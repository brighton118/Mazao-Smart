import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

import { useSimulation } from '../context/SimulationContext'

function WaterParticles({ active }: { active: boolean }) {
    const group = useRef<THREE.Group>(null)

    useFrame(({ clock }) => {
        if (!group.current) return
        if (!active) {
            group.current.visible = false
            return
        }
        group.current.visible = true
        const elapsed = clock.elapsedTime
        // Animate particles falling down
        group.current.children.forEach((child, i) => {
            const speed = 1.5 + (i * 0.2)
            const dropTime = (elapsed * speed + (i * 0.5)) % 1
            // Start at y=0.8, fall to y=0
            child.position.y = 0.8 - (dropTime * 0.8)
            // Fade out near bottom
            child.scale.setScalar(dropTime > 0.8 ? (1 - dropTime) * 5 : 1)
        })
    })

    return (
        <group ref={group} visible={false}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <mesh key={i} position={[Math.cos(i * Math.PI / 3) * 0.15, 0.8, Math.sin(i * Math.PI / 3) * 0.15]}>
                    <sphereGeometry args={[0.015, 4, 4]} />
                    <meshBasicMaterial color="#60a5fa" transparent opacity={0.8} />
                </mesh>
            ))}
        </group>
    )
}

function DataPacket({ active }: { active: boolean }) {
    const group = useRef<THREE.Group>(null)
    const packetRef = useRef<THREE.Mesh>(null)
    const curveRef = useRef<THREE.QuadraticBezierCurve3 | null>(null)

    useFrame(({ clock }) => {
        if (!group.current || !packetRef.current) return
        if (!active) {
            packetRef.current.visible = false
            return
        }

        if (!curveRef.current) {
            // calculate local target of global [0, 1.2, 0]
            const targetGlobal = new THREE.Vector3(0, 1.2, 0)
            const targetLocal = group.current.worldToLocal(targetGlobal.clone())

            // Start from top of sensor [0, 0.6, 0]
            const startLocal = new THREE.Vector3(0, 0.6, 0)

            // Midpoint control for bezier curve (arc upwards)
            const midLocal = startLocal.clone().lerp(targetLocal, 0.5)
            midLocal.y += 1.5 // arc height

            curveRef.current = new THREE.QuadraticBezierCurve3(startLocal, midLocal, targetLocal)
        }

        // Send a burst every few seconds to show telemetry transmission
        const t = (clock.elapsedTime * 0.5) % 1

        // Show packet for 0-0.4 of cycle (animates from 0 to 1 along curve)
        if (t > 0.4) {
            packetRef.current.visible = false
        } else {
            packetRef.current.visible = true
            const normalizedT = t / 0.4
            const pos = curveRef.current.getPoint(normalizedT)
            packetRef.current.position.copy(pos)
        }
    })

    return (
        <group ref={group}>
            <mesh ref={packetRef} visible={false}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshBasicMaterial color="#3b82f6" />
                <pointLight distance={1} intensity={0.5} color="#3b82f6" />
            </mesh>
        </group>
    )
}

interface SensorStakeProps {
    id: string
    position: [number, number, number]
    onSelect?: (id: string) => void
    onSelectComponent: (name: string, specs: string) => void
}

export default function Sensors({ id, position, onSelect, onSelectComponent }: SensorStakeProps) {
    const { state, dispatch } = useSimulation()
    const wetSoilRef = useRef<THREE.Mesh>(null)

    // Find current node
    const node = state.sensors.find(s => s.id === id)
    const isOnline = node ? node.online : false
    const moisture = node ? node.moisture : 50
    const isIrrigating = node ? node.irrigating : false

    // Identify recent AI log event for this node (within last 15 seconds)
    const latestLog = state.log.find(l => l.sensorId === id)
    const timeSinceLog = latestLog ? new Date().getTime() - new Date(latestLog.timestamp).getTime() : 999999
    const showLog = latestLog && timeSinceLog < 15000

    // Custom color mapping as requested: Red < 35%, Yellow < 50%, Green < 75%, Blue > 75%
    let color = '#3b82f6' // Blue > 75%
    if (!isOnline) color = '#94a3b8' // offline
    else if (moisture < 35) color = '#ef4444' // Red < 35%
    else if (moisture < 50) color = '#eab308' // Yellow < 50%
    else if (moisture <= 75) color = '#22c55e' // Green < 75%

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

            {/* Active Irrigation Water Particles */}
            <WaterParticles active={isIrrigating} />
            <DataPacket active={isOnline} />

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
            {/* Removed tooltip overlay as per user request */}

            {/* AI Decision Event Log Popup (Visible for 15s) */}
            {/* Removed log popup as per user request */}
        </group>
    )
}
