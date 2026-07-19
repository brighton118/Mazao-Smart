import React, { useState, useRef, useEffect } from 'react'
import { useSimulation } from '../context/SimulationContext'

interface Message {
    id: string
    sender: 'ai' | 'user'
    text: string
    timestamp: Date
}

export default function AIAssistant() {
    const { state } = useSimulation()
    const { sensors, weather, tankLevel } = state
    const waterLevelPercent = (tankLevel / 5000) * 100

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'm1',
            sender: 'ai',
            text: "Hello! I am AgriSense AI, your digital agronomist. I've audited the farm telemetry. You can ask me questions about moisture, irrigation, hardware health, or local crop recommendations.",
            timestamp: new Date()
        }
    ])

    const [inputVal, setInputVal] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isRagActive, setIsRagActive] = useState(false)
    const [apiKeyMissing, setApiKeyMissing] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    const PRESETS = [
        'Analyze overall soil health',
        'How is irrigation cost trending?',
        'Should I irrigate the coffee crop now?',
        'Check offline hardware nodes'
    ]

    // Check health of RAG service on mount and periodically
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch('http://localhost:8445/api/health')
                if (res.ok) {
                    const data = await res.json()
                    setIsRagActive(data.status === 'healthy' && data.vector_store_initialized)
                    setApiKeyMissing(!data.api_key_configured)
                } else {
                    setIsRagActive(false)
                    setApiKeyMissing(false)
                }
            } catch (e) {
                setIsRagActive(false)
                setApiKeyMissing(false)
            }
        }
        checkHealth()
        const interval = setInterval(checkHealth, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    // Contextual answer parser based on state
    const getSimulatedResponse = (userText: string): string => {
        const txt = userText.toLowerCase()

        // 1. Check offline nodes
        if (txt.includes('offline') || txt.includes('sensor') || txt.includes('hardware') || txt.includes('diagnose')) {
            const offline = sensors.filter(s => !s.online)
            if (offline.length > 0) {
                return `Diagnostic report (Offline Fallback): Sensor node${offline.length > 1 ? 's' : ''} ${offline.map(o => o.id).join(', ')} ${offline.length > 1 ? 'are' : 'is'} currently OFFLINE. I suggest inspecting their solar battery arrays. The remaining ${sensors.length - offline.length} sensor probes are online and reporting normally.`
            }
            return "All registered sensor probes (nodes) are broadcasting telemetry normally. Batteries are above 80% charge levels at present."
        }

        // 2. Cost and billing
        if (txt.includes('cost') || txt.includes('billing') || txt.includes('water') || txt.includes('tariff')) {
            const activeValves = sensors.filter(s => s.online && s.irrigating).length
            return `Economic summary (Offline Fallback): The cost rate is currently ${activeValves > 0 ? `${(activeValves * 20).toLocaleString()} UGX / min` : '0 UGX / min (valves closed)'}. Given current reservoir level (${waterLevelPercent.toFixed(1)}%), we have sufficient reserves for the next 4 days without drawing from municipal mains.`
        }

        // 3. Soil moisture trends
        if (txt.includes('moisture') || txt.includes('health') || txt.includes('soil') || txt.includes('vwc')) {
            const meanMoisture = sensors.filter(s => s.online).reduce((acc, curr) => acc + curr.moisture, 0) / (sensors.filter(s => s.online).length || 1)
            const dryNodes = sensors.filter(s => s.online && s.moisture < s.minMoisture)

            if (dryNodes.length > 0) {
                return `Soil audit (Offline Fallback): The average moisture index is ${meanMoisture.toFixed(1)}% VWC. However, plot${dryNodes.length > 1 ? 's' : ''} ${dryNodes.map(d => d.plot).join(', ')} ${dryNodes.length > 1 ? 'are' : 'is'} displaying critical moisture deficits. Autocommands have triggered valves. R3F model reflects dry soil rendering.`
            }
            return `Soil audit (Offline Fallback): Average farm moisture is ${meanMoisture.toFixed(1)}% VWC, which matches the target threshold for ${weather === 'sunny' ? 'sunny' : 'rainy'} conditions.`
        }

        // 4. Coffee crop specific
        if (txt.includes('coffee')) {
            const coffeeSensors = sensors.filter(s => s.crop === 'Coffee')
            if (coffeeSensors.length > 0) {
                const isDry = coffeeSensors.some(s => s.moisture < s.minMoisture)
                return `Coffee agronomy report: Coffee crop is registered at 40cm probe depth. Current moisture is ${coffeeSensors[0].moisture.toFixed(0)}% vwc. ${isDry ? 'This is below the optimal trigger. Irrigation run is active.' : 'Optimal level. No auxiliary watering needed today.'}`
            }
            return "There are no sensor nodes currently designated for Coffee crop in the registry. Head to 'Sensors' to register Node designation."
        }

        // 5. Default fallback responses
        return "I recommend monitoring the live 3D digital twin to trace valve flow states. The weather forecasts indicate a transition, so keep automatic triggers loaded."
    }

    const triggerReply = async (text: string) => {
        // Add user message
        const userMsg: Message = {
            id: `usr-${Date.now()}`,
            sender: 'user',
            text,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setIsTyping(true)

        // Try to query the RAG FastAPI backend
        try {
            const response = await fetch('http://localhost:8445/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: text,
                    state: state,
                    history: messages.map(m => ({
                        role: m.sender === 'user' ? 'user' : 'model',
                        text: m.text
                    }))
                })
            })

            if (!response.ok) {
                throw new Error("RAG API server response error")
            }

            const data = await response.json()
            if (data.error && data.error.includes("Gemini API key")) {
                // If API Key is missing or there's an error payload, show the error response and fallback
                setMessages(prev => [...prev, {
                    id: `ai-${Date.now()}`,
                    sender: 'ai',
                    text: data.response || "No API key configured for Gemini RAG.",
                    timestamp: new Date()
                }])
            } else {
                setMessages(prev => [...prev, {
                    id: `ai-${Date.now()}`,
                    sender: 'ai',
                    text: data.response,
                    timestamp: new Date()
                }])
            }
        } catch (error) {
            console.warn("FastAPI RAG server offline or failed. Falling back to local offline logic...", error)
            // Local fallback delay for realistic assistant feel
            setTimeout(() => {
                const responseText = getSimulatedResponse(text)
                setMessages(prev => [...prev, {
                    id: `ai-${Date.now()}`,
                    sender: 'ai',
                    text: responseText,
                    timestamp: new Date()
                }])
            }, 600)
        } finally {
            setIsTyping(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputVal.trim()) return
        const text = inputVal.trim()
        setInputVal('')
        triggerReply(text)
    }

    return (
        <div style={{ padding: '24px 0', maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
            `}</style>

            {/* Title block */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '16px', height: '2px', background: '#4caf7d' }} />
                        <span style={{ fontSize: '11px', color: '#4caf7d', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }} className="font-mono-data">
                            AgriSense Agronomy Expert
                        </span>
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', margin: 0 }} className="font-display">
                        AgriSense AI
                    </h2>
                </div>

                {/* Connection Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 12px' }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: apiKeyMissing ? '#ffaa00' : isRagActive ? '#4caf7d' : '#888888',
                        boxShadow: apiKeyMissing
                            ? '0 0 8px #ffaa00'
                            : isRagActive
                                ? '0 0 8px #4caf7d'
                                : 'none'
                    }} />
                    <span style={{
                        fontSize: '11px',
                        color: apiKeyMissing ? '#ffaa00' : isRagActive ? '#4caf7d' : '#8aab90',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                    }} className="font-mono-data">
                        {isRagActive ? (apiKeyMissing ? 'RAG Active (API KEY MISSING)' : 'RAG Agent Active') : 'Offline Backup Agent'}
                    </span>
                </div>
            </div>

            {/* Main chat window container */}
            <div style={{
                flex: 1,
                background: 'rgba(22, 46, 30, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(245, 239, 230, 0.08)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>

                {/* Messages list */}
                <div style={{
                    flex: 1,
                    padding: '20px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {messages.map(m => {
                        const isUser = m.sender === 'user'
                        return (
                            <div
                                key={m.id}
                                style={{
                                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                                    maxWidth: '75%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isUser ? 'flex-end' : 'flex-start',
                                }}
                            >
                                {/* Badge ID */}
                                <span className="font-mono-data" style={{ fontSize: '10px', color: '#8aab90', marginBottom: '4px' }}>
                                    {isUser ? 'YOU' : 'AGRISENSE AI'} · {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>

                                {/* Message bubble */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                    background: isUser ? 'rgba(76,175,125,0.2)' : 'rgba(22,46,30,0.6)',
                                    border: `1px solid ${isUser ? 'rgba(76,175,125,0.4)' : 'rgba(245,239,230,0.08)'}`,
                                    color: '#f5efe6',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    whiteSpace: 'pre-line'
                                }}>
                                    {m.text}
                                </div>
                            </div>
                        )
                    })}

                    {/* Bouncing Dots Typing Indicator */}
                    {isTyping && (
                        <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="font-mono-data" style={{ fontSize: '10px', color: '#8aab90', marginBottom: '4px' }}>
                                AGRISENSE AI · Thinking...
                            </span>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '12px 12px 12px 2px',
                                background: 'rgba(22,46,30,0.6)',
                                border: '1px solid rgba(245,239,230,0.08)',
                                display: 'flex',
                                gap: '4px',
                                alignItems: 'center'
                            }}>
                                <span style={{ width: '6px', height: '6px', background: '#4caf7d', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out' }}></span>
                                <span style={{ width: '6px', height: '6px', background: '#4caf7d', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }}></span>
                                <span style={{ width: '6px', height: '6px', background: '#4caf7d', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Presets suggestions */}
                <div style={{ padding: '0 20px 10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {PRESETS.map(p => (
                        <button
                            key={p}
                            onClick={() => triggerReply(p)}
                            style={{
                                background: 'rgba(245,239,230,0.03)',
                                border: '1px solid rgba(245,239,230,0.1)',
                                borderRadius: '16px',
                                padding: '6px 12px',
                                color: '#8aab90',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'DM Sans, sans-serif'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(76,175,125,0.1)'
                                e.currentTarget.style.borderColor = 'rgba(76,175,125,0.3)'
                                e.currentTarget.style.color = '#4caf7d'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(245,239,230,0.03)'
                                e.currentTarget.style.borderColor = 'rgba(245,239,230,0.1)'
                                e.currentTarget.style.color = '#8aab90'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Input box */}
                <form onSubmit={handleSubmit} style={{
                    padding: '16px',
                    borderTop: '1px solid rgba(245,239,230,0.08)',
                    background: 'rgba(5, 12, 8, 0.4)',
                    display: 'flex',
                    gap: '12px'
                }}>
                    <input
                        type="text"
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        placeholder="Ask a question about the weather, dry soil nodes, or irrigation budgets..."
                        style={{
                            flex: 1,
                            background: 'rgba(12,30,19,0.6)',
                            border: '1px solid rgba(245,239,230,0.1)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            color: '#f5efe6',
                            outline: 'none',
                            fontSize: '14px',
                            fontFamily: 'DM Sans, sans-serif'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            background: '#4caf7d',
                            color: '#0f2318',
                            fontWeight: 700,
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontFamily: 'DM Sans, sans-serif'
                        }}
                    >
                        Send
                    </button>
                </form>

            </div>

        </div>
    )
}
