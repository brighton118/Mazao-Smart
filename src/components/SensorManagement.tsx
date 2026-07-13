import React, { useState } from 'react'
import { useSimulation, SensorNode } from '../context/SimulationContext'
import { SimulationController } from '../utils/SimulationController'
import { useAuth } from '../context/AuthContext'

export default function SensorManagement() {
    const { state, dispatch } = useSimulation()
    const { sensors, lastSyncAt } = state
    const { user } = useAuth()
    const isWriteAllowed = user?.role === 'Administrator' || user?.role === 'Technician'

    // Add Sensor Node states
    const [showAddModal, setShowAddModal] = useState(false)
    const [addId, setAddId] = useState('')
    const [addPlot, setAddPlot] = useState('')
    const [addCrop, setAddCrop] = useState('Maize')
    const [addDepth, setAddDepth] = useState('40cm')
    const [addArea, setAddArea] = useState('1.5 ha')
    const [addMinThreshold, setAddMinThreshold] = useState(30)
    const [addMaxThreshold, setAddMaxThreshold] = useState(65)

    // Edit / Calibration state
    const [editingNode, setEditingNode] = useState<SensorNode | null>(null)
    const [editPlot, setEditPlot] = useState('')
    const [editCrop, setEditCrop] = useState('')
    const [editDepth, setEditDepth] = useState('')
    const [editArea, setEditArea] = useState('')
    const [editMin, setEditMin] = useState(30)
    const [editMax, setEditMax] = useState(65)
    const [editBattery, setEditBattery] = useState(100)
    const [editMoisture, setEditMoisture] = useState(50)

    const openAddModal = () => {
        let idx = sensors.length + 1
        let nextId = `S${idx}`
        while (sensors.some(s => s.id === nextId)) {
            idx++
            nextId = `S${idx}`
        }
        setAddId(nextId)
        setAddPlot(`Plot ${nextId}`)
        setAddCrop('Maize')
        setAddDepth('40cm')
        setAddArea('1.0 ha')
        setAddMinThreshold(30)
        setAddMaxThreshold(65)
        setShowAddModal(true)
    }

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!addId.trim() || !addPlot.trim()) return

        if (sensors.some(s => s.id.toLowerCase() === addId.trim().toLowerCase())) {
            alert(`Sensor ID "${addId}" already exists.`)
            return
        }

        dispatch({
            type: 'ADD_NODE',
            node: {
                id: addId.trim().toUpperCase(),
                plot: addPlot.trim(),
                crop: addCrop,
                depth: addDepth,
                area: addArea,
                minMoisture: Number(addMinThreshold),
                maxMoisture: Number(addMaxThreshold),
            }
        })
        setShowAddModal(false)
    }

    const startEditing = (node: SensorNode) => {
        setEditingNode(node)
        setEditPlot(node.plot)
        setEditCrop(node.crop)
        setEditDepth(node.depth)
        setEditArea(node.area)
        setEditMin(node.minMoisture)
        setEditMax(node.maxMoisture)
        setEditBattery(node.battery)
        setEditMoisture(node.moisture)
    }

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingNode) return

        dispatch({
            type: 'UPDATE_NODE',
            id: editingNode.id,
            updates: {
                plot: editPlot.trim(),
                crop: editCrop,
                depth: editDepth,
                area: editArea.trim(),
                minMoisture: Number(editMin),
                maxMoisture: Number(editMax),
                moisture: Number(editMoisture),
                battery: Number(editBattery)
            }
        })
        setEditingNode(null)
    }

    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header section with add button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '16px', height: '2px', background: '#4caf7d' }} />
                        <span style={{ fontSize: '11px', color: '#4caf7d', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }} className="font-mono-data">
                            Hardware Calibration Registry
                        </span>
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', margin: 0 }} className="font-display">
                        Sensor Management
                    </h2>
                    <div style={{ fontSize: '11px', color: '#8aab90', marginTop: '6px' }} className="font-mono-data">
                        Last sync: {lastSyncAt instanceof Date && !isNaN(lastSyncAt.getTime()) ? lastSyncAt.toLocaleTimeString('en-UG') : '—'} EAT
                    </div>
                </div>

                {isWriteAllowed && (
                    <button
                        onClick={openAddModal}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '8px',
                            border: '1px solid rgba(76,175,125,0.4)',
                            background: 'rgba(76,175,125,0.12)',
                            color: '#4caf7d',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif',
                            transition: 'all 0.2s',
                        }}
                    >
                        + Add Sensor Node
                    </button>
                )}
            </div>

            {!isWriteAllowed && (
                <div style={{
                    marginBottom: '32px',
                    background: 'rgba(232, 160, 66, 0.08)',
                    border: '1px solid rgba(232, 160, 66, 0.25)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#e8a042',
                    fontSize: '13px'
                }}>
                    <span>⚠️</span>
                    <span><strong>Read-Only Access:</strong> You are logged in as a <strong>{user?.role}</strong>. Only Administrators and Technicians can calibrate node thresholds or register new devices.</span>
                </div>
            )}

            {/* Grid of IoT Nodes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
                {sensors.map(node => {
                    return (
                        <div key={node.id} style={{
                            background: node.online ? 'rgba(22, 46, 30, 0.5)' : 'rgba(22, 46, 30, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${node.online ? 'rgba(245, 239, 230, 0.08)' : 'rgba(138, 171, 144, 0.15)'}`,
                            borderRadius: '12px',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.3s'
                        }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="font-mono-data" style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: node.online ? '#4caf7d' : '#8aab90',
                                            background: node.online ? 'rgba(76, 175, 125, 0.12)' : 'rgba(138,171,144,0.1)',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            NODE {node.id}
                                        </span>
                                        <span style={{ fontSize: '13px', color: '#8aab90' }}>({node.crop})</span>
                                    </div>
                                    {isWriteAllowed && (
                                        <button
                                            onClick={() => SimulationController.toggleOnline(dispatch, node.id)}
                                            style={{
                                                background: node.online ? 'rgba(224,90,78,0.1)' : 'rgba(76,175,125,0.15)',
                                                border: `1px solid ${node.online ? 'rgba(224,90,78,0.3)' : 'rgba(76,175,125,0.3)'}`,
                                                borderRadius: '4px',
                                                color: node.online ? '#e05a4e' : '#4caf7d',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                padding: '3px 8px',
                                                cursor: 'pointer',
                                                fontFamily: 'DM Sans, sans-serif'
                                            }}
                                        >
                                            {node.online ? 'DISCONNECT' : 'RECONNECT'}
                                        </button>
                                    )}
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 650, color: '#f5efe6', marginBottom: '4px' }}>
                                        {node.plot}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#8aab90' }}>
                                        Location: {node.area} · Probe Depth: {node.depth}
                                    </div>
                                </div>

                                {/* Values table specs */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(5, 15, 8, 0.3)', borderRadius: '6px', padding: '10px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: '#8aab90' }}>VWC moisture</span>
                                        <span className="font-mono-data" style={{ color: '#f5efe6', fontWeight: 600 }}>{node.online ? `${node.moisture.toFixed(0)}%` : 'OFFLINE'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: '#8aab90' }}>Trigger min</span>
                                        <span className="font-mono-data" style={{ color: '#e8a042' }}>{node.minMoisture}% VWC</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: '#8aab90' }}>Target max</span>
                                        <span className="font-mono-data" style={{ color: '#4caf7d' }}>{node.maxMoisture}% VWC</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: '#8aab90' }}>RSSI Signal</span>
                                        <span className="font-mono-data" style={{ color: '#f5efe6' }}>{node.online ? `${node.signalStrength}%` : 'OFFLINE'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: '#8aab90' }}>Battery SoC</span>
                                        <span className="font-mono-data" style={{ color: '#f5efe6' }}>{node.battery}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Adjust / remove buttons */}
                            {isWriteAllowed && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => startEditing(node)}
                                        style={{
                                            flex: 2,
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(245,239,230,0.15)',
                                            background: 'rgba(245,239,230,0.03)',
                                            color: '#f5efe6',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontFamily: 'DM Sans, sans-serif',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                    >
                                        ⚙️ Calibrate Node
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Remove sensor node ${node.id} from the AgriSense network?`)) {
                                                dispatch({ type: 'REMOVE_NODE', id: node.id })
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(224,90,78,0.3)',
                                            background: 'rgba(224,90,78,0.1)',
                                            color: '#e05a4e',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontFamily: 'DM Sans, sans-serif',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                    >
                                        🗑 Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Add Sensor Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 1000,
                    background: 'rgba(5,12,8,0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20
                }}>
                    <div style={{
                        background: '#162e1e',
                        border: '1px solid rgba(76,175,125,0.3)',
                        borderRadius: 12,
                        padding: 28,
                        maxWidth: 480,
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    }}>
                        <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#f5efe6', marginBottom: 20, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4caf7d' }} />
                            Add New Sensor Node
                        </h3>

                        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>NODE ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={addId}
                                        onChange={e => setAddId(e.target.value.toUpperCase())}
                                        placeholder="e.g. A3"
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                            fontFamily: 'DM Mono, monospace',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>PLOT NAME</label>
                                    <input
                                        type="text"
                                        required
                                        value={addPlot}
                                        onChange={e => setAddPlot(e.target.value)}
                                        placeholder="e.g. Plot A3"
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                            fontFamily: 'DM Sans, sans-serif',
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>CROP TYPE</label>
                                    <select
                                        value={addCrop}
                                        onChange={e => setAddCrop(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 13,
                                            outline: 'none',
                                        }}
                                    >
                                        {['Maize', 'Beans', 'Coffee', 'Tomatoes', 'Cassava'].map(c => (
                                            <option key={c} value={c} style={{ background: '#162e1e' }}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>SENSOR DEPTH</label>
                                    <select
                                        value={addDepth}
                                        onChange={e => setAddDepth(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 13,
                                            outline: 'none',
                                        }}
                                    >
                                        {['20cm', '40cm', '60cm'].map(d => (
                                            <option key={d} value={d} style={{ background: '#162e1e' }}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>AREA</label>
                                    <input
                                        type="text"
                                        required
                                        value={addArea}
                                        onChange={e => setAddArea(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, color: '#8aab90', display: 'block', marginBottom: 6 }}>MIN TRIGGER (%)</label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="90"
                                        required
                                        value={addMinThreshold}
                                        onChange={e => setAddMinThreshold(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, color: '#8aab90', display: 'block', marginBottom: 6 }}>MAX TARGET (%)</label>
                                    <input
                                        type="number"
                                        min="15"
                                        max="95"
                                        required
                                        value={addMaxThreshold}
                                        onChange={e => setAddMaxThreshold(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: '1px solid rgba(245,239,230,0.15)',
                                        borderRadius: 6,
                                        color: '#8aab90',
                                        fontSize: 14,
                                        padding: '10px 0',
                                        cursor: 'pointer',
                                        fontFamily: 'DM Sans, sans-serif'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        background: '#4caf7d',
                                        border: 'none',
                                        borderRadius: 6,
                                        color: '#0f2318',
                                        fontWeight: 600,
                                        fontSize: 14,
                                        padding: '10px 0',
                                        cursor: 'pointer',
                                        fontFamily: 'DM Sans, sans-serif'
                                    }}
                                >
                                    Register Node
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit / Calibration Modal */}
            {editingNode && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 1000,
                    background: 'rgba(5,12,8,0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20
                }}>
                    <div style={{
                        background: '#162e1e',
                        border: '1px solid rgba(232,160,66,0.3)',
                        borderRadius: 12,
                        padding: 28,
                        maxWidth: 480,
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    }}>
                        <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#f5efe6', marginBottom: 20, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e8a042' }} />
                            Calibrate Node {editingNode.id}
                        </h3>

                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>PLOT NAME</label>
                                <input
                                    type="text"
                                    required
                                    value={editPlot}
                                    onChange={e => setEditPlot(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(12,30,19,0.6)',
                                        border: '1px solid rgba(245,239,230,0.1)',
                                        borderRadius: 6,
                                        padding: '8px 12px',
                                        color: '#f5efe6',
                                        fontSize: 14,
                                        outline: 'none',
                                        fontFamily: 'DM Sans, sans-serif',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>CROP TYPE</label>
                                    <select
                                        value={editCrop}
                                        onChange={e => setEditCrop(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 13,
                                            outline: 'none',
                                        }}
                                    >
                                        {['Maize', 'Beans', 'Coffee', 'Tomatoes', 'Cassava'].map(c => (
                                            <option key={c} value={c} style={{ background: '#162e1e' }}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>SENSOR DEPTH</label>
                                    <select
                                        value={editDepth}
                                        onChange={e => setEditDepth(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 13,
                                            outline: 'none',
                                        }}
                                    >
                                        {['20cm', '40cm', '60cm'].map(d => (
                                            <option key={d} value={d} style={{ background: '#162e1e' }}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>PLOT AREA</label>
                                    <input
                                        type="text"
                                        required
                                        value={editArea}
                                        onChange={e => setEditArea(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>SIMULATED BATTERY (%)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        required
                                        value={editBattery}
                                        onChange={e => setEditBattery(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 10, color: '#8aab90', display: 'block', marginBottom: 6 }}>MOISTURE (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        required
                                        value={editMoisture}
                                        onChange={e => setEditMoisture(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, color: '#8aab90', display: 'block', marginBottom: 6 }}>MIN TRIGGER (%)</label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="90"
                                        required
                                        value={editMin}
                                        onChange={e => setEditMin(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, color: '#8aab90', display: 'block', marginBottom: 6 }}>MAX TARGET (%)</label>
                                    <input
                                        type="number"
                                        min="15"
                                        max="95"
                                        required
                                        value={editMax}
                                        onChange={e => setEditMax(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(12,30,19,0.6)',
                                            border: '1px solid rgba(245,239,230,0.1)',
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: '#f5efe6',
                                            fontSize: 14,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => setEditingNode(null)}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: '1px solid rgba(245,239,230,0.15)',
                                        borderRadius: 6,
                                        color: '#8aab90',
                                        fontSize: 14,
                                        padding: '10px 0',
                                        cursor: 'pointer',
                                        fontFamily: 'DM Sans, sans-serif'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        background: '#e8a042',
                                        border: 'none',
                                        borderRadius: 6,
                                        color: '#0f2318',
                                        fontWeight: 600,
                                        fontSize: 14,
                                        padding: '10px 0',
                                        cursor: 'pointer',
                                        fontFamily: 'DM Sans, sans-serif'
                                    }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
