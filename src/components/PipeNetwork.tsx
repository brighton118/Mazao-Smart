import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSimulation } from '../context/SimulationContext'

interface PipeNetworkProps {
    onSelectComponent: (name: string, specs: string) => void
}

export default function PipeNetwork({ onSelectComponent }: PipeNetworkProps) {
    const { state } = useSimulation()

    // Create refs for multiple particle systems
    const particlesA1 = useRef<THREE.Group>(null)
    const particlesA2 = useRef<THREE.Group>(null)
    const particlesB1 = useRef<THREE.Group>(null)
    const particlesB4 = useRef<THREE.Group>(null)
    const particlesC1 = useRef<THREE.Group>(null)
    const particlesC2 = useRef<THREE.Group>(null)

    // Fluid particle speed based on telemetry speed clock
    const flowSpeed = 2.2 * state.speed

    // Coordinate paths of pipes:
    // Water Tower is at [-6, 0, -5]
    // Pump is at [-5, 0, -3]
    // Main header pipe: from Tank [-6, 0.4, -5] -> Pump [-4.8, 0.4, -3] -> Main Header junction [0, 0.4, -3]
    // Branch A (Outdoor Maize Plot A1, A2): junction [0, 0.4, -3] -> A-Header [-2.5, 0.4, -1] -> Solenoids -> stakes.
    // Branch B (Greenhouse Plot B1, B4): junction [0, 0.4, -3] -> B-Header [-5.5, 0.4, 3] -> Solenoids -> stakes.
    // Branch C (Outdoor Sorghum Plot C1, C2): junction [0, 0.4, -3] -> C-Header [2.5, 0.4, -1] -> Solenoids -> stakes.

    useFrame((stateFrame) => {
        const elapsed = stateFrame.clock.getElapsedTime()

        // Helper function to animate particles inside a group along positions
        const animateFlow = (groupRef: React.RefObject<THREE.Group | null>, sensorId: string) => {
            const node = state.sensors.find(s => s.id === sensorId)
            if (!node) return

            const group = groupRef.current
            if (!group) return

            const isOpen = node.irrigating
            // If closed, hide particles, otherwise animate them
            group.visible = isOpen
            if (!isOpen) return

            group.children.forEach((child, index) => {
                // Offset starting times
                const timeOffset = index * 0.4
                const progress = ((elapsed * flowSpeed + timeOffset) % 3.0) / 3.0 // progress 0 to 1

                // Define path coordinates from Pump -> Solenoid -> Stake
                // Start: pump [-4.8, 0.25, -3]
                // Junction: [0, 0.25, -3]
                // Target stake coordinates:
                // A1 = [-4, 0.25, 0]
                // A2 = [-2, 0.25, 1.5]
                // B1 = [-6.2, 0.25, 2.8]
                // B4 = [-4.8, 0.25, 4.2]
                // C1 = [1.2, 0.25, 0.8]
                // C2 = [3.5, 0.25, 1.2]

                let endX = 0
                let endZ = 0
                if (sensorId === 'A1') { endX = -4.0; endZ = 0.0; }
                else if (sensorId === 'A2') { endX = -2.0; endZ = 1.5; }
                else if (sensorId === 'B1') { endX = -6.2; endZ = 2.8; }
                else if (sensorId === 'B4') { endX = -4.8; endZ = 4.2; }
                else if (sensorId === 'C1') { endX = 1.2; endZ = 0.8; }
                else if (sensorId === 'C2') { endX = 3.5; endZ = 1.2; }

                // Interpolate along 3 key segments:
                // 1. Pump to Main Header: [-4.8, 0.15, -3] -> [0, 0.15, -3]
                // 2. Main Header to Zone Branch: [0, 0.15, -3] -> [endX, 0.15, -3]
                // 3. Zone Branch to stake Valve: [endX, 0.15, -3] -> [endX, 0.15, endZ]

                let px = -4.8
                let py = 0.15
                let pz = -3.0

                if (progress < 0.3) {
                    const t = progress / 0.3
                    px = THREE.MathUtils.lerp(-4.8, 0, t)
                } else if (progress < 0.6) {
                    const t = (progress - 0.3) / 0.3
                    px = THREE.MathUtils.lerp(0, endX, t)
                } else {
                    const t = (progress - 0.6) / 0.4
                    px = endX
                    pz = THREE.MathUtils.lerp(-3.0, endZ, t)
                }

                child.position.set(px, py, pz)
            })
        }

        animateFlow(particlesA1, 'A1')
        animateFlow(particlesA2, 'A2')
        animateFlow(particlesB1, 'B1')
        animateFlow(particlesB4, 'B4')
        animateFlow(particlesC1, 'C1')
        animateFlow(particlesC2, 'C2')
    })

    const handleSelect = () => {
        onSelectComponent(
            'Pressurized Irrigation Pipeline Network',
            `Distribution Plumbing:
- Main Header: 2" Schedule 40 UPVC Pipe
- Sub-mains: 1.25" UPVC pressure tube links
- Lateral Driplines: 16mm Polyethylene tubes (subsurface)
- Emitter spacing: 30 cm intervals
- Flow velocities: 1.5 m/s active flow

Telemetry Control:
- Valves: 6x Normally Closed Solenoid actuators
- Feedback: Flow volume sensors integrated at pump head`
        );
    }

    // Draw passive piping network shapes (grey cylinders)
    return (
        <group onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
            {/* 1. Main pipe from Water Tank [-6, 0.15, -5] to Pump [-5, 0.15, -3] */}
            <mesh position={[-5.5, 0.15, -4]} rotation={[Math.PI / 4, 0, -Math.PI / 8]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* 2. Horizontal Main Header: from Pump [-4.8, 0.15, -3] to center junction [2.5, 0.15, -3] */}
            <mesh position={[-1.15, 0.15, -3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.045, 0.045, 7.3, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Extension of header to Plot C [2.5, 0.15, -3] */}
            <mesh position={[1.25, 0.15, -3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 2.5, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* 3. Lateral Pipelines leading to each plot stake:
          A1 = [-4, 0.15, 0]
          A2 = [-2, 0.15, 1.5]
          B1 = [-6.2, 0.15, 2.8]
          B4 = [-4.8, 0.15, 4.2]
          C1 = [1.2, 0.15, 0.8]
          C2 = [3.5, 0.15, 1.2]
      */}
            {/* Lateral A1 */}
            <mesh position={[-4, 0.15, -1.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 3.0, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.6} />
            </mesh>
            {/* Lateral A2 */}
            <mesh position={[-2, 0.15, -0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 4.5, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.6} />
            </mesh>
            {/* Lateral C1 */}
            <mesh position={[1.2, 0.15, -1.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 3.8, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.6} />
            </mesh>
            {/* Lateral C2 */}
            <mesh position={[3.5, 0.15, -0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 4.2, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.6} />
            </mesh>

            {/* Lateral B1 (Greenhouse left) */}
            <mesh position={[-6.2, 0.15, -0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 5.8, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.6} />
            </mesh>
            {/* Lateral B4 (Greenhouse right) */}
            <mesh position={[-4.8, 0.15, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 7.2, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.6} />
            </mesh>

            {/* --- R3F particle spheres representing flowing water --- */}
            {/* Zone A1 Group */}
            <group ref={particlesA1}>
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={`p-a1-${i}`}>
                        <sphereGeometry args={[0.05, 6, 6]} />
                        <meshBasicMaterial color="#00d2d3" />
                    </mesh>
                ))}
            </group>

            {/* Zone A2 Group */}
            <group ref={particlesA2}>
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={`p-a2-${i}`}>
                        <sphereGeometry args={[0.05, 6, 6]} />
                        <meshBasicMaterial color="#00d2d3" />
                    </mesh>
                ))}
            </group>

            {/* Zone B1 Group */}
            <group ref={particlesB1}>
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={`p-b1-${i}`}>
                        <sphereGeometry args={[0.05, 6, 6]} />
                        <meshBasicMaterial color="#00d2d3" />
                    </mesh>
                ))}
            </group>

            {/* Zone B4 Group */}
            <group ref={particlesB4}>
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={`p-b4-${i}`}>
                        <sphereGeometry args={[0.05, 6, 6]} />
                        <meshBasicMaterial color="#00d2d3" />
                    </mesh>
                ))}
            </group>

            {/* Zone C1 Group */}
            <group ref={particlesC1}>
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={`p-c1-${i}`}>
                        <sphereGeometry args={[0.05, 6, 6]} />
                        <meshBasicMaterial color="#00d2d3" />
                    </mesh>
                ))}
            </group>

            {/* Zone C2 Group */}
            <group ref={particlesC2}>
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={`p-c2-${i}`}>
                        <sphereGeometry args={[0.05, 6, 6]} />
                        <meshBasicMaterial color="#00d2d3" />
                    </mesh>
                ))}
            </group>
        </group>
    )
}
