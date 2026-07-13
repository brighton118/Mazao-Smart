import { useState } from 'react'
import { useSimulation } from '../context/SimulationContext'

const components = [
  {
    id: 'sensor',
    name: 'Soil Moisture Sensor',
    model: 'Capacitive v1.2 (custom)',
    cost: '4,200 UGX (~$1.12)',
    qty: '1 per plot',
    details: [
      'Capacitive measurement — no corrosion unlike resistive probes',
      'Operating voltage: 3.3 V (solar or AA battery)',
      'Output: 0–3.3 V analog (converted to 0–100% moisture)',
      'Depth: buried 20–45 cm depending on crop root zone',
      'IP67 waterproof enclosure',
      'Operating temp: 5–55 °C',
    ],
    color: '#4caf7d',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 48 48">
        <rect x="18" y="4" width="12" height="28" rx="6" stroke="#4caf7d" strokeWidth="2" fill="rgba(76,175,125,0.12)" />
        <path d="M24 32v12" stroke="#4caf7d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
        <circle cx="24" cy="20" r="4" fill="#4caf7d" />
        <path d="M14 16h4M30 16h4" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'mcu',
    name: 'Microcontroller Unit',
    model: 'ESP32 (Espressif)',
    cost: '18,000 UGX (~$4.80)',
    qty: '1 per sensor node',
    details: [
      'Dual-core 240 MHz processor, 520 KB SRAM',
      'Reads analog sensor every 15 minutes (sleep between readings)',
      'Packages data as LoRa payload (16 bytes)',
      'Deep-sleep current: 10 µA — critical for battery life',
      'Onboard RTC for accurate timestamps',
      'Programmed via USB in the field',
    ],
    color: '#e8a042',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 48 48">
        <rect x="10" y="10" width="28" height="28" rx="4" stroke="#e8a042" strokeWidth="2" fill="rgba(232,160,66,0.12)" />
        <rect x="16" y="16" width="16" height="16" rx="2" fill="#e8a042" fillOpacity="0.3" />
        <path d="M10 19h-4M10 29h-4M38 19h4M38 29h4M19 10v-4M29 10v-4M19 38v4M29 38v4" stroke="#e8a042" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'lora',
    name: 'LoRa Radio Module',
    model: 'SX1276 868 MHz',
    cost: '22,000 UGX (~$5.90)',
    qty: '1 per node + 1 at base',
    details: [
      '868 MHz ISM band — no license required in Uganda',
      'Range: up to 5 km line-of-sight, 1–2 km in field',
      'Spreading factor SF7–SF12 (range vs. battery tradeoff)',
      'TX power: 17 dBm (100 mW)',
      'Transmits 16-byte packet every 15 minutes',
      'AES-128 encrypted payload',
    ],
    color: '#a78bfa',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 48 48">
        <circle cx="24" cy="32" r="4" fill="#a78bfa" />
        <path d="M12 24c0-6.63 5.37-12 12-12s12 5.37 12 12" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M6 18c0-9.94 8.06-18 18-18s18 8.06 18 18" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        <path d="M17 28c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'solar',
    name: 'Solar Power Unit',
    model: '2W panel + 18650 Li-ion',
    cost: '14,000 UGX (~$3.75)',
    qty: '1 per sensor node',
    details: [
      '2W solar panel — enough to charge in 3–4 hours of sun',
      '18650 3.7 V 2500 mAh Li-ion cell',
      'TP4056 charge controller with protection circuit',
      'Expected battery life without sun: 10–14 days',
      'Output: 3.3 V regulated for ESP32 + sensor',
      'Fully outdoor-rated enclosure (ABS weatherproof box)',
    ],
    color: '#e8a042',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 48 48">
        <rect x="8" y="12" width="32" height="20" rx="3" stroke="#e8a042" strokeWidth="2" fill="rgba(232,160,66,0.12)" />
        <line x1="24" y1="12" x2="24" y2="32" stroke="#e8a042" strokeWidth="1" opacity="0.5" />
        <line x1="16" y1="12" x2="16" y2="32" stroke="#e8a042" strokeWidth="1" opacity="0.5" />
        <line x1="32" y1="12" x2="32" y2="32" stroke="#e8a042" strokeWidth="1" opacity="0.5" />
        <line x1="8" y1="22" x2="40" y2="22" stroke="#e8a042" strokeWidth="1" opacity="0.5" />
        <path d="M18 36h12M24 32v4" stroke="#e8a042" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'valve',
    name: 'Solenoid Valve + Driver',
    model: '12V DC, 1" BSP + MOSFET',
    cost: '28,000 UGX (~$7.50)',
    qty: '1 per irrigation zone',
    details: [
      '12V DC solenoid valve, normally-closed (fail-safe)',
      'Compatible with 1" drip irrigation mainline',
      'MOSFET driver circuit (IRF540N) — ESP32 controls via GPIO',
      'Flyback diode prevents MCU damage on valve close',
      'Power: 12V from separate sealed lead-acid battery',
      'Flow rate: up to 40 L/min at 2 bar',
    ],
    color: '#e05a4e',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 48 48">
        <path d="M8 24h32" stroke="#e05a4e" strokeWidth="4" strokeLinecap="round" />
        <circle cx="24" cy="24" r="8" stroke="#e05a4e" strokeWidth="2" fill="rgba(224,90,78,0.12)" />
        <path d="M24 16v-6M24 38v-6" stroke="#e05a4e" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="3" fill="#e05a4e" />
      </svg>
    ),
  },
  {
    id: 'base',
    name: 'Base Station',
    model: 'Raspberry Pi Zero 2W + LoRa hat',
    cost: '95,000 UGX (~$25.40)',
    qty: '1 per farm',
    details: [
      'Receives LoRa packets from all field nodes',
      'Runs lightweight Python gateway daemon',
      'Stores readings locally on microSD (offline-first)',
      'Wi-Fi / GSM optional for cloud sync',
      'LED indicator board: green/yellow/red status per plot',
      'Powered by 12V solar + battery system (shared with valves)',
    ],
    color: '#4caf7d',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 48 48">
        <rect x="6" y="14" width="36" height="24" rx="3" stroke="#4caf7d" strokeWidth="2" fill="rgba(76,175,125,0.12)" />
        <rect x="12" y="20" width="10" height="6" rx="1" stroke="#4caf7d" strokeWidth="1.5" fill="none" />
        <circle cx="32" cy="23" r="3" stroke="#4caf7d" strokeWidth="1.5" fill="none" />
        <path d="M16 32h16M24 38v-4" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 10l4-4 4 4" stroke="#4caf7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const totalCost = { ugx: '181,200', usd: '48.47' }

export default function HardwareSection() {
  const [active, setActive] = useState<string | null>('sensor')
  const { state } = useSimulation()
  const { sensors } = state

  const activeComp = components.find(c => c.id === active)

  return (
    <section id="hardware" style={{ background: '#0f2318', padding: '80px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 24, height: 1, background: '#e8a042' }} />
          <span className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#e8a042', textTransform: 'uppercase' }}>
            Bill of Materials
          </span>
        </div>
        <h2 className="font-display" style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', lineHeight: 1, marginBottom: 12 }}>
          Hardware Kit
        </h2>
        <p style={{ fontSize: 15, color: '#c8c0b0', maxWidth: 560, marginBottom: 48, lineHeight: 1.65 }}>
          Every component is off-the-shelf or locally sourceable. The full pilot kit for a 2.5 ha farm
          costs under $50 USD — designed for repairability and local manufacture.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 40, alignItems: 'start' }}>
          {/* Component list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {components.map(c => (
              <div
                key={c.id}
                onClick={() => setActive(c.id)}
                style={{
                  background: active === c.id ? '#162e1e' : 'rgba(22,46,30,0.4)',
                  border: `1px solid ${active === c.id ? c.color + '55' : 'rgba(245,239,230,0.07)'}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ flexShrink: 0 }}>{c.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: '#f5efe6', fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#8aab90', marginTop: 2 }}>{c.model}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="font-mono-data" style={{ fontSize: 12, color: c.color }}>{c.cost.split(' ')[0]}</div>
                  <div style={{ fontSize: 10, color: '#8aab90' }}>{c.qty}</div>
                </div>
              </div>
            ))}

            {/* Total cost */}
            <div style={{ background: '#162e1e', border: '1px solid rgba(232,160,66,0.25)', borderRadius: 10, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span className="font-display" style={{ fontSize: 18, fontWeight: 700, color: '#f5efe6', textTransform: 'uppercase' }}>Total per Farm Kit</span>
              <div style={{ textAlign: 'right' }}>
                <div className="font-display" style={{ fontSize: 24, fontWeight: 800, color: '#e8a042' }}>${totalCost.usd}</div>
                <div className="font-mono-data" style={{ fontSize: 11, color: '#8aab90' }}>{totalCost.ugx} UGX</div>
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <div>
            {activeComp && (
              <div
                style={{
                  background: '#162e1e',
                  border: `1px solid ${activeComp.color}33`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  position: 'sticky',
                  top: 80,
                }}
              >
                {/* Header */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(245,239,230,0.08)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: `${activeComp.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {activeComp.icon}
                  </div>
                  <div>
                    <div className="font-display" style={{ fontSize: 24, fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', lineHeight: 1.1 }}>{activeComp.name}</div>
                    <div className="font-mono-data" style={{ fontSize: 12, color: activeComp.color, marginTop: 6 }}>{activeComp.model}</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#8aab90', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unit cost</div>
                        <div className="font-mono-data" style={{ fontSize: 14, color: '#f5efe6' }}>{activeComp.cost}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#8aab90', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quantity</div>
                        <div style={{ fontSize: 14, color: '#f5efe6' }}>{activeComp.qty}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div style={{ padding: '20px 28px' }}>
                  <div style={{ fontSize: 11, color: '#8aab90', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Technical Specifications</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeComp.details.map((d, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: activeComp.color, flexShrink: 0, marginTop: 6 }} />
                        <span style={{ fontSize: 13, color: '#c8c0b0', lineHeight: 1.55 }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LoRa Network Topology Diagram */}
        <div style={{ marginTop: 60 }}>
          <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', marginBottom: 24 }}>
            Network Topology
          </div>
          <div style={{ background: '#162e1e', border: '1px solid rgba(245,239,230,0.08)', borderRadius: 12, padding: '32px', overflowX: 'auto' }}>
            <svg viewBox="0 0 720 220" style={{ width: '100%', maxWidth: 720, display: 'block', margin: '0 auto' }}>
              {/* Sensor nodes */}
              {sensors.map((s, i) => {
                const x = 60 + i * 100
                const y = 60
                const online = s.online
                const color = online ? '#4caf7d' : '#8aab90'
                return (
                  <g key={s.id}>
                    {/* Link to base station */}
                    <line
                      x1={x} y1={y + 24}
                      x2={360} y2={154}
                      stroke={online ? 'rgba(76,175,125,0.3)' : 'rgba(138,171,144,0.12)'}
                      strokeWidth="1.5"
                      strokeDasharray={online ? '0' : '5 4'}
                    />
                    {/* Signal strength label */}
                    {online && (
                      <text x={x} y={y + 50} textAnchor="middle" fill="#8aab90" fontSize="9" fontFamily="DM Mono">
                        {s.signalStrength}%
                      </text>
                    )}
                    {/* Node circle */}
                    <circle cx={x} cy={y} r={20} fill={`${color}15`} stroke={color} strokeWidth={1.5} />
                    {s.irrigating && (
                      <circle cx={x} cy={y} r={24} fill="none" stroke="#4caf7d" strokeWidth={1} opacity={0.4} strokeDasharray="3 3">
                        <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="8s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <text x={x} y={y + 4} textAnchor="middle" fill={color} fontSize="11" fontWeight="bold" fontFamily="DM Mono">{s.id}</text>
                    <text x={x} y={y - 28} textAnchor="middle" fill={color} fontSize="9" fontFamily="DM Mono">{s.moisture.toFixed(0)}%</text>
                  </g>
                )
              })}

              {/* Base station */}
              <rect x={320} y={140} width={80} height={40} rx={6} fill="rgba(76,175,125,0.15)" stroke="#4caf7d" strokeWidth={2} />
              <text x={360} y={158} textAnchor="middle" fill="#4caf7d" fontSize="10" fontWeight="bold" fontFamily="DM Mono">BASE</text>
              <text x={360} y={172} textAnchor="middle" fill="#8aab90" fontSize="9" fontFamily="DM Mono">STATION</text>

              {/* Cloud / data link */}
              <line x1={400} y1={160} x2={500} y2={160} stroke="rgba(232,160,66,0.5)" strokeWidth={1.5} strokeDasharray="6 4" />
              <text x={450} y={152} textAnchor="middle" fill="#e8a042" fontSize="9" fontFamily="DM Mono">GSM/WiFi</text>
              <rect x={500} y={140} width={80} height={40} rx={6} fill="rgba(232,160,66,0.1)" stroke="#e8a042" strokeWidth={1.5} />
              <text x={540} y={158} textAnchor="middle" fill="#e8a042" fontSize="10" fontWeight="bold" fontFamily="DM Mono">CLOUD</text>
              <text x={540} y={172} textAnchor="middle" fill="#8aab90" fontSize="9" fontFamily="DM Mono">OPTIONAL</text>

              {/* Legend */}
              <circle cx={40} cy={200} r={5} fill="rgba(76,175,125,0.3)" stroke="#4caf7d" strokeWidth={1} />
              <text x={50} y={204} fill="#8aab90" fontSize="9" fontFamily="DM Mono">Sensor node (LoRa 868 MHz)</text>
              <line x1={200} y1={200} x2={220} y2={200} stroke="rgba(76,175,125,0.4)" strokeWidth={1.5} />
              <text x={225} y={204} fill="#8aab90" fontSize="9" fontFamily="DM Mono">Active link</text>
              <line x1={310} y1={200} x2={330} y2={200} stroke="rgba(138,171,144,0.3)" strokeWidth={1.5} strokeDasharray="4 3" />
              <text x={335} y={204} fill="#8aab90" fontSize="9" fontFamily="DM Mono">Offline</text>
            </svg>
          </div>
          <p style={{ fontSize: 12, color: '#8aab90', marginTop: 12, textAlign: 'center' }}>
            Sensor node moisture values and signal strength update live from the simulation
          </p>
        </div>
      </div>
    </section>
  )
}
