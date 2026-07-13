import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSimulation } from '../context/SimulationContext'

interface SolarSystemProps {
    position: [number, number, number]
    onSelectComponent: (name: string, specs: string) => void
}

export default function SolarSystem({ position, onSelectComponent }: SolarSystemProps) {
    const { state } = useSimulation()
    const solarPanelGroup = useRef<THREE.Group>(null)

    const handleSelect = () => {
        onSelectComponent(
            'Solar PV & Battery System',
            `Solar Subsystem:
- Panels: 1x 450W Monocrystalline Photovoltaic Module
- Current Solar Influx: ${state.solarOutput} Watts
- Efficiency: 21.8%
- Orientation: 15° North Slant (Optimized for Mbarara)

Power Storage Bank:
- Battery Type: LiFePO4 (Lithium Iron Phosphate)
- System Voltage: 24V DC
- Capacity: 200 Ah (4.8 kWh storage reserve)
- Current Charge State: ${state.batteryLevel}%

Smart Charge Controller:
- Rating: 24V 40A MPPT Charger
- Communication: RS485 Modbus telemetry link`
        );
    }

    // Slowly pivot panels towards the light (aesthetic)
    useFrame((stateFrame) => {
        if (solarPanelGroup.current) {
            // Gentle sun tracking angle adjustment (sinusoidal)
            const elapsed = stateFrame.clock.getElapsedTime()
            solarPanelGroup.current.rotation.y = Math.sin(elapsed * 0.05) * 0.05
        }
    })

    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
            {/* Heavy base foundation blocks */}
            <mesh position={[0, 0.05, 0.4]} castShadow receiveShadow>
                <boxGeometry args={[1.8, 0.1, 0.3]} />
                <meshStandardMaterial color="#57606f" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.05, -0.4]} castShadow receiveShadow>
                <boxGeometry args={[1.8, 0.1, 0.3]} />
                <meshStandardMaterial color="#57606f" roughness={0.9} />
            </mesh>

            {/* Main pivoting frames assembly */}
            <group ref={solarPanelGroup}>
                {/* Support Truss structures */}
                {/* Back tall posts */}
                <mesh position={[-0.7, 0.8, -0.4]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 1.5]} />
                    <meshStandardMaterial color="#747d8c" metalness={0.9} />
                </mesh>
                <mesh position={[0.7, 0.8, -0.4]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 1.5]} />
                    <meshStandardMaterial color="#747d8c" metalness={0.9} />
                </mesh>

                {/* Front low posts */}
                <mesh position={[-0.7, 0.45, 0.4]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.8]} />
                    <meshStandardMaterial color="#747d8c" metalness={0.9} />
                </mesh>
                <mesh position={[0.7, 0.45, 0.4]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.8]} />
                    <meshStandardMaterial color="#747d8c" metalness={0.9} />
                </mesh>

                {/* Slanted PV Panel Board */}
                {/* Frame rotates and sits at roughly 15 degrees tilt Y-Z */}
                <group position={[0, 0.85, 0]} rotation={[0.3, 0, 0]}>
                    {/* Black Frame Backing */}
                    <mesh castShadow>
                        <boxGeometry args={[2.0, 0.06, 1.3]} />
                        <meshStandardMaterial color="#2f3542" roughness={0.5} metalness={0.6} />
                    </mesh>

                    {/* Dark Blue Silicon Cells Surface */}
                    <mesh position={[0, 0.04, 0]}>
                        <boxGeometry args={[1.92, 0.01, 1.22]} />
                        <meshStandardMaterial color="#0c2461" metalness={0.95} roughness={0.08} />
                    </mesh>

                    {/* Silver Grid lines on cells (aesthetic layering) */}
                    <gridHelper args={[1.9, 8, '#57606f', '#1e3799']} rotation={[0, 0, 0]} position={[0, 0.046, 0]} />
                </group>
            </group>

            {/* Floating HUD status */}
            <Html position={[0, 1.8, 0]} center distanceFactor={8}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(3px)',
                    color: '#f1c40f',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(241, 196, 15, 0.3)',
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}>
                    450W solar array ({state.solarOutput}W)
                </div>
            </Html>
        </group>
    )
}
