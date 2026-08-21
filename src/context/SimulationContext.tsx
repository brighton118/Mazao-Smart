import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { collection, query, where, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'

export type SensorStatus = 'optimal' | 'low' | 'critical' | 'offline'
export type IrrigationMode = 'auto' | 'manual'

export type SensorNode = {
  id: string
  plot: string
  crop: string
  depth: string
  area: string
  moisture: number
  temp: number
  battery: number
  status: SensorStatus
  mode: IrrigationMode
  irrigating: boolean
  minMoisture: number // Configurable threshold
  maxMoisture: number // Configurable threshold
  history: number[]   // last 24 readings
  online: boolean
  signalStrength: number // 0-100
}

export interface LogEntry {
  id: string
  timestamp: Date
  type: 'alert' | 'info' | 'action' | 'system'
  message: string
  sensorId?: string
  category?: 'alert' | 'info' | 'action' | 'system'
  severity?: 'info' | 'warning' | 'danger'
}

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'windy'

export interface SimState {
  sensors: SensorNode[]
  log: LogEntry[]
  tick: number
  speed: number   // 1x, 3x, 10x
  totalWaterUsed: number    // litres
  manualWaterEstimate: number
  lastSyncAt: Date
  paused: boolean
  // Extended twins telemetry fields
  weather: WeatherType
  tankLevel: number       // 0 to 5000 Litres
  batteryLevel: number    // 0 to 100%
  solarOutput: number     // 0 to 450 Watts
  pumpActive: boolean
  wifiConnected: boolean
  fertigationLevel: number // 0 to 100%
  waterConsumptionHistory: number[] // history of usage
}

type Action =
  | { type: 'TICK' }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'SET_MODE'; id: string; mode: IrrigationMode }
  | { type: 'TOGGLE_VALVE'; id: string }
  | { type: 'TOGGLE_ONLINE'; id: string }
  | { type: 'SCENARIO_DROUGHT' }
  | { type: 'SCENARIO_RAIN' }
  | { type: 'RESET' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'UPDATE_NODE'; id: string; updates: Partial<Omit<SensorNode, 'id' | 'history'>> }
  | { type: 'ADD_NODE'; node: { id: string; plot: string; crop: string; depth: string; area: string; minMoisture: number; maxMoisture: number } }
  | { type: 'REMOVE_NODE'; id: string }
  | { type: 'CLEAR_LOG' }
  | { type: 'SET_WEATHER'; weather: WeatherType }
  | { type: 'TOGGLE_PUMP' }
  | { type: 'SET_GLOBAL_MODE'; mode: IrrigationMode }
  | { type: 'UPDATE_THRESHOLDS'; id: string; minMoisture: number; maxMoisture: number }
  | { type: 'SYNC_FULL_STATE'; sensors: SensorNode[]; tankLevel: number; pumpActive: boolean }
  | {
    type: 'ADD_LOG'
    event: {
      id?: string
      timestamp?: Date
      type?: 'alert' | 'info' | 'action' | 'system'
      category?: 'alert' | 'info' | 'action' | 'system'
      severity?: 'info' | 'warning' | 'danger'
      message: string
      sensorId?: string
    }
  }

const IRRIGATE_RATE = 4.5          // % per tick when irrigating
const LITRES_PER_TICK = 25         // litres consumed per irrigating sensor per tick

function statusFor(moisture: number, minThreshold: number, online: boolean): SensorStatus {
  if (!online) return 'offline'
  if (moisture < minThreshold - 10) return 'critical'
  if (moisture < minThreshold) return 'low'
  return 'optimal'
}

function mkLog(type: LogEntry['type'], message: string, sensorId?: string): LogEntry {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  return { id: uniqueId, timestamp: new Date(), type, message, sensorId }
}

