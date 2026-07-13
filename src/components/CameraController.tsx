import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraControllerProps {
    poi: string | null
    tourActive: boolean
    onTourStepChange: (stepIndex: number) => void
}

// Preset Coordinates for POIs (camera position and target focus point)
export const POI_PRESETS: Record<string, { cam: [number, number, number]; target: [number, number, number] }> = {
    general: { cam: [8, 10, 12], target: [0, 0, 0] },
    gateway: { cam: [7.5, 2.5, -4.5], target: [5.5, 0.5, -5.0] },
    tank: { cam: [-3.8, 3.5, -3.8], target: [-6.0, 1.5, -5.0] },
    pump: { cam: [-3.2, 1.8, -1.8], target: [-5.0, 0.4, -3.0] },
    solar: { cam: [2.5, 2.2, 2.5], target: [0.0, 0.6, 4.0] },
    greenhouse: { cam: [-2.0, 4.5, 3.0], target: [-5.5, 0.8, 3.5] },
    outfield: { cam: [4.0, 5.0, 4.5], target: [2.5, 0.4, 0.0] },
    weather: { cam: [3.8, 3.2, -3.8], target: [2.2, 1.2, -5.0] }
}

export const TOUR_STEPS = [
    { key: 'general', title: 'System Overview', desc: 'AgriSense 3D Digital Twin environment showing Mbarara smart farm model.' },
    { key: 'gateway', title: 'Smart Gateway Node', desc: 'Central LoRa gateway collects node metrics and relays to AWS Cloud.' },
    { key: 'tank', title: 'Gravity Feeding Water Tower', desc: '5,000-liter storage tank tracking real-world water reserves.' },
    { key: 'pump', title: '12V Irrigation Pump', desc: 'Monitors pump state and schedules pressurized irrigation flow.' },
    { key: 'solar', title: 'Solar PV & Battery Bank', desc: '450W solar module and 24V storage battery run gateway and pump.' },
    { key: 'greenhouse', title: 'Polytunnel Greenhouse (Plot B)', desc: 'Controlled greenhouse zone with automated Solenoid drip lines.' },
    { key: 'outfield', title: 'Outdoor Fields (Plot A & C)', desc: 'Maize and Sorghum outfield monitored by Chirp! moisture probes.' },
    { key: 'weather', title: 'Weather Telemetry', desc: 'Realtime wind, solar influx, and precipitation sensors.' }
]

export default function CameraController({ poi, tourActive, onTourStepChange }: CameraControllerProps) {
    const { camera, controls } = useThree()
    const currentStepIndex = useRef<number>(0)

    // Track target variables
    const targetCam = useRef<THREE.Vector3>(new THREE.Vector3(8, 10, 12))
    const targetLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))

    useEffect(() => {
        // If not in tour mode, set destination from individual POI selection
        if (!tourActive && poi && POI_PRESETS[poi]) {
            const preset = POI_PRESETS[poi]
            targetCam.current.set(...preset.cam)
            targetLook.current.set(...preset.target)
        } else if (!tourActive) {
            // Default to general overview
            const preset = POI_PRESETS.general
            targetCam.current.set(...preset.cam)
            targetLook.current.set(...preset.target)
        }
    }, [poi, tourActive])

    // Handle tour progress clock loop
    useEffect(() => {
        if (!tourActive) return

        // Immediately trigger step 0
        currentStepIndex.current = 0
        onTourStepChange(0)
        const preset = POI_PRESETS[TOUR_STEPS[0].key]
        targetCam.current.set(...preset.cam)
        targetLook.current.set(...preset.target)

        const interval = setInterval(() => {
            currentStepIndex.current = (currentStepIndex.current + 1) % TOUR_STEPS.length
            onTourStepChange(currentStepIndex.current)

            const step = TOUR_STEPS[currentStepIndex.current]
            const nextPreset = POI_PRESETS[step.key]
            if (nextPreset) {
                targetCam.current.set(...nextPreset.cam)
                targetLook.current.set(...nextPreset.target)
            }
        }, 7000) // Change viewpoint focus every 7 seconds

        return () => clearInterval(interval)
    }, [tourActive, onTourStepChange])

    // Smooth lerping frame rates
    useFrame((_, delta) => {
        // Damp camera position
        camera.position.lerp(targetCam.current, delta * 3.2)

        // Damp OrbitControls target focus point
        if (controls) {
            const orbitControls = controls as any
            // Directly linear interpolate the target vector
            const currentTarget = orbitControls.target as THREE.Vector3
            currentTarget.lerp(targetLook.current, delta * 3.2)
            orbitControls.update()
        }
    })

    return null
}
