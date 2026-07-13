import { useState } from 'react'
import MoistureGauge from './MoistureGauge'
import Sparkline from './Sparkline'
import { useSimulation } from '../context/SimulationContext'

const statusConfig = {
  optimal: { label: 'Optimal', color: '#4caf7d', bg: 'rgba(76,175,125,0.12)' },
  low: { label: 'Low', color: '#e8a042', bg: 'rgba(232,160,66,0.12)' },
  critical: { label: 'Critical', color: '#e05a4e', bg: 'rgba(224,90,78,0.12)' },
  offline: { label: 'Offline', color: '#8aab90', bg: 'rgba(138,171,144,0.1)' },
}

function gaugeColor(v: number): string {
  if (v < 30) return '#e05a4e'
  if (v < 50) return '#e8a042'
  return '#4caf7d'
}

export default function DashboardSection() {
  const { state, dispatch } = useSimulation()
  const { sensors, totalWaterUsed, manualWaterEstimate, lastSyncAt } = state
  const [selected, setSelected] = useState<string | null>(null)

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addId, setAddId] = useState('')
  const [addPlot, setAddPlot] = useState('')
  const [addCrop, setAddCrop] = useState('Maize')
  const [addDepth, setAddDepth] = useState('40cm')
  const [addArea, setAddArea] = useState('1.5 ha')
  const [addThreshold, setAddThreshold] = useState(40)
  const [addTargetMoisture, setAddTargetMoisture] = useState(65)

  // Edit modal state
  const [editingNode, setEditingNode] = useState<any | null>(null)
  const [editPlot, setEditPlot] = useState('')
  const [editCrop, setEditCrop] = useState('')
  const [editDepth, setEditDepth] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editThreshold, setEditThreshold] = useState(40)
  const [editTargetMoisture, setEditTargetMoisture] = useState(65)
  const [editMoisture, setEditMoisture] = useState(55)
  const [editBattery, setEditBattery] = useState(100)
  const [editOnline, setEditOnline] = useState(true)

  const openAddModal = () => {
    let index = sensors.length + 1
    let suggestion = `S${index}`
    while (sensors.some(s => s.id === suggestion)) {
      index++
      suggestion = `S${index}`
    }
    setAddId(suggestion)
    setAddPlot(`Plot ${suggestion}`)
    setAddCrop('Maize')
    setAddDepth('40cm')
    setAddArea('1.5 ha')
    setAddThreshold(40)
    setAddTargetMoisture(65)
    setShowAddModal(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addId.trim() || !addPlot.trim()) return

    if (sensors.some(s => s.id.toLowerCase() === addId.trim().toLowerCase())) {
      alert(`Sensor ID "${addId}" already exists. Please use a unique ID.`)
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
        minMoisture: Number(addThreshold),
        maxMoisture: Number(addTargetMoisture),
      }
    })
    setShowAddModal(false)
  }

  const startEditing = (node: any) => {
    setEditingNode(node)
    setEditPlot(node.plot)
    setEditCrop(node.crop)
    setEditDepth(node.depth)
    setEditArea(node.area)
    setEditThreshold(node.minMoisture)
    setEditTargetMoisture(node.maxMoisture)
    setEditMoisture(node.moisture)
    setEditBattery(node.battery)
    setEditOnline(node.online)
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
        minMoisture: Number(editThreshold),
        maxMoisture: Number(editTargetMoisture),
        moisture: Number(editMoisture),
        battery: Number(editBattery),
        online: editOnline,
      }
    })
    setEditingNode(null)
  }

  const alerts = sensors.filter(s => s.status === 'critical' || s.status === 'offline')
  const avgMoisture = sensors.filter(s => s.online).reduce((a, s) => a + s.moisture, 0) / sensors.filter(s => s.online).length
  const irrigating = sensors.filter(s => s.irrigating).length
  const saved = Math.max(0, manualWaterEstimate - totalWaterUsed)

  return (
    <section id="dashboard" style={{ padding: '100px 0 80px', maxWidth: 1200, margin: '0 auto', paddingLeft: 24, paddingRight: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 24, height: 1, background: '#e8a042' }} />
            <span className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#e8a042', textTransform: 'uppercase' }}>
              Real-time Sensor Network
            </span>
          </div>
          <h2 className="font-display" style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, color: '#f5efe6', letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1 }}>
            Field Dashboard
          </h2>
          <div style={{ fontSize: 11, color: '#8aab90', marginTop: 8 }} className="font-mono-data">
            Last sync: {lastSyncAt instanceof Date && !isNaN(lastSyncAt.getTime()) ? lastSyncAt.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'} EAT
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {alerts.length > 0 && (
            <div style={{ background: 'rgba(224,90,78,0.1)', border: '1px solid rgba(224,90,78,0.3)', borderRadius: 8, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e05a4e' }} />
              <span style={{ fontSize: 13, color: '#e05a4e', fontWeight: 500 }}>{alerts.length} plot{alerts.length > 1 ? 's' : ''} need attention</span>
            </div>
          )}

          <button
            onClick={openAddModal}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: '1px solid rgba(76,175,125,0.4)',
              background: 'rgba(76,175,125,0.12)',
              color: '#4caf7d',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 0 }}>+</span> Add Sensor Node
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, background: 'rgba(245,239,230,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 40, border: '1px solid rgba(245,239,230,0.08)' }}>
        {[
          { label: 'Active Sensors', val: `${sensors.filter(s => s.online).length} / ${sensors.length}`, sub: sensors.every(s => s.online) ? 'all online' : 'some offline' },
          { label: 'Avg Moisture', val: `${avgMoisture.toFixed(1)}%`, sub: 'live reading' },
          { label: 'Irrigating Now', val: `${irrigating} plot${irrigating !== 1 ? 's' : ''}`, sub: 'valves open' },
          { label: 'Water Saved', val: `${saved.toFixed(0)} L`, sub: `vs ${manualWaterEstimate.toFixed(0)} L manual est.` },
        ].map(({ label, val, sub }) => (
          <div key={label} style={{ padding: '20px 24px', background: '#162e1e' }}>
            <div style={{ fontSize: 11, color: '#8aab90', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
            <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: '#f5efe6', letterSpacing: '-0.01em', transition: 'all 0.5s' }}>{val}</div>
            <div style={{ fontSize: 11, color: '#4caf7d', marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Sensor cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
        {sensors.map(s => {
          const cfg = statusConfig[s.status] || statusConfig.offline
          const isSelected = selected === s.id
          const color = gaugeColor(s.moisture)

          return (
            <div
              key={s.id}
              id={`sensor-card-${s.id}`}
              data-selected={isSelected}
              onClick={() => setSelected(isSelected ? null : s.id)}
              style={{
                background: s.online ? '#162e1e' : 'rgba(22,46,30,0.5)',
                border: `1px solid ${isSelected ? 'rgba(76,175,125,0.5)' : s.status === 'critical' ? 'rgba(224,90,78,0.3)' : 'rgba(245,239,230,0.08)'}`,
                borderRadius: 12,
                padding: '24px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.15s, opacity 0.3s',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                opacity: s.online ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#f5efe6', fontWeight: 500, marginBottom: 3 }}>{s.plot} — {s.crop}</div>
                  <div style={{ fontSize: 11, color: '#8aab90' }}>{s.area} · {s.depth}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, padding: '3px 8px', borderRadius: 4 }}>
                    {cfg.label}
                  </span>
                  {s.irrigating && (
                    <span style={{ fontSize: 9, color: '#4caf7d', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4caf7d', display: 'inline-block' }} />
                      IRRIGATING
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <MoistureGauge value={s.moisture} size={88} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <div className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#f5efe6', lineHeight: 1, transition: 'all 0.5s' }}>
                      {s.moisture.toFixed(0)}<span style={{ fontSize: 13, fontWeight: 400 }}>%</span>
                    </div>
                    <div style={{ fontSize: 9, color: '#8aab90', marginTop: 2, letterSpacing: '0.08em' }}>MOISTURE</div>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  {[
                    { label: 'Temp', val: `${s.temp.toFixed(1)}°C` },
                    { label: 'Battery', val: `${s.battery.toFixed(0)}%`, warn: s.battery < 20 },
                    { label: 'Signal', val: `${s.signalStrength}%`, warn: s.signalStrength < 40 },
                    { label: 'Mode', val: s.mode.toUpperCase() },
                  ].map(({ label, val, warn }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <span style={{ fontSize: 11, color: '#8aab90' }}>{label}</span>
                      <span className="font-mono-data" style={{ fontSize: 12, color: warn ? '#e8a042' : '#d0c9b8', transition: 'color 0.3s' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ borderTop: '1px solid rgba(245,239,230,0.06)', paddingTop: 12 }}>
                <div style={{ fontSize: 9, color: '#8aab90', letterSpacing: '0.1em', marginBottom: 6 }}>MOISTURE TREND (24 readings)</div>
                <Sparkline data={s.history} width={260} height={28} color={color} />
              </div>

              {/* Expanded recommendation */}
              {isSelected && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(245,239,230,0.08)' }}>
                  <div style={{ fontSize: 11, color: '#8aab90', marginBottom: 8, letterSpacing: '0.08em' }}>SYSTEM RECOMMENDATION</div>
                  <p style={{ fontSize: 13, color: '#c8c0b0', lineHeight: 1.65, marginBottom: 12 }}>
                    {s.moisture < 30
                      ? `⚠️ Critical. ${s.irrigating ? 'Auto-irrigation active.' : 'Activate irrigation immediately.'} Apply ~${Math.round((s.maxMoisture - s.moisture) * 4)} L over 45 min.`
                      : s.moisture < s.minMoisture
                        ? `ℹ️ Below target. ${s.irrigating ? 'Auto-irrigation running.' : `Schedule irrigation soon.`} Estimated need: ~${Math.round((s.maxMoisture - s.moisture) * 2.5)} L.`
                        : s.moisture > s.maxMoisture
                          ? `✅ Above target moisture. No irrigation needed. Next check in 6 h.`
                          : `✅ Moisture within optimal range. System monitoring normally.`}
                  </p>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(s)
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid rgba(245,239,230,0.15)',
                        background: 'rgba(245,239,230,0.03)',
                        color: '#f5efe6',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                    >
                      ⚙️ Configure Node
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Are you sure you want to remove sensor node ${s.id} from the network?`)) {
                          dispatch({ type: 'REMOVE_NODE', id: s.id })
                          setSelected(null)
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid rgba(220,90,78,0.3)',
                        background: 'rgba(220,90,78,0.1)',
                        color: '#e05a4e',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                    >
                      🗑 Remove
                    </button>
                  </div>
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
            padding: 32,
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
                    placeholder="e.g. 1.5 ha"
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
                  <label style={{ fontSize: 10, color: '#8aab90', display: 'block', marginBottom: 6 }}>THRESHOLD (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    required
                    value={addThreshold}
                    onChange={e => setAddThreshold(Number(e.target.value))}
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
                  <label style={{ fontSize: 10, color: '#8aab90', display: 'block', marginBottom: 6 }}>TARGET (%)</label>
                  <input
                    type="number"
                    min="20"
                    max="95"
                    required
                    value={addTargetMoisture}
                    onChange={e => setAddTargetMoisture(Number(e.target.value))}
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
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: '1px solid rgba(245,239,230,0.15)',
                    background: 'transparent',
                    color: '#8aab90',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: '1px solid rgba(76,175,125,0.4)',
                    background: 'rgba(76,175,125,0.2)',
                    color: '#4caf7d',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Sensor Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sensor Modal */}
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
            padding: 32,
            maxWidth: 520,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#f5efe6', marginBottom: 20, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e8a042' }} />
              Configure Node {editingNode.id}
            </h3>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                    }}
                  />
                </div>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>THRESHOLD (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    required
                    value={editThreshold}
                    onChange={e => setEditThreshold(Number(e.target.value))}
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
                  <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>TARGET (%)</label>
                  <input
                    type="number"
                    min="20"
                    max="95"
                    required
                    value={editTargetMoisture}
                    onChange={e => setEditTargetMoisture(Number(e.target.value))}
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

              {/* Simulation Sandbox controls */}
              <div style={{
                background: 'rgba(245,239,230,0.02)',
                border: '1px solid rgba(245,239,230,0.06)',
                borderRadius: 8,
                padding: 16,
                marginTop: 4,
              }}>
                <div style={{ fontSize: 10, color: '#e8a042', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 12 }}>
                  SIMULATION DEBUG SANDBOX
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>MOISTURE: {editMoisture}%</label>
                    <input
                      type="range"
                      min="5"
                      max="98"
                      value={editMoisture}
                      onChange={e => setEditMoisture(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#4caf7d' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#8aab90', display: 'block', marginBottom: 6 }}>BATTERY: {editBattery}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editBattery}
                      onChange={e => setEditBattery(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#e8a042' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="editOnline"
                    checked={editOnline}
                    onChange={e => setEditOnline(e.target.checked)}
                    style={{ accentColor: '#4caf7d', width: 15, height: 15, cursor: 'pointer' }}
                  />
                  <label htmlFor="editOnline" style={{ fontSize: 13, color: '#c8c0b0', cursor: 'pointer' }}>
                    Sensor Node Online / Transmitting via LoRa
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: '1px solid rgba(245,239,230,0.15)',
                    background: 'transparent',
                    color: '#8aab90',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: '1px solid rgba(232,160,66,0.4)',
                    background: 'rgba(232,160,66,0.2)',
                    color: '#e8a042',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Apply Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