const initialSensors: SensorNode[] = [
  { id: 'A1', plot: 'Plot A1 (Maize)', crop: 'Maize', depth: '30 cm', area: '0.4 ha', moisture: 52, temp: 24.3, battery: 87, status: 'optimal', mode: 'auto', irrigating: false, minMoisture: 30, maxMoisture: 65, history: Array(24).fill(52), online: true, signalStrength: 88 },
  { id: 'A2', plot: 'Plot A2 (Maize)', crop: 'Maize', depth: '30 cm', area: '0.4 ha', moisture: 28, temp: 26.1, battery: 91, status: 'critical', mode: 'auto', irrigating: true, minMoisture: 30, maxMoisture: 65, history: Array(24).fill(28), online: true, signalStrength: 74 },
  { id: 'B1', plot: 'Plot B1 (Beans)', crop: 'Beans', depth: '20 cm', area: '0.25 ha', moisture: 58, temp: 23.8, battery: 94, status: 'optimal', mode: 'auto', irrigating: false, minMoisture: 35, maxMoisture: 70, history: Array(24).fill(58), online: true, signalStrength: 95 },
  { id: 'B4', plot: 'Plot B4 (Beans)', crop: 'Beans', depth: '20 cm', area: '0.25 ha', moisture: 45, temp: 25.0, battery: 90, status: 'optimal', mode: 'auto', irrigating: false, minMoisture: 35, maxMoisture: 70, history: Array(24).fill(45), online: true, signalStrength: 85 },
  { id: 'C1', plot: 'Plot C1 (Sorghum)', crop: 'Sorghum', depth: '45 cm', area: '0.6 ha', moisture: 55, temp: 24.7, battery: 78, status: 'optimal', mode: 'auto', irrigating: false, minMoisture: 30, maxMoisture: 65, history: Array(24).fill(55), online: true, signalStrength: 82 },
  { id: 'C2', plot: 'Plot C2 (Sorghum)', crop: 'Sorghum', depth: '45 cm', area: '0.6 ha', moisture: 38, temp: 25.4, battery: 85, status: 'optimal', mode: 'auto', irrigating: false, minMoisture: 30, maxMoisture: 65, history: Array(24).fill(38), online: true, signalStrength: 78 },
]

const initialState: SimState = {
  sensors: initialSensors,
  log: [
    mkLog('system', 'IoT gateway online. Connected to LoRa weather & Node stakes.'),
    mkLog('action', 'Plot A2 moisture critically low (28%). Auto-irrigation activated.', 'A2'),
  ],
  tick: 0,
  speed: 1,
  totalWaterUsed: 120,
  manualWaterEstimate: 0,
  lastSyncAt: new Date(),
  paused: false,
  weather: 'sunny',
  tankLevel: 4200,
  batteryLevel: 88,
  solarOutput: 310,
  pumpActive: true,
  wifiConnected: true,
  fertigationLevel: 82,
  waterConsumptionHistory: Array(10).fill(12).map((_, i) => 10 + i * 2),
}

