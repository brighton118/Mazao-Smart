import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSimulation } from '../context/SimulationContext'

interface WaterTankProps {
    position: [number, number, number]
    onSelectComponent: (name: string, specs: string) => void
}

export default function WaterTank({ position, onSelectComponent }: WaterTankProps) {
    const { state } = useSimulation()
    const waterLevelRef = useRef<THREE.Mesh>(null)

    // Smoothly adjust the physical water cylinder scale based on current state (0 - 5000)
    useFrame(() => {
        if (waterLevelRef.current) {
            const targetScaleY = state.tankLevel / 5000
            waterLevelRef.current.scale.y = THREE.MathUtils.lerp(
                waterLevelRef.current.scale.y,
                Math.max(0.01, targetScaleY),
                0.05
            )
            // Adjust position Y as scale changes to keep base fixed
            waterLevelRef.current.position.y = 1.0 + (waterLevelRef.current.scale.y * 2.2) / 2
        }
    })

    const handleSelect = () => {
        onSelectComponent(
            'Irrigation Water Tank',
            `Storage Parameters:
- Design: Cylindrical Galvanized Tank
- Rated Volume: 5,000 Litres
- Current Volume: ${state.tankLevel} Litres
- Base Pressure: 0.25 MPa (Gravity Fed)
- Materials: Food-grade steel liner

Auxiliary Fertigation Reservoir:
- Volume: 200 Litres
- Current Nutrient Level: ${state.fertigationLevel}%
- Mixer: 12V DC Electric Agitator
- Dosage Ratio: 1:100 (Adjusted via Solenoid)`
        );
    }

    return (
        <group position={position}>
            {/* Interactive Selection Zone */}
            <group onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
                {/* Foundation Concrete Pad */}
                <mesh position={[0, 0.05, 0]} receiveShadow>
                    <cylinderGeometry args={[1.8, 1.8, 0.1, 16]} />
                    <meshStandardMaterial color="#7f8c8d" roughness={0.8} />
                </mesh>

                {/* 4 Steel Leg Columns */}
                <mesh position={[-1, 1, -1]} castShadow>
                    <cylinderGeometry args={[0.08, 0.08, 2]} />
                    <meshStandardMaterial color="#2d3748" metalness={0.9} />
                </mesh>
                <mesh position={[1, 1, -1]} castShadow>
                    <cylinderGeometry args={[0.08, 0.08, 2]} />
                    <meshStandardMaterial color="#2d3748" metalness={0.9} />
                </mesh>
                <mesh position={[-1, 1, 1]} castShadow>
                    <cylinderGeometry args={[0.08, 0.08, 2]} />
                    <meshStandardMaterial color="#2d3748" metalness={0.9} />
                </mesh>
                <mesh position={[1, 1, 1]} castShadow>
                    <cylinderGeometry args={[0.08, 0.08, 2]} />
                    <meshStandardMaterial color="#2d3748" metalness={0.9} />
                </mesh>

                {/* Tank Platform */}
                <mesh position={[0, 2.05, 0]} receiveShadow castShadow>
                    <boxGeometry args={[2.5, 0.1, 2.5]} />
                    <meshStandardMaterial color="#34495e" roughness={0.6} metalness={0.5} />
                </mesh>

                {/* Transparent Outer Glass/Perspex Tank Shield (to view water level inside) */}
                <mesh position={[0, 3.2, 0]}>
                    <cylinderGeometry args={[1.1, 1.1, 2.2, 16]} />
                    <meshStandardMaterial
                        color="#a5b1c2"
                        transparent
                        opacity={0.155}
                        roughness={0.1}
                        metalness={0.9}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Dynamic Water Volume Cylinder */}
                <mesh ref={waterLevelRef} position={[0, 2.1, 0]}>
                    <cylinderGeometry args={[1.05, 1.05, 2.2, 16]} />
                    <meshStandardMaterial
                        color="#2980b9"
                        transparent
                        opacity={0.7}
                        roughness={0.2}
                        metalness={0.1}
                    />
                </mesh>

                {/* Tank Lid */}
                <mesh position={[0, 4.35, 0]} castShadow>
                    <cylinderGeometry args={[1.15, 1.15, 0.1, 16]} />
                    <meshStandardMaterial color="#2c3e50" metalness={0.7} />
                </mesh>

                {/* Adjacent Fertigation Reservoir (Small plastic tank on the ground) */}
                <group position={[1.4, 0.45, 1.4]}>
                    <mesh castShadow receiveShadow>
                        <cylinderGeometry args={[0.4, 0.4, 0.8, 12]} />
                        <meshStandardMaterial color="#27ae60" roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0.42, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.05, 12]} />
                        <meshStandardMaterial color="#1e272e" />
                    </mesh>
                    {/* Feed pipe back to base */}
                    <mesh position={[-0.3, -0.1, -0.3]} rotation={[1.1, 0.5, 0.5]}>
                        <cylinderGeometry args={[0.04, 0.04, 0.8]} />
                        <meshStandardMaterial color="#2c3e50" />
                    </mesh>
                </group>
            </group>

            {/* Floating HUD status */}
            <Html position={[0, 4.8, 0]} center distanceFactor={8}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(4px)',
                    color: '#00d2d3',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(0, 210, 211, 0.4)',
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}>
                    5,000L Water Tower ({state.tankLevel}L)
                </div>
            </Html>
        </group>
    )
}
