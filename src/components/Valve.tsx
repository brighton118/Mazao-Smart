import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSimulation } from '../context/SimulationContext'

interface ValveProps {
    position: [number, number, number]
    sensorId: string
    onSelectComponent: (name: string, specs: string) => void
}

export default function Valve({ position, sensorId, onSelectComponent }: ValveProps) {
    const { state } = useSimulation()
    const actuatorRef = useRef<THREE.Mesh>(null)

    // Find corresponding sensor to listen to its irrigating state
    const node = state.sensors.find(s => s.id === sensorId)
    const isOpen = node ? node.irrigating : false

    // Animate the physical valve actuator rotation between 0 (CLOSED) and PI/2 (OPEN)
    useFrame(() => {
        if (actuatorRef.current) {
            const targetRotation = isOpen ? Math.PI / 2 : 0
            actuatorRef.current.rotation.y = THREE.MathUtils.lerp(
                actuatorRef.current.rotation.y,
                targetRotation,
                0.1
            )
        }
    })

    // Destructure properties to display
    const handleSelect = () => {
        if (!node) return
        onSelectComponent(
            `Solenoid Valve Module (${sensorId})`,
            `Actuator Specifications:
- Model: Normally Closed Solenoid Valve
- Driver Voltage: 12V DC
- Current Consumption: 450mA
- Fitting Size: 3/4" (G-Thread Female)
- Operation Type: Pilot-operated diaphragm
- Action: Electromagnetic toggle
- Status: ${isOpen ? 'OPEN (Water Flowing)' : 'CLOSED (Blocked)'}
- Mode: ${node.mode === 'auto' ? 'AUTOMATIC CONTROL' : 'MANUAL OVERRIDE'}`
        );
    }

    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
            {/* Horizontal Pipe Body Section */}
            <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.065, 0.065, 0.4, 8]} />
                <meshStandardMaterial color="#34495e" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Valve Brass Bonnet / Core housing */}
            <mesh position={[0, 0.08, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.15, 8]} />
                <meshStandardMaterial color="#d35400" roughness={0.4} metalness={0.8} />
            </mesh>

            {/* Rotating Actuator handle */}
            <mesh ref={actuatorRef} position={[0, 0.18, 0]} castShadow>
                <boxGeometry args={[0.03, 0.06, 0.22]} />
                <meshStandardMaterial color={isOpen ? '#2ecc71' : '#c0392b'} roughness={0.3} />
            </mesh>

            {/* Small status LED bulb */}
            <mesh position={[0, 0.22, 0]}>
                <sphereGeometry args={[0.02, 6, 6]} />
                <meshBasicMaterial color={isOpen ? '#2ecc71' : '#e74c3c'} />
            </mesh>

            {/* Description tag */}
            <Html position={[0, 0.45, 0]} center distanceFactor={8}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(3px)',
                    color: isOpen ? '#2ecc71' : '#c0392b',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontSize: '7px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}>
                    Valve {sensorId} ({isOpen ? 'OPEN' : 'CLOSED'})
                </div>
            </Html>
        </group>
    )
}
