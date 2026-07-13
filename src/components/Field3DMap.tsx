import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useSimulation, SensorNode } from '../context/SimulationContext'

interface Field3DMapProps {
    onSelectSensor?: (id: string) => void
}

// Presentation tour configurations
const TOUR_POINTS = [
    { cam: [10, 8, 12], look: [0, 0.5, 0], duration: 6000, desc: "System Overview: Multi-plot IoT telemetry dashboard monitoring soil moisture in Mbarara pilot gardens." },
    { cam: [-5, 3.5, 3.5], look: [-2.5, 0.9, 0.5], duration: 6000, desc: "Greenhouse Area: Coffee & Matooke growth beds covered under semi-transparent temperature-controlled layout." },
    { cam: [-3.0, 3.0, -0.5], look: [-3.0, 1.15, -2.8], duration: 6000, desc: "Solar Array Charger: Power management grids backing local microcontroller battery charging nodes." },
    { cam: [5.5, 4.0, -1.0], look: [3.0, 1.9, -2.8], duration: 6000, desc: "Water Tank Tower: Gravity-fed elevated capacity storing 12,000L of reserve volume for drip feeds." },
    { cam: [5, 3.5, 3.5], look: [2.5, 0.9, 0.3], duration: 6000, desc: "Outfield Sorghum Beds: Multi-depth ground-level drip pipelines controlled by battery-powered valves." },
    { cam: [-1.5, 1.8, -1.0], look: [-3.0, 0.55, -2.8], duration: 6000, desc: "Control Unit: local server receiving live LoRa packets and regulating valve duty cycles." }
]

const SYSTEM_DESCRIPTIONS: Record<string, { title: string; text: string }> = {
    greenhouse: { title: "Greenhouse Crop Zone", text: "Climate-controlled enclosure holding deep soil stakes B1 and B4 tracking Tomato/Matooke moisture levels." },
    'water-tank': { title: "Elevated Water Tower", text: "Stores gravity-fed reservoir supply (12,000L level) for greenhouse misting and outfield drip line valves." },
    'solar-panel': { title: "Solar Array Charger", text: "High-efficiency monocrystalline solar panels harvesting 120W peak power to charge local hardware battery cells." },
    'server-house': { title: "Server Telemetry Unit", text: "Houses standard ESP32 gateway node receiving wireless LoRa signals from stakes and hosting local telemetry database." }
}

