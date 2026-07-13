import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSimulation } from '../context/SimulationContext'

interface PumpProps {
    position: [number, number, number]
    onSelectComponent: (name: string, specs: string) => void
}

export default function Pump({ position, onSelectComponent }: PumpProps) {
    const { state } = useSimulation()
    const pumpGroupRef = useRef<THREE.Group>(null)

    // Jitter/Vibrate the pump when it's active to show physical operations
    useFrame((stateFrame) => {
        if (pumpGroupRef.current) {
            if (state.pumpActive) {
                const elapsed = stateFrame.clock.getElapsedTime()
                pumpGroupRef.current.position.y = Math.sin(elapsed * 120) * 0.015
                pumpGroupRef.current.position.x = Math.cos(elapsed * 120) * 0.015
            } else {
                pumpGroupRef.current.position.y = 0
                pumpGroupRef.current.position.x = 0
            }
        }
    })

    const handleSelect = () => {
        onSelectComponent(
            'Pressure Irrigation Pump',
            `Motor Specifications:
- Type: High-Pressure 12V DC Diaphragm Pump
- Max Flow Rate: 33 Litres/minute (Adjusted)
- Cut-off Pressure: 0.42 MPa (60 PSI)
- Draw: 9.5 Amperes (approx. 114 Watts active)
- Status: ${state.pumpActive ? 'RUNNING (Active Vibe)' : 'STANDBY (Idle)'}

Pump Controller:
- Relay: 5V 10A Optocoupler Isolated Relays
- Mode: ${state.weather === 'rainy' ? 'SUSPENDED (Rain Override)' : 'STANDBY'}`
        );
    }

    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
            {/* Structural Pump Ground Plinth */}
            <mesh receiveShadow position={[0, 0.05, 0]}>
                <boxGeometry args={[0.9, 0.1, 0.7]} />
                <meshStandardMaterial color="#4a5568" roughness={0.9} />
            </mesh>

            {/* Main Vibrating Pump Assembly */}
            <group ref={pumpGroupRef} position={[0, 0.1, 0]}>
                {/* Pump Motor Cylinder */}
                <mesh castShadow position={[-0.1, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
                    <meshStandardMaterial color="#1a202c" metalness={0.7} roughness={0.3} />
                </mesh>

                {/* Diaphragm Head Box */}
                <mesh castShadow position={[0.25, 0.25, 0]}>
                    <boxGeometry args={[0.3, 0.35, 0.35]} />
                    <meshStandardMaterial color="#2d3748" metalness={0.8} />
                </mesh>

                {/* Valve Inlet pipe connection */}
                <mesh position={[0.25, 0.15, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.15]} />
                    <meshStandardMaterial color="#a0aec0" metalness={0.8} />
                </mesh>

                {/* Valve Outlet pipe connection */}
                <mesh position={[0.25, 0.15, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.15]} />
                    <meshStandardMaterial color="#a0aec0" metalness={0.8} />
                </mesh>

                {/* Active Power Pilot Lamp */}
                <mesh position={[-0.2, 0.4, 0.1]}>
                    <sphereGeometry args={[0.03, 8, 8]} />
                    <meshBasicMaterial color={state.pumpActive ? '#00ff00' : '#7f8c8d'} />
                </mesh>
            </group>

            {/* Description tag */}
            <Html position={[0, 0.7, 0]} center distanceFactor={8}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(3px)',
                    color: state.pumpActive ? '#2ecc71' : '#a0aec0',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(46, 204, 113, 0.3)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    transition: 'all 0.3s ease'
                }}>
                    12V Water Pump ({state.pumpActive ? 'ON' : 'OFF'})
                </div>
            </Html>
        </group>
    )
}
