import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

import { useSimulation } from '../context/SimulationContext'

interface ServerHouseProps {
    position: [number, number, number]
    onSelectComponent: (name: string, specs: string) => void
}

export default function ServerHouse({ position, onSelectComponent }: ServerHouseProps) {
    const { state } = useSimulation()
    const gatewayLedRef = useRef<THREE.Mesh>(null)

    // Flashing IoT gateway led simulation
    useFrame((stateFrame) => {
        if (gatewayLedRef.current) {
            const elapsed = stateFrame.clock.getElapsedTime()
            const intensity = (Math.sin(elapsed * 8) + 1.0) / 2.0
            const material = gatewayLedRef.current.material as THREE.MeshBasicMaterial
            if (material) {
                material.color.setRGB(0.1, intensity > 0.5 ? 0.9 : 0.2, 0.1)
            }
        }
    })

    const handleSelect = () => {
        onSelectComponent(
            'Server & Control House',
            `ESP32 IoT Gateway:
- Chipset: ESP32-WROOM-32D (Dual Core 240MHz)
- Memory: 520KB SRAM, 4MB Flash
- Linkage: LoRa 868MHz + 2.4GHz WiFi
- Protocol: MQTT / JSON Telemetry

Telemetry Server:
- Raspberry Pi 4 Model B (4GB RAM)
- Database: Local SQLite Cache
- Sync Speed: ${state.speed}x speed

LoRa Radio:
- Gateway: SX1302 8-Channel Concentrator
- Antenna Gain: 5.8 dBi Omni-directional
- Coverage: Up to 5 km range`
        );
    }

    return (
        <group position={position}>
            {/* Clickable zone wrapper */}
            <group onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
                {/* Main server housing box */}
                <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
                    <boxGeometry args={[3, 2.5, 2.5]} />
                    <meshStandardMaterial color="#404552" roughness={0.7} metalness={0.2} />
                </mesh>

                {/* Concrete Foundation */}
                <mesh position={[0, 0.05, 0]} receiveShadow>
                    <boxGeometry args={[3.4, 0.1, 2.9]} />
                    <meshStandardMaterial color="#7f8c8d" roughness={0.9} />
                </mesh>

                {/* Slanted Roof */}
                <mesh position={[0, 2.6, 0]} rotation={[0, 0, 0.08]} castShadow>
                    <boxGeometry args={[3.2, 0.2, 2.8]} />
                    <meshStandardMaterial color="#1e2530" metalness={0.5} roughness={0.4} />
                </mesh>

                {/* Door */}
                <mesh position={[1.51, 1, 0]}>
                    <boxGeometry args={[0.02, 1.8, 0.9]} />
                    <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
                </mesh>

                {/* LoRa Antenna base and rod */}
                <group position={[0, 2.7, 1]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 0.2]} />
                        <meshStandardMaterial color="#7f8c8d" metalness={0.9} />
                    </mesh>
                    <mesh position={[0, 0.8, 0]} castShadow>
                        <cylinderGeometry args={[0.015, 0.015, 1.4]} />
                        <meshStandardMaterial color="#dcdde1" metalness={0.9} />
                    </mesh>
                </group>

                {/* Solar Charger Controller panel indicators inside / through back window */}
                <mesh position={[0, 1.5, -1.26]}>
                    <boxGeometry args={[1.2, 0.8, 0.02]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>

                {/* Gateway flashing LED mock */}
                <mesh ref={gatewayLedRef} position={[0.4, 1.5, -1.28]}>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshBasicMaterial color="#00ff00" />
                </mesh>

                {/* Charge Controller LCD indicator screen (Glowing Blue) */}
                <mesh position={[-0.2, 1.5, -1.28]}>
                    <planeGeometry args={[0.4, 0.25]} />
                    <meshBasicMaterial color="#3498db" />
                </mesh>
            </group>

            {/* Removed floating specification tooltip as per user request */}
        </group>
    )
}
