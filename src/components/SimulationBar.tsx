import { useSimulation } from '../context/SimulationContext'

export default function SimulationBar() {
  const { state, dispatch } = useSimulation()
  const { speed, tick, paused } = state

  const exportLogsToCSV = () => {
    const headers = ['Time', 'Type', 'Event', 'Sensor ID']
    const rows = state.log.map(entry => {
      const timeStr = entry.timestamp instanceof Date
        ? entry.timestamp.toISOString()
        : new Date(entry.timestamp).toISOString()
      return [
        timeStr,
        entry.type.toUpperCase(),
        `"${entry.message.replace(/"/g, '""')}"`,
        entry.sensorId || ''
      ]
    })
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `mazaosmart_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(12,30,19,0.96)',
      borderTop: '1px solid rgba(76,175,125,0.2)',
      backdropFilter: 'blur(12px)',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      flexWrap: 'wrap',
    }}>
      {/* Simulation label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf7d', boxShadow: '0 0 6px #4caf7d' }} />
        <span className="font-mono-data" style={{ fontSize: 10, color: '#4caf7d', letterSpacing: '0.15em' }}>
          PROTOTYPE SIMULATION · TICK #{tick}
        </span>
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(245,239,230,0.1)' }} />

      {/* Play/Pause Button */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
        style={{
          padding: '4px 12px',
          borderRadius: 5,
          border: `1px solid ${paused ? 'rgba(232,160,66,0.5)' : 'rgba(76,175,125,0.5)'}`,
          background: paused ? 'rgba(232,160,66,0.15)' : 'rgba(76,175,125,0.15)',
          color: paused ? '#e8a042' : '#4caf7d',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 9 }}>{paused ? '▶' : '⏸'}</span>
        {paused ? 'Resume clock' : 'Pause clock'}
      </button>

      <div style={{ width: 1, height: 28, background: 'rgba(245,239,230,0.1)' }} />

      {/* Speed control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#8aab90' }}>Speed:</span>
        {[1, 3, 10].map(s => (
          <button
            key={s}
            onClick={() => dispatch({ type: 'SET_SPEED', speed: s })}
            style={{
              padding: '4px 12px',
              borderRadius: 5,
              border: `1px solid ${speed === s ? 'rgba(76,175,125,0.6)' : 'rgba(245,239,230,0.12)'}`,
              background: speed === s ? 'rgba(76,175,125,0.2)' : 'transparent',
              color: speed === s ? '#4caf7d' : '#8aab90',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'DM Mono, monospace',
              transition: 'all 0.2s',
            }}
          >
            {s}×
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(245,239,230,0.1)' }} />

      {/* Scenario & Log controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#8aab90' }}>Scenarios:</span>
        <button
          onClick={() => dispatch({ type: 'SCENARIO_DROUGHT' })}
          style={{
            padding: '4px 12px',
            borderRadius: 5,
            border: '1px solid rgba(224,90,78,0.4)',
            background: 'rgba(224,90,78,0.1)',
            color: '#e05a4e',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          🌵 Drought
        </button>
        <button
          onClick={() => dispatch({ type: 'SCENARIO_RAIN' })}
          style={{
            padding: '4px 12px',
            borderRadius: 5,
            border: '1px solid rgba(76,175,125,0.4)',
            background: 'rgba(76,175,125,0.1)',
            color: '#4caf7d',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          🌧 Rainfall
        </button>
        <div style={{ width: 1, height: 16, background: 'rgba(245,239,230,0.1)' }} />
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          style={{
            padding: '4px 12px',
            borderRadius: 5,
            border: '1px solid rgba(245,239,230,0.15)',
            background: 'transparent',
            color: '#8aab90',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          ↺ Reset
        </button>
        <button
          onClick={() => dispatch({ type: 'CLEAR_LOG' })}
          style={{
            padding: '4px 12px',
            borderRadius: 5,
            border: '1px solid rgba(224,90,78,0.2)',
            background: 'transparent',
            color: '#e05a4e',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          🗑 Clear Logs
        </button>
        <button
          onClick={exportLogsToCSV}
          style={{
            padding: '4px 12px',
            borderRadius: 5,
            border: '1px solid rgba(76,175,125,0.2)',
            background: 'transparent',
            color: '#4caf7d',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Water stats */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
        <div>
          <span style={{ fontSize: 9, color: '#8aab90', letterSpacing: '0.1em', textTransform: 'uppercase' }}>System Used </span>
          <span className="font-mono-data" style={{ fontSize: 12, color: '#4caf7d' }}>{state.totalWaterUsed.toFixed(0)} L</span>
        </div>
        <div>
          <span style={{ fontSize: 9, color: '#8aab90', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Manual Est. </span>
          <span className="font-mono-data" style={{ fontSize: 12, color: '#e8a042' }}>{state.manualWaterEstimate.toFixed(0)} L</span>
        </div>
      </div>
    </div>
  )
}
