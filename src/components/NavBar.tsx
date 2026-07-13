import { useState } from 'react'

export default function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(245,239,230,0.08)',
        background: 'rgba(15,35,24,0.88)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#4caf7d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(15,35,24,0.9)" />
              <path d="M12 6v6l4 2" stroke="rgba(15,35,24,0.9)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" fill="#0f2318" />
              <path d="M7 12c0-2.76 2.24-5 5-5" stroke="#0a1c11" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span
            className="font-display"
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', color: '#f5efe6' }}
          >
            MAZAO<span style={{ color: '#4caf7d' }}>SMART</span>
          </span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hidden md:flex">
          {['Dashboard', 'Field Map', 'Irrigation', 'Learn'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(' ', '-')}`}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#8aab90',
                textDecoration: 'none',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#f5efe6')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8aab90')}
            >
              {label}
            </a>
          ))}
          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('mazaosmart-toast', {
                  detail: {
                    message: 'Mbarara District Pilot is active. You are currently viewing live simulator telemetry.',
                    type: 'info'
                  }
                })
              )
            }}
            style={{
              background: '#e8a042',
              color: '#0f2318',
              border: 'none',
              borderRadius: 6,
              padding: '7px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Mbarara Pilot
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f5efe6' }}
          className="md:hidden"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(245,239,230,0.08)' }}>
          {['Dashboard', 'Field Map', 'Irrigation', 'Learn'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(' ', '-')}`}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '10px 0',
                fontSize: 14,
                color: '#8aab90',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(245,239,230,0.06)',
              }}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