function simulateTick(state: SimState): SimState {
  const newLog: LogEntry[] = []
  let waterUsed = 0
  let isAnySensorIrrigating = false

  // Determine solar output dynamically based on weather
  let solarWatts = 0
  if (state.weather === 'sunny') solarWatts = Math.round(380 + Math.random() * 40)
  else if (state.weather === 'windy') solarWatts = Math.round(280 + Math.random() * 30)
  else if (state.weather === 'cloudy') solarWatts = Math.round(90 + Math.random() * 20)
  else if (state.weather === 'rainy') solarWatts = Math.round(15 + Math.random() * 10)

  // Solar charging vs battery draining
  let powerConsumed = 5 // Base sensor load
  if (state.pumpActive) powerConsumed += 95 // Water Pump load

  // Power balance
  const batteryDelta = (solarWatts - powerConsumed) / 3600 // hourly conversion
  const newBattery = Math.min(100, Math.max(12, state.batteryLevel + batteryDelta * 5))

  // In auto mode, weather suspension
  const isSuspendedDueToRain = state.weather === 'rainy'

  const sensors = state.sensors.map(s => {
    if (!s.online) return s

    // Moisture dynamics
    const jitter = (Math.random() - 0.5) * 0.3
    let newMoisture = s.moisture

    let irrigating = s.irrigating

    // Auto irrigation logic check
    if (s.mode === 'auto') {
      if (isSuspendedDueToRain) {
        irrigating = false
      } else {
        if (!irrigating && newMoisture < s.minMoisture) {
          irrigating = true
          newLog.push(mkLog('action', `⚠️ ${s.plot} moisture drops to ${newMoisture.toFixed(0)}% — below threshold of ${s.minMoisture}%. Starting auto-irrigation.`, s.id))
        } else if (irrigating && newMoisture >= s.maxMoisture) {
          irrigating = false
          newLog.push(mkLog('info', `✅ ${s.plot} moisture reach maximum threshold of ${s.maxMoisture}%. Irrigation stopped.`, s.id))
        }
      }
    }

    if (irrigating && state.tankLevel > 10) {
      newMoisture = Math.min(s.moisture + IRRIGATE_RATE + jitter, 100)
      waterUsed += LITRES_PER_TICK
      isAnySensorIrrigating = true
    } else {
      // Natural rain moistening vs standard drainage rate
      if (state.weather === 'rainy') {
        newMoisture = Math.min(s.moisture + 1.2 + jitter, 90)
      } else {
        newMoisture = Math.max(s.moisture - DRAIN_RATE(s.crop) + jitter, 5)
      }
    }

    newMoisture = Math.round(newMoisture * 10) / 10

    // Temperature fluctuation based on weather
    let expectedTemp = 24
    if (state.weather === 'sunny') expectedTemp = 28
    else if (state.weather === 'rainy') expectedTemp = 20
    else if (state.weather === 'cloudy') expectedTemp = 22
    else if (state.weather === 'windy') expectedTemp = 23

    const newTemp = Math.round((expectedTemp + (Math.random() - 0.5) * 0.8) * 10) / 10

    // Battery slow solar refill/drain
    const newNodeBattery = Math.min(100, Math.max(10, s.battery - 0.02 + (state.weather === 'sunny' ? 0.05 : 0.01)))

    const newSignal = Math.min(100, Math.max(30, s.signalStrength + (Math.random() - 0.5) * 3))

    // Alert generation
    const prevStatus = s.status
    const newStatus = statusFor(newMoisture, s.minMoisture, s.online)
    if (prevStatus !== 'critical' && newStatus === 'critical') {
      newLog.push(mkLog('alert', `⚠️ ALARM: ${s.plot} moisture critically dry (${newMoisture.toFixed(0)}%)! Action required.`, s.id))
    }

    const newHistory = [...s.history.slice(1), Math.round(newMoisture)]

    return {
      ...s,
      moisture: newMoisture,
      temp: newTemp,
      battery: Math.round(newNodeBattery * 10) / 10,
      signalStrength: Math.round(newSignal),
      status: newStatus,
      irrigating,
      history: newHistory,
    }
  })

  // Trigger pump status automatically if in auto mode
  let pumpActive = state.pumpActive
  const hasAutoIrrigatingSensor = sensors.some(s => s.irrigating && s.mode === 'auto')

  if (sensors.every(s => s.mode === 'auto')) {
    pumpActive = hasAutoIrrigatingSensor && !isSuspendedDueToRain
  } else {
    // If some sensors are manual, pump is on if any valve is active
    pumpActive = sensors.some(s => s.irrigating) && !isSuspendedDueToRain
  }

  // Adjust tank level
  const actualWaterDrained = waterUsed
  const newTankLevel = Math.max(0, state.tankLevel - actualWaterDrained + (state.weather === 'rainy' ? 15 : 0)) // Rain collects in tank too!

  if (isSuspendedDueToRain && state.weather === 'rainy' && state.tick % 5 === 0) {
    newLog.push(mkLog('system', '🌧 Rain detected: Auto-irrigation cycles suspended. Tank gathering run-offs.'))
  }

  const allLog = [...newLog, ...state.log].slice(0, 80)
  const newWaterHistory = [...state.waterConsumptionHistory.slice(1), Math.round(waterUsed)]

  return {
    ...state,
    sensors,
    tick: state.tick + 1,
    log: allLog,
    totalWaterUsed: Math.round((state.totalWaterUsed + waterUsed) * 10) / 10,
    waterConsumptionHistory: newWaterHistory,
    tankLevel: Math.round(newTankLevel),
    batteryLevel: Math.round(newBattery * 10) / 10,
    solarOutput: solarWatts,
    pumpActive,
    wifiConnected: Math.random() > 0.01, // 99% reliability simulation
    fertigationLevel: Math.max(20, Math.round(state.fertigationLevel - (isAnySensorIrrigating ? 0.25 : 0))),
    lastSyncAt: new Date(),
  }
}

function DRAIN_RATE(crop: string): number {
  if (crop === 'Beans') return 0.55
  if (crop === 'Maize') return 0.45
  return 0.35
}

