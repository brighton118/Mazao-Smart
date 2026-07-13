import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSimulation } from '../context/SimulationContext'

interface WeatherStationProps {
    position: [number, number, number]
    onSelectComponent: (name: string, specs: string) => void
}

export default function WeatherStation({ position, onSelectComponent }: WeatherStationProps) {
    const { state } = useSimulation()
    const anemometerRef = useRef<THREE.Group>(null)
    const cloudsRef = useRef<THREE.Points>(null)

    // Rotate anemometer cup based on weather
    useFrame((_, delta) => {
        let speed = 1.2
        if (state.weather === 'windy') speed = 8.5
        else if (state.weather === 'rainy') speed = 3.8
        else if (state.weather === 'cloudy') speed = 0.5
        else if (state.weather === 'sunny') speed = 0.8

        if (anemometerRef.current) {
            anemometerRef.current.rotation.y += speed * delta
        }

        // Rain particles falling simulation
        if (cloudsRef.current && state.weather === 'rainy') {
            const positions = cloudsRef.current.geometry.attributes.position.array as Float32Array
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= 15 * delta // fall speed
                if (positions[i] < 0) {
                    positions[i] = 12 // reset to top
                }
            }
            cloudsRef.current.geometry.attributes.position.needsUpdate = true
        }
    })

    // Rain particles matrix setup (used only when raining)
    const particleCount = 200
    const tempArray = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
        // Spread particles relative to center
        tempArray[i * 3] = (Math.random() - 0.5) * 15   // X
        tempArray[i * 3 + 1] = Math.random() * 12        // Y
        tempArray[i * 3 + 2] = (Math.random() - 0.5) * 15 // Z
    }

    const handleSelect = () => {
        onSelectComponent(
            'Mbarara Weather Station',
            `Sensors Logged:
- Anemometer: Wind Speed (${state.weather === 'windy' ? '18.4' : '3.2'} m/s)
- Wind Vane: Direction (ENE)
- Barometer / Hygrometer: Humidity (${state.weather === 'rainy' ? '92' : '64'}%)
- Rain Gauge: Precipitation (${state.weather === 'rainy' ? '12.0 mm/hr' : '0.0 mm'})
- Ambient Temperature: ${state.sensors[0]?.temp ?? 24}°C

Hardware Controller:
- MCU: ESP8266 Wi-Fi Module (3.3V)
- Battery: Powered by independent 5W PV Unit`
        );
    }

    return (
        <group position={position}>
            {/* Interactive Selection Zone */}
            <group onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
                {/* Concrete Platform */}
                <mesh position={[0, 0.05, 0]} receiveShadow>
                    <cylinderGeometry args={[0.7, 0.7, 0.1, 12]} />
                    <meshStandardMaterial color="#95a5a6" roughness={0.8} />
                </mesh>

                {/* Supporting Mast */}
                <mesh position={[0, 1.2, 0]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 2.4]} />
                    <meshStandardMaterial color="#bdc3c7" metalness={0.9} />
                </mesh>

                {/* Anemometer cups (rotating head) */}
                <group ref={anemometerRef} position={[0, 2.4, 0]}>
                    {/* Central hub */}
                    <mesh>
                        <cylinderGeometry args={[0.06, 0.06, 0.1, 8]} />
                        <meshStandardMaterial color="#2c3e50" />
                    </mesh>
                    {/* 3 arms with cups */}
                    {[0, 1, 2].map((i) => {
                        const angle = (i * Math.PI * 2) / 3
                        return (
                            <group key={`cup-arm-${i}`} rotation={[0, -angle, 0]}>
                                {/* Arm wire */}
                                <mesh position={[0.125, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                                    <cylinderGeometry args={[0.008, 0.008, 0.25]} />
                                    <meshStandardMaterial color="#2d3436" metalness={0.9} />
                                </mesh>
                                {/* Visual Cup Sphere half */}
                                <mesh position={[0.25, 0, 0]}>
                                    <sphereGeometry args={[0.06, 8, 8, 0, Math.PI]} />
                                    <meshStandardMaterial color="#d63031" roughness={0.5} />
                                </mesh>
                            </group>
                        )
                    })}
                </group>

                {/* Small weather sensor radiation shield casing */}
                <mesh position={[0, 1.8, 0.2]} castShadow>
                    <cylinderGeometry args={[0.12, 0.12, 0.3, 8]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.6} />
                </mesh>

                {/* Rain Gauge funnel bucket */}
                <mesh position={[0, 2.2, -0.25]} castShadow>
                    <cylinderGeometry args={[0.1, 0.05, 0.2, 8]} />
                    <meshStandardMaterial color="#7f8c8d" metalness={0.7} />
                </mesh>
            </group>

            {/* Floating weather particles representing raining condition */}
            {state.weather === 'rainy' && (
                <points ref={cloudsRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[tempArray, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        color="#74b9ff"
                        size={0.08}
                        transparent
                        opacity={0.6}
                        sizeAttenuation
                    />
                </points>
            )}

            {/* Floating HUD status */}
            <Html position={[0, 2.8, 0]} center distanceFactor={8}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(3px)',
                    color: '#e74c3c',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}>
                    Weather Unit ({state.weather.toUpperCase()})
                </div>
            </Html>
        </group>
    )
}
