import { useState, useEffect, lazy, Suspense } from 'react'
import { SimulationProvider, useSimulation } from './context/SimulationContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthPages } from './components/AuthPages'
import { LogOut } from 'lucide-react'

// Lazy-load dashboard pages for faster initial render (code splitting)
const DashboardOverview = lazy(() => import('./components/DashboardOverview'))
const GreenhousesPanel = lazy(() => import('./components/GreenhousesPanel'))
const OutdoorPanel = lazy(() => import('./components/OutdoorPanel'))
const SensorManagement = lazy(() => import('./components/SensorManagement'))
const WaterBilling = lazy(() => import('./components/WaterBilling'))
const SystemAlerts = lazy(() => import('./components/SystemAlerts'))
const AIAssistant = lazy(() => import('./components/AIAssistant'))
const Dashboard3D = lazy(() => import('./components/Dashboard3D'))
const SettingsPanel = lazy(() => import('./components/SettingsPanel'))

// Custom toast notification type
interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warn' | 'error'
}

function MainLayout() {
  const { state } = useSimulation()
  const { sensors, wifiConnected } = state
  const [currentTab, setCurrentTab] = useState<string>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const { user, token, logout, isLoading } = useAuth()

  // Watch for toast events
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: 'info' | 'success' | 'warn' | 'error' }>
      const newToast: Toast = {
        id: Math.random().toString(36).substr(2, 9),
        message: customEvent.detail.message,
        type: customEvent.detail.type || 'info'
      }
      setToasts(prev => [...prev, newToast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id))
      }, 5000)
    }

    window.addEventListener('mazaosmart-toast', handleToast)
    return () => window.removeEventListener('mazaosmart-toast', handleToast)
  }, [])

  // Calculate live navigation badge counts
  const criticalSensorsCount = sensors.filter(s => s.online && s.status === 'critical').length
  const offlineSensorsCount = sensors.filter(s => !s.online).length
  const activeAlertsCount = criticalSensorsCount + offlineSensorsCount

  const greenhouseAlerts = sensors.filter(s => s.id.startsWith('B') && (s.status === 'critical' || !s.online)).length
  const gardenAlerts = sensors.filter(s => (s.id.startsWith('A') || s.id.startsWith('C')) && (s.status === 'critical' || !s.online)).length

  // Navigation tabs configuration
  const navigationItems = [
    { id: 'dashboard', label: 'Overview', icon: '📊', badge: 0, badgeColor: '#4caf7d' },
    { id: '3d-sim', label: '3D Twin Simulator', icon: '🌍', badge: 0, badgeColor: '#4caf7d' },
    { id: 'greenhouses', label: 'Greenhouse Complex', icon: '🏘️', badge: greenhouseAlerts, badgeColor: '#e05a4e' },
    { id: 'gardens', label: 'Outdoor Gardens', icon: '🌽', badge: gardenAlerts, badgeColor: '#e8a042' },
    { id: 'sensors', label: 'Node Registry', icon: '💾', badge: offlineSensorsCount, badgeColor: '#8aab90' },
    { id: 'billing', label: 'Water Economics', icon: '💧', badge: 0, badgeColor: '#4caf7d' },
    { id: 'alerts', label: 'System Rules & Log', icon: '🚨', badge: activeAlertsCount, badgeColor: '#e05a4e' },
    { id: 'ai-assistant', label: 'Contextual Agronomist', icon: '🤖', badge: 0, badgeColor: '#4caf7d' },
    { id: 'settings', label: 'System Settings', icon: '⚙️', badge: 0, badgeColor: '#4caf7d' },
  ]

  // Role-Based Access Control Filters
  const userRole = user?.role || 'Farmer'
  const filteredNavigationItems = navigationItems.filter(item => {
    if (userRole === 'Administrator') return true
    if (userRole === 'Technician') {
      return ['sensors', '3d-sim', 'alerts', 'settings'].includes(item.id)
    }
    if (userRole === 'Agronomist') {
      return ['dashboard', '3d-sim', 'greenhouses', 'gardens', 'ai-assistant', 'settings'].includes(item.id)
    }
    if (userRole === 'Farmer') {
      return ['dashboard', 'greenhouses', 'gardens', 'billing', 'ai-assistant', 'settings'].includes(item.id)
    }
    return false
  })

  // Shift currentTab if not allowed for newly switched role
  const allowedTabs = filteredNavigationItems.map(item => item.id)
  useEffect(() => {
    if (user && allowedTabs.length > 0 && !allowedTabs.includes(currentTab)) {
      setCurrentTab(allowedTabs[0])
    }
  }, [userRole, currentTab, user])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f2318', color: '#f5efe6', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(76, 175, 125, 0.1)',
          borderTopColor: '#4caf7d',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '13px', color: '#8aab90', letterSpacing: '0.05em' }}>VERIFYING AUTHORIZATION CREDENTIALS...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Not authenticated? Show Login / Signup Screen
  if (!token || !user) {
    return (
      <>
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '360px',
          width: '100%'
        }}>
          {toasts.map(toast => {
            let bg = 'rgba(22, 46, 30, 0.9)';
            let border = '1px solid rgba(76, 175, 125, 0.4)';
            let accent = '#4caf7d';
            if (toast.type === 'error') {
              bg = 'rgba(38, 20, 20, 0.9)';
              border = '1px solid rgba(224, 90, 78, 0.4)';
              accent = '#e05a4e';
            } else if (toast.type === 'warn') {
              bg = 'rgba(38, 30, 20, 0.9)';
              border = '1px solid rgba(232, 160, 66, 0.4)';
              accent = '#e8a042';
            }

            return (
              <div
                key={toast.id}
                style={{
                  background: bg,
                  backdropFilter: 'blur(10px)',
                  border: border,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderLeft: `4px solid ${accent}`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards'
                }}
              >
                <span style={{ fontSize: '13px', color: '#f5efe6', lineHeight: 1.4, flex: 1 }}>{toast.message}</span>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  style={{ background: 'transparent', border: 'none', color: '#8aab90', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <AuthPages />
      </>
    )
  }

  const renderActiveTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardOverview onNavigate={(tab) => setCurrentTab(tab)} />
      case 'greenhouses':
        return <GreenhousesPanel />
      case 'gardens':
        return <OutdoorPanel />
      case 'sensors':
        return <SensorManagement />
      case 'billing':
        return <WaterBilling />
      case 'alerts':
        return <SystemAlerts />
      case 'ai-assistant':
        return <AIAssistant />
      case '3d-sim':
        return <Dashboard3D />
      case 'settings':
        return <SettingsPanel />
      default:
        return <DashboardOverview onNavigate={(tab) => setCurrentTab(tab)} />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f2318', color: '#f5efe6', flexDirection: 'row' }}>
      {/* Toast Notification Container */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
        width: '100%'
      }}>
        {toasts.map(toast => {
          let bg = 'rgba(22, 46, 30, 0.9)';
          let border = '1px solid rgba(76, 175, 125, 0.4)';
          let accent = '#4caf7d';
          if (toast.type === 'error') {
            bg = 'rgba(38, 20, 20, 0.9)';
            border = '1px solid rgba(224, 90, 78, 0.4)';
            accent = '#e05a4e';
          } else if (toast.type === 'warn') {
            bg = 'rgba(38, 30, 20, 0.9)';
            border = '1px solid rgba(232, 160, 66, 0.4)';
            accent = '#e8a042';
          }

          return (
            <div
              key={toast.id}
              style={{
                background: bg,
                backdropFilter: 'blur(10px)',
                border: border,
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderLeft: `4px solid ${accent}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards'
              }}
            >
              <span style={{ fontSize: '13px', color: '#f5efe6', lineHeight: 1.4, flex: 1 }}>{toast.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{ background: 'transparent', border: 'none', color: '#8aab90', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}
              >
                ×
              </button>
            </div>
          )
        })}
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>

      {/* Desktop Sidebar Layout */}
      <aside style={{
        width: '280px',
        background: 'rgba(15, 35, 24, 0.75)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(245, 239, 230, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        padding: '24px 20px'
      }} className="hidden md:flex">
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#4caf7d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#0f2318" />
              <path d="M12 6v6l4 2" stroke="#4caf7d" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '20px', fontWeight: 800, color: '#f5efe6', letterSpacing: '0.04em' }}>
            MAZAO<span style={{ color: '#4caf7d' }}>SMART</span>
          </span>
        </div>

        {/* Profile Header Widget */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(245, 239, 230, 0.03)',
          border: '1px solid rgba(245, 239, 230, 0.06)',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#4caf7d',
            color: '#0f2318',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '15px',
            overflow: 'hidden'
          }}>
            {user.profile_image ? (
              <img src={user.profile_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            ) : (
              user.full_name.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 650, color: '#f5efe6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.full_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{
                fontSize: '8.5px',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '1px 5px',
                borderRadius: '4px',
                background: user.role === 'Administrator' ? '#e05a4e' :
                  user.role === 'Farmer' ? '#4caf7d' :
                    user.role === 'Agronomist' ? '#e8a042' : '#8aab90',
                color: '#0f2318',
                letterSpacing: '0.04em'
              }}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8aab90',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(224, 90, 78, 0.1)'; e.currentTarget.style.color = '#e05a4e'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8aab90'; }}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          {filteredNavigationItems.map(item => {
            const active = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: active ? 'rgba(76, 175, 125, 0.15)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(76, 175, 125, 0.25)' : 'transparent'}`,
                  color: active ? '#4caf7d' : '#8aab90',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: active ? 650 : 500,
                  fontSize: '13.5px',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    ; (e.currentTarget as HTMLElement).style.background = 'rgba(245, 239, 230, 0.03)'
                      ; (e.currentTarget as HTMLElement).style.color = '#f5efe6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    ; (e.currentTarget as HTMLElement).style.background = 'transparent'
                      ; (e.currentTarget as HTMLElement).style.color = '#8aab90'
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span className="font-mono-data" style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#0f2318',
                    background: item.badgeColor,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    minWidth: '16px',
                    textAlign: 'center'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer info */}
        <div style={{ borderTop: '1px solid rgba(245, 239, 230, 0.08)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifySelf: 'start', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: wifiConnected ? '#4caf7d' : '#e05a4e',
              boxShadow: `0 0 6px ${wifiConnected ? '#4caf7d' : '#e05a4e'}`
            }} />
            <div style={{ fontSize: '11px', color: '#8aab90' }}>
              {wifiConnected ? 'System Telemetry Synced' : 'Offline/Simulated Local'}
            </div>
          </div>
          <div style={{ fontSize: '9px', color: '#8aab90', marginTop: '6px', fontFamily: 'monospace' }} className="font-mono-data">
            PILOT DISTRICT: MBARARA v1.4
          </div>
        </div>
      </aside>

      {/* Mobile Sliding Sidebar & Header */}
      <div className="md:hidden" style={{ width: '100%', position: 'fixed', top: 0, zIndex: 100 }}>
        {/* Mobile Header Bar */}
        <header style={{
          height: '60px',
          background: 'rgba(15, 35, 24, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(245, 239, 230, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#4caf7d', display: 'flex', alignItems: 'center', justifySelf: 'center' }} />
            <span className="font-display" style={{ fontSize: '16px', fontWeight: 800 }}>MAZAOSMART</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={logout}
              style={{ background: 'transparent', border: 'none', color: '#8aab90', cursor: 'pointer', padding: '4px' }}
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'transparent', border: 'none', color: '#f5efe6', cursor: 'pointer' }}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile menu pane */}
        {mobileMenuOpen && (
          <div style={{
            background: 'rgba(12, 30, 19, 0.98)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(245,239,230,0.1)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: 'calc(100vh - 60px)',
            overflowY: 'auto'
          }}>
            {filteredNavigationItems.map(item => {
              const active = currentTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: active ? 'rgba(76, 175, 125, 0.15)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(76, 175, 125, 0.25)' : 'transparent'}`,
                    color: active ? '#4caf7d' : '#8aab90',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: active ? 650 : 500,
                    fontSize: '13.5px'
                  }}
                >
                  <span>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="font-mono-data" style={{ fontSize: '10px', color: '#0f2318', background: item.badgeColor, padding: '1px 6px', borderRadius: '4px' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Main Workspace Frame container */}
      <main style={{
        flex: 1,
        marginLeft: '280px',
        padding: '32px 40px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }} className="main-content-area">
        {/* Style sheet override for responsiveness and scroll behaviors */}
        <style>{`
          @media (max-width: 768px) {
            .main-content-area {
              margin-left: 0 !important;
              padding: 92px 20px 24px 20px !important;
            }
          }
        `}</style>

        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', flexDirection: 'column' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid rgba(76,175,125,0.15)', borderTopColor: '#4caf7d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '12px', color: '#8aab90', letterSpacing: '0.04em' }}>LOADING MODULE...</span>
          </div>
        }>
          {renderActiveTabContent()}
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SimulationProvider>
        <MainLayout />
      </SimulationProvider>
    </AuthProvider>
  )
}

