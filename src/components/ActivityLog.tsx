import { useSimulation } from '../context/SimulationContext'

const typeStyle = {
  alert:  { color: '#e05a4e', bg: 'rgba(224,90,78,0.1)',  icon: '⚠' },
  info:   { color: '#8aab90', bg: 'rgba(138,171,144,0.08)', icon: 'ℹ' },
  action: { color: '#4caf7d', bg: 'rgba(76,175,125,0.1)',  icon: '▶' },
  system: { color: '#e8a042', bg: 'rgba(232,160,66,0.08)', icon: '◈' },
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ActivityLog() {
  const { state } = useSimulation()
  const { log, tick } = state

  return (
    <section style={{ background: '#0c1e13', padding: '80px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 24, height: 1, background: '#e8a042' }} />
              <span className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#e8a042', textTransform: 'uppercase' }}>
                System Activity
              </span>
            </div>
            <h2 className="font-display" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', lineHeight: 1 }}>
              Event Log
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf7d' }} />
              <span className="font-mono-data" style={{ fontSize: 11, color: '#4caf7d' }}>LIVE · TICK #{tick}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#0f2318',
            border: '1px solid rgba(245,239,230,0.08)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Log header */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 60px 1fr 80px', gap: 0, padding: '10px 20px', borderBottom: '1px solid rgba(245,239,230,0.08)', background: '#162e1e' }}>
            {['TIME', 'TYPE', 'EVENT', 'SENSOR'].map(h => (
              <div key={h} className="font-mono-data" style={{ fontSize: 9, color: '#8aab90', letterSpacing: '0.15em' }}>{h}</div>
            ))}
          </div>

          {/* Log entries */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {log.slice(0, 40).map((entry, i) => {
              const t = typeStyle[entry.type]
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 60px 1fr 80px',
                    gap: 0,
                    padding: '10px 20px',
                    borderBottom: '1px solid rgba(245,239,230,0.04)',
                    background: i === 0 ? 'rgba(76,175,125,0.04)' : 'transparent',
                    transition: 'background 0.3s',
                    alignItems: 'center',
                  }}
                >
                  <span className="font-mono-data" style={{ fontSize: 11, color: '#8aab90' }}>
                    {formatTime(entry.timestamp)}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: t.color,
                      background: t.bg,
                      padding: '2px 6px',
                      borderRadius: 3,
                      letterSpacing: '0.08em',
                      width: 'fit-content',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {t.icon} {entry.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: '#c8c0b0', lineHeight: 1.4 }}>{entry.message}</span>
                  <span className="font-mono-data" style={{ fontSize: 11, color: '#4caf7d' }}>
                    {entry.sensorId ?? '—'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(245,239,230,0.06)', background: '#162e1e', display: 'flex', justifyContent: 'space-between' }}>
            <span className="font-mono-data" style={{ fontSize: 10, color: '#8aab90' }}>{log.length} events recorded this session</span>
            <span className="font-mono-data" style={{ fontSize: 10, color: '#8aab90' }}>BASE STATION: MBARARA-BS-01</span>
          </div>
        </div>
      </div>
    </section>
  )
}
