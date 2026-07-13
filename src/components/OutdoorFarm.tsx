import { Html } from '@react-three/drei'

interface OutdoorFarmProps {
    position: [number, number, number]
    onSelectComponent: (name: string, specs: string) => void
}

export default function OutdoorFarm({ position, onSelectComponent }: OutdoorFarmProps) {

    const handleSelect = () => {
        onSelectComponent(
            'Outdoor Cultivation Garden',
            `Field Parameters:
- Cultivated Crop: Maize (Plot A) & Sorghum (Plot C)
- Field Area: 1.0 Hectare (Total tilled zone)
- Irrigation Scheme: Subsurface Drip Irrigation (SDI)
- Soil Type: Clay loam (Optimal for cereal crops)

Zone Layout:
- Plot A: Maize (Stakes A1, A2) - Height: 1.8m
- Plot C: Sorghum (Stakes C1, C2) - Height: 1.2m
- Sensor Mapping: LoRa Capacitive Probes`
        );
    }

    // Draw simple tilled soil rows and crops (corn/sorghum mock with cylindrical stalks)
    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
            {/* Tilled Mud Bed 1: Maize Plot */}
            <group position={[-2.5, 0, 0]}>
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[4.2, 0.08, 5]} />
                    <meshStandardMaterial color="#573d26" roughness={0.9} />
                </mesh>

                {/* Helper grids representing tilled soil rows */}
                <gridHelper args={[4.6, 12, '#382312', '#412a17']} position={[0, 0.05, 0]} />

                {/* Rows of crop plants (Corn stalks) */}
                {[-1.6, -0.6, 0.4, 1.4].map((x) =>
                    [-2, -1, 0, 1, 2].map((z) => (
                        <group key={`maize-${x}-${z}`} position={[x, 0.05, z]}>
                            {/* Plant Stem */}
                            <mesh position={[0, 0.4, 0]} castShadow>
                                <cylinderGeometry args={[0.015, 0.02, 0.8, 5]} />
                                <meshStandardMaterial color="#2d8a4e" roughness={0.9} />
                            </mesh>
                            {/* Plant Leaves */}
                            <mesh position={[0, 0.7, 0]} rotation={[0.4, 0, 0.4]}>
                                <coneGeometry args={[0.08, 0.3, 4]} />
                                <meshStandardMaterial color="#22b358" />
                            </mesh>
                            <mesh position={[0, 0.6, 0]} rotation={[-0.4, 0, -0.4]}>
                                <coneGeometry args={[0.07, 0.25, 4]} />
                                <meshStandardMaterial color="#218c47" />
                            </mesh>
                        </group>
                    ))
                )}
            </group>

            {/* Tilled Mud Bed 2: Sorghum Plot */}
            <group position={[2.5, 0, 0]}>
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[4.2, 0.08, 5]} />
                    <meshStandardMaterial color="#47321e" roughness={0.95} />
                </mesh>

                <gridHelper args={[4.6, 12, '#2c1e12', '#332315']} position={[0, 0.05, 0]} />

                {/* Rows of crop plants (Sorghum stalks - slightly shorter/redder tops) */}
                {[-1.6, -0.6, 0.4, 1.4].map((x) =>
                    [-2, -1, 0, 1, 2].map((z) => (
                        <group key={`sorghum-${x}-${z}`} position={[x, 0.05, z]}>
                            {/* Stem */}
                            <mesh position={[0, 0.3, 0]} castShadow>
                                <cylinderGeometry args={[0.012, 0.018, 0.6, 5]} />
                                <meshStandardMaterial color="#3b7d34" roughness={0.8} />
                            </mesh>
                            {/* Grain head */}
                            <mesh position={[0, 0.55, 0]}>
                                <sphereGeometry args={[0.04, 6, 6]} />
                                <meshStandardMaterial color="#b33939" roughness={0.9} />
                            </mesh>
                        </group>
                    ))
                )}
            </group>

            {/* Outer wooden border post fence representing farm bounds */}
            <mesh position={[-5, 0.3, -3]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.6]} />
                <meshStandardMaterial color="#7f8c8d" />
            </mesh>
            <mesh position={[5, 0.3, -3]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.6]} />
                <meshStandardMaterial color="#7f8c8d" />
            </mesh>
            <mesh position={[-5, 0.3, 3]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.6]} />
                <meshStandardMaterial color="#7f8c8d" />
            </mesh>
            <mesh position={[5, 0.3, 3]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.6]} />
                <meshStandardMaterial color="#7f8c8d" />
            </mesh>

            {/* Description tag */}
            <Html position={[0, 1.2, 0]} center distanceFactor={8}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(3px)',
                    color: '#2ecc71',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(46, 204, 113, 0.3)',
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}>
                    Open Crop Fields (Maize & Sorghum)
                </div>
            </Html>
        </group>
    )
}
