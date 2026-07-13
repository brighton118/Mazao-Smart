import { useState } from 'react'
import { useSimulation } from '../context/SimulationContext'
import SmartFarm3D from './SmartFarm3D'

const PLOT_LAYOUT = [
  { id: 'A1', col: 2, row: 1, span: 2 },
  { id: 'A2', col: 4, row: 1, span: 2 },
  { id: 'B1', col: 1, row: 2, span: 2 },
  { id: 'B4', col: 3, row: 2, span: 2 },
  { id: 'C1', col: 1, row: 3, span: 3 },
  { id: 'C2', col: 4, row: 3, span: 2 },
]

const statusColor = {
  optimal: { fill: 'rgba(76,175,125,0.18)', border: 'rgba(76,175,125,0.6)', text: '#4caf7d' },
  low: { fill: 'rgba(232,160,66,0.18)', border: 'rgba(232,160,66,0.6)', text: '#e8a042' },
  critical: { fill: 'rgba(224,90,78,0.22)', border: 'rgba(224,90,78,0.7)', text: '#e05a4e' },
  offline: { fill: 'rgba(138,171,144,0.08)', border: 'rgba(138,171,144,0.3)', text: '#8aab90' },
}

const CELL_W = 90
const CELL_H = 90
const GAP = 6

