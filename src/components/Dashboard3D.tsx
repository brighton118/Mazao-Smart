import { Suspense } from 'react'

// Load the heavy 3D Digital Twin Canvas
import SmartFarm3D from './SmartFarm3D'

// Custom loader matching the AgriSense visual style
function DigitalTwinLoader() {
    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 220px)',
            minHeight: '480px',
            background: 'rgba(22, 46, 30, 0.25)',
            backdropFilter: 'blur(10px)',
            border: '1px dashed rgba(76, 175, 125, 0.3)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
        }}>
            {/* Pulse circle */}
            <div style={{
                width: '60px',
                height: '60px',
                border: '3px solid rgba(76, 175, 125, 0.1)',
                borderTopColor: '#4caf7d',
                borderRadius: '50%',
                animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            }} className="r3f-loader-spinner" />

            {/* Styled text */}
            <div style={{ textAlign: 'center' }}>
                <h4 className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: '#f5efe6', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                    Loading 3D Digital Twin
                </h4>
                <p style={{ fontSize: '12px', color: '#8aab90', margin: 0 }} className="font-mono-data">
                    Compiling WebGL contexts &amp; sync-ing Wokwi telemeters...
                </p>
            </div>

            {/* Injecting keyframes style block directly */}
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}

export default function Dashboard3D() {
    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto', height: '100%' }}>
            {/* Title section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '16px', height: '2px', background: '#4caf7d' }} />
                        <span style={{ fontSize: '11px', color: '#4caf7d', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }} className="font-mono-data">
                            Real-Time Virtualization
                        </span>
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', margin: 0 }} className="font-display">
                        3D Farm Simulation
                    </h2>
                    <div style={{ fontSize: '12px', color: '#8aab90', marginTop: '6px' }}>
                        Drag to rotate, scroll to zoom. Click individual hardware nodes or nodes list on the right to inspect.
                    </div>
                </div>
            </div>

            {/* 3D Canvas Box wrapper */}
            <div style={{ width: '100%', height: 'calc(100vh - 220px)', minHeight: '520px', position: 'relative' }}>
                <Suspense fallback={<DigitalTwinLoader />}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                        <SmartFarm3D />
                    </div>
                </Suspense>
            </div>
        </div>
    )
}
