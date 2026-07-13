import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSimulation } from '../context/SimulationContext'

interface SensorStakeProps {
    id: string
    position: [number, number, number]
    onSelect?: (id: string) => void
    onSelectComponent: (name: string, specs: string) => void
}

export default function Sensors({ id, position, onSelect, onSelectComponent }: SensorStakeProps) {
    const { state } = useSimulation()
    const wetSoilRef = useRef<THREE.Mesh>(null)

    // Find current node
    const node = state.sensors.find(s => s.id === id)
    const isOnline = node ? node.online : false
    const moisture = node ? node.moisture : 50
    const isIrrigating = node ? node.irrigating : false

    // Colors mapping matches status Config exactly
    let color = '#27ae60' // optimal
    if (!isOnline) color = '#7f8c8d'
    else if (moisture < (node?.minMoisture ?? 30) - 10) color = '#e74c3c' // critical
    else if (moisture < (node?.minMoisture ?? 30)) color = '#f39c12' // low

    // Animate soil moistness ring overlay (shading)
    // Dilates outward if irrigating, slowly fades color as moisture drops
    useFrame(() => {
        if (wetSoilRef.current) {
            // Scale soil wetness circle based on moisture level
            const targetScale = isOnline ? 0.3 + (moisture / 100) * 1.2 : 0.01
            wetSoilRef.current.scale.set(targetScale, targetScale, 1)

            // Wet soil texture opacity drops as moisture declines
            const material = wetSoilRef.current.material as THREE.MeshStandardMaterial
            if (material) {
                material.opacity = THREE.MathUtils.lerp(
                    material.opacity,
                    isIrrigating ? 0.8 : (moisture / 100) * 0.7,
                    0.05
                )
            }
        }
    })

    const handleSelect = () => {
        if (!node) return
        onSelectComponent(
            `Capacitive Moisture Sensor (${node.id})`,
            `Sensor Probe Hardware:
- Model: Chirp! Capacitive Moisture Probe V2.0
- Transceiver MCU: ESP32-S2 (Single Core 240MHz)
- RF link: LoRa 868MHz (to Central Gateway)
- Battery Unit: 1500mAh LiPo + 1.5W Solar lid
- Current Battery: ${node.battery}%
- Current Signal: ${node.signalStrength} dBm

Telemetry Readings:
- Current Moisture: ${node.moisture}% (${node.status.toUpperCase()})
- Soil Temp: ${node.temp}°C
- Depth: ${node.depth}
- Area Scale: ${node.area}
- Threshold Min: ${node.minMoisture}%, Max: ${node.maxMoisture}%`
        );
        if (onSelect) onSelect(id)
    }

    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
            {/* Ground Dilation Wetness circle (flat on soil) */}
            <mesh
                ref={wetSoilRef}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.051, 0]}
            >
                <planeGeometry args={[1.5, 1.5]} />
                <meshStandardMaterial
                    color="#382312"
                    transparent
                    opacity={0.5}
                    roughness={0.9}
                />
            </mesh>

            {/* Ground Stake Spike (Brown plastic cylinder driven into ground) */}
            <mesh position={[0, 0.1, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
                <meshStandardMaterial color="#4a3728" roughness={0.9} />
            </mesh>

            {/* Stake Probe Body (Capacitive board section) */}
            <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.02, 0.28, 0.06]} />
                <meshStandardMaterial color="#2d3748" metalness={0.7} />
            </mesh>

            {/* Electronics Casing Top Shell (Green / Orange depending on status) */}
            <mesh position={[0, 0.46, 0]} castShadow>
                <boxGeometry args={[0.07, 0.08, 0.09]} />
                <meshStandardMaterial color="#27ae60" roughness={0.5} />
            </mesh>

            {/* Status LED Blink (flashing indicator) */}
            <mesh position={[0, 0.46, 0.05]}>
                <sphereGeometry args={[0.012, 6, 6]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Small solar cap lid */}
            <mesh position={[0, 0.505, 0]} rotation={[0.1, 0, 0]}>
                <boxGeometry args={[0.09, 0.01, 0.11]} />
                <meshStandardMaterial color="#0a3d62" metalness={0.9} />
            </mesh>

            {/* Small whip antenna */}
            <mesh position={[0, 0.56, -0.03]} rotation={[0, 0, 0.15]}>
                <cylinderGeometry args={[0.005, 0.005, 0.14]} />
                <meshStandardMaterial color="#1e272e" />
            </mesh>

            {/* Display floating tag label */}
            <Html position={[0, 0.75, 0]} center distanceFactor={8}>
                <div style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: color,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    border: `1px solid ${color}44`,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                }}>
                    <span>Node {id}</span>
                    <span style={{ fontSize: '7px', opacity: 0.7 }}>{isOnline ? `${moisture}%` : 'OFFLINE'}</span>
                </div>
            </Html>
        </group>
    )
}
