const steps = [
  {
    icon: (
      <svg width="36" height="36" fill="none" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="rgba(76,175,125,0.15)" stroke="#4caf7d" strokeWidth="1.5" />
        <path d="M24 14v10l6 4" stroke="#4caf7d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="24" r="3" fill="#4caf7d" />
      </svg>
    ),
    step: '01',
    title: 'Bury the Sensor',
    body: 'Push the sensor probe 30 cm into the soil near the roots. A single sensor covers one quarter-hectare plot.',
    visual: '📍',
  },
  {
    icon: (
      <svg width="36" height="36" fill="none" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="rgba(232,160,66,0.15)" stroke="#e8a042" strokeWidth="1.5" />
        <path d="M16 32c0-8 4-14 8-14s8 6 8 14" stroke="#e8a042" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 24h6M30 24h6" stroke="#e8a042" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    step: '02',
    title: 'Sensor Reads Moisture',
    body: 'Every 15 minutes, the sensor measures how wet your soil is and sends the reading wirelessly to the base station — no wires or internet needed.',
    visual: '📡',
  },
  {
    icon: (
      <svg width="36" height="36" fill="none" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="rgba(76,175,125,0.15)" stroke="#4caf7d" strokeWidth="1.5" />
        <rect x="16" y="16" width="16" height="12" rx="2" stroke="#4caf7d" strokeWidth="2" />
        <path d="M20 28v4M28 28v4M16 22h16" stroke="#4caf7d" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    step: '03',
    title: 'System Decides',
    body: 'If the soil is too dry, the system automatically opens your irrigation valve. When moisture is sufficient, it closes. You are always in control.',
    visual: '🧠',
  },
  {
    icon: (
      <svg width="36" height="36" fill="none" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="rgba(232,160,66,0.15)" stroke="#e8a042" strokeWidth="1.5" />
        <path d="M24 16v4M24 28v4M16 24h4M28 24h4" stroke="#e8a042" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="4" fill="#e8a042" />
      </svg>
    ),
    step: '04',
    title: 'Water Flows',
    body: 'Your pump or gravity-fed tank delivers water through drip lines directly to roots — using up to 40% less water than traditional flooding methods.',
    visual: '💧',
  },
]

const faq = [
  {
    q: 'What if I have no phone or internet?',
    a: 'The system works without internet. The base station uses a solar-powered display with lights: green = good, yellow = water soon, red = irrigate now. No phone needed for daily use.',
  },
  {
    q: 'How much does the system cost?',
    a: 'The pilot kit (2 sensors + base station + valve controller) costs 180,000 UGX (~$48 USD), subsidised through the programme. Refill subscriptions are 12,000 UGX/month for cloud access.',
  },
  {
    q: 'What happens when the battery is low?',
    a: 'Sensors are solar-recharged. If a sensor battery falls below 20%, the base station light blinks white. Sensors last up to 10 days without any sun.',
  },
  {
    q: 'Can it work with borehole or rainwater tank?',
    a: 'Yes. The valve controller works with any water source — gravity-fed tanks, borehole pumps, or small motorised pumps up to 1.5 kW.',
  },
]

export default function EducationSection() {
  return (
    <section id="learn" style={{ background: '#0c1e13', padding: '80px 0 100px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 24, height: 1, background: '#e8a042' }} />
            <span className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#e8a042', textTransform: 'uppercase' }}>
              Simple Enough for Any Farmer
            </span>
            <div style={{ width: 24, height: 1, background: '#e8a042' }} />
          </div>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', lineHeight: 1 }}
          >
            HOW IT<br /><span style={{ color: '#4caf7d' }}>WORKS</span>
          </h2>
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 80 }}>
          {steps.map((s, i) => (
            <div
              key={s.step}
              style={{
                position: 'relative',
                background: '#162e1e',
                border: '1px solid rgba(245,239,230,0.08)',
                borderRadius: 12,
                padding: '28px 24px',
              }}
            >
              {/* Step number */}
              <div
                className="font-display"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 20,
                  fontSize: 48,
                  fontWeight: 800,
                  color: 'rgba(245,239,230,0.04)',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                {s.step}
              </div>

              <div style={{ marginBottom: 16 }}>{s.icon}</div>

              <div
                className="font-display"
                style={{ fontSize: 20, fontWeight: 700, color: '#f5efe6', textTransform: 'uppercase', marginBottom: 10 }}
              >
                {s.title}
              </div>
              <p style={{ fontSize: 14, color: '#c8c0b0', lineHeight: 1.65 }}>{s.body}</p>

              {/* Connector line (not on last) */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    display: 'none',
                    position: 'absolute',
                    right: -13,
                    top: '50%',
                    width: 26,
                    height: 1,
                    background: 'rgba(76,175,125,0.3)',
                    zIndex: 1,
                  }}
                  className="lg:block"
                />
              )}
            </div>
          ))}
        </div>

        {/* Visual indicator legend */}
        <div
          style={{
            background: '#162e1e',
            border: '1px solid rgba(245,239,230,0.08)',
            borderRadius: 14,
            padding: '36px 40px',
            marginBottom: 64,
          }}
        >
          <div
            className="font-display"
            style={{ fontSize: 22, fontWeight: 700, color: '#f5efe6', textTransform: 'uppercase', marginBottom: 8 }}
          >
            Reading Your Light Indicator
          </div>
          <p style={{ fontSize: 14, color: '#8aab90', marginBottom: 28 }}>
            No phone needed — your base station uses simple colored lights that any household member can read.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { color: '#4caf7d', glow: 'rgba(76,175,125,0.5)', label: 'Solid Green', desc: 'Soil moisture is good. No action needed today.' },
              { color: '#e8a042', glow: 'rgba(232,160,66,0.5)', label: 'Blinking Yellow', desc: 'Moisture is getting low. Check in 2–4 hours.' },
              { color: '#e05a4e', glow: 'rgba(224,90,78,0.5)', label: 'Solid Red', desc: 'Soil is too dry. Irrigate now or system will start automatically.' },
              { color: '#f5efe6', glow: 'rgba(245,239,230,0.3)', label: 'Blinking White', desc: 'Sensor battery low. Move to sunlight to recharge.' },
            ].map(({ color, glow, label, desc }) => (
              <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 12px ${glow}`,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f5efe6', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#8aab90', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div
            className="font-display"
            style={{ fontSize: 28, fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', marginBottom: 28, letterSpacing: '-0.01em' }}
          >
            Common Questions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
            {faq.map(({ q, a }) => (
              <div
                key={q}
                style={{
                  background: '#162e1e',
                  border: '1px solid rgba(245,239,230,0.08)',
                  borderRadius: 10,
                  padding: '22px 24px',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f5efe6', marginBottom: 10, display: 'flex', gap: 8 }}>
                  <span style={{ color: '#e8a042', flexShrink: 0 }}>Q.</span>
                  {q}
                </div>
                <div style={{ fontSize: 13, color: '#c8c0b0', lineHeight: 1.65, paddingLeft: 20 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div
          style={{
            marginTop: 80,
            padding: '48px',
            background: 'linear-gradient(135deg, rgba(76,175,125,0.15) 0%, rgba(22,46,30,0.8) 100%)',
            border: '1px solid rgba(76,175,125,0.2)',
            borderRadius: 16,
            textAlign: 'center',
          }}
        >
          <div
            className="font-display"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', lineHeight: 1.05, marginBottom: 16 }}
          >
            Join the Mbarara Pilot
          </div>
          <p style={{ fontSize: 15, color: '#c8c0b0', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>
            We are currently enrolling 50 smallholder farming households in Mbarara District.
            Equipment, training, and technical support are provided for the first season at no cost.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('mazaosmart-toast', {
                    detail: {
                      message: 'Application submitted successfully! Our extension officer will contact you within 48 hours.',
                      type: 'success'
                    }
                  })
                )
              }}
              style={{
                background: '#e8a042',
                color: '#0f2318',
                border: 'none',
                borderRadius: 6,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Apply to Participate
            </button>
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = 'data:application/pdf;base64,JVBERi0xLjQKJdDFnzsyIDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAzIDAgUj4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUvUGFnZXMvS2lkc1s0IDAgUl0vQ291bnQgMT4+CmVuZG9iago0IDAgb2JqCjw8L1R5cGUvUGFnZS9QYXJlbnQgMyAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDcwPj5zdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyIFRkCihNYXphb1NtYXJ0IFNvaWwgTW9pc3R1cmUgTW9uaXRvcmluZyBTeXN0ZW0gLSBNYmFyYXJhIFBpbG90IEZpZWxkIEd1aWRlKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDcwIDA5OTk5IG4gCjAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDE4NSAwMDAwMCBuIAowMDAwMDAwMjg0IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMzkzCiUlRU9GCg=='
                link.download = 'MazaoSmart_Mbarara_Field_Guide.pdf'
                link.click()
                window.dispatchEvent(
                  new CustomEvent('mazaosmart-toast', {
                    detail: {
                      message: 'MazaoSmart Field Guide (PDF) download started.',
                      type: 'success'
                    }
                  })
                )
              }}
              style={{
                background: 'transparent',
                color: '#f5efe6',
                border: '1px solid rgba(245,239,230,0.25)',
                borderRadius: 6,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Download Field Guide (PDF)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 60,
            paddingTop: 28,
            borderTop: '1px solid rgba(245,239,230,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span className="font-display" style={{ fontSize: 18, fontWeight: 700, color: '#4caf7d', letterSpacing: '0.04em' }}>
            MAZAO<span style={{ color: '#8aab90' }}>SMART</span>
          </span>
          <span className="font-mono-data" style={{ fontSize: 11, color: '#8aab90', letterSpacing: '0.1em' }}>
            PILOT REGION: MBARARA DISTRICT, UGANDA · 2025
          </span>
        </div>
      </div>
    </section>
  )
}
