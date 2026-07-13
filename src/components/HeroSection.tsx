import { useSimulation } from '../context/SimulationContext'

export default function HeroSection() {
  const { state } = useSimulation()
  const { sensors, totalWaterUsed, manualWaterEstimate } = state
  const liveB4 = sensors.find(s => s.id === 'B4')
  const saved = Math.max(0, manualWaterEstimate - totalWaterUsed)
  const savePct = manualWaterEstimate > 0 ? Math.round((saved / manualWaterEstimate) * 100) : 31

  return (
    <section
      id="hero"
      style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: 60 }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1600&h=900&fit=crop&auto=format)', backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(15,35,24,0.97) 0%, rgba(15,35,24,0.85) 50%, rgba(15,35,24,0.70) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(76,175,125,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(76,175,125,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '80px 24px', width: '100%' }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 32, height: 1, background: '#e8a042' }} />
            <span className="font-mono-data" style={{ fontSize: 11, letterSpacing: '0.18em', color: '#e8a042', textTransform: 'uppercase' }}>
              Mbarara District, Uganda — Pilot Program 2025
            </span>
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(52px,9vw,96px)', fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.01em', color: '#f5efe6', marginBottom: 32, textTransform: 'uppercase' }}>
            EVERY DROP<br />
            <span style={{ color: '#4caf7d' }}>FEEDS</span><br />
            THE HARVEST
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.65, color: '#c8c0b0', maxWidth: 520, marginBottom: 48, fontWeight: 300 }}>
            Affordable IoT soil moisture sensors and automated irrigation — built for smallholder farmers in
            Sub-Saharan Africa. No specialist knowledge required. Water smarter, harvest more.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="#dashboard"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4caf7d', color: '#0a1c11', padding: '14px 28px', borderRadius: 6, fontWeight: 600, fontSize: 15, textDecoration: 'none', letterSpacing: '0.02em' }}
            >
              View Live Dashboard
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a
              href="#hardware"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(245,239,230,0.25)', color: '#f5efe6', padding: '14px 28px', borderRadius: 6, fontWeight: 500, fontSize: 15, textDecoration: 'none' }}
            >
              Hardware Kit
            </a>
          </div>

          <div style={{ display: 'flex', gap: 40, marginTop: 72, paddingTop: 32, borderTop: '1px solid rgba(245,239,230,0.1)', flexWrap: 'wrap' }}>
            {[
              { val: '<2.5%', label: 'of Uganda households use irrigation' },
              { val: '47 sensors', label: 'deployed across pilot farms' },
              { val: `${savePct}%`, label: 'water usage reduction (live simulation)' },
            ].map(({ val, label }) => (
              <div key={label}>
                <div className="font-display" style={{ fontSize: 34, fontWeight: 700, color: '#e8a042', letterSpacing: '-0.01em', transition: 'all 0.5s' }}>{val}</div>
                <div style={{ fontSize: 12, color: '#8aab90', marginTop: 4, maxWidth: 140, lineHeight: 1.4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating live sensor card */}
      {liveB4 && (
        <div
          style={{
            position: 'absolute',
            right: '5%',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(22,46,30,0.92)',
            border: `1px solid ${liveB4.status === 'critical' ? 'rgba(224,90,78,0.4)' : 'rgba(76,175,125,0.25)'}`,
            borderRadius: 12,
            padding: '20px 24px',
            backdropFilter: 'blur(16px)',
            minWidth: 200,
          }}
          className="hidden lg:block"
        >
          <div style={{ fontSize: 11, color: '#8aab90', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Live — {liveB4.plot}
          </div>
          {[
            { label: 'Soil Moisture', val: `${liveB4.moisture.toFixed(1)}%`, color: liveB4.moisture < 30 ? '#e05a4e' : liveB4.moisture < 50 ? '#e8a042' : '#4caf7d' },
            { label: 'Temp', val: `${liveB4.temp.toFixed(1)}°C`, color: '#e8a042' },
            { label: 'Irrigation', val: liveB4.irrigating ? 'ON' : 'STANDBY', color: liveB4.irrigating ? '#4caf7d' : '#8aab90' },
            { label: 'Battery', val: `${liveB4.battery.toFixed(0)}%`, color: liveB4.battery < 20 ? '#e05a4e' : '#8aab90' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(245,239,230,0.06)' }}>
              <span style={{ fontSize: 12, color: '#8aab90' }}>{label}</span>
              <span className="font-mono-data" style={{ fontSize: 13, color, fontWeight: 500, transition: 'color 0.5s' }}>{val}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf7d' }} />
            <span style={{ fontSize: 10, color: '#4caf7d', letterSpacing: '0.1em' }}>LIVE SIMULATION</span>
          </div>
        </div>
      )}
    </section>
  )
}
