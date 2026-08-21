import React, { Component, type ReactNode, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './Scene'
import { useSimulation } from '../context/SimulationContext'
import { TOUR_STEPS } from './CameraController'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("WebGL Canvas Error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', textAlign: 'center', color: '#e8a042', background: 'rgba(232, 160, 66, 0.05)', border: '1px dashed rgba(232, 160, 66, 0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</span>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>WebGL Graphic Context Crashed</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#8aab90', maxWidth: '360px', lineHeight: 1.5 }}>
                        The 3D digital twin requires WebGL support. This can happen if GPU acceleration is disabled, or due to headless browser rendering constraints.
                    </p>
                </div>
            )
        }
        return this.props.children
    }
}

// Collapsible Accordion UI Component
function Accordion({ title, children, defaultOpen = false }: any) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(76, 175, 125, 0.2)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
            <button
                onClick={() => setOpen(!open)}
                style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', background: open ? 'rgba(76, 175, 125, 0.1)' : 'transparent', border: 'none', color: '#f5efe6', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}
            >
                <span className="font-display" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', fontSize: '13px' }}>{title}</span>
                <span style={{ color: '#10b981' }}>{open ? '▼' : '▶'}</span>
            </button>
            {open && (
                <div style={{ padding: '16px', borderTop: '1px solid rgba(76, 175, 125, 0.1)' }}>
                    {children}
                </div>
            )}
        </div>
    )
}