export default function Field3DMap({ onSelectSensor }: Field3DMapProps) {
    const { state, dispatch } = useSimulation()
    const { sensors } = state
    const containerRef = useRef<HTMLDivElement>(null)
    const controlsRef = useRef<any>(null)
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

    // Additional state for interactive presentation
    const [hoveredSystem, setHoveredSystem] = useState<string | null>(null)
    const [autoRotateActive, setAutoRotateActive] = useState<boolean>(false)
    const [showLabels, setShowLabels] = useState<boolean>(true)
    const [timeOfDay, setTimeOfDay] = useState<number>(12) // 0 to 24 hours
    const [autoTourActive, setAutoTourActive] = useState<boolean>(false)
    const [tourStep, setTourStep] = useState<number>(0)

    // Refs to bypass React closures in requestAnimationFrame loop
    const stateRef = useRef(state)
    const timeOfDayRef = useRef<number>(12)
    const showLabelsRef = useRef<boolean>(true)
    const autoRotateRef = useRef<boolean>(false)
    const targetCamPosRef = useRef<THREE.Vector3 | null>(null)
    const targetLookAtRef = useRef<THREE.Vector3 | null>(null)

    useEffect(() => { stateRef.current = state }, [state])
    useEffect(() => { timeOfDayRef.current = timeOfDay }, [timeOfDay])
    useEffect(() => { showLabelsRef.current = showLabels }, [showLabels])
    useEffect(() => { autoRotateRef.current = autoRotateActive }, [autoRotateActive])

    // Auto-Tour effect: step every 6 seconds through presets
    useEffect(() => {
        if (!autoTourActive) return

        const point = TOUR_POINTS[tourStep]
        targetCamPosRef.current = new THREE.Vector3(point.cam[0], point.cam[1], point.cam[2])
        targetLookAtRef.current = new THREE.Vector3(point.look[0], point.look[1], point.look[2])

        const timer = setTimeout(() => {
            setTourStep((prev) => (prev + 1) % TOUR_POINTS.length)
        }, point.duration)

        return () => clearTimeout(timer)
    }, [autoTourActive, tourStep])

    // Direct POI Click Transitions
    const handlePOIClick = (poiName: string) => {
        setAutoTourActive(false)
        if (poiName === 'overview') {
            targetCamPosRef.current = new THREE.Vector3(10, 8, 12)
            targetLookAtRef.current = new THREE.Vector3(0, 0.5, 0)
        } else if (poiName === 'greenhouse') {
            targetCamPosRef.current = new THREE.Vector3(-5, 3.5, 3.5)
            targetLookAtRef.current = new THREE.Vector3(-2.5, 0.9, 0.5)
        } else if (poiName === 'outfield') {
            targetCamPosRef.current = new THREE.Vector3(5, 3.5, 3.5)
            targetLookAtRef.current = new THREE.Vector3(2.5, 0.9, 0.3)
        } else if (poiName === 'watertower') {
            targetCamPosRef.current = new THREE.Vector3(5.5, 4.0, -1.0)
            targetLookAtRef.current = new THREE.Vector3(3.0, 1.9, -2.8)
        } else if (poiName === 'solar') {
            targetCamPosRef.current = new THREE.Vector3(-3.0, 3.0, -0.5)
            targetLookAtRef.current = new THREE.Vector3(-3.0, 1.15, -2.8)
        } else if (poiName === 'server') {
            targetCamPosRef.current = new THREE.Vector3(-1.5, 1.8, -1.0)
            targetLookAtRef.current = new THREE.Vector3(-3.0, 0.55, -2.8)
        }
    }

    // Keep track of the active selected node object
    const selectedNode = sensors.find(s => s.id === selectedNodeId) || null

    // Ref to store current sensor states to bypass React enclosure in the requestAnimationFrame loop
    const sensorsRef = useRef<SensorNode[]>(sensors)
    useEffect(() => {
        sensorsRef.current = sensors
    }, [sensors])


    // Map sensor 3D positions in the scene coordinate system
    const getSensorCoords = (id: string, index: number): [number, number, number] => {
        switch (id) {
            case 'B1': return [-2.5, 0.1, -1.2]
            case 'B4': return [-2.5, 0.1, 1.2]
            case 'A1': return [2.5, 0.1, -1.5]
            case 'A2': return [2.5, 0.1, 0.0]
            case 'C1': return [2.5, 0.1, 1.5]
            case 'C2': return [1.5, 0.1, 0.8]
            default: {
                // Distribute added nodes dynamically
                const side = index % 2 === 0 ? 1 : -1 // right / left
                const x = side * (2.0 + (index * 0.3) % 1.5)
                const z = -2.0 + (index * 0.8) % 4.0
                return [x, 0.1, z]
            }
        }
    }

    // Effect to instantiate ThreeJS scene
    useEffect(() => {
        if (!containerRef.current) return

        const container = containerRef.current
        const width = container.clientWidth
        const height = container.clientHeight

        // Scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0c1a11)
        scene.fog = new THREE.FogExp2(0x0c1a11, 0.04)

        // Camera
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)

        // Retrieve camera state if present in localstorage
        const camX = localStorage.getItem('agrisense_react_cam_x')
        const camY = localStorage.getItem('agrisense_react_cam_y')
        const camZ = localStorage.getItem('agrisense_react_cam_z')
        if (camX && camY && camZ) {
            camera.position.set(parseFloat(camX), parseFloat(camY), parseFloat(camZ))
        } else {
            camera.position.set(10, 8, 12)
        }

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        // Clear previous children
        while (container.firstChild) {
            container.removeChild(container.firstChild)
        }
        container.appendChild(renderer.domElement)

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controlsRef.current = controls
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.maxPolarAngle = Math.PI / 2 - 0.05
        controls.minDistance = 3
        controls.maxDistance = 25
        controls.target.set(0, 0.5, 0)
        controls.update()

        // Save camera position on changes
        controls.addEventListener('change', () => {
            localStorage.setItem('agrisense_react_cam_x', camera.position.x.toString())
            localStorage.setItem('agrisense_react_cam_y', camera.position.y.toString())
            localStorage.setItem('agrisense_react_cam_z', camera.position.z.toString())
        })

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
        scene.add(ambientLight)

        const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.0)
        dirLight.position.set(8, 14, 6)
        dirLight.castShadow = true
        dirLight.shadow.mapSize.width = 1024
        dirLight.shadow.mapSize.height = 1024
        dirLight.shadow.camera.near = 0.5
        dirLight.shadow.camera.far = 40
        const d = 8
        dirLight.shadow.camera.left = -d
        dirLight.shadow.camera.right = d
        dirLight.shadow.camera.top = d
        dirLight.shadow.camera.bottom = -d
        scene.add(dirLight)

        // Ground Grass Base
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x1d3d27,
            roughness: 0.9,
            metalness: 0.1
        })
        const groundGeo = new THREE.BoxGeometry(11, 0.2, 9)
        const ground = new THREE.Mesh(groundGeo, groundMat)
        ground.position.y = -0.1
        ground.receiveShadow = true
        scene.add(ground)

        // Boundaries/Fence Lines (just subtle aesthetic indicators)
        const fenceMat = new THREE.LineBasicMaterial({ color: 0x275235 })
        const fenceGeo = new THREE.EdgesGeometry(groundGeo)
        const fence = new THREE.LineSegments(fenceGeo, fenceMat)
        fence.position.y = -0.1
        scene.add(fence)

        // Greenhouse Soil Plot (Brown dirt)
        const ghSoilMat = new THREE.MeshStandardMaterial({ color: 0x423328, roughness: 0.98 })
        const ghSoil = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 4.4), ghSoilMat)
        ghSoil.position.set(-2.5, 0.075, 0.5)
        ghSoil.receiveShadow = true
        scene.add(ghSoil)

        // Outfield Soil Plot (Brown dirt)
        const ofSoilMat = new THREE.MeshStandardMaterial({ color: 0x48372b, roughness: 0.98 })
        const ofSoil = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.15, 4.8), ofSoilMat)
        ofSoil.position.set(2.5, 0.075, 0.3)
        ofSoil.receiveShadow = true
        scene.add(ofSoil)

        // Greenhouse Structures
        // Semi-transparent greenhouse glass dome
        const ghGlassMat = new THREE.MeshStandardMaterial({
            color: 0x93c5fd,
            transparent: true,
            opacity: 0.14,
            roughness: 0.1,
            metalness: 0.2,
            side: THREE.DoubleSide
        })
        const ghGlass = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.8, 4.5), ghGlassMat)
        ghGlass.position.set(-2.5, 0.9 + 0.1, 0.5)
        scene.add(ghGlass)

        // Steel frame edges for Greenhouse
        const ghEdges = new THREE.EdgesGeometry(ghGlass.geometry)
        const ghFrame = new THREE.LineSegments(ghEdges, new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 2 }))
        ghFrame.position.set(-2.5, 0.9 + 0.1, 0.5)
        scene.add(ghFrame)

        // Arched roof
        const roofGeom = new THREE.CylinderGeometry(1.85, 1.85, 4.5, 12, 1, false, 0, Math.PI)
        const roofSegment = new THREE.Mesh(roofGeom, ghGlassMat)
        roofSegment.rotation.x = Math.PI / 2
        roofSegment.position.set(-2.5, 1.8 + 0.1, 0.5)
        scene.add(roofSegment)

        const roofEdges = new THREE.EdgesGeometry(roofGeom)
        const roofFrame = new THREE.LineSegments(roofEdges, new THREE.LineBasicMaterial({ color: 0x475569 }))
        roofFrame.rotation.x = Math.PI / 2
        roofFrame.position.set(-2.5, 1.8 + 0.1, 0.5)
        scene.add(roofFrame)

        // Control Center Server House
        const serverHouse = new THREE.Group()
        serverHouse.position.set(-3.0, 0.1, -2.8)
        scene.add(serverHouse)

        // Building structure
        const houseBody = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1.1, 1.4),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
        )
        houseBody.position.y = 0.55
        houseBody.castShadow = true
        houseBody.receiveShadow = true
        serverHouse.add(houseBody)

        // Sloped roof
        const roofBody = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 0.15, 1.6),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
        )
        roofBody.position.y = 1.15
        serverHouse.add(roofBody)

        // Flashing Console/LED on Server House wall (signifying telemetry controller)
        const ledIndicator = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.12, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
        )
        ledIndicator.position.set(-0.2, 0.6, 0.71) // facing forward
        serverHouse.add(ledIndicator)

        // Internal glowing point light inside server house for night transitions
        const serverGlow = new THREE.PointLight(0x06b6d4, 0.0, 3)
        serverGlow.position.set(-3.0, 0.6, -2.5)
        scene.add(serverGlow)

        // Solar panels on Server House roof
        const solarFrame = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 0.05, 0.9),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
        )
        solarFrame.rotation.x = -Math.PI / 8
        solarFrame.position.set(0, 1.3, 0.1)
        serverHouse.add(solarFrame)

        const solarPanel = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.02, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.05 })
        )
        solarPanel.position.set(0, 0.04, 0)
        solarFrame.add(solarPanel)

        // Grid Lines on solar panel
        const gridEdges = new THREE.EdgesGeometry(solarPanel.geometry)
        const solarGrid = new THREE.LineSegments(gridEdges, new THREE.LineBasicMaterial({ color: 0x60a5fa, opacity: 0.5, transparent: true }))
        solarFrame.add(solarGrid)

        // Water Tank Storage Tower
        const waterTower = new THREE.Group()
        waterTower.position.set(3.0, 0.1, -2.8)
        scene.add(waterTower)

        // Metal legs
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 })
        for (let x = -0.4; x <= 0.4; x += 0.8) {
            for (let z = -0.4; z <= 0.4; z += 0.8) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3), metalMat)
                leg.position.set(x, 0.65, z)
                leg.castShadow = true
                waterTower.add(leg)
            }
        }

        // Elevated Water Tank Cylinder
        const tankCylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.65, 0.65, 1.4, 16),
            new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.25, transparent: true, opacity: 0.75 })
        )
        tankCylinder.position.y = 1.95
        tankCylinder.castShadow = true
        waterTower.add(tankCylinder)

        // Internal Water cylinder showing storage level
        const waterGeo = new THREE.CylinderGeometry(0.63, 0.63, 1.3, 16)
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.82, roughness: 0.1, metalness: 0.1 })
        const waterMesh = new THREE.Mesh(waterGeo, waterMat)
        waterMesh.position.y = 1.9
        waterTower.add(waterMesh)


        // Blue capacity ring at top of the tank
        const capacityRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.66, 0.03, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0x2563eb })
        )
        capacityRing.rotation.x = Math.PI / 2
        capacityRing.position.y = 2.4
        waterTower.add(capacityRing)

        // Water Pipelines Network
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })

        // Vertically down from water tank
        const tankDownPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3), pipeMat)
        tankDownPipe.position.set(3.0, 0.75, -2.8)
        scene.add(tankDownPipe)

        // Pipeline running from server house (power grid lines representation)
        const powerCable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 5.0), new THREE.MeshStandardMaterial({ color: 0x0f172a }))
        powerCable.rotation.z = Math.PI / 2
        powerCable.position.set(0, 0.1, -2.8)
        scene.add(powerCable)

        // Water Main conduit pipeline running straight along back boundary
        const mainWaterLine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.4), pipeMat)
        mainWaterLine.rotation.z = Math.PI / 2
        mainWaterLine.position.set(0.3, 0.15, -2.8)
        scene.add(mainWaterLine)

        // Split conduit pipeline running forward from main line
        const leftFeedPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.4), pipeMat)
        leftFeedPipe.rotation.x = Math.PI / 2
        leftFeedPipe.position.set(-2.5, 0.15, -1.1)
        scene.add(leftFeedPipe)

        const rightFeedPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.2), pipeMat)
        rightFeedPipe.rotation.x = Math.PI / 2
        rightFeedPipe.position.set(2.5, 0.15, -1.2)
        scene.add(rightFeedPipe)

        // Greenhouse overhead drip irrigation lines
        const ghUpPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2), pipeMat)
        ghUpPipe.position.set(-2.5, 0.75, -1.0)
        scene.add(ghUpPipe)

        const ghDripLine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.8), pipeMat)
        ghDripLine.rotation.x = Math.PI / 2
        ghDripLine.position.set(-2.5, 1.35, 0.5)
        scene.add(ghDripLine)

        // Outfield drip irrigation lines ground level
        const ofDripLine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.0), pipeMat)
        ofDripLine.rotation.x = Math.PI / 2
        ofDripLine.position.set(2.5, 0.18, 0.3)
        scene.add(ofDripLine)

        // Dynamic Elements mapping list
        const sensorStakes: { id: string; mesh: THREE.Group; scaleMesh: THREE.Mesh }[] = []
        const moistureRings: { id: string; mesh: THREE.Mesh }[] = []
        const valveMeshes: { id: string; led: THREE.Mesh; group: THREE.Group }[] = []

        // Create Solenoid Valve Indicator meshes on pipeline entrance points
        const valvePositions = [
            { id: 'B1', pos: [-2.5, 0.15, -0.6] },
            { id: 'B4', pos: [-2.5, 0.15, 0.6] },
            { id: 'A1', pos: [2.3, 0.15, -1.0] },
            { id: 'A2', pos: [2.3, 0.15, -0.1] },
            { id: 'C1', pos: [2.3, 0.15, 1.0] },
            { id: 'C2', pos: [1.7, 0.15, 0.5] }
        ]
        valvePositions.forEach(vp => {
            const vGroup = new THREE.Group()
            vGroup.position.set(vp.pos[0], vp.pos[1], vp.pos[2])
            scene.add(vGroup)

            const vBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.12, 0.14),
                new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
            )
            vBody.castShadow = true
            vGroup.add(vBody)

            const vLed = new THREE.Mesh(
                new THREE.SphereGeometry(0.035, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xef4444 })
            )
            vLed.position.y = 0.08
            vGroup.add(vLed)

            valveMeshes.push({ id: vp.id, led: vLed, group: vGroup })
        })

        // Plant meshes container for animations
        const plantMeshes: { type: string; mesh: THREE.Group; initialScale: number }[] = []


        // Helper geometries
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
        const stalkMat = new THREE.MeshStandardMaterial({ color: 0x166534 })

        // Populating Greenhouse Coffee/Matooke plants
        // Grid: columns inside greenhouse bed
        const ghPlantCoords = [
            [-2.8, -1.4], [-2.2, -1.4],
            [-2.8, -0.6], [-2.2, -0.6],
            [-2.8, 0.2], [-2.2, 0.2],
            [-2.8, 1.0], [-2.2, 1.0],
            [-2.8, 1.8], [-2.2, 1.8]
        ]

        ghPlantCoords.forEach(([px, pz]) => {
            const plant = new THREE.Group()
            plant.position.set(px, 0.1, pz)
            scene.add(plant)

            // stalk
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.45), stalkMat)
            stalk.position.y = 0.225
            stalk.castShadow = true
            plant.add(stalk)

            // nested leaves
            const leafGeo = new THREE.SphereGeometry(0.14, 6, 6)
            leafGeo.scale(1.7, 0.15, 0.7)
            for (let l = 0; l < 4; l++) {
                const leaf = new THREE.Mesh(leafGeo, leafMat)
                leaf.position.set(0, 0.38, 0)
                leaf.rotation.y = (Math.PI / 2) * l + Math.random() * 0.3
                leaf.rotation.z = 0.25 + Math.random() * 0.1
                leaf.castShadow = true
                plant.add(leaf)
            }
            plantMeshes.push({ type: 'coffee', mesh: plant, initialScale: 1.0 })
        })

        // Populating Outfield Maize/Beans plants
        const ofPlantCoords = [
            [2.2, -1.6], [2.8, -1.6],
            [2.2, -0.9], [2.8, -0.9],
            [2.2, -0.2], [2.8, -0.2],
            [2.2, 0.5], [2.8, 0.5],
            [2.2, 1.2], [2.8, 1.2],
            [2.2, 1.9], [2.8, 1.9],
            [1.7, 0.2], [1.7, 1.0] // border nodes
        ]

        const maizeStalkMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f })
        const cobMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 })

        ofPlantCoords.forEach(([px, pz]) => {
            const plant = new THREE.Group()
            plant.position.set(px, 0.1, pz + (Math.random() - 0.5) * 0.1)
            scene.add(plant)

            const isMaize = px > 2.0
            if (isMaize) {
                // Maize stalks
                const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.65), maizeStalkMat)
                stalk.position.y = 0.325
                stalk.castShadow = true
                plant.add(stalk)

                const leafCone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 6), maizeStalkMat)
                leafCone.position.set(0, 0.55, 0)
                leafCone.rotation.x = 0.15
                leafCone.castShadow = true
                plant.add(leafCone)

                const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 6), cobMat)
                cob.position.set(0.04, 0.38, 0.04)
                cob.rotation.z = 0.65
                plant.add(cob)

                plantMeshes.push({ type: 'maize', mesh: plant, initialScale: 1.0 })
            } else {
                // Row of beans
                const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.35), stalkMat)
                stalk.position.y = 0.175
                stalk.castShadow = true
                plant.add(stalk)

                const bush = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), leafMat)
                bush.position.set(0, 0.32, 0)
                bush.scale.set(1.2, 0.8, 1.2)
                bush.castShadow = true
                plant.add(bush)

                plantMeshes.push({ type: 'beans', mesh: plant, initialScale: 1.0 })
            }
        })

        // Subsurface Moisture sensors stakes
        const sensorGroup = new THREE.Group()
        scene.add(sensorGroup)

        const raycastTargets: THREE.Object3D[] = []
        const hoverTargets: THREE.Object3D[] = []

        // Create actual sensor stakes based on active list
        sensorsRef.current.forEach((sensor, idx) => {
            const coords = getSensorCoords(sensor.id, idx)

            const stake = new THREE.Group()
            stake.position.set(coords[0], coords[1], coords[2])
            stake.name = `sensor-stake-${sensor.id}`
            sensorGroup.add(stake)

            // Solid ground peg rod
            const peg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.045, 0.045, 0.45),
                new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
            )
            peg.position.y = 0.125
            peg.castShadow = true
            stake.add(peg)

            // Top box solar/telemetry transmitter capsule
            const transmitter = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 0.14, 0.16),
                new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
            )
            transmitter.position.y = 0.355
            transmitter.castShadow = true
            stake.add(transmitter)

            // LED glowing status light sphere
            const led = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x8aab90 })
            )
            led.position.set(0, 0.44, 0)
            stake.add(led)

            // Invisible larger click target box overlay for raycasting
            const clickBox = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.75, 0.4),
                new THREE.MeshBasicMaterial({ visible: false })
            )
            clickBox.position.y = 0.35
            clickBox.userData = { sensorId: sensor.id, systemId: `sensor-${sensor.id}` }
            stake.add(clickBox)

            // Ground moisture feedback ring around stake base
            const ringGeo = new THREE.RingGeometry(0.18, 0.22, 16)
            ringGeo.rotateX(-Math.PI / 2)
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x10b981,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            })
            const ringMesh = new THREE.Mesh(ringGeo, ringMat)
            ringMesh.position.set(0, 0.04, 0)
            stake.add(ringMesh)
            moistureRings.push({ id: sensor.id, mesh: ringMesh })

            raycastTargets.push(clickBox)
            hoverTargets.push(clickBox)
            sensorStakes.push({ id: sensor.id, mesh: stake, scaleMesh: led })
        })


        // Set systemIds for hover detection HUD
        ghGlass.userData = { systemId: 'greenhouse' }
        hoverTargets.push(ghGlass)

        tankCylinder.userData = { systemId: 'water-tank' }
        hoverTargets.push(tankCylinder)

        solarPanel.userData = { systemId: 'solar-panel' }
        hoverTargets.push(solarPanel)

        houseBody.userData = { systemId: 'server-house' }
        hoverTargets.push(houseBody)

        // Particle flow simulations for active pipelines & solar charger charging flows
        const pipeParticles: { mesh: THREE.Mesh; path: [number, number, number][]; currentIdx: number; progress: number; speed: number; active: boolean }[] = []
        const telemetryPackets: { mesh: THREE.Mesh; progress: number; speed: number; active: boolean; id: string; startCoords: [number, number, number] }[] = []

        const packetMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 })
        const packetGeo = new THREE.SphereGeometry(0.06, 8, 8)

        sensorsRef.current.forEach((sensor, idx) => {
            const coords = getSensorCoords(sensor.id, idx)
            const pMesh = new THREE.Mesh(packetGeo, packetMat.clone())
            pMesh.visible = false
            scene.add(pMesh)
            telemetryPackets.push({
                mesh: pMesh,
                progress: Math.random(),
                speed: 0.18 + Math.random() * 0.12,
                active: true,
                id: sensor.id,
                startCoords: coords
            })
        })



        // Define pathways: from tank down (3.0, 0.75, -2.8) -> splitting paths
        const waterPaths: { id: string; coords: [number, number, number][] }[] = [
            {
                id: 'B1',
                coords: [
                    [3.0, 2.0, -2.8],
                    [3.0, 0.15, -2.8],
                    [0.3, 0.15, -2.8],
                    [-2.5, 0.15, -2.8],
                    [-2.5, 0.15, -1.2],
                    [-2.5, 1.35, -1.0],
                    [-2.5, 1.35, -1.2]
                ]
            },
            {
                id: 'B4',
                coords: [
                    [3.0, 2.0, -2.8],
                    [3.0, 0.15, -2.8],
                    [0.3, 0.15, -2.8],
                    [-2.5, 0.15, -2.8],
                    [-2.5, 0.15, 1.2],
                    [-2.5, 1.35, -1.0],
                    [-2.5, 1.35, 1.2]
                ]
            },
            {
                id: 'A1',
                coords: [
                    [3.0, 2.0, -2.8],
                    [3.0, 0.15, -2.8],
                    [3.0, 0.15, -1.5],
                    [2.5, 0.18, -1.5]
                ]
            },
            {
                id: 'A2',
                coords: [
                    [3.0, 2.0, -2.8],
                    [3.0, 0.15, -2.8],
                    [3.0, 0.15, 0.0],
                    [2.5, 0.18, 0.0]
                ]
            },
            {
                id: 'C1',
                coords: [
                    [3.0, 2.0, -2.8],
                    [3.0, 0.15, -2.8],
                    [3.0, 0.15, 1.5],
                    [2.5, 0.18, 1.5]
                ]
            },
            {
                id: 'C2',
                coords: [
                    [3.0, 2.0, -2.8],
                    [3.0, 0.15, -2.8],
                    [3.0, 0.15, 0.8],
                    [1.5, 0.18, 0.8]
                ]
            }
        ]

        const bluePMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
        const particleGeo = new THREE.SphereGeometry(0.04, 4, 4)

        waterPaths.forEach(wp => {
            // Create 3 particles per active watering path
            for (let p = 0; p < 3; p++) {
                const mesh = new THREE.Mesh(particleGeo, bluePMat)
                mesh.visible = false
                scene.add(mesh)
                pipeParticles.push({
                    mesh,
                    path: wp.coords,
                    currentIdx: 0,
                    progress: p / 3, // spaced out
                    speed: 0.7 + Math.random() * 0.3,
                    active: false
                })
            }
        })

        // Solar power particle flows (golden particles from solar panel to server house)
        const solarParticles: { mesh: THREE.Mesh; progress: number; speed: number }[] = []
        const goldPMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        for (let s = 0; s < 5; s++) {
            const pm = new THREE.Mesh(particleGeo, goldPMat)
            scene.add(pm)
            solarParticles.push({
                mesh: pm,
                progress: s / 5,
                speed: 0.4 + Math.random() * 0.2
            })
        }

        // Raycasting event listener
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        const handleMouseClick = (event: MouseEvent) => {
            // Calculate mouse position in normalized device coordinates
            const rect = renderer.domElement.getBoundingClientRect()
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(raycastTargets)

            if (intersects.length > 0) {
                const targetObj = intersects[0].object
                const sensorId = targetObj.userData.sensorId

                if (sensorId) {
                    setSelectedNodeId(sensorId)

                    // Animate camera orbital controls target to the sensor location
                    const sensorPos = new THREE.Vector3()
                    targetObj.getWorldPosition(sensorPos)

                    // Smooth transition
                    const targetCoords = { x: sensorPos.x, y: 0.5, z: sensorPos.z }

                    let steps = 0
                    const animateFocus = () => {
                        if (steps < 20) {
                            controls.target.lerp(new THREE.Vector3(targetCoords.x, targetCoords.y, targetCoords.z), 0.15)
                            controls.update()
                            steps++
                            requestAnimationFrame(animateFocus)
                        }
                    }
                    animateFocus()

                    // Trigger callback to select it in the Parent React layout
                    if (onSelectSensor) {
                        onSelectSensor(sensorId)
                    }

                    // Trigger DOM elements focus click
                    const domCard = document.getElementById(`sensor-card-${sensorId}`)
                    if (domCard) {
                        domCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        const isAlreadySelected = domCard.getAttribute('data-selected') === 'true'
                        if (!isAlreadySelected) {
                            setTimeout(() => {
                                const el = document.getElementById(`sensor-card-${sensorId}`)
                                if (el) el.click()
                            }, 300)
                        }
                    }
                }
            }
        }

        renderer.domElement.addEventListener('click', handleMouseClick)

        // Animation variables
        let clock = new THREE.Clock()
        let animationFrameId: number

        // Render loop
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate)

            const elapsed = clock.getElapsedTime()
            const delta = clock.getDelta()

            controls.update()

            // Fetch latest state values
            const currentSensors = sensorsRef.current

            // Flashing server console LED status (indicating telemetry systems online)
            if (ledIndicator) {
                const flashRate = 2.0 // cycles per second
                const cyanIntens = 0.5 + 0.5 * Math.sin(elapsed * Math.PI * flashRate)
                const ledMat = ledIndicator.material as THREE.MeshBasicMaterial
                // flash between Cyan/Blue
                if (Math.sin(elapsed * 2) > 0) {
                    ledMat.color.setRGB(0.04, 0.45 * cyanIntens + 0.5, 0.8)
                } else {
                    ledMat.color.setRGB(0.0, 0.2 + 0.3 * cyanIntens, 0.9)
                }
            }

            // Update sensor light statuses and scales
            sensorStakes.forEach(stake => {
                const node = currentSensors.find(s => s.id === stake.id)
                if (!node) return

                const ledMat = stake.scaleMesh.material as THREE.MeshBasicMaterial

                if (!node.online) {
                    // Offline: Slow warning flash
                    const flash = Math.floor(elapsed * 2.5) % 2 === 0
                    ledMat.color.setHex(flash ? 0xef4444 : 0x4b5563)
                    // Pulse the scaling size slightly
                    const scale = 1.0 + 0.15 * Math.sin(elapsed * 5)
                    stake.scaleMesh.scale.set(scale, scale, scale)
                } else {
                    // Glow intensity
                    let colorHex = 0x4caf7d // optimal green
                    let pulseSpeed = 2.0

                    if (node.status === 'critical') {
                        colorHex = 0xe05a4e // dry red
                        pulseSpeed = 8.0 // flash fast
                        const flash = Math.floor(elapsed * pulseSpeed) % 2 === 0
                        ledMat.color.setHex(flash ? 0xef4444 : 0x220505)
                    } else if (node.status === 'low') {
                        colorHex = 0xe8a042 // low amber
                        pulseSpeed = 3.5
                        const flash = Math.floor(elapsed * pulseSpeed) % 2 === 0
                        ledMat.color.setHex(flash ? 0xf59e0b : 0x543603)
                    } else {
                        // solid green
                        ledMat.color.setHex(colorHex)
                    }

                    const scale = 1.0 + 0.08 * Math.sin(elapsed * pulseSpeed)
                    stake.scaleMesh.scale.set(scale, scale, scale)
                }
            })

            // Update ground moisture feedback rings
            moistureRings.forEach(ring => {
                const node = currentSensors.find(s => s.id === ring.id)
                if (!node) return
                const ringMat = ring.mesh.material as THREE.MeshBasicMaterial

                // Color based on moisture
                if (node.status === 'offline') {
                    ringMat.color.setHex(0x4b5563) // Grey
                    ring.mesh.scale.set(0.1, 0.1, 1)
                } else if (node.status === 'critical') {
                    ringMat.color.setHex(0xef4444) // Red
                    // Pulse ring opacity/scale for alerting
                    const pulse = 0.9 + 0.25 * Math.sin(elapsed * 8)
                    ring.mesh.scale.set(pulse, pulse, 1)
                    ringMat.opacity = 0.6 + 0.3 * Math.sin(elapsed * 8)
                } else if (node.status === 'low') {
                    ringMat.color.setHex(0xf59e0b) // Orange/Amber
                    const pulse = 1.0 + 0.12 * Math.sin(elapsed * 4)
                    ring.mesh.scale.set(pulse, pulse, 1)
                    ringMat.opacity = 0.5 + 0.2 * Math.sin(elapsed * 4)
                } else {
                    ringMat.color.setHex(0x10b981) // Green
                    ring.mesh.scale.set(1, 1, 1)
                    ringMat.opacity = 0.4
                }
            })

            // Update Solenoid Valves
            valveMeshes.forEach(valve => {
                const node = currentSensors.find(s => s.id === valve.id)
                const isIrrigating = node ? node.irrigating : false
                const isOnline = node ? node.online : false

                const ledMat = valve.led.material as THREE.MeshBasicMaterial
                if (isIrrigating) {
                    ledMat.color.setHex(0x22c55e) // green
                    // Vibration effect
                    valve.group.position.y = 0.15 + 0.015 * Math.sin(elapsed * 25)
                    valve.group.rotation.y = 0.25 * Math.sin(elapsed * 35)
                } else {
                    ledMat.color.setHex(isOnline ? 0xef4444 : 0x4b5563) // red or grey
                    valve.group.position.y = 0.15
                    valve.group.rotation.set(0, 0, 0)
                }
            })

            // Update water tank capacity level translucent mesh height
            if (waterMesh) {
                // Calculate capacity fraction based on total water used
                const level = Math.max(0.12, 1.0 - (stateRef.current.totalWaterUsed % 600) / 600)
                waterMesh.scale.y = level
                waterMesh.position.y = 1.25 + 0.65 * level

                // Color gets slightly deeper blue if full, lighter if draining
                const waterMat = waterMesh.material as THREE.MeshStandardMaterial
                waterMat.color.setRGB(0.15 + (1 - level) * 0.1, 0.45 + (1 - level) * 0.15, 0.9)
            }

            // Animate active dripper water pipes particles
            pipeParticles.forEach(p => {
                // Find which node matches this path's target ID
                const targetNode = currentSensors.find(s => s.id === wpTarget(p.path))
                const isIrrigating = targetNode ? targetNode.irrigating : false

                if (isIrrigating) {
                    p.mesh.visible = true
                    p.progress += delta * p.speed * 0.65
                    if (p.progress >= 1.0) {
                        p.progress = 0
                    }

                    // Calculate node traversal coordinate positions
                    const segmentCount = p.path.length - 1
                    const progressPercentage = p.progress * segmentCount
                    const activeSegment = Math.floor(progressPercentage)
                    const localProgress = progressPercentage - activeSegment

                    const startPt = p.path[activeSegment]
                    const endPt = p.path[activeSegment + 1]

                    if (startPt && endPt) {
                        p.mesh.position.set(
                            startPt[0] + (endPt[0] - startPt[0]) * localProgress,
                            startPt[1] + (endPt[1] - startPt[1]) * localProgress,
                            startPt[2] + (endPt[2] - startPt[2]) * localProgress
                        )
                    }
                } else {
                    p.mesh.visible = false
                }
            })

            // Animate solar charging flows (gold particles floating to server house)
            solarParticles.forEach(sp => {
                sp.progress += delta * sp.speed * 0.5
                if (sp.progress >= 1.0) {
                    sp.progress = 0
                }

                // Path: from solar panel (-3.0, 1.4, -2.7) down connection pipe to server base (-3.0, 0.4, -2.8)
                const sx = -3.0 + 0.4 * Math.sin(elapsed * 2.0 + sp.progress * Math.PI)
                const sz = -2.7 - 0.2 * sp.progress
                const sy = 1.3 - 0.8 * sp.progress
                sp.mesh.position.set(sx, sy, sz)
            })

            // Animate telemetry RF packages (LoRa signal waves) traveling from online sensors to server unit
            telemetryPackets.forEach(tp => {
                const node = currentSensors.find(s => s.id === tp.id)
                const isOnline = node ? node.online : false

                if (isOnline) {
                    tp.mesh.visible = true
                    tp.progress += delta * tp.speed * 1.2
                    if (tp.progress >= 1.0) {
                        tp.progress = 0
                    }

                    const p = tp.progress
                    const start = tp.startCoords
                    const end = [-3.0, 0.6, -2.5] // server receiver port

                    // Arch trajectory
                    const x = start[0] + (end[0] - start[0]) * p
                    const y = start[1] + 0.45 + (end[1] - (start[1] + 0.45)) * p + 1.2 * Math.sin(p * Math.PI)
                    const z = start[2] + (end[2] - start[2]) * p

                    tp.mesh.position.set(x, y, z)

                    const mat = tp.mesh.material as THREE.MeshBasicMaterial
                    mat.opacity = 1.0 - p
                    const scale = 0.5 + 0.5 * Math.sin(p * Math.PI)
                    tp.mesh.scale.set(scale, scale, scale)
                } else {
                    tp.mesh.visible = false
                }
            })

            // Subtle plant growth/breathing animations based on hydration levels
            plantMeshes.forEach(pm => {
                // Look up node in same plot
                const inGreenhouse = pm.type === 'coffee'
                const matchedNodes = currentSensors.filter(s => inGreenhouse ? (s.id === 'B1' || s.id === 'B4') : (s.id !== 'B1' && s.id !== 'B4'))
                const avgMoisture = matchedNodes.length > 0 ? matchedNodes.reduce((a, s) => a + s.moisture, 0) / matchedNodes.length : 50

                // Moisture expands size very slightly (turgor pressure)
                const turgorScale = 0.9 + (avgMoisture / 100) * 0.2
                const breathe = 1.0 + 0.015 * Math.sin(elapsed * 1.5 + pm.mesh.position.x)

                const finalScale = turgorScale * breathe
                pm.mesh.scale.set(finalScale, finalScale, finalScale)
            })

            // Interpolate dynamic lighting based on timeOfDayRef.current
            const tod = timeOfDayRef.current
            const skyCol = new THREE.Color()
            const sunCol = new THREE.Color()
            let sunIntensity = 1.0
            let ambIntensity = 0.5
            let fogDensity = 0.02
            let serverGlowIntensity = 0.0

            if (tod >= 10 && tod <= 16) {
                // Daytime (Sun)
                skyCol.setHex(0xe0f2fe)
                sunCol.setHex(0xffffff)
                sunIntensity = 1.0
                ambIntensity = 0.5
                fogDensity = 0.015
                serverGlowIntensity = 0.0
            } else if (tod > 16 && tod < 20) {
                // Sunset (Golden transition)
                const t = (tod - 16) / 4 // 0 to 1
                skyCol.lerpColors(new THREE.Color(0xe0f2fe), new THREE.Color(0xfdba74), t)
                sunCol.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xf97316), t)
                sunIntensity = 1.0 * (1 - t) + 0.1 * t
                ambIntensity = 0.5 * (1 - t) + 0.2 * t
                fogDensity = 0.015 * (1 - t) + 0.035 * t
                serverGlowIntensity = 3.0 * t
            } else if (tod >= 20 || tod < 5) {
                // Midnight (Darkness)
                skyCol.setHex(0x0a0f1d)
                sunCol.setHex(0x38bdf8) // moonlight blue
                sunIntensity = 0.08
                ambIntensity = 0.15
                fogDensity = 0.04
                serverGlowIntensity = 4.0
            } else {
                // Sunrise (5 to 10)
                const t = (tod - 5) / 5 // 0 to 1
                skyCol.lerpColors(new THREE.Color(0x0a0f1d), new THREE.Color(0xe0f2fe), t)
                sunCol.lerpColors(new THREE.Color(0x38bdf8), new THREE.Color(0xffffff), t)
                sunIntensity = 0.08 * (1 - t) + 1.0 * t
                ambIntensity = 0.15 * (1 - t) + 0.5 * t
                fogDensity = 0.04 * (1 - t) + 0.015 * t
                serverGlowIntensity = 4.0 * (1 - t)
            }

            // Apply lighting values
            if (scene.background instanceof THREE.Color) {
                scene.background.copy(skyCol)
            }
            if (scene.fog && 'color' in scene.fog) {
                (scene.fog as THREE.FogExp2).color.copy(skyCol)
                    ; (scene.fog as THREE.FogExp2).density = fogDensity
            }
            ambientLight.color.copy(skyCol)
            ambientLight.intensity = ambIntensity
            dirLight.color.copy(sunCol)
            dirLight.intensity = sunIntensity
            if (serverGlow) {
                serverGlow.intensity = serverGlowIntensity
            }

            // Handle Camera Transitions
            if (targetCamPosRef.current) {
                camera.position.lerp(targetCamPosRef.current, 0.05)
                if (camera.position.distanceTo(targetCamPosRef.current) < 0.02) {
                    targetCamPosRef.current = null
                }
            }
            if (targetLookAtRef.current) {
                controls.target.lerp(targetLookAtRef.current, 0.05)
                if (controls.target.distanceTo(targetLookAtRef.current) < 0.02) {
                    targetLookAtRef.current = null
                }
            }

            // Auto-Rotate and update OrbitControls
            controls.autoRotate = autoRotateRef.current
            controls.autoRotateSpeed = 0.5
            controls.update()

            // 3D Anchor overlay projection
            if (containerRef.current) {
                const wWidth = containerRef.current.clientWidth
                const wHeight = containerRef.current.clientHeight
                const tempV = new THREE.Vector3()

                const anchors = [
                    { id: 'anchor-greenhouse', pos: new THREE.Vector3(-2.5, 1.6, 0.5) },
                    { id: 'anchor-outfield', pos: new THREE.Vector3(2.5, 0.5, 0.3) },
                    { id: 'anchor-watertower', pos: new THREE.Vector3(3.0, 2.5, -2.8) },
                    { id: 'anchor-solar', pos: new THREE.Vector3(-3.0, 1.4, -2.7) },
                    { id: 'anchor-server', pos: new THREE.Vector3(-3.0, 0.7, -2.8) }
                ]

                anchors.forEach(a => {
                    const el = document.getElementById(a.id)
                    if (el) {
                        if (showLabelsRef.current) {
                            tempV.copy(a.pos)
                            tempV.project(camera)
                            const x = (tempV.x * 0.5 + 0.5) * wWidth
                            const y = (tempV.y * -0.5 + 0.5) * wHeight

                            el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`
                            if (tempV.z > 1.0) {
                                el.style.display = 'none'
                            } else {
                                el.style.display = 'block'
                            }
                        } else {
                            el.style.display = 'none'
                        }
                    }
                })
            }

            renderer.render(scene, camera)
        }

        animate()


        // Helper to determine target node ID for a path coordinate representation
        function wpTarget(path: [number, number, number][]) {
            const last = path[path.length - 1]
            // Match coordinate values mapping matching table
            if (last[0] === -2.5 && last[1] === 1.35 && last[2] === -1.2) return 'B1'
            if (last[0] === -2.5 && last[1] === 1.35 && last[2] === 1.2) return 'B4'
            if (last[0] === 2.5 && last[1] === 0.18 && last[2] === -1.5) return 'A1'
            if (last[0] === 2.5 && last[1] === 0.18 && last[2] === 0.0) return 'A2'
            if (last[0] === 2.5 && last[1] === 0.18 && last[2] === 1.5) return 'C1'
            return 'C2'
        }

        // Resize handler
        const handleResize = () => {
            if (!containerRef.current) return
            const w = containerRef.current.clientWidth
            const h = containerRef.current.clientHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }

        // Raycasting for Mouse move events (systen components hover description HUD)
        let currentHoveredObj: THREE.Object3D | null = null

        const handleMouseMove = (event: MouseEvent) => {
            if (!containerRef.current) return
            const rect = renderer.domElement.getBoundingClientRect()
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(hoverTargets, true)

            if (intersects.length > 0) {
                // Find top-level target (traverse parent until it has systemId)
                let targetObj: THREE.Object3D | null = intersects[0].object
                while (targetObj && !targetObj.userData.systemId) {
                    targetObj = targetObj.parent
                }

                if (targetObj && targetObj.userData.systemId) {
                    const systemId = targetObj.userData.systemId
                    setHoveredSystem(systemId)

                    // Emissive overlay feedback
                    if (currentHoveredObj !== targetObj) {
                        // Reset old hovered object if any
                        if (currentHoveredObj) {
                            currentHoveredObj.traverse(child => {
                                if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
                                    const m = child.material as THREE.MeshStandardMaterial
                                    m.emissive.setHex(0x000000)
                                    m.emissiveIntensity = 0.0
                                }
                            })
                        }

                        currentHoveredObj = targetObj
                        targetObj.traverse(child => {
                            if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
                                const m = child.material as THREE.MeshStandardMaterial
                                m.emissive.setHex(0x0284c7)
                                m.emissiveIntensity = 0.35
                            }
                        })
                    }
                }
            } else {
                setHoveredSystem(null)
                if (currentHoveredObj) {
                    currentHoveredObj.traverse(child => {
                        if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
                            const m = child.material as THREE.MeshStandardMaterial
                            m.emissive.setHex(0x000000)
                            m.emissiveIntensity = 0.0
                        }
                    })
                    currentHoveredObj = null
                }
            }
        }

        window.addEventListener('resize', handleResize)
        renderer.domElement.addEventListener('mousemove', handleMouseMove)

        // Clear target positions on user navigation drag
        controls.addEventListener('start', () => {
            targetCamPosRef.current = null
            targetLookAtRef.current = null
            setAutoTourActive(false)
        })

        // Cleanups
        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener('resize', handleResize)
            if (renderer.domElement) {
                renderer.domElement.removeEventListener('click', handleMouseClick)
                renderer.domElement.removeEventListener('mousemove', handleMouseMove)
                if (renderer.domElement.parentNode) {
                    renderer.domElement.parentNode.removeChild(renderer.domElement)
                }
            }
            controls.dispose()
            renderer.dispose()
        }
    }, [onSelectSensor])

    // Click handler from HUD list
    const handleHUDNodeSelect = (nodeId: string) => {
        setSelectedNodeId(nodeId)
        // Focus camera controls target onto sensor coordinate
        const targetIdx = sensors.findIndex(s => s.id === nodeId)
        const [tx, , tz] = getSensorCoords(nodeId, targetIdx)

        if (controlsRef.current) {
            let steps = 0
            const animateFocus = () => {
                if (steps < 20 && controlsRef.current) {
                    controlsRef.current.target.lerp(new THREE.Vector3(tx, 0.5, tz), 0.15)
                    controlsRef.current.update()
                    steps++
                    requestAnimationFrame(animateFocus)
                }
            }
            animateFocus()
        }

        // Focus card in DOM
        if (containerRef.current) {
            const domCard = document.getElementById(`sensor-card-${nodeId}`)
            if (domCard) {
                domCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
                const isAlreadySelected = domCard.getAttribute('data-selected') === 'true'
                if (!isAlreadySelected) {
                    setTimeout(() => {
                        const el = document.getElementById(`sensor-card-${nodeId}`)
                        if (el) el.click()
                    }, 300)
                }
            }
        }
    }

    // Toggle Valve manually from HUD UI
    const handleHUDToggleValve = (nodeId: string) => {
        dispatch({ type: 'TOGGLE_VALVE', id: nodeId })
    }

    // Toggle mode manually from HUD UI
    const handleHUDSelectMode = (nodeId: string, mode: 'auto' | 'manual') => {
        dispatch({ type: 'SET_MODE', id: nodeId, mode })
    }

    // Prepare hovered overlay text if any
    let hoveredDetails = hoveredSystem ? SYSTEM_DESCRIPTIONS[hoveredSystem] : null
    if (hoveredSystem && hoveredSystem.startsWith('sensor-')) {
        const sensorId = hoveredSystem.replace('sensor-', '')
        const sNode = sensors.find(s => s.id === sensorId)
        hoveredDetails = {
            title: `Telemetry Node ${sensorId}`,
            text: `Smart sensor stake measuring ${sNode?.crop || 'Crop'} moisture (${sNode?.moisture.toFixed(1)}%) and soil temperature (${sNode?.temp.toFixed(1)}°C) connected via LoRa.`
        }
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 480, overflow: 'hidden', borderRadius: 12, border: '1px solid rgba(76,175,125,0.2)' }}>
            {/* 3D WebGL Canvas container */}
            <div
                ref={containerRef}
                style={{ width: '100%', height: '100%', minHeight: 480, cursor: 'grab' }}
            />

            {/* Floating CSS 3D projected labels (Updated in requestAnimationFrame loop) */}
            <div id="anchor-greenhouse" style={{ position: 'absolute', top: 0, left: 0, display: 'none', background: 'rgba(12, 30, 19, 0.85)', border: '1px solid #10b981', color: '#f5efe6', padding: '2px 8px', borderRadius: 4, fontSize: 10, pointerEvents: 'none', zIndex: 5, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>Greenhouse Crop Zone</div>
            <div id="anchor-outfield" style={{ position: 'absolute', top: 0, left: 0, display: 'none', background: 'rgba(12, 30, 19, 0.85)', border: '1px solid #10b981', color: '#f5efe6', padding: '2px 8px', borderRadius: 4, fontSize: 10, pointerEvents: 'none', zIndex: 5, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>Outfield Gardens</div>
            <div id="anchor-watertower" style={{ position: 'absolute', top: 0, left: 0, display: 'none', background: 'rgba(12, 30, 19, 0.85)', border: '1px solid #3b82f6', color: '#f5efe6', padding: '2px 8px', borderRadius: 4, fontSize: 10, pointerEvents: 'none', zIndex: 5, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>Elevated Water Tower</div>
            <div id="anchor-solar" style={{ position: 'absolute', top: 0, left: 0, display: 'none', background: 'rgba(12, 30, 19, 0.85)', border: '1px solid #facc15', color: '#f5efe6', padding: '2px 8px', borderRadius: 4, fontSize: 10, pointerEvents: 'none', zIndex: 5, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>Solar Array</div>
            <div id="anchor-server" style={{ position: 'absolute', top: 0, left: 0, display: 'none', background: 'rgba(12, 30, 19, 0.85)', border: '1px solid #ef4444', color: '#f5efe6', padding: '2px 8px', borderRadius: 4, fontSize: 10, pointerEvents: 'none', zIndex: 5, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>Server Gateway Unit</div>

            {/* Hovered system description overlay */}
            {hoveredDetails && (
                <div style={{
                    position: 'absolute',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 320,
                    background: 'rgba(12, 30, 19, 0.9)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none',
                    zIndex: 20
                }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 13, fontWeight: 'bold', color: '#10b981' }}>{hoveredDetails.title}</h4>
                    <p style={{ margin: 0, fontSize: 11, color: '#c8c0b0', lineHeight: 1.4 }}>{hoveredDetails.text}</p>
                </div>
            )}

            {/* Active Auto-Tour Narrative Overlay */}
            {autoTourActive && (
                <div style={{
                    position: 'absolute',
                    bottom: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    maxWidth: 500,
                    background: 'rgba(12, 30, 19, 0.92)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: 8,
                    padding: '10px 16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 20,
                    pointerEvents: 'none',
                    textAlign: 'center',
                    backdropFilter: 'blur(12px)',
                    color: '#ffffff'
                }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#10b981', fontWeight: 'bold', marginBottom: 4 }}>Presentation Auto-Tour Mode</div>
                    <div style={{ fontSize: 12, fontWeight: '600', lineHeight: 1.4, color: '#f5efe6' }}>{TOUR_POINTS[tourStep]?.desc}</div>
                </div>
            )}

            {/* TOP LEFT HUD: Active Node inspect status */}
            <div
                style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    width: 260,
                    background: 'rgba(12, 30, 19, 0.82)',
                    border: '1px solid rgba(76, 175, 125, 0.25)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    pointerEvents: 'auto',
                    zIndex: 10
                }}
            >
                <span style={{ fontSize: 9, letterSpacing: '0.12em', color: '#e8a042', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Selected Telemetry Node
                </span>
                {selectedNode ? (
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                            {selectedNode.id} &middot; {selectedNode.crop}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#c8c0b0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Soil Moisture:</span>
                                <span className="font-mono-data" style={{ fontWeight: 700, color: selectedNode.status === 'optimal' ? '#4caf7d' : selectedNode.status === 'low' ? '#e8a042' : '#e05a4e' }}>
                                    {selectedNode.online ? `${selectedNode.moisture.toFixed(1)}%` : 'OFFLINE'}
                                </span>
                            </div>

                            {/* Progress moisture bar */}
                            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', margin: '2px 0 6px 0' }}>
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${selectedNode.online ? selectedNode.moisture : 0}%`,
                                        background: selectedNode.status === 'optimal' ? '#4caf7d' : selectedNode.status === 'low' ? '#e8a042' : '#e05a4e',
                                        transition: 'width 0.4s ease'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Watering Valve:</span>
                                <span style={{
                                    fontWeight: 700,
                                    color: selectedNode.irrigating ? '#4caf7d' : '#8aab90',
                                    fontSize: 10,
                                    padding: '2px 6px',
                                    background: selectedNode.irrigating ? 'rgba(76,175,125,0.15)' : 'rgba(138,171,144,0.1)',
                                    borderRadius: 4
                                }}>
                                    {selectedNode.irrigating ? 'OPEN (Dripping)' : 'CLOSED (Idle)'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Irrigation Mode:</span>
                                <span style={{ fontWeight: 600, color: '#ffffff', textTransform: 'capitalize' }}>{selectedNode.mode}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Soil Temp:</span>
                                <span className="font-mono-data" style={{ color: '#f5efe6' }}>{selectedNode.temp.toFixed(1)} &deg;C</span>
                            </div>

                            {/* Direct interactive controls on HUD */}
                            <div style={{ borderTop: '1px dashed rgba(76,175,125,0.2)', marginTop: 8, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={() => handleHUDSelectMode(selectedNode.id, 'auto')}
                                        style={{
                                            flex: 1,
                                            padding: '4px 6px',
                                            fontSize: 10,
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            border: '1px solid rgba(76,175,125,0.3)',
                                            background: selectedNode.mode === 'auto' ? 'rgba(76,175,125,0.2)' : 'transparent',
                                            color: selectedNode.mode === 'auto' ? '#4caf7d' : '#8aab90',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        Auto
                                    </button>
                                    <button
                                        onClick={() => handleHUDSelectMode(selectedNode.id, 'manual')}
                                        style={{
                                            flex: 1,
                                            padding: '4px 6px',
                                            fontSize: 10,
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            border: '1px solid rgba(76,175,125,0.3)',
                                            background: selectedNode.mode === 'manual' ? 'rgba(76,175,125,0.2)' : 'transparent',
                                            color: selectedNode.mode === 'manual' ? '#4caf7d' : '#8aab90',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        Manual
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleHUDToggleValve(selectedNode.id)}
                                    style={{
                                        width: '100%',
                                        padding: '6px 0',
                                        fontSize: 11,
                                        fontWeight: 650,
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        border: '1px solid ' + (selectedNode.irrigating ? 'rgba(224,90,78,0.4)' : 'rgba(76,175,125,0.4)'),
                                        background: selectedNode.irrigating ? 'rgba(224,90,78,0.1)' : 'rgba(76,175,125,0.1)',
                                        color: selectedNode.irrigating ? '#e05a4e' : '#4caf7d',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {selectedNode.irrigating ? 'Close Emitter Valve' : 'Open Emitter Valve'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: 13, color: '#8aab90', lineHeight: 1.5, marginTop: 4 }}>
                        Click on any sensor stake or building in the farm landscape coordinate map to inspect.
                    </div>
                )}
            </div>

            {/* TOP RIGHT HUD: Nodes overview side selector */}
            <div
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 200,
                    background: 'rgba(12, 30, 19, 0.82)',
                    border: '1px solid rgba(76, 175, 125, 0.25)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    pointerEvents: 'auto',
                    zIndex: 10
                }}
            >
                <span style={{ fontSize: 9, letterSpacing: '0.12em', color: '#8aab90', fontWeight: 650, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Crop Zones & Sensors
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
                    {sensors.map((s) => {
                        const isSel = selectedNodeId === s.id
                        let indicatorColor = '#b8b81eff'
                        if (!s.online) indicatorColor = '#8aab90'
                        else if (s.status === 'critical') indicatorColor = '#e05a4e'
                        else if (s.status === 'low') indicatorColor = '#e8a042'

                        return (
                            <button
                                key={s.id}
                                onClick={() => handleHUDNodeSelect(s.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: isSel ? 'rgba(76,175,125,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: isSel ? '1px solid rgba(76,175,125,0.4)' : '1px solid rgba(255,255,255,0.04)',
                                    borderRadius: 6,
                                    padding: '6px 8px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: indicatorColor }} />
                                    <span style={{ fontSize: 11, fontWeight: isSel ? 700 : 500, color: '#f5efe6' }}>{s.id}</span>
                                    <span style={{ fontSize: 8, color: '#8aab90' }}>({s.crop})</span>
                                </div>

                                {s.irrigating && (
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 4px #3b82f6' }} />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* BOTTOM PRESENTER CONTROL CHANNEL */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    right: 16,
                    background: 'rgba(12, 30, 19, 0.85)',
                    border: '1px solid rgba(76, 175, 125, 0.25)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'auto',
                    zIndex: 10,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                }}
            >
                {/* Left section: Preset Cam Views */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#e8a042', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
                        POI Presets:
                    </span>
                    <button
                        onClick={() => handlePOIClick('overview')}
                        style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5efe6' }}
                    >
                        🌎 Full Map
                    </button>
                    <button
                        onClick={() => handlePOIClick('greenhouse')}
                        style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5efe6' }}
                    >
                        🌿 Greenhouse
                    </button>
                    <button
                        onClick={() => handlePOIClick('outfield')}
                        style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5efe6' }}
                    >
                        🌾 Outfields
                    </button>
                    <button
                        onClick={() => handlePOIClick('watertower')}
                        style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5efe6' }}
                    >
                        💧 Tower
                    </button>
                    <button
                        onClick={() => handlePOIClick('solar')}
                        style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5efe6' }}
                    >
                        ⚡ Solar Array
                    </button>
                    <button
                        onClick={() => handlePOIClick('server')}
                        style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5efe6' }}
                    >
                        💻 Control Unit
                    </button>
                </div>

                {/* Middle section: Lighting Cycles Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#e8a042', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Time cycle:
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="23"
                        value={timeOfDay}
                        onChange={(e) => setTimeOfDay(parseInt(e.target.value))}
                        style={{ width: 80, cursor: 'pointer', accentColor: '#10b981' }}
                    />
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#f5efe6', minWidth: 42 }}>
                        {timeOfDay === 12 ? '☀️ Noon' : timeOfDay === 18 ? '🌆 Sunset' : timeOfDay === 22 ? '🌙 Night' : `${timeOfDay}:00`}
                    </span>
                </div>

                {/* Right section: Presentation Controls (rotation, labels, auto tours) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                        onClick={() => {
                            setAutoTourActive(!autoTourActive)
                            if (!autoTourActive) setTourStep(0)
                        }}
                        style={{
                            padding: '4px 8px',
                            fontSize: 10,
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 600,
                            background: autoTourActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                            border: autoTourActive ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.1)',
                            color: autoTourActive ? '#10b981' : '#f5efe6'
                        }}
                    >
                        {autoTourActive ? '⏹️ Stop Tour' : '▶️ Presentation Tour'}
                    </button>
                    <button
                        onClick={() => setAutoRotateActive(!autoRotateActive)}
                        style={{
                            padding: '4px 8px',
                            fontSize: 10,
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: autoRotateActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                            border: autoRotateActive ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.1)',
                            color: autoRotateActive ? '#10b981' : '#f5efe6'
                        }}
                    >
                        🔄 Auto-Rotate
                    </button>
                    <button
                        onClick={() => setShowLabels(!showLabels)}
                        style={{
                            padding: '4px 8px',
                            fontSize: 10,
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: showLabels ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                            border: showLabels ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.1)',
                            color: showLabels ? '#10b981' : '#f5efe6'
                        }}
                    >
                        🏷️ Labels
                    </button>
                </div>
            </div>
        </div>
    )
}
