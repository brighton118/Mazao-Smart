import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useSimulation } from '../context/SimulationContext'

// Import consolidated digital twin components
import Greenhouse from './Greenhouse'
import ServerHouse from './ServerHouse'
import WaterTank from './WaterTank'
import Pump from './Pump'
import SolarSystem from './SolarSystem'
import OutdoorFarm from './OutdoorFarm'
import WeatherStation from './WeatherStation'
import PipeNetwork from './PipeNetwork'
import Valve from './Valve'
import Sensors from './Sensors'
import CameraController, { TOUR_STEPS } from './CameraController'

interface SceneProps {
    selectedNodeId: string | null;
    selectedComponent: { name: string; specs: string } | null;
    autoRotateActive: boolean;
    showLabels: boolean;
    timeOfDay: number;
    autoTourActive: boolean;
    tourStepIndex: number;
    setTourStepIndex: (v: number) => void;
    activePOI: string | null;
    onPOIClick: (poi: string) => void;
    onSelectStake: (sensorId: string) => void;
    onSelectComponent: (name: string, specs: string) => void;
}

export default function Scene({
    selectedNodeId,
    selectedComponent,
    autoRotateActive,
    showLabels,
    timeOfDay,
    autoTourActive,
    tourStepIndex,
    setTourStepIndex,
    activePOI,
    onPOIClick,
    onSelectStake,
    onSelectComponent
}: SceneProps) {
    const { state, dispatch } = useSimulation()
    const { sensors } = state
    const { camera } = useThree()

    const controlsRef = useRef<any>(null)

    // Auto-rotation sync with OrbitControls
    useFrame(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = autoRotateActive
            controlsRef.current.autoRotateSpeed = 0.6
            controlsRef.current.update()
        }
    })

    // Load last camera coordinates on launch
    useEffect(() => {
        const camX = localStorage.getItem('agrisense_react_cam_x')
        const camY = localStorage.getItem('agrisense_react_cam_y')
        const camZ = localStorage.getItem('agrisense_react_cam_z')
        if (camX && camY && camZ) {
            camera.position.set(parseFloat(camX), parseFloat(camY), parseFloat(camZ))
            if (controlsRef.current) controlsRef.current.update()
        }
    }, [camera])

    // Prop handles are connected directly in SmartFarm3D now.

    // Lighting cycles calculations
    const isNight = timeOfDay < 6 || timeOfDay > 18
    const ambientIntensity = isNight ? 0.15 : 0.5
    const dirIntensity = isNight ? 0.05 : 1.1
    const skyColor = isNight ? '#0b0f19' : timeOfDay < 8 || timeOfDay > 17 ? '#1a1829' : '#0f2617'

    return (
        <>
            <OrbitControls
                ref={controlsRef}
                enableDamping
                dampingFactor={0.05}
                maxPolarAngle={Math.PI / 2 - 0.05}
                minDistance={3}
                maxDistance={28}
                onChange={() => {
                    localStorage.setItem('agrisense_react_cam_x', camera.position.x.toString())
                    localStorage.setItem('agrisense_react_cam_y', camera.position.y.toString())
                    localStorage.setItem('agrisense_react_cam_z', camera.position.z.toString())
                }}
            />

            {/* Camera transition manager */}
            <CameraController
                poi={activePOI}
                tourActive={autoTourActive}
                onTourStepChange={setTourStepIndex}
            />

            {/* Sky colors & field fog */}
            <color attach="background" args={[skyColor]} />
            <fogExp2 attach="fog" args={[skyColor, 0.038]} />

            {/* Lighting configuration */}
            <ambientLight intensity={ambientIntensity} />
            <directionalLight
                position={[8, 14, 6]}
                intensity={dirIntensity}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-near={0.5}
                shadow-camera-far={45}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
            />

            {/* Base Earth Grids */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
                <boxGeometry args={[16, 0.1, 14]} />
                <meshStandardMaterial color={isNight ? '#0e1610' : '#1b3322'} roughness={0.9} />
            </mesh>

            {/* 2D Grid pattern layers representing physical zoning mapping */}
            <gridHelper args={[16, 16, '#27ae60', isNight ? '#162319' : '#223829']} position={[0, 0.01, 0]} />

            {/* 1. Central Serverhouse (LoRa gateway & battery array) */}
            <ServerHouse position={[5.5, 0, -5.0]} onSelectComponent={onSelectComponent} />
            {/* 2. Elevated Gravity Water Tank */}
            <WaterTank position={[-6.0, 0, -5.0]} onSelectComponent={onSelectComponent} />
            {/* 3. Water Pump Station */}
            <Pump position={[-5.0, 0, -3.0]} onSelectComponent={onSelectComponent} />
            {/* 4. Solar PV Panels Arrays */}
            <SolarSystem position={[0.0, 0, 4.0]} onSelectComponent={onSelectComponent} />
            {/* 5. Weather Station Unit */}
            <WeatherStation position={[2.2, 0, -5.0]} onSelectComponent={onSelectComponent} />
            {/* 6. Polytunnel Greenhouse Plot (Greenhouse.tsx) */}
            <Greenhouse position={[-5.5, 0, 1.5]} sensors={sensors} selectedNodeId={selectedNodeId} onSelectSensor={onSelectStake} onSelectComponent={onSelectComponent} />
            {/* 7. Outdoor Crops Fields Plots */}
            <OutdoorFarm position={[2.5, 0, 0.0]} sensors={sensors} onSelectComponent={onSelectComponent} />
            {/* 8. Pipenetwork system flow paths */}
            <PipeNetwork onSelectComponent={onSelectComponent} />

            {/* 9. Valve nodes placement at pipe junctions */}
            <Valve position={[-4.0, 0.15, -1.0]} sensorId="A1" onSelectComponent={onSelectComponent} />
            <Valve position={[-2.0, 0.15, -1.0]} sensorId="A2" onSelectComponent={onSelectComponent} />
            <Valve position={[1.2, 0.15, -1.0]} sensorId="C1" onSelectComponent={onSelectComponent} />
            <Valve position={[3.5, 0.15, -1.0]} sensorId="C2" onSelectComponent={onSelectComponent} />
            <Valve position={[-6.2, 0.15, -1.0]} sensorId="B1" onSelectComponent={onSelectComponent} />
            <Valve position={[-4.8, 0.15, -1.0]} sensorId="B4" onSelectComponent={onSelectComponent} />

            {/* 10. Outdoor moisture probes */}
            <Sensors id="A1" position={[-4.0, 0.15, 0.0]} onSelect={onSelectStake} onSelectComponent={onSelectComponent} />
            <Sensors id="A2" position={[-2.0, 0.15, 1.5]} onSelect={onSelectStake} onSelectComponent={onSelectComponent} />
            <Sensors id="C1" position={[1.2, 0.15, 0.8]} onSelect={onSelectStake} onSelectComponent={onSelectComponent} />
            <Sensors id="C2" position={[3.5, 0.15, 1.2]} onSelect={onSelectStake} onSelectComponent={onSelectComponent} />

            {/* Removed Labels descriptions bubble layer as per user request */}
        </>
    )
}