function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case 'TICK':
      return simulateTick(state)

    case 'SYNC_FULL_STATE':
      return {
        ...state,
        sensors: action.sensors,
        tankLevel: action.tankLevel,
        pumpActive: action.pumpActive,
        lastSyncAt: new Date()
      }

    case 'SET_SPEED':
      return { ...state, speed: action.speed }

    case 'SET_MODE':
      return {
        ...state,
        sensors: state.sensors.map(s =>
          s.id === action.id ? { ...s, mode: action.mode } : s
        ),
        log: [mkLog('action', `Sensor ${action.id} switched to ${action.mode} configuration.`, action.id), ...state.log].slice(0, 80),
      }

    case 'SET_GLOBAL_MODE':
      return {
        ...state,
        sensors: state.sensors.map(s => ({ ...s, mode: action.mode })),
        log: [mkLog('system', `All irrigation systems converted to ${action.mode.toUpperCase()} mode.`), ...state.log].slice(0, 80),
      }

    case 'TOGGLE_VALVE': {
      const sensor = state.sensors.find(s => s.id === action.id)!
      const next = !sensor.irrigating
      const updatedSensors = state.sensors.map(s =>
        s.id === action.id ? { ...s, irrigating: next, mode: 'manual' as const } : s
      )
      const isAnyActive = updatedSensors.some(s => s.irrigating)
      return {
        ...state,
        sensors: updatedSensors,
        pumpActive: isAnyActive,
        log: [mkLog('action', `${next ? 'Opened' : 'Closed'} solenoid valve for ${sensor.plot} manually.`, action.id), ...state.log].slice(0, 80),
      }
    }

    case 'TOGGLE_PUMP': {
      const nextPump = !state.pumpActive
      const updatedSensors = state.sensors.map(s => {
        // If turning off pump, shut down all emitter flows
        if (!nextPump) return { ...s, irrigating: false, mode: 'manual' as const }
        return s
      })
      return {
        ...state,
        pumpActive: nextPump,
        sensors: updatedSensors,
        log: [mkLog('action', `Manual override: Primary Pressure Pump powered ${nextPump ? 'ON' : 'OFF'}`), ...state.log].slice(0, 80),
      }
    }

    case 'SET_WEATHER':
      return {
        ...state,
        weather: action.weather,
        log: [mkLog('system', `Weather weather station reports transition to: ${action.weather.toUpperCase()}`), ...state.log].slice(0, 80),
      }

    case 'UPDATE_THRESHOLDS':
      return {
        ...state,
        sensors: state.sensors.map(s =>
          s.id === action.id ? { ...s, minMoisture: action.minMoisture, maxMoisture: action.maxMoisture } : s
        ),
        log: [mkLog('system', `Updated ${action.id} threshold config. Min: ${action.minMoisture}%, Max: ${action.maxMoisture}%`), ...state.log].slice(0, 80),
      }

    case 'TOGGLE_ONLINE': {
      const sensor = state.sensors.find(s => s.id === action.id)!
      const online = !sensor.online
      return {
        ...state,
        sensors: state.sensors.map(s =>
          s.id === action.id
            ? { ...s, online, status: statusFor(s.moisture, s.minMoisture, online), irrigating: online ? s.irrigating : false }
            : s
        ),
        log: [
          mkLog(online ? 'info' : 'alert', `${sensor.plot} telemetry stake ${online ? 'synchronized' : 'link offline'}`, action.id),
          ...state.log,
        ].slice(0, 80),
      }
    }

    case 'SCENARIO_DROUGHT':
      return {
        ...state,
        sensors: state.sensors.map(s => ({ ...s, moisture: Math.max(s.moisture - 20, 8) })),
        log: [mkLog('system', '🌵 Simulated Drought warning active. Draining all soil moisture sectors.'), ...state.log].slice(0, 80),
      }

    case 'SCENARIO_RAIN':
      return {
        ...state,
        weather: 'rainy',
        sensors: state.sensors.map(s => ({
          ...s,
          moisture: Math.min(s.moisture + 25, 92),
          irrigating: false,
        })),
        log: [mkLog('system', '🌧 Heavy rain started. Drip solenoid valves shut, collecting natural run-offs.'), ...state.log].slice(0, 80),
      }

    case 'RESET':
      return { ...initialState, log: [mkLog('system', 'Telemetry simulation reset. Config restored.')] }

    case 'TOGGLE_PAUSE':
      return {
        ...state,
        paused: !state.paused,
        log: [mkLog('system', `Simulation clock ${state.paused ? 'resumed' : 'paused'}`), ...state.log].slice(0, 80)
      }

    case 'UPDATE_NODE': {
      const { id, updates } = action
      return {
        ...state,
        sensors: state.sensors.map(s => {
          if (s.id !== id) return s
          const updated = { ...s, ...updates }
          if (updates.moisture !== undefined || updates.online !== undefined) {
            updated.status = statusFor(updated.moisture, updated.minMoisture, updated.online)
          }
          return updated
        }),
        log: [
          mkLog('system', `Sensor ${id} telemetry overridden.`, id),
          ...state.log
        ].slice(0, 80)
      }
    }

    case 'ADD_NODE': {
      const { node } = action
      const defaultHistory = Array(24).fill(55)
      const newNode: SensorNode = {
        id: node.id,
        plot: node.plot,
        crop: node.crop,
        depth: '30 cm',
        area: '0.3 ha',
        moisture: 55,
        temp: 24.5,
        battery: 100,
        status: 'optimal',
        mode: 'auto',
        irrigating: false,
        minMoisture: node.minMoisture,
        maxMoisture: node.maxMoisture,
        history: defaultHistory,
        online: true,
        signalStrength: 95
      }
      return {
        ...state,
        sensors: [...state.sensors, newNode],
        log: [
          mkLog('system', `Stitched new LoRa node ${node.id} into system.`, node.id),
          ...state.log
        ].slice(0, 80)
      }
    }

    case 'REMOVE_NODE': {
      return {
        ...state,
        sensors: state.sensors.filter(s => s.id !== action.id),
        log: [
          mkLog('system', `Node stake ${action.id} removed from network topology.`, action.id),
          ...state.log
        ].slice(0, 80)
      }
    }

    case 'CLEAR_LOG':
      return {
        ...state,
        log: [mkLog('system', 'Cleaned telemetry log files')]
      }

    case 'ADD_LOG': {
      const { id, timestamp, type, category, severity, message, sensorId } = action.event
      const logEntry: LogEntry = {
        id: id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: timestamp || new Date(),
        type: type || category || 'system',
        message,
        sensorId,
        category: category || type || 'system',
        severity: severity || 'info'
      }
      return {
        ...state,
        log: [logEntry, ...state.log].slice(0, 80)
      }
    }

    default:
      return state
  }
}

