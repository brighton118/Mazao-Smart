import { useSimulation } from '../context/SimulationContext'
import MoistureGauge from './MoistureGauge'
import { SimulationController } from '../utils/SimulationController'

export default function GreenhousesPanel() {
    const { state, dispatch } = useSimulation()
    const ghSensors = state.sensors.filter(s => s.id.startsWith('B'))

    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '16px', height: '2px', background: '#4caf7d' }} />
                    <span style={{ fontSize: '11px', color: '#4caf7d', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }} className="font-mono-data">
                        Microclimate & Solenoid Control
                    </span>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', margin: 0 }} className="font-display">
                    Greenhouse Complexes
                </h2>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#8aab90' }}>
                    Real-time telemetry and solenoid valve control for Greenhouse units B1 (Beans) and B4 (Beans).
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {ghSensors.map(sensor => {
                    const isCritical = sensor.status === 'critical'
                    const isLow = sensor.status === 'low'
                    const isOffline = !sensor.online

                    let alertBorder = 'rgba(245, 239, 230, 0.08)'
                    let badgeColor = '#4caf7d'
                    let badgeBg = 'rgba(76, 175, 125, 0.12)'

                    if (isOffline) {
                        badgeColor = '#8aab90'
                        badgeBg = 'rgba(138, 171, 144, 0.12)'
                    } else if (isCritical) {
                        alertBorder = 'rgba(224, 90, 78, 0.4)'
                        badgeColor = '#e05a4e'
                        badgeBg = 'rgba(224, 90, 78, 0.15)'
                    } else if (isLow) {
                        alertBorder = 'rgba(232, 160, 66, 0.3)'
                        badgeColor = '#e8a042'
                        badgeBg = 'rgba(232, 160, 66, 0.15)'
                    }

                    return (
                        <div key={sensor.id} style={{
                            background: 'rgba(22, 46, 30, 0.5)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alertBorder}`,
                            borderRadius: '12px',
                            padding: '24px',
                            opacity: isOffline ? 0.75 : 1,
                            transition: 'all 0.3s'
                        }}>
                            {/* Header inside card */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="font-mono-data" style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: badgeColor,
                                            background: badgeBg,
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            NODE {sensor.id}
                                        </span>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f5efe6', margin: 0 }}>
                                            {sensor.plot}
                                        </h3>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#8aab90', marginTop: '4px' }}>
                                        Crop: <span style={{ color: '#d0c9b8', fontWeight: 500 }}>{sensor.crop}</span> · Depth: {sensor.depth}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: isOffline ? '#8aab90' : isCritical ? '#e05a4e' : '#4caf7d',
                                            boxShadow: isOffline ? 'none' : `0 0 8px ${isCritical ? '#e05a4e' : '#4caf7d'}`
                                        }} />
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: badgeColor }}>
                                            {isOffline ? 'Offline' : sensor.status}
                                        </span>
                                    </div>
                                    {sensor.irrigating && (
                                        <span className="font-mono-data" style={{ fontSize: '9px', color: '#4caf7d', letterSpacing: '0.05em' }}>
                                            ⚡ WATER FLOWING
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Main Reading & Details */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                                <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                                    <MoistureGauge value={sensor.moisture} size={90} />
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        textAlign: 'center'
                                    }}>
                                        <span style={{ fontSize: '24px', fontWeight: 800, color: '#f5efe6', lineHeight: 1 }} className="font-display">
                                            {sensor.moisture.toFixed(0)}%
                                        </span>
                                        <div style={{ fontSize: '8px', color: '#8aab90', marginTop: '2px', letterSpacing: '0.05em' }}>VWC</div>
                                    </div>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(245,239,230,0.04)', paddingBottom: '4px' }}>
                                        <span style={{ fontSize: '12px', color: '#8aab90' }}>Soil Temp</span>
                                        <span className="font-mono-data" style={{ fontSize: '13px', color: '#f5efe6' }}>{sensor.temp.toFixed(1)}°C</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(245,239,230,0.04)', paddingBottom: '4px' }}>
                                        <span style={{ fontSize: '12px', color: '#8aab90' }}>RSSI Signal</span>
                                        <span className="font-mono-data" style={{ fontSize: '13px', color: '#f5efe6' }}>-{100 - sensor.signalStrength} dBm ({sensor.signalStrength}%)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(245,239,230,0.04)', paddingBottom: '4px' }}>
                                        <span style={{ fontSize: '12px', color: '#8aab90' }}>Node Battery</span>
                                        <span className="font-mono-data" style={{ fontSize: '13px', color: sensor.battery < 20 ? '#e8a042' : '#f5efe6' }}>{sensor.battery}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Solenoid Controls Panel */}
                            <div style={{
                                background: 'rgba(15, 35, 24, 0.5)',
                                border: '1px solid rgba(245, 239, 230, 0.06)',
                                borderRadius: '8px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f5efe6' }}>Irrigation Logic</div>
                                        <div style={{ fontSize: '11px', color: '#8aab90' }}>Automatic triggers vs manual override</div>
                                    </div>
                                    <div style={{ display: 'flex', background: 'rgba(245,239,230,0.05)', borderRadius: '6px', padding: '2px' }}>
                                        <button
                                            onClick={() => !isOffline && SimulationController.setSensorMode(dispatch, sensor.id, 'auto')}
                                            disabled={isOffline}
                                            style={{
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                border: 'none',
                                                borderRadius: '4px',
                                                background: sensor.mode === 'auto' ? '#4caf7d' : 'transparent',
                                                color: sensor.mode === 'auto' ? '#0f2318' : '#8aab90',
                                                cursor: isOffline ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            AUTO
                                        </button>
                                        <button
                                            onClick={() => !isOffline && SimulationController.setSensorMode(dispatch, sensor.id, 'manual')}
                                            disabled={isOffline}
                                            style={{
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                border: 'none',
                                                borderRadius: '4px',
                                                background: sensor.mode === 'manual' ? '#e8a042' : 'transparent',
                                                color: sensor.mode === 'manual' ? '#0f2318' : '#8aab90',
                                                cursor: isOffline ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            MANUAL
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(245,239,230,0.06)', paddingTop: '10px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f5efe6' }}>Solenoid Valve Tag</div>
                                        <div style={{ fontSize: '11px', color: '#8aab90' }}>
                                            {sensor.irrigating ? 'State: 90° (Fully Open)' : 'State: 0° (Fully Closed)'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => !isOffline && SimulationController.toggleValve(dispatch, sensor.id)}
                                        disabled={isOffline || sensor.mode === 'auto'}
                                        style={{
                                            padding: '8px 16px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: sensor.irrigating ? '#e05a4e' : '#4caf7d',
                                            color: '#0f2318',
                                            cursor: (isOffline || sensor.mode === 'auto') ? 'not-allowed' : 'pointer',
                                            opacity: sensor.mode === 'auto' ? 0.5 : 1,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {sensor.irrigating ? 'CLOSE VALVE' : 'OPEN VALVE'}
                                    </button>
                                </div>
                            </div>

                            {/* Threshold indicator parameters */}
                            <div style={{ marginTop: '14px', fontSize: '11px', color: '#8aab90', textAlign: 'center' }}>
                                Auto bounds: <span style={{ color: '#d0c9b8' }}>&lt; {sensor.minMoisture}% VWC</span> (trigger) to <span style={{ color: '#4caf7d' }} className="font-mono-data">&gt; {sensor.maxMoisture}% VWC</span> (cut-off)
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
