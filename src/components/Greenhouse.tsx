import * as THREE from 'three'
import { Edges } from '@react-three/drei'
import { SensorNode } from '../context/SimulationContext'
import Sensors from './Sensors'

interface GreenhouseProps {
    position?: [number, number, number]
    sensors?: SensorNode[]
    selectedNodeId?: string | null
    onSelectSensor?: (id: string) => void
    onSelectComponent: (name: string, specs: string) => void
}

function CoffeePlant({ position, status = 'optimal' }: { position: [number, number, number], status?: string }) {
    // Determine colors/scale based on health status
    let leafColor = "#15803d"
    let leafScaleY = 0.15
    let leafAngle = 0.25

    if (status === 'critical') {
        leafColor = "#78350f" // withered, brown
        leafScaleY = 0.03 // shriveled
        leafAngle = -0.2 // drooping heavily
    } else if (status === 'low') {
        leafColor = "#84cc16" // lighter green / yellowing
        leafScaleY = 0.1 // slightly wilted
        leafAngle = 0.05 // slightly droopy
    }

    return (
        <group position={position}>
            {/* Stalk */}
            <mesh position={[0, 0.225, 0]} castShadow>
                <cylinderGeometry args={[0.025, 0.035, 0.45]} />
                <meshStandardMaterial color="#166534" />
            </mesh>
            {/* Leaves */}
            {[0, 1, 2, 3].map((l) => (
                <mesh
                    key={l}
                    position={[0, 0.38, 0]}
                    rotation={[0, (Math.PI / 2) * l + 0.1, leafAngle]}
                    scale={[1.7, leafScaleY, 0.7]}
                    castShadow
                >
                    <sphereGeometry args={[0.14, 6, 6]} />
                    <meshStandardMaterial color={leafColor} roughness={0.6} />
                </mesh>
            ))}
        </group>
    )
}

export default function Greenhouse({
    position = [-2.5, 0, 0.5],
    sensors = [],
    onSelectSensor = () => { },
    onSelectComponent = () => { },
}: GreenhouseProps) {
    // Extract B1 and B4 sensors if present
    const sensorB1 = sensors.find((s) => s.id === 'B1')
    const sensorB4 = sensors.find((s) => s.id === 'B4')

    // Plant coordinates relative to greenhouse center position
    const plantRelativeCoords: [number, number, number][] = [
        [-0.3, 0.15, -1.9], [0.3, 0.15, -1.9],
        [-0.3, 0.15, -1.1], [0.3, 0.15, -1.1],
        [-0.3, 0.15, -0.3], [0.3, 0.15, -0.3],
        [-0.3, 0.15, 0.5], [0.3, 0.15, 0.5],
        [-0.3, 0.15, 1.3], [0.3, 0.15, 1.3],
    ]

    return (
        <group position={position}>
            {/* Greenhouse Soil Plot (Brown dirt) */}
            <mesh position={[0, 0.075, 0]} receiveShadow>
                <boxGeometry args={[3.6, 0.15, 4.4]} />
                <meshStandardMaterial color="#423328" roughness={0.98} />
            </mesh>

            {/* Transparent glass dome body */}
            <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.7, 1.8, 4.5]} />
                <meshStandardMaterial
                    color="#93c5fd"
                    transparent
                    opacity={0.14}
                    roughness={0.1}
                    metalness={0.2}
                    side={THREE.DoubleSide}
                />
                <Edges color="#475569" />
            </mesh>

            {/* Arched roof segments */}
            <mesh position={[0, 1.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.85, 1.85, 4.5, 12, 1, false, 0, Math.PI]} />
                <meshStandardMaterial
                    color="#93c5fd"
                    transparent
                    opacity={0.14}
                    roughness={0.1}
                    metalness={0.2}
                    side={THREE.DoubleSide}
                />
                <Edges color="#475569" />
            </mesh>

            {/* Plant Grid */}
            {plantRelativeCoords.map((pos, idx) => {
                const node = pos[2] < 0 ? sensorB1 : sensorB4;
                return <CoffeePlant key={idx} position={pos} status={node ? node.status : 'optimal'} />
            })}

            {/* Internal sensors (B1 / B4) */}
            {sensorB1 && (
                <Sensors
                    key="B1"
                    id="B1"
                    position={[0, 0.15, -1.7]}
                    onSelect={onSelectSensor}
                    onSelectComponent={onSelectComponent}
                />
            )}
            {sensorB4 && (
                <Sensors
                    key="B4"
                    id="B4"
                    position={[0, 0.15, 0.7]}
                    onSelect={onSelectSensor}
                    onSelectComponent={onSelectComponent}
                />
            )}

            {/* Irrigation System Pipes */}
            {/* Vertical riser pipe */}
            <mesh position={[0, 0.75, -1.5]} castShadow>
                <cylinderGeometry args={[0.025, 0.025, 1.2]} />
                <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
            {/* Overhead drip line */}
            <mesh position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 3.8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
        </group>
    )
}