export default function FieldMapSection() {
  const { state } = useSimulation()
  const { sensors } = state
  const [hovered, setHovered] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d')

  const sensorMap = Object.fromEntries(sensors.map(s => [s.id, s]))

  // Dynamically map layout cells for added sensors
  const layout = [...PLOT_LAYOUT]
  const extraSensors = sensors.filter(s => !PLOT_LAYOUT.some(p => p.id === s.id))

  let nextRow = 4
  let nextCol = 1

  extraSensors.forEach(s => {
    if (!layout.some(l => l.row === 1 && l.col === 1)) {
      layout.push({ id: s.id, col: 1, row: 1, span: 1 })
    } else if (!layout.some(l => l.row === 2 && l.col === 5)) {
      layout.push({ id: s.id, col: 5, row: 2, span: 1 })
    } else {
      layout.push({ id: s.id, col: nextCol, row: nextRow, span: 2 })
      nextCol += 2
      if (nextCol > 4) {
        nextCol = 1
        nextRow += 1
      }
    }
  })

  const maxRow = Math.max(3, ...layout.map(l => l.row))

  return (
    <section id="field-map" style={{ background: '#0c1e13', padding: '80px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

          {/* Left: info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 24, height: 1, background: '#e8a042' }} />
              <span className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#e8a042', textTransform: 'uppercase' }}>
                Spatial Overview · Live
              </span>
            </div>
            <h2 className="font-display" style={{ fontSize: 'clamp(36px,4vw,52px)', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', lineHeight: 1, marginBottom: 20 }}>
              YOUR<br />FIELD MAP
            </h2>
            <p style={{ fontSize: 15, color: '#c8c0b0', lineHeight: 1.7, marginBottom: 32 }}>
              Each plot shows live soil moisture from buried sensors. Color and shading update in real time as
              sensors transmit via LoRa radio. Tap any plot for details and direct irrigation control.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {[
                { label: 'Optimal (50–80%)', color: '#4caf7d' },
                { label: 'Low moisture (30–50%)', color: '#e8a042' },
                { label: 'Critical — irrigate now (<30%)', color: '#e05a4e' },
                { label: 'Sensor offline', color: '#8aab90' },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: color, opacity: 0.8 }} />
                  <span style={{ fontSize: 13, color: '#c8c0b0' }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#162e1e', border: '1px solid rgba(245,239,230,0.08)', borderRadius: 10, padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
              {[
                { label: 'Farm Owner', val: 'Amina Nabwire' },
                { label: 'Location', val: 'Mbarara, Uganda' },
                { label: 'Total Area', val: '2.5 hectares' },
                { label: 'Online Sensors', val: `${sensors.filter(s => s.online).length} / ${sensors.length}` },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: '#8aab90', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#f5efe6', fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: map */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              {/* Toggle Buttons */}
              <div style={{ display: 'flex', gap: 4, background: 'rgba(22,46,30,0.4)', padding: 3, borderRadius: 8, border: '1px solid rgba(76,175,125,0.15)' }}>
                <button
                  onClick={() => setViewMode('2d')}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 650,
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: 'none',
                    background: viewMode === '2d' ? 'rgba(76,175,125,0.2)' : 'transparent',
                    color: viewMode === '2d' ? '#4caf7d' : '#8aab90',
                    transition: 'all 0.2s',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                >
                  2D Grid Map
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 650,
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: 'none',
                    background: viewMode === '3d' ? 'rgba(76,175,125,0.2)' : 'transparent',
                    color: viewMode === '3d' ? '#4caf7d' : '#8aab90',
                    transition: 'all 0.2s',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                >
                  3D Farm Simulation
                </button>
              </div>

              {/* Compass marker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(245,239,230,0.2)" strokeWidth="1.5" />
                  <path d="M12 4l2 6H10L12 4z" fill="#e8a042" />
                  <path d="M12 20l-2-6h4L12 20z" fill="rgba(245,239,230,0.3)" />
                </svg>
                <span style={{ fontSize: 10, color: '#8aab90', letterSpacing: '0.1em' }}>N</span>
              </div>
            </div>

            {viewMode === '2d' ? (
              <div style={{ position: 'relative', background: 'rgba(22,46,30,0.6)', border: '1px solid rgba(76,175,125,0.15)', borderRadius: 12, padding: 20, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(76,175,125,0.03) 0px, transparent 2px, transparent 10px)', borderRadius: 12 }} />

                <div style={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: `repeat(5, ${CELL_W}px)`,
                  gridTemplateRows: `repeat(${maxRow}, ${CELL_H}px)`,
                  gap: GAP,
                  width: 'fit-content',
                  margin: '0 auto',
                }}>
                  {layout.map(p => {
                    const s = sensorMap[p.id]
                    if (!s) return null
                    const cfg = statusColor[s.status] || statusColor.offline
                    const isHov = hovered === p.id

                    return (
                      <div
                        key={p.id}
                        onMouseEnter={() => setHovered(p.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => {
                          const card = document.getElementById(`sensor-card-${p.id}`)
                          if (card) {
                            card.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            const isAlreadySelected = card.getAttribute('data-selected') === 'true'
                            if (!isAlreadySelected) {
                              setTimeout(() => {
                                const el = document.getElementById(`sensor-card-${p.id}`)
                                if (el) el.click()
                              }, 350)
                            }
                          }
                        }}
                        style={{
                          gridColumn: `${p.col} / span ${p.span}`,
                          gridRow: `${p.row} / span 1`,
                          background: isHov ? cfg.fill.replace('0.18', '0.32').replace('0.08', '0.15') : cfg.fill,
                          border: `1.5px solid ${cfg.border}`,
                          borderRadius: 8,
                          padding: 10,
                          cursor: 'pointer',
                          transition: 'background 0.3s, transform 0.15s',
                          transform: isHov ? 'scale(1.03)' : 'scale(1)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Moisture fill bar */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${s.moisture}%`, background: `${cfg.text}07`, transition: 'height 0.8s ease' }} />

                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 10, color: cfg.text, fontWeight: 700, letterSpacing: '0.08em' }}>{p.id}</div>
                            <div style={{ fontSize: 9, color: '#8aab90', marginTop: 1 }}>{s.crop}</div>
                          </div>
                          {s.irrigating && (
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf7d', boxShadow: '0 0 6px #4caf7d' }} />
                          )}
                        </div>

                        <div style={{ position: 'relative', textAlign: 'center' }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.text, margin: '0 auto 5px', boxShadow: `0 0 ${s.online ? '7px' : '2px'} ${cfg.text}` }} />
                          <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: '#f5efe6', lineHeight: 1, transition: 'all 0.5s' }}>
                            {s.online ? `${s.moisture.toFixed(0)}%` : '—'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Hover tooltip */}
                {hovered && (() => {
                  const s = sensorMap[hovered]
                  if (!s) return null
                  const cfg = statusColor[s.status]
                  return (
                    <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(15,35,24,0.95)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#c8c0b0', backdropFilter: 'blur(8px)', zIndex: 10 }}>
                      <div style={{ fontWeight: 600, color: '#f5efe6', marginBottom: 4 }}>{s.plot} — {s.crop}</div>
                      <div>Moisture: <span className="font-mono-data" style={{ color: cfg.text }}>{s.moisture.toFixed(1)}%</span></div>
                      <div>Temp: <span className="font-mono-data" style={{ color: '#d0c9b8' }}>{s.temp.toFixed(1)}°C</span></div>
                      <div>Status: <span style={{ color: cfg.text }}>{s.status}</span></div>
                      <div>Valve: <span style={{ color: s.irrigating ? '#4caf7d' : '#8aab90' }}>{s.irrigating ? 'OPEN' : 'CLOSED'}</span></div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <SmartFarm3D />
            )}

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: '#8aab90', letterSpacing: '0.1em' }}>
              LIVE · AUTO-SYNC EVERY TICK · LORA 868 MHz
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
