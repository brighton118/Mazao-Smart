import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { useSimulation } from '../context/SimulationContext'

// Import consolidated digital twin components
import Greenhouse from './Greenhouse'
import ServerHouse from './ServerHouse'
import WaterTank from './WaterTank'
import Pump from './Pump'
import SolarSystem from './SolarSystem'
import OutdoorFarm from './OutdoorFarm'
import WeatherStation from './WeatherStation'
import PipeNetwork from './PipeNetwork'
import Valve from './Valve'
import Sensors from './Sensors'
import CameraController, { TOUR_STEPS } from './CameraController'

export default function Scene() {
    const { state, dispatch } = useSimulation()
    const { sensors } = state
    const { camera } = useThree()

    // Selection & control states
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [selectedComponent, setSelectedComponent] = useState<{ name: string; specs: string } | null>(null)
    const [autoRotateActive, setAutoRotateActive] = useState<boolean>(false)
    const [showLabels, setShowLabels] = useState<boolean>(true)
    const [timeOfDay, setTimeOfDay] = useState<number>(12) // 0 to 24 hour slider
    const [autoTourActive, setAutoTourActive] = useState<boolean>(false)
    const [tourStepIndex, setTourStepIndex] = useState<number>(0)
    const [activePOI, setActivePOI] = useState<string | null>(null)

    const controlsRef = useRef<any>(null)

    // Auto-rotation sync with OrbitControls
    useFrame(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = autoRotateActive
            controlsRef.current.autoRotateSpeed = 0.6
            controlsRef.current.update()
        }
    })

    // Load last camera coordinates on launch
    useEffect(() => {
        const camX = localStorage.getItem('agrisense_react_cam_x')
        const camY = localStorage.getItem('agrisense_react_cam_y')
        const camZ = localStorage.getItem('agrisense_react_cam_z')
        if (camX && camY && camZ) {
            camera.position.set(parseFloat(camX), parseFloat(camY), parseFloat(camZ))
            if (controlsRef.current) controlsRef.current.update()
        }
    }, [camera])

    // Handle POI Selection Click
    const handlePOIClick = (poiName: string) => {
        setAutoTourActive(false)
        setActivePOI(poiName)
        setSelectedComponent(null) // clear focus
    }

    // Handle Sensor Node Click
    const handleSelectStake = (sensorId: string) => {
        setSelectedNodeId(sensorId)
        // Map to coordinate presets if applicable
        if (sensorId === 'B1' || sensorId === 'B4') {
            setActivePOI('greenhouse')
        } else {
            setActivePOI('outfield')
        }
    }

    // Handle detailed component popup selection
    const handleSelectComponent = (name: string, specs: string) => {
        setSelectedComponent({ name, specs })
        setAutoTourActive(false) // stop the automated walk-through on interaction

        // Auto-focus the digital twin camera (POI) on the clicked hardware module
        const nameLower = name.toLowerCase()
        if (nameLower.includes('pump')) {
            setActivePOI('pump')
        } else if (nameLower.includes('solar') || nameLower.includes('power')) {
            setActivePOI('solar')
        } else if (nameLower.includes('tank') || nameLower.includes('reservoir')) {
            setActivePOI('tank')
        } else if (nameLower.includes('gateway') || nameLower.includes('server') || nameLower.includes('control house')) {
            setActivePOI('gateway')
        } else if (nameLower.includes('weather')) {
            setActivePOI('weather')
        } else if (nameLower.includes('greenhouse')) {
            setActivePOI('greenhouse')
        } else if (nameLower.includes('valve')) {
            // Solenoid Valve Module (sensorId)
            const match = name.match(/\(([^)]+)\)/)
            if (match) {
                const sId = match[1]
                setSelectedNodeId(sId)
                if (sId === 'B1' || sId === 'B4') {
                    setActivePOI('greenhouse')
                } else {
                    setActivePOI('outfield')
                }
            } else {
                setActivePOI('greenhouse')
            }
        } else if (nameLower.includes('sensor') || nameLower.includes('moisture') || nameLower.includes('probe')) {
            const match = name.match(/\(([^)]+)\)/)
            if (match) {
                const sId = match[1]
                setSelectedNodeId(sId)
                if (sId === 'B1' || sId === 'B4') {
                    setActivePOI('greenhouse')
                } else {
                    setActivePOI('outfield')
                }
            } else {
                setActivePOI('outfield')
            }
        }
    }

    // Lighting cycles calculations
    const isNight = timeOfDay < 6 || timeOfDay > 18
    const ambientIntensity = isNight ? 0.15 : 0.5
    const dirIntensity = isNight ? 0.05 : 1.1
    const skyColor = isNight ? '#0b0f19' : timeOfDay < 8 || timeOfDay > 17 ? '#1a1829' : '#0f2617'

    return (
        <>
            <OrbitControls
                ref={controlsRef}
                enableDamping
                dampingFactor={0.05}
                maxPolarAngle={Math.PI / 2 - 0.05}
                minDistance={3}
                maxDistance={28}
                onChange={() => {
                    localStorage.setItem('agrisense_react_cam_x', camera.position.x.toString())
                    localStorage.setItem('agrisense_react_cam_y', camera.position.y.toString())
                    localStorage.setItem('agrisense_react_cam_z', camera.position.z.toString())
                }}
            />

            {/* Camera transition manager */}
            <CameraController
                poi={activePOI}
                tourActive={autoTourActive}
                onTourStepChange={setTourStepIndex}
            />

            {/* Sky colors & field fog */}
            <color attach="background" args={[skyColor]} />
            <fogExp2 attach="fog" args={[skyColor, 0.038]} />

            {/* Lighting configuration */}
            <ambientLight intensity={ambientIntensity} />
            <directionalLight
                position={[8, 14, 6]}
                intensity={dirIntensity}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-near={0.5}
                shadow-camera-far={45}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
            />

            {/* Base Earth Grids */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
                <boxGeometry args={[16, 0.1, 14]} />
                <meshStandardMaterial color={isNight ? '#0e1610' : '#1b3322'} roughness={0.9} />
            </mesh>

            {/* 2D Grid pattern layers representing physical zoning mapping */}
            <gridHelper args={[16, 16, '#27ae60', isNight ? '#162319' : '#223829']} position={[0, 0.01, 0]} />

            {/* 1. Central Serverhouse (LoRa gateway & battery array) */}
            <ServerHouse
                position={[5.5, 0, -5.0]}
                onSelectComponent={handleSelectComponent}
            />

            {/* 2. Elevated Gravity Water Tank */}
            <WaterTank
                position={[-6.0, 0, -5.0]}
                onSelectComponent={handleSelectComponent}
            />

            {/* 3. Water Pump Station */}
            <Pump
                position={[-5.0, 0, -3.0]}
                onSelectComponent={handleSelectComponent}
            />

            {/* 4. Solar PV Panels Arrays */}
            <SolarSystem
                position={[0.0, 0, 4.0]}
                onSelectComponent={handleSelectComponent}
            />

            {/* 5. Weather Station Unit */}
            <WeatherStation
                position={[2.2, 0, -5.0]}
                onSelectComponent={handleSelectComponent}
            />

            {/* 6. Polytunnel Greenhouse Plot (Greenhouse.tsx) */}
            <Greenhouse
                position={[-5.5, 0, 1.5]}
                sensors={sensors}
                selectedNodeId={selectedNodeId}
                onSelectSensor={handleSelectStake}
                onSelectComponent={handleSelectComponent}
            />

            {/* 7. Outdoor Crops Fields Plots */}
            <OutdoorFarm
                position={[2.5, 0, 0.0]}
                onSelectComponent={handleSelectComponent}
            />

            {/* 8. Pipenetwork system flow paths */}
            <PipeNetwork
                onSelectComponent={handleSelectComponent}
            />

            {/* 9. Valve nodes placement at pipe junctions
          A1 = [-4, 0.15, -1.0]
          A2 = [-2, 0.15, -1.0]
          C1 = [1.2, 0.15, -1.0]
          C2 = [3.5, 0.15, -1.0]
          B1 = [-6.2, 0.15, -1.0]
          B4 = [-4.8, 0.15, -1.0]
      */}
            <Valve position={[-4.0, 0.15, -1.0]} sensorId="A1" onSelectComponent={handleSelectComponent} />
            <Valve position={[-2.0, 0.15, -1.0]} sensorId="A2" onSelectComponent={handleSelectComponent} />
            <Valve position={[1.2, 0.15, -1.0]} sensorId="C1" onSelectComponent={handleSelectComponent} />
            <Valve position={[3.5, 0.15, -1.0]} sensorId="C2" onSelectComponent={handleSelectComponent} />
            <Valve position={[-6.2, 0.15, -1.0]} sensorId="B1" onSelectComponent={handleSelectComponent} />
            <Valve position={[-4.8, 0.15, -1.0]} sensorId="B4" onSelectComponent={handleSelectComponent} />

            {/* 10. Outdoor moisture probes
          A1 = [-4, 0.15, 0]
          A2 = [-2, 0.15, 1.5]
          C1 = [1.2, 0.15, 0.8]
          C2 = [3.5, 0.15, 1.2]
      */}
            <Sensors id="A1" position={[-4.0, 0.15, 0.0]} onSelect={handleSelectStake} onSelectComponent={handleSelectComponent} />
            <Sensors id="A2" position={[-2.0, 0.15, 1.5]} onSelect={handleSelectStake} onSelectComponent={handleSelectComponent} />
            <Sensors id="C1" position={[1.2, 0.15, 0.8]} onSelect={handleSelectStake} onSelectComponent={handleSelectComponent} />
            <Sensors id="C2" position={[3.5, 0.15, 1.2]} onSelect={handleSelectStake} onSelectComponent={handleSelectComponent} />

            {/* Labels descriptions bubble layer */}
            {showLabels && (
                <>
                    <Html position={[-5.5, 1.8, 1.5]} center distanceFactor={14}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #10b981', color: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: 9, pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'monospace', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                            Greenhouse Plot (Matooke)
                        </div>
                    </Html>
                    <Html position={[2.5, 1.0, 0.0]} center distanceFactor={14}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #10b981', color: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: 9, pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'monospace', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                            Open Crops Field (Maize & Sorghum)
                        </div>
                    </Html>
                    <Html position={[-6.0, 3.2, -5.0]} center distanceFactor={14}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #3b82f6', color: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: 9, pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'monospace', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                            5000L Water Tower
                        </div>
                    </Html>
                    <Html position={[5.5, 1.6, -5.0]} center distanceFactor={14}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #94a3b8', color: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: 9, pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'monospace', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                            Central LoRa Gateway
                        </div>
                    </Html>
                    <Html position={[0.0, 1.5, 4.0]} center distanceFactor={14}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #facc15', color: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: 9, pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'monospace', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                            Solar PV Array
                        </div>
                    </Html>
                </>
            )}

            {/* HTML absolute overlays inside full screen overlay */}
            <Html fullscreen style={{ pointerEvents: 'none' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>

                    {/* 1. Detailed component specifications panel (displayed on clicking buildings/systems) */}
                    {selectedComponent && (
                        <div style={{
                            position: 'absolute',
                            top: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 380,
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(16, 185, 129, 0.45)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: 8,
                            padding: '12px 16px',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)',
                            pointerEvents: 'auto',
                            color: '#ffffff',
                            zIndex: 30
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase' }}>
                                    {selectedComponent.name}
                                </h4>
                                <button
                                    onClick={() => setSelectedComponent(null)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        padding: 0
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <pre style={{
                                margin: 0,
                                fontSize: 10.5,
                                color: '#cbd5e1',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'monospace',
                                lineHeight: 1.4
                            }}>
                                {selectedComponent.specs}
                            </pre>
                        </div>
                    )}

                    {/* 2. Automated tour presentation overlay */}
                    {autoTourActive && (
                        <div style={{
                            position: 'absolute',
                            bottom: 82,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '90%',
                            maxWidth: 520,
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            borderRadius: 8,
                            padding: '12px 18px',
                            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
                            zIndex: 20,
                            pointerEvents: 'none',
                            textAlign: 'center',
                            backdropFilter: 'blur(12px)',
                            color: '#ffffff'
                        }}>
                            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#10b981', fontWeight: 'bold', marginBottom: 4, letterSpacing: '0.1em' }}>
                                Investor Presentation Guide &middot; Step {tourStepIndex + 1} of {TOUR_STEPS.length}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#f1fac3', marginBottom: 2 }}>
                                {TOUR_STEPS[tourStepIndex]?.title}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.4 }}>
                                {TOUR_STEPS[tourStepIndex]?.desc}
                            </div>
                        </div>
                    )}

                    {/* 3. Sensor Stake details HUD panel (top-left) */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            width: 250,
                            background: 'rgba(15, 23, 42, 0.88)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: 8,
                            padding: '12px 14px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'auto',
                            zIndex: 10
                        }}
                    >
                        <span style={{ fontSize: 9, letterSpacing: '0.12em', color: '#facc15', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                            Active Sensor Node
                        </span>
                        {selectedNodeId && sensors.find(s => s.id === selectedNodeId) ? (() => {
                            const node = sensors.find(s => s.id === selectedNodeId)!;
                            let indicatorColor = node.online ? (node.status === 'optimal' ? '#10b981' : node.status === 'low' ? '#f59e0b' : '#ef4444') : '#94a3b8';
                            return (
                                <div>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                                        {node.id} &middot; {node.crop}
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: '#cbd5e1' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Soil Moisture:</span>
                                            <span style={{ fontWeight: 700, color: indicatorColor }}>
                                                {node.online ? `${node.moisture.toFixed(1)}%` : 'OFFLINE'}
                                            </span>
                                        </div>

                                        <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: `${node.online ? node.moisture : 0}%`,
                                                    background: indicatorColor,
                                                    transition: 'width 0.4s ease'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Solenoid Valve:</span>
                                            <span style={{
                                                fontWeight: 700,
                                                color: node.irrigating ? '#10b981' : '#94a3b8',
                                                fontSize: 10,
                                                padding: '1px 5px',
                                                background: node.irrigating ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)',
                                                borderRadius: 3
                                            }}>
                                                {node.irrigating ? 'OPEN (Watering)' : 'CLOSED (Idle)'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>System Mode:</span>
                                            <span style={{ fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', fontSize: 10.5 }}>{node.mode}</span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Soil Temp:</span>
                                            <span style={{ color: '#ffffff' }}>{node.temp.toFixed(1)} &deg;C</span>
                                        </div>

                                        {/* Quick limits controls inside the HUD */}
                                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: 8, color: '#94a3b8', display: 'block' }}>Min Limit</span>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max="90"
                                                    value={node.minMoisture}
                                                    onChange={(e) => dispatch({ type: 'UPDATE_THRESHOLDS', id: node.id, minMoisture: parseInt(e.target.value) || 30, maxMoisture: node.maxMoisture })}
                                                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid #334155', color: '#fff', fontSize: 10, borderRadius: 3, padding: '2px 4px' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: 8, color: '#94a3b8', display: 'block' }}>Max Limit</span>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max="90"
                                                    value={node.maxMoisture}
                                                    onChange={(e) => dispatch({ type: 'UPDATE_THRESHOLDS', id: node.id, minMoisture: node.minMoisture, maxMoisture: parseInt(e.target.value) || 80 })}
                                                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid #334155', color: '#fff', fontSize: 10, borderRadius: 3, padding: '2px 4px' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px dashed rgba(16,185,129,0.2)', marginTop: 6, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button
                                                    onClick={() => dispatch({ type: 'SET_MODE', id: node.id, mode: 'auto' })}
                                                    style={{
                                                        flex: 1,
                                                        padding: '3px 4px',
                                                        fontSize: 9.5,
                                                        borderRadius: 3,
                                                        cursor: 'pointer',
                                                        border: '1px solid rgba(16,185,129,0.3)',
                                                        background: node.mode === 'auto' ? 'rgba(16,185,129,0.2)' : 'transparent',
                                                        color: node.mode === 'auto' ? '#10b981' : '#94a3b8',
                                                    }}
                                                >
                                                    Auto Mode
                                                </button>
                                                <button
                                                    onClick={() => dispatch({ type: 'SET_MODE', id: node.id, mode: 'manual' })}
                                                    style={{
                                                        flex: 1,
                                                        padding: '3px 4px',
                                                        fontSize: 9.5,
                                                        borderRadius: 3,
                                                        cursor: 'pointer',
                                                        border: '1px solid rgba(16,185,129,0.3)',
                                                        background: node.mode === 'manual' ? 'rgba(16,185,129,0.2)' : 'transparent',
                                                        color: node.mode === 'manual' ? '#10b981' : '#94a3b8',
                                                    }}
                                                >
                                                    Manual
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => dispatch({ type: 'TOGGLE_VALVE', id: node.id })}
                                                style={{
                                                    width: '100%',
                                                    padding: '5px 0',
                                                    fontSize: 10,
                                                    fontWeight: 'bold',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    border: '1px solid ' + (node.irrigating ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'),
                                                    background: node.irrigating ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: node.irrigating ? '#ef4444' : '#10b981',
                                                }}
                                            >
                                                {node.irrigating ? 'Close Solenoid Valve' : 'Open Solenoid Valve'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })() : (
                            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, marginTop: 4 }}>
                                Click any sensor node probe, green valve, or building in the simulation scene to inspect telemetry.
                            </div>
                        )}
                    </div>

                    {/* 4. TOP RIGHT HUD: Nodes quick navigation list */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            width: 180,
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'auto',
                            zIndex: 10
                        }}
                    >
                        <span style={{ fontSize: 9, letterSpacing: '0.12em', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                            Field Node Feeds
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 160, overflowY: 'auto' }}>
                            {sensors.map((s) => {
                                const isSel = selectedNodeId === s.id
                                let indicatorColor = '#94a3b8'
                                if (s.online) {
                                    if (s.status === 'optimal') indicatorColor = '#10b981'
                                    else if (s.status === 'low') indicatorColor = '#f59e0b'
                                    else if (s.status === 'critical') indicatorColor = '#ef4444'
                                }

                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSelectStake(s.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: isSel ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                                            border: isSel ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.04)',
                                            borderRadius: 4,
                                            padding: '5px 7px',
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: indicatorColor }} />
                                            <span style={{ fontSize: 10.5, fontWeight: isSel ? 700 : 500, color: '#f1f5f9' }}>{s.id}</span>
                                            <span style={{ fontSize: 8, color: '#94a3b8' }}>({s.crop})</span>
                                        </div>

                                        {s.irrigating && (
                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 4px #3b82f6' }} />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* 5. BOTTOM PRESENTATION DOCK SYSTEM */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            right: 16,
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: 8,
                            padding: '8px 12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                            pointerEvents: 'auto',
                            zIndex: 10,
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10
                        }}
                    >
                        {/* Direct Focus Targets */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 2 }}>
                                Show Subsystem:
                            </span>
                            <button
                                onClick={() => handlePOIClick('general')}
                                style={{ padding: '3px 6px', fontSize: 9.5, borderRadius: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                            >
                                🗺️ Full Farm
                            </button>
                            <button
                                onClick={() => handlePOIClick('gateway')}
                                style={{ padding: '3px 6px', fontSize: 9.5, borderRadius: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                            >
                                💾 Gateway
                            </button>
                            <button
                                onClick={() => handlePOIClick('greenhouse')}
                                style={{ padding: '3px 6px', fontSize: 9.5, borderRadius: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                            >
                                🌿 Greenhouse
                            </button>
                            <button
                                onClick={() => handlePOIClick('outfield')}
                                style={{ padding: '3px 6px', fontSize: 9.5, borderRadius: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                            >
                                🌾 Outfields
                            </button>
                            <button
                                onClick={() => handlePOIClick('tank')}
                                style={{ padding: '3px 6px', fontSize: 9.5, borderRadius: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                            >
                                💧 Tank
                            </button>
                            <button
                                onClick={() => handlePOIClick('pump')}
                                style={{ padding: '3px 6px', fontSize: 9.5, borderRadius: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                            >
                                ⚙️ Pump
                            </button>
                            <button
                                onClick={() => handlePOIClick('solar')}
                                style={{ padding: '3px 6px', fontSize: 9.5, borderRadius: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                            >
                                ⚡ Solar
                            </button>
                            <button
                                onClick={() => handlePOIClick('weather')}
                                style={{ padding: '3px 6px', fontSize: 9.5, borderRadius: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                            >
                                ☁️ Weather
                            </button>
                        </div>

                        {/* Time cycle Slider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Time:
                            </span>
                            <input
                                type="range"
                                min="0"
                                max="23"
                                value={timeOfDay}
                                onChange={(e) => setTimeOfDay(parseInt(e.target.value))}
                                style={{ width: 70, cursor: 'pointer', accentColor: '#10b981' }}
                            />
                            <span style={{ fontSize: 9.5, fontWeight: 600, color: '#cbd5e1', minWidth: 40 }}>
                                {timeOfDay === 12 ? 'Noon' : timeOfDay === 18 ? 'Sunset' : timeOfDay === 22 ? 'Night' : `${timeOfDay}:00`}
                            </span>
                        </div>

                        {/* Global presentation toggles */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <button
                                onClick={() => {
                                    setAutoTourActive(!autoTourActive)
                                    if (!autoTourActive) setTourStepIndex(0)
                                }}
                                style={{
                                    padding: '3px 6px',
                                    fontSize: 9.5,
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    background: autoTourActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                                    border: autoTourActive ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                    color: autoTourActive ? '#10b981' : '#f1f5f9'
                                }}
                            >
                                {autoTourActive ? '⏹ Stop Tour' : '▶ Investor Tour'}
                            </button>
                            <button
                                onClick={() => setAutoRotateActive(!autoRotateActive)}
                                style={{
                                    padding: '3px 6px',
                                    fontSize: 9.5,
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    background: autoRotateActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                                    border: autoRotateActive ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                    color: autoRotateActive ? '#10b981' : '#f1f5f9'
                                }}
                            >
                                🔄 Rotate
                            </button>
                            <button
                                onClick={() => setShowLabels(!showLabels)}
                                style={{
                                    padding: '3px 6px',
                                    fontSize: 9.5,
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    background: showLabels ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                                    border: showLabels ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                    color: showLabels ? '#10b981' : '#f1f5f9'
                                }}
                            >
                                🏷️ Labels
                            </button>
                        </div>

                    </div>
                </div>
            </Html>
        </>
    )
}
