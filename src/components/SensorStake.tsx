import * as THREE from 'three'
import { SensorNode } from '../context/SimulationContext'

interface SensorStakeProps {
    sensor: SensorNode
    position: [number, number, number]
    isSelected: boolean
    onSelect: (id: string) => void
}

export default function SensorStake({ sensor, position, isSelected, onSelect }: SensorStakeProps) {
    let statusColor = '#8aab90' // offline
    if (sensor.online) {
        if (sensor.status === 'optimal') statusColor = '#4caf7d'
        else if (sensor.status === 'low') statusColor = '#e8a042'
        else if (sensor.status === 'critical') statusColor = '#e05a4e'
    }

    // Handle click to select the node
    const handleClick = (e: any) => {
        e.stopPropagation()
        onSelect(sensor.id)
    }

    return (
        <group position={position} onClick={handleClick}>
            {/* Click target box (invisible but raycastable) */}
            <mesh position={[0, 0.35, 0]}>
                <boxGeometry args={[0.4, 0.75, 0.4]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {/* Ground peg */}
            <mesh position={[0, 0.125, 0]} castShadow>
                <cylinderGeometry args={[0.045, 0.045, 0.45]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Transmitter box */}
            <mesh position={[0, 0.355, 0]} castShadow>
                <boxGeometry args={[0.16, 0.14, 0.16]} />
                <meshStandardMaterial color={isSelected ? '#3b82f6' : '#1e293b'} roughness={0.5} />
            </mesh>

            {/* LED indicator */}
            <mesh position={[0, 0.44, 0]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshBasicMaterial color={statusColor} />
            </mesh>

            {/* Moisture base ring */}
            <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.18, 0.22, 16]} />
                <meshBasicMaterial color={statusColor} side={THREE.DoubleSide} transparent opacity={0.7} />
            </mesh>
        </group>
    )
}
