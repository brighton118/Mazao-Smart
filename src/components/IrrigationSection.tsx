import { useSimulation } from '../context/SimulationContext'

export default function IrrigationSection() {
  const { state, dispatch } = useSimulation()
  const { sensors } = state

  const activePumps = sensors.filter(s => s.irrigating).length
  const waterRate = activePumps * 18

  return (
    <section id="irrigation" style={{ padding: '80px 0', maxWidth: 1200, margin: '0 auto', paddingLeft: 24, paddingRight: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 24, height: 1, background: '#e8a042' }} />
            <span className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#e8a042', textTransform: 'uppercase' }}>
              Automated Control — Live
            </span>
          </div>
          <h2 className="font-display" style={{ fontSize: 'clamp(36px,4vw,52px)', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', lineHeight: 1 }}>
            Irrigation<br />Controls
          </h2>
        </div>

        <div style={{ background: '#162e1e', border: '1px solid rgba(245,239,230,0.08)', borderRadius: 10, padding: '16px 24px', display: 'flex', gap: 32 }}>
          <div>
            <div style={{ fontSize: 10, color: '#8aab90', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Active Valves</div>
            <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: '#4caf7d', transition: 'all 0.4s' }}>{activePumps}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#8aab90', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Flow Rate</div>
            <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: '#f5efe6', transition: 'all 0.4s' }}>{waterRate} L/h</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
        {sensors.map(s => (
          <div
            key={s.id}
            style={{
              background: '#162e1e',
              border: `1px solid ${s.irrigating ? 'rgba(76,175,125,0.35)' : s.status === 'critical' ? 'rgba(224,90,78,0.25)' : 'rgba(245,239,230,0.08)'}`,
              borderRadius: 12,
              padding: '22px 24px',
              opacity: s.online ? 1 : 0.55,
              transition: 'border-color 0.3s, opacity 0.3s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, color: '#f5efe6', fontWeight: 500 }}>{s.plot}</div>
                <div style={{ fontSize: 11, color: '#8aab90', marginTop: 2 }}>{s.crop} · Threshold {s.minMoisture}%</div>
              </div>
              <div style={{ display: 'flex', gap: 1, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(245,239,230,0.1)' }}>
                {(['auto', 'manual'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => dispatch({ type: 'SET_MODE', id: s.id, mode: m })}
                    disabled={!s.online}
                    style={{
                      padding: '5px 12px',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: s.online ? 'pointer' : 'not-allowed',
                      background: s.mode === m ? '#2a4a35' : 'transparent',
                      color: s.mode === m ? '#4caf7d' : '#8aab90',
                      transition: 'background 0.15s, color 0.15s',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Live moisture bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#8aab90' }}>Soil Moisture</span>
                <span className="font-mono-data" style={{ fontSize: 12, color: s.moisture < 30 ? '#e05a4e' : s.moisture < s.minMoisture ? '#e8a042' : '#4caf7d', transition: 'color 0.5s' }}>
                  {s.online ? `${s.moisture.toFixed(1)}%` : 'OFFLINE'}
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(245,239,230,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${s.online ? s.moisture : 0}%`,
                    background: s.moisture < 30 ? '#e05a4e' : s.moisture < s.minMoisture ? '#e8a042' : '#4caf7d',
                    borderRadius: 3,
                    transition: 'width 0.8s ease, background 0.5s ease',
                  }}
                />
              </div>
              {/* Threshold marker */}
              <div style={{ position: 'relative', height: 0 }}>
                <div style={{ position: 'absolute', left: `${s.minMoisture}%`, top: -6, width: 1, height: 10, background: 'rgba(245,239,230,0.3)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: s.irrigating ? '#4caf7d' : '#2a4a35',
                  border: '2px solid',
                  borderColor: s.irrigating ? '#4caf7d' : 'rgba(245,239,230,0.15)',
                  boxShadow: s.irrigating ? '0 0 8px rgba(76,175,125,0.5)' : 'none',
                  transition: 'all 0.3s',
                }} />
                <span className="font-mono-data" style={{ fontSize: 12, color: s.irrigating ? '#4caf7d' : '#8aab90' }}>
                  {s.online ? (s.irrigating ? 'IRRIGATING' : 'STANDBY') : 'OFFLINE'}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#8aab90' }}>
                {s.mode === 'auto' ? `Auto · target ${s.maxMoisture}%` : 'Manual control'}
              </span>
            </div>

            <button
              onClick={() => dispatch({ type: 'TOGGLE_VALVE', id: s.id })}
              disabled={!s.online}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                border: `1px solid ${s.irrigating ? 'rgba(224,90,78,0.3)' : 'rgba(76,175,125,0.3)'}`,
                cursor: s.online ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: s.irrigating ? 'rgba(224,90,78,0.12)' : 'rgba(76,175,125,0.12)',
                color: s.irrigating ? '#e05a4e' : '#4caf7d',
                transition: 'background 0.25s, color 0.25s, border-color 0.25s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'DM Sans, sans-serif',
                opacity: s.online ? 1 : 0.4,
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                {s.irrigating
                  ? <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                  : <polygon points="5,3 19,12 5,21" fill="currentColor" />}
              </svg>
              {s.irrigating ? 'Stop Irrigation' : 'Start Irrigation'}
            </button>

            {/* Toggle sensor online */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_ONLINE', id: s.id })}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '7px',
                borderRadius: 6,
                border: '1px solid rgba(245,239,230,0.08)',
                cursor: 'pointer',
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'transparent',
                color: '#8aab90',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {s.online ? 'Simulate Sensor Offline' : 'Reconnect Sensor'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: '16px 20px', background: 'rgba(232,160,66,0.07)', border: '1px solid rgba(232,160,66,0.2)', borderRadius: 8, fontSize: 13, color: '#c8c0b0', lineHeight: 1.6, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ color: '#e8a042', fontSize: 16, flexShrink: 0 }}>ℹ</span>
        <span>
          <strong style={{ color: '#f5efe6' }}>Auto mode</strong> activates irrigation when moisture drops below the threshold and stops when the target moisture is reached. Soil moisture readings update live — you can see the response in real time. The <strong style={{ color: '#f5efe6' }}>Simulate Sensor Offline</strong> button mimics a sensor losing its LoRa signal.
        </span>
      </div>
    </section>
  )
}