type ContextValue = {
  state: SimState
  dispatch: React.Dispatch<Action>
}

const SimulationContext = createContext<ContextValue | null>(null)

const TICK_MS: Record<number, number> = { 1: 3000, 3: 1000, 10: 300 }

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const saved = localStorage.getItem('mazaosmart_sim_state')
      if (saved) {
        const parsedData = JSON.parse(saved)
        const parsed = { ...initialState, ...parsedData }

        // Sanitize sensors to ensure they have current fields (minMoisture, maxMoisture)
        if (Array.isArray(parsed.sensors)) {
          parsed.sensors = parsed.sensors.map((s: any) => {
            const defaults = initialSensors.find(is => is.id === s.id) || { minMoisture: 30, maxMoisture: 65 }
            return {
              minMoisture: defaults.minMoisture,
              maxMoisture: defaults.maxMoisture,
              ...s
            }
          })
        } else {
          parsed.sensors = initialSensors
        }

        const lastSyncDate = parsed.lastSyncAt ? new Date(parsed.lastSyncAt) : null
        parsed.lastSyncAt = lastSyncDate && !isNaN(lastSyncDate.getTime()) ? lastSyncDate : new Date()

        if (Array.isArray(parsed.log)) {
          parsed.log = parsed.log.map((entry: any) => {
            const entryDate = entry.timestamp ? new Date(entry.timestamp) : null
            return {
              ...entry,
              timestamp: entryDate && !isNaN(entryDate.getTime()) ? entryDate : new Date()
            }
          })
        } else {
          parsed.log = []
        }
        return parsed
      }
    } catch (err) {
      console.error('Failed to load state from localStorage', err)
    }
    return initialState
  })

  const { user } = useAuth()
  const sensorUuidMapRef = useRef<Record<string, string>>({})
  const [dbSyncedOnce, setDbSyncedOnce] = useState(false)
  const syncInProgressRef = useRef(false)
  const lastSyncedTickRef = useRef(-1)

  useEffect(() => {
    localStorage.setItem('mazaosmart_sim_state', JSON.stringify(state))
  }, [state])

  // Fetch initial state from Supabase when user logs in
  useEffect(() => {
    if (!user || user.id.startsWith('offline_')) {
      setDbSyncedOnce(false)
      return
    }

    const initDbState = async () => {
      try {
        console.log('Initializing database simulation state for user:', user.id)

        // 1. Get/create farm
        let farmId = ''
        const farmsRef = collection(db, 'farms')
        const qFarm = query(farmsRef, where('owner_id', '==', user.id))
        const farmsSnap = await getDocs(qFarm)

        if (!farmsSnap.empty) {
          farmId = farmsSnap.docs[0].id
        } else {
          const newFarmRef = doc(collection(db, 'farms'))
          await setDoc(newFarmRef, {
            owner_id: user.id,
            farm_name: user.farm_name || 'Mbarara Pilot Farm',
            district: 'Mbarara',
            village: 'Ruti',
            latitude: -0.6074,
            longitude: 30.6548,
            description: 'Main cultivation site'
          })
          farmId = newFarmRef.id
        }

        // 2. Get/create greenhouse
        let greenhouseId = ''
        const ghRef = collection(db, 'greenhouses')
        const qGh = query(ghRef, where('farm_id', '==', farmId), where('name', '==', 'Main Greenhouse'))
        const ghSnap = await getDocs(qGh)

        if (!ghSnap.empty) {
          greenhouseId = ghSnap.docs[0].id
        } else {
          const newGhRef = doc(collection(db, 'greenhouses'))
          await setDoc(newGhRef, {
            farm_id: farmId,
            name: 'Main Greenhouse',
            location_details: 'North sector'
          })
          greenhouseId = newGhRef.id
        }

        // 3. Get/create outdoor garden
        let gardenId = ''
        const gardenRef = collection(db, 'outdoor_gardens')
        const qGarden = query(gardenRef, where('farm_id', '==', farmId), where('name', '==', 'Main Garden'))
        const gardenSnap = await getDocs(qGarden)

        if (!gardenSnap.empty) {
          gardenId = gardenSnap.docs[0].id
        } else {
          const newGdRef = doc(collection(db, 'outdoor_gardens'))
          await setDoc(newGdRef, {
            farm_id: farmId,
            name: 'Main Garden',
            crop_type: 'Mixed',
            area_sq_meters: 1000
          })
          gardenId = newGdRef.id
        }

        // 4. Get/create ESP32 device
        let deviceId = ''
        const devRef = collection(db, 'esp32_devices')
        const qDev = query(devRef, where('farm_id', '==', farmId))
        const devSnap = await getDocs(qDev)

        if (!devSnap.empty) {
          deviceId = devSnap.docs[0].id
        } else {
          const newDevRef = doc(collection(db, 'esp32_devices'))
          await setDoc(newDevRef, {
            farm_id: farmId,
            device_name: 'ESP32 Gateway Node',
            mac_address: `00:0a:95:9d:68:${user.id.substring(0, 2)}`,
            firmware_version: 'v2.1',
            status: 'active'
          })
          deviceId = newDevRef.id
        }

        // 5. Get/create pump
        let pumpActive = stateRef.current.pumpActive
        const pumpRef = collection(db, 'pumps')
        const qPump = query(pumpRef, where('farm_id', '==', farmId), where('name', '==', 'Primary Pump'))
        const pumpSnap = await getDocs(qPump)

        if (!pumpSnap.empty) {
          pumpActive = pumpSnap.docs[0].data().status
        } else {
          await setDoc(doc(collection(db, 'pumps')), {
            farm_id: farmId,
            name: 'Primary Pump',
            status: pumpActive,
            flow_rate_lpm: 60.0
          })
        }

        // 6. Get/create water tank
        let tankLevel = stateRef.current.tankLevel
        const tankRef = collection(db, 'water_tanks')
        const qTank = query(tankRef, where('farm_id', '==', farmId), where('name', '==', 'Primary Reservoir'))
        const tankSnap = await getDocs(qTank)

        if (!tankSnap.empty) {
          tankLevel = Math.round(Number(tankSnap.docs[0].data().current_level_liters))
        } else {
          await setDoc(doc(collection(db, 'water_tanks')), {
            farm_id: farmId,
            name: 'Primary Reservoir',
            capacity_liters: 5000.0,
            current_level_liters: tankLevel
          })
        }

        // 7. Get/create soil moisture sensors
        const sensRef = collection(db, 'soil_moisture_sensors')
        const sensSnap = await getDocs(sensRef)

        const finalSensors: SensorNode[] = []

        if (sensSnap.empty) {
          // No sensors in DB yet. Create default 6 sensors
          const defaults = [
            { sensor_code: 'A1', greenhouse_id: null, garden_id: gardenId, device_id: deviceId, crop: 'Maize', depth_cm: 30, min_moisture: 30, max_moisture: 65, current_moisture: 52, current_temp: 24.3, online: true, irrigating: false },
            { sensor_code: 'A2', greenhouse_id: null, garden_id: gardenId, device_id: deviceId, crop: 'Maize', depth_cm: 30, min_moisture: 30, max_moisture: 65, current_moisture: 28, current_temp: 26.1, online: true, irrigating: true },
            { sensor_code: 'B1', greenhouse_id: greenhouseId, garden_id: null, device_id: deviceId, crop: 'Beans', depth_cm: 20, min_moisture: 35, max_moisture: 70, current_moisture: 58, current_temp: 23.8, online: true, irrigating: false },
            { sensor_code: 'B4', greenhouse_id: greenhouseId, garden_id: null, device_id: deviceId, crop: 'Beans', depth_cm: 20, min_moisture: 35, max_moisture: 70, current_moisture: 45, current_temp: 25.0, online: true, irrigating: false },
            { sensor_code: 'C1', greenhouse_id: null, garden_id: gardenId, device_id: deviceId, crop: 'Sorghum', depth_cm: 45, min_moisture: 30, max_moisture: 65, current_moisture: 55, current_temp: 24.7, online: true, irrigating: false },
            { sensor_code: 'C2', greenhouse_id: null, garden_id: gardenId, device_id: deviceId, crop: 'Sorghum', depth_cm: 45, min_moisture: 30, max_moisture: 65, current_moisture: 38, current_temp: 25.4, online: true, irrigating: false }
          ]

          for (const d of defaults) {
            const newSenRef = doc(collection(db, 'soil_moisture_sensors'))
            await setDoc(newSenRef, d)

            sensorUuidMapRef.current[d.sensor_code] = newSenRef.id
            const stateDefault = stateRef.current.sensors.find(s => s.id === d.sensor_code)
            finalSensors.push({
              id: d.sensor_code,
              plot: `Plot ${d.sensor_code} (${d.crop})`,
              crop: d.crop || '',
              depth: `${d.depth_cm} cm`,
              area: stateDefault?.area || '0.4 ha',
              moisture: Number(d.current_moisture),
              temp: Number(d.current_temp),
              battery: stateDefault?.battery || 90,
              status: statusFor(Number(d.current_moisture), Number(d.min_moisture), !!d.online),
              mode: stateDefault?.mode || 'auto',
              irrigating: !!d.irrigating,
              minMoisture: Number(d.min_moisture),
              maxMoisture: Number(d.max_moisture),
              history: stateDefault?.history || Array(24).fill(Number(d.current_moisture)),
              online: !!d.online,
              signalStrength: stateDefault?.signalStrength || 90
            })
          }
        } else {
          // Sensors exist in DB. Fetch them and populate mapping
          const currentSensorsInDb = sensSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

          for (const s of currentSensorsInDb) {
            sensorUuidMapRef.current[s.sensor_code] = s.id
            const stateDefault = stateRef.current.sensors.find(ds => ds.id === s.sensor_code)

            // Fetch history from moisture_readings table
            const readingsRef = collection(db, 'moisture_readings')
            const qRead = query(readingsRef, where('sensor_id', '==', s.id))
            const readingsSnap = await getDocs(qRead)

            const readings = readingsSnap.docs.map(d => d.data())
            // Note: complex sorting wasn't handled in simple Firebase getDocs to avoid missing index errors easily,
            // we sort in memory for this demo.
            readings.sort((a, b) => b.created_at?.localeCompare(a.created_at || '') || 0)
            const recentReadings = readings.slice(0, 24)

            const historyReadings = recentReadings.length > 0
              ? recentReadings.map(r => Math.round(Number(r.moisture))).reverse()
              : Array(24).fill(Number(s.current_moisture))

            // Pad history to 24 items if needed
            while (historyReadings.length < 24) {
              historyReadings.unshift(Number(s.current_moisture))
            }

            finalSensors.push({
              id: s.sensor_code,
              plot: `Plot ${s.sensor_code} (${s.crop})`,
              crop: s.crop || '',
              depth: `${s.depth_cm} cm`,
              area: stateDefault?.area || '0.4 ha',
              moisture: Number(s.current_moisture),
              temp: Number(s.current_temp),
              battery: stateDefault?.battery || 90,
              status: statusFor(Number(s.current_moisture), Number(s.min_moisture), !!s.online),
              mode: stateDefault?.mode || 'auto',
              irrigating: !!s.irrigating,
              minMoisture: Number(s.min_moisture),
              maxMoisture: Number(s.max_moisture),
              history: historyReadings,
              online: !!s.online,
              signalStrength: stateDefault?.signalStrength || 90
            })
          }
        }

        // Sort finalSensors by id so they stay in standard layout
        finalSensors.sort((a, b) => a.id.localeCompare(b.id))

        if (finalSensors.length > 0) {
          dispatch({
            type: 'SYNC_FULL_STATE',
            sensors: finalSensors,
            tankLevel,
            pumpActive
          })
        }
        setDbSyncedOnce(true)
        console.log('Successfully completed Firebase telemetry sync!')
      } catch (err) {
        console.error('Error syncing telemetry state from Firebase:', err)
      }
    }

    initDbState()
  }, [user])

  // Synchronize state changes back to Supabase
  useEffect(() => {
    if (!user || user.id.startsWith('offline_') || !dbSyncedOnce || syncInProgressRef.current) {
      return
    }

    const pushStateToDb = async () => {
      // Only sync if the tick actually changed or was manual change
      const isTickChange = state.tick !== lastSyncedTickRef.current

      if (isTickChange) {
        const shouldSync =
          state.speed === 1 ||
          (state.speed === 3 && state.tick % 3 === 0) ||
          (state.speed === 10 && state.tick % 10 === 0)

        if (!shouldSync) return
      }

      syncInProgressRef.current = true
      try {
        // Find farm
        const farmsRef = collection(db, 'farms')
        const qFarm = query(farmsRef, where('owner_id', '==', user.id))
        const farmsSnap = await getDocs(qFarm)

        const farmId = farmsSnap.empty ? null : farmsSnap.docs[0].id
        if (!farmId) return

        // 1. Sync sensors
        for (const s of state.sensors) {
          const uuid = sensorUuidMapRef.current[s.id]
          if (uuid) {
            const sensRef = doc(db, 'soil_moisture_sensors', uuid)
            await updateDoc(sensRef, {
              current_moisture: s.moisture,
              current_temp: s.temp,
              online: s.online,
              irrigating: s.irrigating,
              min_moisture: s.minMoisture,
              max_moisture: s.maxMoisture
            })

            // Insert telemetry logs to moisture_readings table on tick update
            if (isTickChange) {
              const readingsRef = doc(collection(db, 'moisture_readings'))
              await setDoc(readingsRef, {
                sensor_id: uuid,
                moisture: s.moisture,
                temp: s.temp,
                created_at: new Date().toISOString()
              })
            }
          }
        }

        // 2. Sync pump
        const pumpRef = collection(db, 'pumps')
        const qPump = query(pumpRef, where('farm_id', '==', farmId))
        const pumpSnap = await getDocs(qPump)

        if (!pumpSnap.empty) {
          pumpSnap.forEach(async d => {
            await updateDoc(doc(db, 'pumps', d.id), { status: state.pumpActive })
          })
        }

        // 3. Sync tank
        const tankRef = collection(db, 'water_tanks')
        const qTank = query(tankRef, where('farm_id', '==', farmId))
        const tankSnap = await getDocs(qTank)

        if (!tankSnap.empty) {
          tankSnap.forEach(async d => {
            await updateDoc(doc(db, 'water_tanks', d.id), { current_level_liters: state.tankLevel })
          })
        }

        lastSyncedTickRef.current = state.tick
      } catch (err) {
        console.error('Failed to sync simulation updates to Firebase:', err)
      } finally {
        syncInProgressRef.current = false
      }
    }

    pushStateToDb()
  }, [state.tick, state.sensors, state.pumpActive, state.tankLevel, user, dbSyncedOnce])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const startInterval = useCallback((speed: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => dispatch({ type: 'TICK' }), TICK_MS[speed] ?? 3000)
  }, [])

  useEffect(() => {
    if (state.paused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    startInterval(state.speed)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state.speed, state.paused, startInterval])

  return (
    <SimulationContext.Provider value={{ state, dispatch }}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be used inside SimulationProvider')
  return ctx
}