export default function SmartFarm3D() {
    const { state, dispatch } = useSimulation()
    const { sensors } = state

    // Lifted Scene states
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [selectedComponent, setSelectedComponent] = useState<{ name: string; specs: string } | null>(null)
    const [autoRotateActive, setAutoRotateActive] = useState<boolean>(false)
    const [showLabels, setShowLabels] = useState<boolean>(true)
    const [timeOfDay, setTimeOfDay] = useState<number>(12) // 0 to 24 hour slider
    const [autoTourActive, setAutoTourActive] = useState<boolean>(false)
    const [tourStepIndex, setTourStepIndex] = useState<number>(0)
    const [activePOI, setActivePOI] = useState<string | null>(null)

    // Handlers
    const handlePOIClick = (poiName: string) => {
        setAutoTourActive(false)
        setActivePOI(poiName)
        setSelectedComponent(null) // clear focus
    }

    const handleSelectStake = (sensorId: string) => {
        setSelectedNodeId(sensorId)
        if (sensorId === 'B1' || sensorId === 'B4') {
            setActivePOI('greenhouse')
        } else {
            setActivePOI('outfield')
        }
    }

    const handleSelectComponent = (name: string, specs: string) => {
        setSelectedComponent({ name, specs })
        setAutoTourActive(false)

        const nameLower = name.toLowerCase()
        if (nameLower.includes('pump')) setActivePOI('pump')
        else if (nameLower.includes('solar') || nameLower.includes('power')) setActivePOI('solar')
        else if (nameLower.includes('tank') || nameLower.includes('reservoir')) setActivePOI('tank')
        else if (nameLower.includes('gateway') || nameLower.includes('server') || nameLower.includes('control house')) setActivePOI('gateway')
        else if (nameLower.includes('weather')) setActivePOI('weather')
        else if (nameLower.includes('greenhouse')) setActivePOI('greenhouse')
        else if (nameLower.includes('valve') || nameLower.includes('sensor') || nameLower.includes('moisture') || nameLower.includes('probe')) {
            const match = name.match(/\(([^)]+)\)/)
            if (match) {
                const sId = match[1]
                setSelectedNodeId(sId)
                if (sId === 'B1' || sId === 'B4') setActivePOI('greenhouse')
                else setActivePOI('outfield')
            } else {
                setActivePOI(nameLower.includes('valve') ? 'greenhouse' : 'outfield')
            }
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
                id="agrisense-3d-canvas-container"
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '480px',
                    background: '#0c1e13',
                    borderRadius: '12px',
                    border: '1px solid rgba(76, 175, 125, 0.15)',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
                }}
            >
                <WebGLErrorBoundary>
                    <Canvas shadows camera={{ position: [10, 8, 12], fov: 40 }}>
                        <Scene
                            selectedNodeId={selectedNodeId}
                            selectedComponent={selectedComponent}
                            autoRotateActive={autoRotateActive}
                            showLabels={showLabels}
                            timeOfDay={timeOfDay}
                            autoTourActive={autoTourActive}
                            tourStepIndex={tourStepIndex}
                            setTourStepIndex={setTourStepIndex}
                            activePOI={activePOI}
                            onPOIClick={handlePOIClick}
                            onSelectStake={handleSelectStake}
                            onSelectComponent={handleSelectComponent}
                        />
                    </Canvas>
                </WebGLErrorBoundary>
            </div>

            {/* Accordion Panels (Moved from absolutely positioned HUD elements) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                {/* Global Controls & Time */}
                <Accordion title="Tour & Global Controls" defaultOpen={true}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Focus Subsystem</span>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {['general', 'gateway', 'greenhouse', 'outfield', 'tank', 'pump', 'solar', 'weather'].map(target => (
                                    <button
                                        key={target}
                                        onClick={() => handlePOIClick(target)}
                                        style={{ padding: '6px 12px', background: activePOI === target ? 'rgba(76, 175, 125, 0.2)' : 'rgba(255,255,255,0.05)', border: activePOI === target ? '1px solid #4caf7d' : '1px solid rgba(255,255,255,0.1)', color: '#f5efe6', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize' }}
                                    >
                                        {target}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Time of Day Simulator</span>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input type="range" min="0" max="23" value={timeOfDay} onChange={(e) => setTimeOfDay(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#4caf7d' }} />
                                <span style={{ fontSize: '12px', color: '#f5efe6', width: '40px' }}>{timeOfDay}:00</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: 'auto' }}>
                            <button onClick={() => { setAutoTourActive(!autoTourActive); if (!autoTourActive) setTourStepIndex(0); }} style={{ padding: '6px 16px', background: autoTourActive ? 'rgba(76, 175, 125, 0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (autoTourActive ? '#4caf7d' : 'rgba(255,255,255,0.1)'), color: autoTourActive ? '#4caf7d' : '#f5efe6', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                {autoTourActive ? '⏹ Stop Tour' : '▶ Start Investor Tour'}
                            </button>
                            <button onClick={() => setAutoRotateActive(!autoRotateActive)} style={{ padding: '6px 16px', background: autoRotateActive ? 'rgba(76, 175, 125, 0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (autoRotateActive ? '#4caf7d' : 'rgba(255,255,255,0.1)'), color: autoRotateActive ? '#4caf7d' : '#f5efe6', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                🔄 Auto Rotate
                            </button>
                            <button onClick={() => setShowLabels(!showLabels)} style={{ padding: '6px 16px', background: showLabels ? 'rgba(76, 175, 125, 0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (showLabels ? '#4caf7d' : 'rgba(255,255,255,0.1)'), color: showLabels ? '#4caf7d' : '#f5efe6', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                🏷️ Labels
                            </button>
                        </div>
                    </div>
                    {/* Tour Text Display */}
                    {autoTourActive && (
                        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(76, 175, 125, 0.1)', borderRadius: '8px', border: '1px solid rgba(76, 175, 125, 0.3)' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#4caf7d', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.1em' }}>
                                Step {tourStepIndex + 1} of {TOUR_STEPS.length}
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f5efe6', marginBottom: '4px' }}>
                                {TOUR_STEPS[tourStepIndex]?.title}
                            </div>
                            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                                {TOUR_STEPS[tourStepIndex]?.desc}
                            </div>
                        </div>
                    )}
                </Accordion>

                {/* Selected Component Specifications */}
                {selectedComponent && (
                    <Accordion title={`Component Specs: ${selectedComponent.name}`} defaultOpen={true}>
                        <pre style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                            {selectedComponent.specs}
                        </pre>
                    </Accordion>
                )}

                {/* Sensor Node Details */}
                <Accordion title="Active Sensor Node Feed" defaultOpen={!!selectedNodeId}>
                    {!selectedNodeId ? (
                        <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                            Click any sensor node probe, green valve, or building in the simulation scene (or in the Node List below) to inspect telemetry.
                        </div>
                    ) : (
                        (() => {
                            const node = sensors.find(s => s.id === selectedNodeId);
                            if (!node) return null;
                            let indicatorColor = node.online ? (node.status === 'optimal' ? '#10b981' : node.status === 'low' ? '#f59e0b' : '#ef4444') : '#94a3b8';
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f5efe6', margin: 0 }}>
                                            {node.id} &middot; {node.crop}
                                        </h3>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: node.online ? 'rgba(76, 175, 125, 0.1)' : 'rgba(148,163,184,0.1)', color: node.online ? '#4caf7d' : '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>
                                            {node.online ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Soil Moisture</div>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: indicatorColor }}>{node.moisture.toFixed(1)}%</div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Soil Temperature</div>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f5efe6' }}>{node.temp.toFixed(1)} &deg;C</div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Solenoid Valve</div>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '6px', color: node.irrigating ? '#3b82f6' : '#94a3b8' }}>
                                                {node.irrigating ? 'OPEN (Watering)' : 'CLOSED (Idle)'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Limits & Controls */}
                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', borderTop: '1px solid rgba(76, 175, 125, 0.1)', paddingTop: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Min Moisture</span>
                                                <input type="number" min="10" max="90" value={node.minMoisture} onChange={(e) => dispatch({ type: 'UPDATE_THRESHOLDS', id: node.id, minMoisture: parseInt(e.target.value) || 30, maxMoisture: node.maxMoisture })} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #334155', color: '#fff', fontSize: '12px', borderRadius: '4px', padding: '6px', width: '80px' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Max Moisture</span>
                                                <input type="number" min="10" max="90" value={node.maxMoisture} onChange={(e) => dispatch({ type: 'UPDATE_THRESHOLDS', id: node.id, minMoisture: node.minMoisture, maxMoisture: parseInt(e.target.value) || 80 })} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #334155', color: '#fff', fontSize: '12px', borderRadius: '4px', padding: '6px', width: '80px' }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => dispatch({ type: 'SET_MODE', id: node.id, mode: 'auto' })} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(76, 175, 125, 0.3)', background: node.mode === 'auto' ? 'rgba(76, 175, 125, 0.2)' : 'transparent', color: node.mode === 'auto' ? '#4caf7d' : '#94a3b8' }}>
                                                Auto Mode
                                            </button>
                                            <button onClick={() => dispatch({ type: 'SET_MODE', id: node.id, mode: 'manual' })} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(76, 175, 125, 0.3)', background: node.mode === 'manual' ? 'rgba(76, 175, 125, 0.2)' : 'transparent', color: node.mode === 'manual' ? '#4caf7d' : '#94a3b8' }}>
                                                Manual Mode
                                            </button>
                                        </div>

                                        <button onClick={() => dispatch({ type: 'TOGGLE_VALVE', id: node.id })} style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', border: '1px solid ' + (node.irrigating ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.5)'), background: node.irrigating ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.15)', color: node.irrigating ? '#ef4444' : '#60a5fa', marginLeft: 'auto' }}>
                                            {node.irrigating ? 'Stop Irrigation' : 'Start Irrigation'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })()
                    )}
                </Accordion>

                {/* Node Quick List */}
                <Accordion title="All Field Nodes" defaultOpen={false}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                        {sensors.map((s) => {
                            const isSel = selectedNodeId === s.id;
                            let indicatorColor = '#94a3b8';
                            if (s.online) {
                                if (s.status === 'optimal') indicatorColor = '#10b981';
                                else if (s.status === 'low') indicatorColor = '#f59e0b';
                                else if (s.status === 'critical') indicatorColor = '#ef4444';
                            }
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => handleSelectStake(s.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: isSel ? 'rgba(76, 175, 125, 0.15)' : 'rgba(0,0,0,0.2)',
                                        border: isSel ? '1px solid #4caf7d' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '6px', padding: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: indicatorColor }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f5efe6' }}>{s.id}</span>
                                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>{s.crop}</span>
                                        </div>
                                    </div>
                                    {s.irrigating && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} />}
                                </button>
                            );
                        })}
                    </div>
                </Accordion>

            </div>
        </div>
    )
}
