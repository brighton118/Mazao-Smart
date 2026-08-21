import { useState } from 'react'
import { useSimulation } from '../context/SimulationContext'

interface AutoTriggerRule {
    id: string
    triggerField: string
    conditionType: 'below' | 'above'
    threshold: number
    actionTarget: string
    actionValue: 'open' | 'close' | 'start' | 'stop'
    enabled: boolean
}

export default function SystemAlerts() {
    const { state, dispatch } = useSimulation()
    const { log: logs, sensors } = state

    // Simulated rules manager details
    const [rules, setRules] = useState<AutoTriggerRule[]>([
        {
            id: 'R1',
            triggerField: 'Outfield Moisture',
            conditionType: 'below',
            threshold: 30,
            actionTarget: 'Outfield Valves (A1-A2)',
            actionValue: 'open',
            enabled: true
        },
        {
            id: 'R2',
            triggerField: 'Greenhouse Moisture',
            conditionType: 'below',
            threshold: 35,
            actionTarget: 'Greenhouse Valves (B1-B4)',
            actionValue: 'open',
            enabled: true
        },
        {
            id: 'R3',
            triggerField: 'Reservoir Level',
            conditionType: 'below',
            threshold: 20,
            actionTarget: 'Well Pump P1',
            actionValue: 'start',
            enabled: true
        }
    ])

    // New rule state
    const [newField, setNewField] = useState('Outfield Moisture')
    const [newCond, setNewCond] = useState<'below' | 'above'>('below')
    const [newVal, setNewVal] = useState(30)
    const [newAction, setNewAction] = useState('Outfield Valves (A1-A2)')
    const [newActVal, setNewActVal] = useState<'open' | 'close' | 'start' | 'stop'>('open')

    const toggleRule = (id: string) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
        dispatch({
            type: 'ADD_LOG',
            event: {
                id: `LOG-${Date.now()}`,
                timestamp: new Date(),
                category: 'system',
                message: `Automation rule ${id} status toggled.`,
                severity: 'info'
            }
        })
    }

    const deleteRule = (id: string) => {
        setRules(prev => prev.filter(r => r.id !== id))
        dispatch({
            type: 'ADD_LOG',
            event: {
                id: `LOG-${Date.now()}`,
                timestamp: new Date(),
                category: 'system',
                message: `Automation rule ${id} unregistered.`,
                severity: 'info'
            }
        })
    }

    const handleAddRule = (e: React.FormEvent) => {
        e.preventDefault()
        const ruleId = `R${rules.length + 1}`
        const r: AutoTriggerRule = {
            id: ruleId,
            triggerField: newField,
            conditionType: newCond,
            threshold: newVal,
            actionTarget: newAction,
            actionValue: newActVal,
            enabled: true
        }
        setRules(prev => [...prev, r])
        dispatch({
            type: 'ADD_LOG',
            event: {
                id: `LOG-${Date.now()}`,
                timestamp: new Date(),
                category: 'system',
                message: `New rule ${ruleId} spawned: If ${newField} ${newCond} ${newVal}%, execute ${newAction} [${newActVal}].`,
                severity: 'warning'
            }
        })
    }

    // Group alerts & active notifications
    // Active sensors reporting dry condition:
    const dryNodes = sensors.filter(s => s.online && s.moisture < s.minMoisture)
    const offlineNodes = sensors.filter(s => !s.online)

    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '16px', height: '2px', background: '#e05a4e' }} />
                        <span style={{ fontSize: '11px', color: '#e05a4e', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }} className="font-mono-data">
                            Real-time Logs & Rules
                        </span>
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', margin: 0 }} className="font-display">
                        Notifications
                    </h2>
                    <div style={{ fontSize: '12px', color: '#8aab90', marginTop: '6px' }}>
                        Telemetry dispatch center for edge automation contracts and log audits.
                    </div>
                </div>

                {/* Clear log toggle */}
                <button
                    onClick={() => {
                        if (confirm('Clear telemetry log list?')) {
                            dispatch({ type: 'CLEAR_LOG' })
                        }
                    }}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid rgba(224,90,78,0.25)',
                        background: 'rgba(224,90,78,0.06)',
                        color: '#e05a4e',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif'
                    }}
                >
                    🧹 Flush Event Logs
                </button>
            </div>

            {/* Top section: Critical alerts notification board */}
            {(dryNodes.length > 0 || offlineNodes.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {offlineNodes.map(node => (
                        <div key={node.id} style={{
                            background: 'rgba(224, 90, 78, 0.08)',
                            border: '1px solid rgba(224, 90, 78, 0.3)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '13px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e05a4e' }}>
                                <span>🚨</span>
                                <strong>Sensor Offline Warning:</strong>
                                <span style={{ color: '#f5efe6' }}>Probe {node.id} on {node.plot} is not broadcasting telemetry.</span>
                            </div>
                            <span className="font-mono-data" style={{ color: '#8aab90', fontSize: '11px' }}>RSSI: 0%</span>
                        </div>
                    ))}
                    {dryNodes.map(node => (
                        <div key={node.id} style={{
                            background: 'rgba(232, 160, 66, 0.08)',
                            border: '1px solid rgba(232, 160, 66, 0.3)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '13px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e8a042' }}>
                                <span>🌾</span>
                                <strong>Soil Moisture Deficit:</strong>
                                <span style={{ color: '#f5efe6' }}>{node.plot} ({node.crop}) is at {node.moisture.toFixed(0)}% vwc (Min threshold: {node.minMoisture}%).</span>
                            </div>
                            <span style={{ color: '#e8a042', fontWeight: 600 }}>Irrigation Triggered</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Main split */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.8fr)', gap: '20px', alignItems: 'start' }}>

                {/* Left Column: Automation Rules Constructor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Active Rules List */}
                    <div style={{ background: 'rgba(22, 46, 30, 0.3)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '20px' }}>
                        <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: '#f5efe6', marginBottom: '16px', textTransform: 'uppercase' }}>
                            Edge Automation Rules
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {rules.map(r => (
                                <div key={r.id} style={{
                                    background: r.enabled ? 'rgba(22, 46, 30, 0.5)' : 'rgba(245,239,230,0.02)',
                                    border: `1px solid ${r.enabled ? 'rgba(76,175,125,0.2)' : 'rgba(245,239,230,0.06)'}`,
                                    borderRadius: '8px',
                                    padding: '12px',
                                    opacity: r.enabled ? 1 : 0.6,
                                    transition: 'opacity 0.2s'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className="font-mono-data" style={{ fontSize: '11px', fontWeight: 700, color: r.enabled ? '#4caf7d' : '#8aab90' }}>
                                            RULE {r.id}
                                        </span>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => toggleRule(r.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: r.enabled ? '#4caf7d' : '#8aab90',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    fontFamily: 'DM Sans, sans-serif'
                                                }}
                                            >
                                                {r.enabled ? 'Enabled' : 'Disabled'}
                                            </button>
                                            <button
                                                onClick={() => deleteRule(r.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#e05a4e',
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '13px', color: '#f5efe6', lineHeight: 1.4 }}>
                                        If <strong>{r.triggerField}</strong> is <strong>{r.conditionType}</strong> <strong>{r.threshold}%</strong>,<br />
                                        then execute <strong>{r.actionTarget}</strong> ➔ <span style={{ color: '#4caf7d', fontWeight: 600 }}>{r.actionValue.toUpperCase()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Create Rule Form */}
                    <div style={{ background: 'rgba(22, 46, 30, 0.3)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '20px' }}>
                        <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: '#f5efe6', marginBottom: '16px', textTransform: 'uppercase' }}>
                            Add Automation Rule
                        </h3>

                        <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '11px', color: '#8aab90', display: 'block', marginBottom: '4px' }}>TRIGGER SOURCE</label>
                                <select
                                    value={newField}
                                    onChange={e => setNewField(e.target.value)}
                                    style={{ width: '100%', background: 'rgba(12,30,19,0.6)', border: '1px solid rgba(245,239,230,0.1)', borderRadius: '6px', padding: '8px', color: '#f5efe6', fontSize: '13px' }}
                                >
                                    <option value="Outfield Moisture">Outfield Moisture (Global)</option>
                                    <option value="Greenhouse Moisture">Greenhouse Moisture (Global)</option>
                                    <option value="Reservoir Level">Reservoir Level (Tank)</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#8aab90', display: 'block', marginBottom: '4px' }}>CONDITION</label>
                                    <select
                                        value={newCond}
                                        onChange={e => setNewCond(e.target.value as 'below' | 'above')}
                                        style={{ width: '100%', background: 'rgba(12,30,19,0.6)', border: '1px solid rgba(245,239,230,0.1)', borderRadius: '6px', padding: '8px', color: '#f5efe6', fontSize: '13px' }}
                                    >
                                        <option value="below">Is Below</option>
                                        <option value="above">Is Above</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#8aab90', display: 'block', marginBottom: '4px' }}>VALUE (%)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="95"
                                        value={newVal}
                                        onChange={e => setNewVal(Number(e.target.value))}
                                        style={{ width: '100%', background: 'rgba(12,30,19,0.6)', border: '1px solid rgba(245,239,230,0.1)', borderRadius: '6px', padding: '8px', color: '#f5efe6', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', color: '#8aab90', display: 'block', marginBottom: '4px' }}>ACTION EXEC TARGET</label>
                                <select
                                    value={newAction}
                                    onChange={e => setNewAction(e.target.value)}
                                    style={{ width: '100%', background: 'rgba(12,30,19,0.6)', border: '1px solid rgba(245,239,230,0.1)', borderRadius: '6px', padding: '8px', color: '#f5efe6', fontSize: '13px' }}
                                >
                                    <option value="Outfield Valves (A1-A2)">Outfield Valves (A1-A2)</option>
                                    <option value="Greenhouse Valves (B1-B4)">Greenhouse Valves (B1-B4)</option>
                                    <option value="Well Pump P1">Well Pump P1</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', color: '#8aab90', display: 'block', marginBottom: '4px' }}>VALVE/PUMP ACTION</label>
                                <select
                                    value={newActVal}
                                    onChange={e => setNewActVal(e.target.value as 'open' | 'close' | 'start' | 'stop')}
                                    style={{ width: '100%', background: 'rgba(12,30,19,0.6)', border: '1px solid rgba(245,239,230,0.1)', borderRadius: '6px', padding: '8px', color: '#f5efe6', fontSize: '13px' }}
                                >
                                    <option value="open">OPEN Valve</option>
                                    <option value="close">CLOSE Valve</option>
                                    <option value="start">START Pump</option>
                                    <option value="stop">STOP Pump</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    marginTop: '6px',
                                    padding: '10px 0',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#4caf7d',
                                    color: '#0f2318',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontFamily: 'DM Sans, sans-serif'
                                }}
                            >
                                Register Rule
                            </button>
                        </form>
                    </div>

                </div>

                {/* Right Column: Console Output & Full Log List */}
                <div style={{ background: 'rgba(22, 46, 30, 0.3)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: '#f5efe6', marginBottom: '8px', textTransform: 'uppercase' }}>
                        System Audit Log
                    </h3>
                    <p style={{ fontSize: '13px', color: '#8aab90', marginBottom: '20px' }}>
                        Streaming telemetry events directly from Wokwi virtual simulator core.
                    </p>

                    {/* Console logger display */}
                    <div style={{
                        background: 'rgba(5, 12, 8, 0.6)',
                        border: '1px solid rgba(245,239,230,0.08)',
                        borderRadius: '8px',
                        padding: '16px',
                        height: '460px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                    }} className="font-mono-data">
                        {logs.length === 0 ? (
                            <div style={{ color: '#8aab90', fontStyle: 'italic', textAlign: 'center', margin: 'auto' }}>
                                Console empty. Telemetry events will accumulate here.
                            </div>
                        ) : (
                            [...logs].reverse().map(l => {
                                let badgeColor = '#4caf7d'
                                let bgBadge = 'rgba(76,175,125,0.1)'
                                if (l.severity === 'warning') {
                                    badgeColor = '#e8a042'
                                    bgBadge = 'rgba(232,160,66,0.1)'
                                } else if (l.severity === 'danger') {
                                    badgeColor = '#e05a4e'
                                    bgBadge = 'rgba(224,90,78,0.1)'
                                }

                                return (
                                    <div key={l.id} style={{
                                        fontSize: '12px',
                                        lineHeight: '1.5',
                                        paddingBottom: '8px',
                                        borderBottom: '1px solid rgba(245,239,230,0.04)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <span style={{
                                                    color: badgeColor,
                                                    background: bgBadge,
                                                    padding: '1px 5px',
                                                    borderRadius: '3px',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {l.category}
                                                </span>
                                                <span style={{ color: '#f5efe6', fontWeight: 550 }}>
                                                    {l.message}
                                                </span>
                                            </div>
                                            <span style={{ color: '#8aab90', fontSize: '10px' }}>
                                                {l.timestamp instanceof Date && !isNaN(l.timestamp.getTime()) ? l.timestamp.toLocaleTimeString('en-US') : ''}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

            </div>

        </div>
    )
}
