import { useState, useEffect, useRef } from 'react'
import { useSimulation } from '../context/SimulationContext'
import { useAuth } from '../context/AuthContext'
import { User as UserIcon, Shield, Lock, Key, Upload } from 'lucide-react'

export default function SettingsPanel() {
    const { state, dispatch } = useSimulation()
    const { speed, paused, weather, wifiConnected } = state
    const { user, updateProfile, uploadAvatar, changePassword } = useAuth()

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form inputs state
    const [fullName, setFullName] = useState(user?.full_name || '')
    const [phone, setPhone] = useState(user?.phone || '')
    const [nationalId, setNationalId] = useState(user?.national_id || '')
    const [farmName, setFarmName] = useState(user?.farm_name || '')
    const [farmLocation, setFarmLocation] = useState(user?.farm_location || '')
    const [preferredLanguage, setPreferredLanguage] = useState(user?.preferred_language || 'en')

    // Password State
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Feedback States
    const [isUpdating, setIsUpdating] = useState(false)
    const [isChangingPass, setIsChangingPass] = useState(false)

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '')
            setPhone(user.phone || '')
            setNationalId(user.national_id || '')
            setFarmName(user.farm_name || '')
            setFarmLocation(user.farm_location || '')
            setPreferredLanguage(user.preferred_language || 'en')
        }
    }, [user])



    const handleClearCache = () => {
        localStorage.removeItem('mazaosmart_sim_state')
        window.location.reload()
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        const res = await updateProfile({
            full_name: fullName,
            phone,
            national_id: nationalId || null,
            farm_name: farmName,
            farm_location: farmLocation,
            preferred_language: preferredLanguage
        })
        setIsUpdating(false)
        if (res.success) {
            window.dispatchEvent(
                new CustomEvent('mazaosmart-toast', {
                    detail: { message: 'Profile updated successfully!', type: 'success' }
                })
            )
        } else {
            window.dispatchEvent(
                new CustomEvent('mazaosmart-toast', {
                    detail: { message: res.error || 'Failed to update profile.', type: 'error' }
                })
            )
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            window.dispatchEvent(
                new CustomEvent('mazaosmart-toast', {
                    detail: { message: 'New passwords do not match.', type: 'error' }
                })
            )
            return
        }
        if (newPassword.length < 6) {
            window.dispatchEvent(
                new CustomEvent('mazaosmart-toast', {
                    detail: { message: 'Password must be at least 6 characters.', type: 'error' }
                })
            )
            return
        }
        setIsChangingPass(true)
        const res = await changePassword(currentPassword, newPassword)
        setIsChangingPass(false)
        if (res.success) {
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            window.dispatchEvent(
                new CustomEvent('mazaosmart-toast', {
                    detail: { message: 'Password changed successfully.', type: 'success' }
                })
            )
        } else {
            window.dispatchEvent(
                new CustomEvent('mazaosmart-toast', {
                    detail: { message: res.error || 'Failed to change password.', type: 'error' }
                })
            )
        }
    }

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                window.dispatchEvent(
                    new CustomEvent('mazaosmart-toast', {
                        detail: { message: 'Profile picture must be under 2MB.', type: 'error' }
                    })
                )
                return
            }

            const reader = new FileReader()
            reader.onloadend = async () => {
                const base64String = reader.result as string
                const res = await uploadAvatar(base64String)
                if (res.success) {
                    window.dispatchEvent(
                        new CustomEvent('mazaosmart-toast', {
                            detail: { message: 'Profile picture updated successfully!', type: 'success' }
                        })
                    )
                } else {
                    window.dispatchEvent(
                        new CustomEvent('mazaosmart-toast', {
                            detail: { message: res.error || 'Failed to upload profile picture.', type: 'error' }
                        })
                    )
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(245, 239, 230, 0.1)',
        background: 'rgba(15, 35, 24, 0.4)',
        color: '#f5efe6',
        fontSize: '13.5px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'all 0.2s',
    }

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '11px',
        fontWeight: 600,
        color: '#8aab90',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '6px',
    }

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: 700,
        color: '#f5efe6',
        margin: '0 0 8px 0',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    }

    const cardStyle: React.CSSProperties = {
        background: 'rgba(22, 46, 30, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(245, 239, 230, 0.08)',
        borderRadius: '12px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
    }

    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '16px', height: '2px', background: '#e8a042' }} />
                    <span style={{ fontSize: '11px', color: '#e8a042', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }} className="font-mono-data">
                        Account &amp; Environmental Configuration
                    </span>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', margin: 0 }} className="font-display">
                    Settings Panel
                </h2>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#8aab90' }}>
                    Manage your AgriSense user profile, secure access credentials, and adjust real-time simulation variables.
                </p>
            </div>

            {/* Main Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>

                {/* Column 1: User Profile Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* User Profile Card */}
                    <div style={{ ...cardStyle }}>
                        <h3 style={sectionTitleStyle}>
                            <UserIcon size={18} style={{ color: '#4caf7d' }} />
                            Edit Profile Details
                        </h3>
                        <p style={{ fontSize: '12px', color: '#8aab90', margin: '0 0 20px 0' }}>
                            Keep your personal information and farm location context up to date to normalize telemetry metrics properly.
                        </p>

                        {/* Avatar Settings Section */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            background: 'rgba(15, 35, 24, 0.3)',
                            padding: '16px',
                            borderRadius: '10px',
                            border: '1px solid rgba(245, 239, 230, 0.04)',
                            marginBottom: '20px'
                        }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                                {user?.profile_image ? (
                                    <img
                                        src={user.profile_image}
                                        alt="Avatar"
                                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4caf7d' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'rgba(76, 175, 125, 0.15)',
                                        color: '#4caf7d',
                                        border: '2px dashed rgba(76, 175, 125, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '28px',
                                        fontWeight: 700
                                    }}>
                                        {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f5efe6' }}>{user?.full_name || 'AgriSense User'}</div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    onClick={triggerFileInput}
                                    style={{
                                        background: 'rgba(76, 175, 125, 0.12)',
                                        color: '#4caf7d',
                                        border: '1px solid rgba(76, 175, 125, 0.3)',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginTop: '10px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Upload size={12} />
                                    Change Picture
                                </button>
                            </div>
                        </div>

                        {/* Profile Edit Form */}
                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Username (Read-only)</label>
                                    <div style={{ ...inputStyle, background: 'rgba(15, 35, 24, 0.15)', color: '#8aab90', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Lock size={12} /> {user?.username}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Email Address (Read-only)</label>
                                    <div style={{ ...inputStyle, background: 'rgba(15, 35, 24, 0.15)', color: '#8aab90', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Lock size={12} /> {user?.email}
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>National ID (Optional)</label>
                                    <input
                                        type="text"
                                        value={nationalId}
                                        onChange={(e) => setNationalId(e.target.value)}
                                        style={inputStyle}
                                        placeholder="Enter National ID"
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Preferred Language</label>
                                    <select
                                        value={preferredLanguage}
                                        onChange={(e) => setPreferredLanguage(e.target.value)}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                    >
                                        <option value="en" style={{ background: '#162e1e', color: '#f5efe6' }}>🇺🇸 English (US)</option>
                                        <option value="lg" style={{ background: '#162e1e', color: '#f5efe6' }}>🇺🇬 Luganda (Uganda)</option>
                                        <option value="sw" style={{ background: '#162e1e', color: '#f5efe6' }}>🇰🇪 Swahili (East Africa)</option>
                                        <option value="fr" style={{ background: '#162e1e', color: '#f5efe6' }}>🇫🇷 French (France)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Farm Name</label>
                                    <input
                                        type="text"
                                        value={farmName}
                                        onChange={(e) => setFarmName(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Farm Location</label>
                                    <input
                                        type="text"
                                        value={farmLocation}
                                        onChange={(e) => setFarmLocation(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isUpdating}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(76, 175, 125, 0.4)',
                                    background: 'rgba(76, 175, 125, 0.15)',
                                    color: '#4caf7d',
                                    fontWeight: 650,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginTop: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isUpdating ? 'Saving...' : '💾 Save Settings'}
                            </button>
                        </form>
                    </div>

                    {/* Change Password Card */}
                    <div style={{ ...cardStyle }}>
                        <h3 style={sectionTitleStyle}>
                            <Key size={18} style={{ color: '#e8a042' }} />
                            Update Credentials
                        </h3>
                        <p style={{ fontSize: '12px', color: '#8aab90', margin: '0 0 20px 0' }}>
                            Ensure your account remains safe and resilient by periodically revising your cryptography settings.
                        </p>

                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Must match"
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isChangingPass}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(232, 160, 66, 0.4)',
                                    background: 'rgba(232, 160, 66, 0.12)',
                                    color: '#e8a042',
                                    fontWeight: 650,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginTop: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isChangingPass ? 'Updating...' : '🔒 Change Password'}
                            </button>
                        </form>
                    </div>

                </div>

                {/* Column 2: System Simulator Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Weather Scenarios */}
                    <div style={{ ...cardStyle }}>
                        <h3 style={{ ...sectionTitleStyle }}>
                            ☀️ Climate Engine Config
                        </h3>
                        <p style={{ fontSize: '12px', color: '#8aab90', margin: '0 0 20px 0' }}>
                            Override climate conditions. This directly influences the moisture evaporation rates of your soils and ambient relative light.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {[
                                { type: 'sunny', label: '☀️ Sunny / Arid', desc: 'Accelerates evaporation' },
                                { type: 'cloudy', label: '☁️ Overcast', desc: 'Moderate light levels' },
                                { type: 'rainy', label: '🌧 Heavy Rain', desc: 'Increases soil moisture' },
                                { type: 'windy', label: '💨 High Winds', desc: 'Rapid surface draft' }
                            ].map(w => {
                                const active = weather === w.type
                                return (
                                    <button
                                        key={w.type}
                                        type="button"
                                        onClick={() => dispatch({ type: 'SET_WEATHER', weather: w.type as any })}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${active ? '#4caf7d' : 'rgba(245, 239, 230, 0.08)'}`,
                                            background: active ? 'rgba(76, 175, 125, 0.12)' : 'rgba(15, 35, 24, 0.4)',
                                            color: '#f5efe6',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 650, fontSize: '13.5px', color: active ? '#4caf7d' : '#f5efe6' }}>{w.label}</div>
                                        <div style={{ fontSize: '10px', color: '#8aab90', marginTop: '4px' }}>{w.desc}</div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Simulator Speed Controller */}
                    <div style={{ ...cardStyle }}>
                        <h3 style={{ ...sectionTitleStyle }}>
                            ⏱️ Clock Frequency
                        </h3>
                        <p style={{ fontSize: '12px', color: '#8aab90', margin: '0 0 20px 0' }}>
                            Control the virtual tick rate. High speed allows quick testing of threshold-based automation behaviors.
                        </p>

                        <div style={{ background: 'rgba(15,35,24,0.4)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(245,239,230,0.04)', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#8aab90' }}>Clock Frequency</span>
                                <span className="font-mono-data" style={{ fontSize: '13px', color: '#4caf7d', fontWeight: 600 }}>
                                    {paused ? 'PAUSED' : `${speed} sec/tick`}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[1, 3, 10].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => dispatch({ type: 'SET_SPEED', speed: s })}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: `1px solid ${speed === s ? '#4caf7d' : 'rgba(245,239,230,0.08)'}`,
                                            background: speed === s ? 'rgba(76,175,125,0.15)' : 'transparent',
                                            color: speed === s ? '#4caf7d' : '#8aab90',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontFamily: 'DM Mono, monospace',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: `1px solid ${paused ? 'rgba(232,160,66,0.4)' : 'rgba(76,175,125,0.4)'}`,
                                background: paused ? 'rgba(232,160,66,0.1)' : 'rgba(76,175,125,0.1)',
                                color: paused ? '#e8a042' : '#4caf7d',
                                fontWeight: 650,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span>{paused ? '▶ Resume Simulator' : '⏸ Pause Simulator'}</span>
                        </button>
                    </div>

                    {/* Database & Storage Purger */}
                    <div style={{ ...cardStyle }}>
                        <h3 style={{ ...sectionTitleStyle }}>
                            💾 Local Storage &amp; Cache
                        </h3>
                        <p style={{ fontSize: '12px', color: '#8aab90', margin: '0 0 20px 0' }}>
                            AgriSense state is synced automatically to your browser storage. Reset to defaults to clear database telemetry logs.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,35,24,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245,239,230,0.04)' }}>
                                <div>
                                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f5efe6' }}>ESP32 WiFi Receiver</div>
                                    <div style={{ fontSize: '11px', color: '#8aab90' }}>Wokwi telemetry hub ping status</div>
                                </div>
                                <span className="font-mono-data" style={{
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    color: wifiConnected ? '#4caf7d' : '#e05a4e',
                                    background: wifiConnected ? 'rgba(76,175,125,0.12)' : 'rgba(224,90,78,0.12)',
                                    padding: '3px 8px',
                                    borderRadius: '4px'
                                }}>
                                    {wifiConnected ? 'WIFI UP' : 'WIFI DOWN'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleClearCache}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(224,90,78,0.4)',
                                    background: 'rgba(224,90,78,0.08)',
                                    color: '#e05a4e',
                                    fontWeight: 650,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ⚠️ Purge Telemetry &amp; Reset Layout
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
