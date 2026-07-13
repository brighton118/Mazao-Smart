import { useSimulation } from '../context/SimulationContext'
import MoistureGauge from './MoistureGauge'

export default function DashboardOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
    const { state } = useSimulation()
    const { sensors, totalWaterUsed, manualWaterEstimate, log } = state

    const activeSensors = sensors.filter(s => s.online)
    const avgMoisture = activeSensors.length > 0
        ? activeSensors.reduce((acc, s) => acc + s.moisture, 0) / activeSensors.length
        : 0

    const criticalSensors = sensors.filter(s => s.online && s.status === 'critical')
    const warningSensors = sensors.filter(s => s.online && s.status === 'low')
    const offlineSensors = sensors.filter(s => !s.online)

    const savedWater = Math.max(0, manualWaterEstimate - totalWaterUsed)

    // Get last 5 alerts or system changes
    const recentLogs = [...log].reverse().slice(0, 5)

    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Upper header summary */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '16px', height: '2px', background: '#4caf7d' }} />
                    <span style={{ fontSize: '11px', color: '#4caf7d', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }} className="font-mono-data">
                        System Operational Dashboard
                    </span>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', margin: 0 }} className="font-display">
                    agrisense overview
                </h2>
            </div>

            {/* Grid of 4 primary dials */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
            }}>
                {/* Average Soil Moisture */}
                <div style={{
                    background: 'rgba(22, 46, 30, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(76, 175, 125, 0.15)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
                        <MoistureGauge value={avgMoisture} size={70} />
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#f5efe6'
                        }} className="font-display">
                            {avgMoisture.toFixed(0)}%
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#8aab90', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Avg Moisture</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#f5efe6' }} className="font-display">Optimal Target</div>
                        <div style={{ fontSize: '11px', color: '#4caf7d' }}>Across {activeSensors.length} active nodes</div>
                    </div>
                </div>

                {/* Total Water Pumped */}
                <div style={{
                    background: 'rgba(22, 46, 30, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(76, 175, 125, 0.15)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ fontSize: '11px', color: '#8aab90', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Total Irrigation Flow</div>
                    <div>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#f5efe6' }} className="font-display">
                            {totalWaterUsed.toLocaleString('en-UG', { maximumFractionDigits: 0 })}
                        </span>
                        <span style={{ fontSize: '14px', color: '#8aab90', marginLeft: '4px', fontWeight: 500 }}>Litres</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#8aab90', marginTop: '6px' }}>
                        Tank volume: <span style={{ color: '#f5efe6', fontWeight: 600 }} className="font-mono-data">{state.tankLevel.toFixed(0)} L remaining</span>
                    </div>
                </div>

                {/* Cumulative Water Saved */}
                <div style={{
                    background: 'rgba(22, 46, 30, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(76, 175, 125, 0.15)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ fontSize: '11px', color: '#8aab90', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Water Ecology Savings</div>
                    <div>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#e8a042' }} className="font-display">
                            {savedWater.toLocaleString('en-UG', { maximumFractionDigits: 0 })}
                        </span>
                        <span style={{ fontSize: '14px', color: '#e8a042', marginLeft: '4px', fontWeight: 500 }}>Litres</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#4caf7d', marginTop: '6px' }}>
                        Smart scheduling optimization
                    </div>
                </div>

                {/* Micro-Grid Solar Status */}
                <div style={{
                    background: 'rgba(22, 46, 30, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(76, 175, 125, 0.15)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ fontSize: '11px', color: '#8aab90', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Smart PV Microgrid</div>
                    <div>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#4caf7d' }} className="font-display">
                            {state.solarOutput.toFixed(0)}
                        </span>
                        <span style={{ fontSize: '14px', color: '#4caf7d', marginLeft: '4px', fontWeight: 500 }}>W Generation</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#8aab90', marginTop: '6px' }}>
                        Battery Level: <span style={{ color: '#4caf7d', fontWeight: 600 }} className="font-mono-data">{state.batteryLevel.toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* Main Grid: Health Alerts & Detailed Log */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '24px',
                alignItems: 'start'
            }} className="lg:grid-cols-2">
                {/* Critical Alerts */}
                <div style={{
                    background: 'rgba(22, 46, 30, 0.4)',
                    border: '1px solid rgba(245, 239, 230, 0.08)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f5efe6', textTransform: 'uppercase', margin: '0 0 16px 0', borderBottom: '1px solid rgba(245,239,230,0.08)', paddingBottom: '12px' }} className="font-display">
                        Active Attention Areas
                    </h3>

                    {criticalSensors.length === 0 && warningSensors.length === 0 && offlineSensors.length === 0 ? (
                        <div style={{
                            padding: '24px',
                            textAlign: 'center',
                            color: '#8aab90',
                            fontSize: '13px'
                        }}>
                            ✨ All systems operational. Dry soil parameters optimal.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {offlineSensors.map(s => (
                                <div key={s.id} style={{
                                    background: 'rgba(138, 171, 144, 0.05)',
                                    border: '1px solid rgba(138, 171, 144, 0.15)',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#8aab90', background: 'rgba(138,171,144,0.15)', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }} className="font-mono-data">NODE {s.id}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 550, color: '#f5efe6' }}>{s.plot}</span>
                                        <div style={{ fontSize: '11px', color: '#8aab90', marginTop: '3px' }}>FDR telemetry link broke or node unpowered.</div>
                                    </div>
                                    <button
                                        onClick={() => onNavigate('sensors')}
                                        style={{ background: 'transparent', border: 'none', color: '#8aab90', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                    >
                                        Diagnose
                                    </button>
                                </div>
                            ))}

                            {criticalSensors.map(s => (
                                <div key={s.id} style={{
                                    background: 'rgba(224, 90, 78, 0.05)',
                                    border: '1px solid rgba(224, 90, 78, 0.2)',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#e05a4e', background: 'rgba(224,90,78,0.15)', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }} className="font-mono-data">NODE {s.id}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 550, color: '#f5efe6' }}>{s.plot}</span>
                                        <div style={{ fontSize: '11px', color: '#e05a4e', marginTop: '3px' }}>Moisture falls critical: <strong className="font-mono-data">{s.moisture.toFixed(0)}%</strong> (Min target: {s.minMoisture}%)</div>
                                    </div>
                                    <button
                                        onClick={() => onNavigate(s.id.startsWith('B') ? 'greenhouses' : 'garden-details')}
                                        style={{ background: 'transparent', border: 'none', color: '#e05a4e', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                    >
                                        Irrigate
                                    </button>
                                </div>
                            ))}

                            {warningSensors.map(s => (
                                <div key={s.id} style={{
                                    background: 'rgba(232, 160, 66, 0.05)',
                                    border: '1px solid rgba(232, 160, 66, 0.2)',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#e8a042', background: 'rgba(232,160,66,0.15)', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }} className="font-mono-data">NODE {s.id}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 550, color: '#f5efe6' }}>{s.plot}</span>
                                        <div style={{ fontSize: '11px', color: '#e8a042', marginTop: '3px' }}>Moisture dropping below minimum: <strong className="font-mono-data">{s.moisture.toFixed(0)}%</strong></div>
                                    </div>
                                    <button
                                        onClick={() => onNavigate('sensors')}
                                        style={{ background: 'transparent', border: 'none', color: '#e8a042', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                    >
                                        Inspect
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Real-time Activity Logs */}
                <div style={{
                    background: 'rgba(22, 46, 30, 0.4)',
                    border: '1px solid rgba(245, 239, 230, 0.08)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(245,239,230,0.08)', paddingBottom: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f5efe6', textTransform: 'uppercase', margin: 0 }} className="font-display">
                            Centralised Telemetry Stream
                        </h3>
                        <button
                            onClick={() => onNavigate('notifications')}
                            style={{ background: 'transparent', border: 'none', color: '#4caf7d', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                        >
                            See Log System
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '310px', overflowY: 'auto' }}>
                        {recentLogs.map((item) => {
                            let tagColor = '#8aab90'
                            let bg = 'rgba(245,239,230,0.04)'
                            if (item.type === 'alert') { tagColor = '#e05a4e'; bg = 'rgba(224,90,78,0.04)'; }
                            else if (item.type === 'action') { tagColor = '#4caf7d'; bg = 'rgba(76,175,125,0.04)'; }
                            else if (item.type === 'system') { tagColor = '#e8a042'; bg = 'rgba(232,160,66,0.04)'; }

                            const timeStr = item.timestamp instanceof Date && !isNaN(item.timestamp.getTime())
                                ? item.timestamp.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                : new Date(item.timestamp).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

                            return (
                                <div key={item.id} style={{
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    background: bg,
                                    borderLeft: `3px solid ${tagColor}`,
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center'
                                }}>
                                    <span className="font-mono-data" style={{ fontSize: '11px', color: '#8aab90', flexShrink: 0 }}>
                                        {timeStr}
                                    </span>
                                    <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: tagColor }} className="font-mono-data">
                                        {item.type}
                                    </span>
                                    <span style={{ fontSize: '12.5px', color: '#d0c9b8', lineHeight: 1.4 }}>
                                        {item.message}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
