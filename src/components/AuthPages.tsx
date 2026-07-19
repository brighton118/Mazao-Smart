import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn, UserPlus, HelpCircle, Key, Lock, Mail, User, Shield, ArrowLeft, MapPin } from 'lucide-react'

// Simple interface toast trigger helper inside auth pages
const triggerToast = (message: string, type: 'success' | 'error' | 'info' | 'warn' = 'info') => {
    window.dispatchEvent(
        new CustomEvent('mazaosmart-toast', {
            detail: { message, type }
        })
    )
}

export const AuthPages: React.FC = () => {
    const { login, register, forgotPassword, resetPassword } = useAuth()

    // Views: 'login' | 'register' | 'forgot' | 'reset'
    const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login')
    const [loading, setLoading] = useState(false)

    // --- Login Form State ---
    const [loginIdent, setLoginIdent] = useState('')
    const [loginPass, setLoginPass] = useState('')

    // --- Registration Form State ---
    const [regName, setRegName] = useState('')
    const [regUser, setRegUser] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regPhone, setRegPhone] = useState('')
    const [regNid, setRegNid] = useState('')
    const [regPass, setRegPass] = useState('')
    const [regConfirmPass, setRegConfirmPass] = useState('')
    const regRole: 'Administrator' | 'Farmer' | 'Agronomist' | 'Technician' = 'Farmer'
    const [regFarmName, setRegFarmName] = useState('')
    const [regDistrict, setRegDistrict] = useState('')
    const [regVillage, setRegVillage] = useState('')
    const [regGps, setRegGps] = useState('')
    const regLang = 'en'
    const [acceptTerms, setAcceptTerms] = useState(false)

    // --- Forgot / Reset Password State ---
    const [forgotIdent, setForgotIdent] = useState('')
    const [resetCode, setResetCode] = useState('')
    const [resetNewPass, setResetNewPass] = useState('')
    const [resetConfirmPass, setResetConfirmPass] = useState('')

    // GPS fetch simulation
    const fetchGPSLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setRegGps(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
                    triggerToast('GPS coordinates fetched successfully!', 'success')
                },
                (error) => {
                    console.warn('Geolocation failed', error)
                    // Hardcode mock GPS for Uganda Mbarara pilot
                    setRegGps('-0.6074, 30.6548')
                    triggerToast('GPS permission denied. Using Mbarara Pilot coordinates.', 'info')
                }
            )
        } else {
            setRegGps('-0.6074, 30.6548')
            triggerToast('Geolocation not supported. Hand-coded Uganda center coordinates.', 'info')
        }
    }

    // --- Submit Handlers ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!loginIdent || !loginPass) {
            triggerToast('Please complete all credential fields.', 'warn')
            return
        }
        setLoading(true)
        const res = await login(loginIdent, loginPass)
        setLoading(false)
        if (!res.success) {
            triggerToast(res.error || 'Authentication denied.', 'error')
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!regName.trim() || !regUser.trim() || !regEmail.trim() || !regPhone.trim() || !regPass || !regFarmName.trim() || !regDistrict.trim() || !regVillage.trim()) {
            triggerToast('Please fill out all required fields.', 'warn')
            return
        }
        if (regUser.length < 3) {
            triggerToast('Username must be at least 3 characters.', 'warn')
            return
        }
        if (!/\S+@\S+\.\S+/.test(regEmail)) {
            triggerToast('Please enter a valid email format.', 'warn')
            return
        }
        if (regPass.length < 6) {
            triggerToast('Password must be at least 6 characters.', 'warn')
            return
        }
        if (regPass !== regConfirmPass) {
            triggerToast('Password verification mismatch.', 'warn')
            return
        }
        if (!acceptTerms) {
            triggerToast('You must accept the terms & conditions.', 'warn')
            return
        }

        setLoading(true)
        const farmLocJson = JSON.stringify({
            district: regDistrict,
            village: regVillage,
            gps: regGps
        })

        const data = {
            full_name: regName,
            username: regUser,
            email: regEmail,
            phone: regPhone,
            national_id: regNid || null,
            password: regPass,
            role: regRole,
            farm_name: regFarmName,
            farm_location: farmLocJson,
            preferred_language: regLang
        }

        const res = await register(data)
        setLoading(false)
        if (res.success) {
            setView('login')
            setLoginIdent(regUser) // prefill username
        } else {
            triggerToast(res.error || 'Registration failed.', 'error')
        }
    }

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!forgotIdent.trim()) {
            triggerToast('Please enter your email or username.', 'warn')
            return
        }
        setLoading(true)
        const res = await forgotPassword(forgotIdent)
        setLoading(false)
        if (res.success) {
            triggerToast(`Verification code sent! Code: ${res.token || 'sent to email'}`, 'success')
            if (res.token) {
                setResetCode(res.token) // autofill code for easier test validation
            }
            setView('reset')
        } else {
            triggerToast(res.error || 'Failed to request reset.', 'error')
        }
    }

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetCode.trim() || !resetNewPass || !resetConfirmPass) {
            triggerToast('Please complete all form fields.', 'warn')
            return
        }
        if (resetNewPass.length < 6) {
            triggerToast('Password must be at least 6 characters long.', 'warn')
            return
        }
        if (resetNewPass !== resetConfirmPass) {
            triggerToast('Passwords do not match.', 'warn')
            return
        }
        setLoading(true)
        const res = await resetPassword(resetCode, resetNewPass)
        setLoading(false)
        if (res.success) {
            setView('login')
        } else {
            triggerToast(res.error || 'Reset code validation failed.', 'error')
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
            {/* Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-950/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-amber-950/15 rounded-full blur-[120px] pointer-events-none" />

            {/* Main Container */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
                <div className="flex justify-center items-center gap-3">
                    <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
                        <Shield className="h-6 w-6 text-slate-900" />
                    </div>
                    <span className="text-2xl font-bold tracking-wide bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                        AgriSense Agronomy Experts
                    </span>
                </div>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Soil Moisture Monitoring & Telemetry Infrastructure
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-2xl py-8 px-6 sm:px-10">

                    {/* 1. LOGIN VIEW */}
                    {view === 'login' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <LogIn className="h-5 w-5 text-emerald-400" /> Authorized Portal Sign In
                            </h2>

                            <form className="space-y-5" onSubmit={handleLogin}>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                        Username or Email
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                                            placeholder="Username or email address"
                                            value={loginIdent}
                                            onChange={(e) => setLoginIdent(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setView('forgot')}
                                            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                                        >
                                            Forgot?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                        <input
                                            type="password"
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                                            placeholder="••••••••"
                                            value={loginPass}
                                            onChange={(e) => setLoginPass(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/10 flex justify-center items-center gap-2 transition-all mt-6 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Sign In'}
                                </button>
                            </form>


                            <div className="mt-6 text-center text-sm">
                                <span className="text-slate-400">Need an account?</span>{' '}
                                <button
                                    onClick={() => setView('register')}
                                    className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                                >
                                    Create one now
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. REGISTRATION VIEW */}
                    {view === 'register' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-emerald-400" /> Portal Registration
                            </h2>

                            <form className="space-y-4 max-h-[60vh] overflow-y-auto pr-1" onSubmit={handleRegister}>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-750 focus:outline-none"
                                        placeholder="Enter full name"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                        Username *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-750 focus:outline-none"
                                        placeholder="username"
                                        value={regUser}
                                        onChange={(e) => setRegUser(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-750 focus:outline-none"
                                        placeholder="name@farm.com"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-700 focus:outline-none"
                                            placeholder="+256..."
                                            value={regPhone}
                                            onChange={(e) => setRegPhone(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                            National ID (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-700 focus:outline-none"
                                            placeholder="ID-..."
                                            value={regNid}
                                            onChange={(e) => setRegNid(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-750 focus:outline-none"
                                            placeholder="••••••"
                                            value={regPass}
                                            onChange={(e) => setRegPass(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                            Confirm Password *
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-750 focus:outline-none"
                                            placeholder="••••••"
                                            value={regConfirmPass}
                                            onChange={(e) => setRegConfirmPass(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-800/80">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                        Farm Details & Logistics
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                            Farm Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-750 focus:outline-none"
                                            placeholder="e.g. Mbarara Estate"
                                            value={regFarmName}
                                            onChange={(e) => setRegFarmName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                            District *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-700 focus:outline-none"
                                            placeholder="District"
                                            value={regDistrict}
                                            onChange={(e) => setRegDistrict(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                            Village *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3.5 text-slate-100 text-sm placeholder-slate-700 focus:outline-none"
                                            placeholder="Village name"
                                            value={regVillage}
                                            onChange={(e) => setRegVillage(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                            GPS Coordinates (optional)
                                        </label>
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-2.5 text-slate-100 text-xs placeholder-slate-700 focus:outline-none"
                                                placeholder="lat, lng"
                                                value={regGps}
                                                onChange={(e) => setRegGps(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={fetchGPSLocation}
                                                className="bg-slate-950 border border-slate-800 hover:border-emerald-500 p-2 rounded-xl text-slate-450 hover:text-emerald-400 transition-colors"
                                                title="Locate Current Lat/Lng"
                                            >
                                                <MapPin className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>



                                <div className="flex items-start gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        className="border-slate-800 rounded bg-slate-950 text-emerald-500 focus:ring-emerald-500 mt-1"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                    />
                                    <label htmlFor="terms" className="text-xs text-slate-400 selection:bg-emerald-500/20">
                                        I accept the{' '}
                                        <span className="text-emerald-400 cursor-pointer hover:underline">
                                            Terms of Service
                                        </span>{' '}
                                        and{' '}
                                        <span className="text-emerald-400 cursor-pointer hover:underline">
                                            Privacy Directives
                                        </span>.
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-xl shadow-lg flex justify-center items-center mt-4 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Creating Account...' : 'Submit Registration'}
                                </button>
                            </form>

                            <div className="mt-5 text-center text-sm border-t border-slate-850 pt-4">
                                <span className="text-slate-400">Already registered?</span>{' '}
                                <button
                                    onClick={() => setView('login')}
                                    className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                                >
                                    Sign In instead
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. FORGOT PASSWORD VIEW */}
                    {view === 'forgot' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-emerald-400" /> Account Recovery
                            </h2>
                            <p className="text-xs text-slate-400 mb-5">
                                Provide your username or email address. If found, we will deliver an 8-character recovery token to verify your ownership.
                            </p>

                            <form className="space-y-4" onSubmit={handleForgot}>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                        Email or Username
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-700 focus:outline-none transition-colors"
                                            placeholder="e.g. admin or admin@agrisense.io"
                                            value={forgotIdent}
                                            onChange={(e) => setForgotIdent(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Searching account...' : 'Request Recovery Code'}
                                </button>
                            </form>

                            <button
                                onClick={() => setView('login')}
                                className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors w-full"
                            >
                                <ArrowLeft className="h-4 w-4" /> Return to Login
                            </button>
                        </div>
                    )}

                    {/* 4. RESET PASSWORD VIEW */}
                    {view === 'reset' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Key className="h-5 w-5 text-emerald-400" /> Check & Reset Credentials
                            </h2>
                            <p className="text-xs text-slate-400 mb-5">
                                We've generated an 8-character authentication check code. Enter it below to commit your new password.
                            </p>

                            <form className="space-y-4" onSubmit={handleReset}>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                        Recovery Token / 8-char Code
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950/80 border border-slate-850 focus:border-emerald-500 tracking-widest text-center text-lg font-bold rounded-xl py-2 px-4 text-slate-100 placeholder-slate-700 focus:outline-none"
                                        placeholder="XYZ123AB"
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-slate-100 text-sm focus:outline-none"
                                        placeholder="New password (min 6 chars)"
                                        value={resetNewPass}
                                        onChange={(e) => setResetNewPass(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                        Verify New Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-slate-100 text-sm focus:outline-none"
                                        placeholder="Verify new password"
                                        value={resetConfirmPass}
                                        onChange={(e) => setResetConfirmPass(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Securing password...' : 'Perform Reset'}
                                </button>
                            </form>

                            <button
                                onClick={() => setView('login')}
                                className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors w-full"
                            >
                                <ArrowLeft className="h-4 w-4" /> Return to Login
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
