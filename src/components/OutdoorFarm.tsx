
import { SensorNode } from '../context/SimulationContext'

interface OutdoorFarmProps {
    position: [number, number, number]
    sensors?: SensorNode[]
    onSelectComponent: (name: string, specs: string) => void
}

export default function OutdoorFarm({ position, sensors, onSelectComponent }: OutdoorFarmProps) {

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
                    [-2, -1, 0, 1, 2].map((z) => {
                        const sensorId = z < 0 ? 'A1' : 'A2';
                        const status = sensors?.find(s => s.id === sensorId)?.status || 'optimal';

                        let leafColor1 = "#22b358"
                        let leafColor2 = "#218c47"
                        if (status === 'critical') {
                            leafColor1 = "#92400e"
                            leafColor2 = "#78350f"
                        } else if (status === 'low') {
                            leafColor1 = "#facc15"
                            leafColor2 = "#eab308"
                        }

                        return (
                            <group key={`maize-${x}-${z}`} position={[x, 0.05, z]}>
                                {/* Plant Stem */}
                                <mesh position={[0, 0.4, 0]} castShadow>
                                    <cylinderGeometry args={[0.015, 0.02, 0.8, 5]} />
                                    <meshStandardMaterial color={status === 'critical' ? "#78350f" : "#2d8a4e"} roughness={0.9} />
                                </mesh>
                                {/* Plant Leaves */}
                                <mesh position={[0, 0.7, 0]} rotation={[0.4, 0, 0.4]}>
                                    <coneGeometry args={[0.08, 0.3, 4]} />
                                    <meshStandardMaterial color={leafColor1} />
                                </mesh>
                                <mesh position={[0, 0.6, 0]} rotation={[-0.4, 0, -0.4]}>
                                    <coneGeometry args={[0.07, 0.25, 4]} />
                                    <meshStandardMaterial color={leafColor2} />
                                </mesh>
                            </group>
                        )
                    })
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
                    [-2, -1, 0, 1, 2].map((z) => {
                        const sensorId = z < 0 ? 'C1' : 'C2';
                        const status = sensors?.find(s => s.id === sensorId)?.status || 'optimal';

                        let stemColor = "#3b7d34"
                        let headColor = "#b33939"
                        if (status === 'critical') {
                            stemColor = "#713f12"
                            headColor = "#451a03"
                        } else if (status === 'low') {
                            stemColor = "#84cc16"
                            headColor = "#f59e0b"
                        }

                        return (
                            <group key={`sorghum-${x}-${z}`} position={[x, 0.05, z]}>
                                {/* Stem */}
                                <mesh position={[0, 0.3, 0]} castShadow>
                                    <cylinderGeometry args={[0.012, 0.018, 0.6, 5]} />
                                    <meshStandardMaterial color={stemColor} roughness={0.8} />
                                </mesh>
                                {/* Grain head */}
                                <mesh position={[0, 0.55, 0]}>
                                    <sphereGeometry args={[0.04, 6, 6]} />
                                    <meshStandardMaterial color={headColor} roughness={0.9} />
                                </mesh>
                            </group>
                        )
                    })
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

            {/* Removed description tag as per user request */}
        </group>
    )
}
