import { useState } from 'react'
import { useSimulation } from '../context/SimulationContext'

interface Invoice {
    id: string
    date: string
    amountUGX: number
    status: 'paid' | 'unpaid'
    greenhouseLiters: number
    outfieldLiters: number
}

export default function WaterBilling() {
    const { state } = useSimulation()

    const [tariffRate, setTariffRate] = useState(15) // 15 UGX per liter of agricultural water
    const [selectedCurrency, setSelectedCurrency] = useState<'UGX' | 'USD'>('UGX')

    // Invoices ledger (simulated / persistent for session)
    const [invoices, setInvoices] = useState<Invoice[]>([
        { id: 'INV-0705', date: '2026-07-05', amountUGX: 7900 * 15, status: 'paid', greenhouseLiters: 2400, outfieldLiters: 5500 },
        { id: 'INV-0628', date: '2026-06-28', amountUGX: 7100 * 15, status: 'paid', greenhouseLiters: 2200, outfieldLiters: 4900 },
    ])

    // Historical context (simulated 7 days)
    const historyData = [
        { day: 'Mon', greenhouse: 240, outfield: 550, rainfall: 4.5 },
        { day: 'Tue', greenhouse: 220, outfield: 480, rainfall: 1.2 },
        { day: 'Wed', greenhouse: 280, outfield: 300, rainfall: 8.0 },
        { day: 'Thu', greenhouse: 190, outfield: 600, rainfall: 0.0 },
        { day: 'Fri', greenhouse: 250, outfield: 580, rainfall: 0.2 },
        { day: 'Sat', greenhouse: 310, outfield: 420, rainfall: 3.5 },
        { day: 'Sun', greenhouse: 200, outfield: 390, rainfall: 12.4 },
    ]

    // Calculate current flow rates
    const activeGreenhouseCount = state.sensors.filter(s => s.plot.toLowerCase().includes('greenhouse') && s.irrigating).length
    const activeOutfieldCount = state.sensors.filter(s => (s.plot.toLowerCase().includes('outfield') || s.plot.toLowerCase().includes('garden')) && s.irrigating).length
    const activePumpCount = state.pumpActive ? 1 : 0

    const projectedVWCUsageLpm = (activeGreenhouseCount * 15) + (activeOutfieldCount * 25)
    const powerConsumptionKw = activePumpCount * 0.75

    // Daily totals
    const totalRainfallWeek = historyData.reduce((acc, curr) => acc + curr.rainfall, 0)
    const totalWaterGreenhouse = historyData.reduce((acc, curr) => acc + curr.greenhouse, 0)
    const totalWaterOutfield = historyData.reduce((acc, curr) => acc + curr.outfield, 0)
    const totalWaterConsumed = totalWaterGreenhouse + totalWaterOutfield

    // Convert rate
    const formatCost = (literAmount: number) => {
        const costInUGX = literAmount * tariffRate
        if (selectedCurrency === 'USD') {
            const costInUSD = costInUGX / 3700 // roughly 3700 UGX = 1 USD
            return `$${costInUSD.toFixed(2)}`
        }
        return `${costInUGX.toLocaleString()} UGX`
    }

    // Savings estimation
    const estimatedManualWater = totalWaterConsumed * 1.3
    const litersSaved = Math.max(0, estimatedManualWater - totalWaterConsumed)
    const costSavedUGX = litersSaved * tariffRate

    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '16px', height: '2px', background: '#4caf7d' }} />
                        <span style={{ fontSize: '11px', color: '#4caf7d', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }} className="font-mono-data">
                            Resource Economics Summary
                        </span>
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 32px)', fontWeight: 800, color: '#f5efe6', textTransform: 'uppercase', margin: 0 }} className="font-display">
                        Water & Utility Billing
                    </h2>
                    <div style={{ fontSize: '12px', color: '#8aab90', marginTop: '6px' }}>
                        Interactive cost auditor connected to telemetry solenoid discharge.
                    </div>
                </div>

                {/* Currency Switcher Toggle */}
                <div style={{ display: 'flex', background: 'rgba(22, 46, 30, 0.4)', border: '1px solid rgba(245,239,230,0.1)', borderRadius: '8px', padding: '4px' }}>
                    <button
                        onClick={() => setSelectedCurrency('UGX')}
                        style={{
                            padding: '8px 16px',
                            minHeight: '44px',
                            borderRadius: '6px',
                            border: 'none',
                            background: selectedCurrency === 'UGX' ? 'rgba(76,175,125,0.2)' : 'transparent',
                            color: selectedCurrency === 'UGX' ? '#4caf7d' : '#8aab90',
                            fontWeight: 650,
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontFamily: 'DM Mono, monospace'
                        }}
                    >
                        UGX (Shs)
                    </button>
                    <button
                        onClick={() => setSelectedCurrency('USD')}
                        style={{
                            padding: '8px 16px',
                            minHeight: '44px',
                            borderRadius: '6px',
                            border: 'none',
                            background: selectedCurrency === 'USD' ? 'rgba(76,175,125,0.2)' : 'transparent',
                            color: selectedCurrency === 'USD' ? '#4caf7d' : '#8aab90',
                            fontWeight: 650,
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontFamily: 'DM Mono, monospace'
                        }}
                    >
                        USD ($)
                    </button>
                </div>
            </div>

            {/* Main Billing KPI Blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px', marginBottom: '24px' }}>

                {/* Metric 1: Monthly Cost Projected */}
                <div style={{ background: 'rgba(22, 46, 30, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ color: '#8aab90', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }} className="font-mono-data">
                        Current Week Cost
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#f5efe6', marginBottom: '4px' }} className="font-mono-data">
                        {formatCost(totalWaterConsumed)}
                    </div>
                    <div style={{ color: '#8aab90', fontSize: '12px' }}>
                        Based on {totalWaterConsumed.toLocaleString()} L total discharge
                    </div>
                </div>

                {/* Metric 2: Live Flow Rate Cost */}
                <div style={{ background: 'rgba(22, 46, 30, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ color: '#8aab90', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }} className="font-mono-data">
                        Live Metering Cost
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#4caf7d', marginBottom: '4px' }} className="font-mono-data">
                        {formatCost(projectedVWCUsageLpm)} / min
                    </div>
                    <div style={{ color: '#8aab90', fontSize: '12px' }}>
                        Flowing now: {projectedVWCUsageLpm} L/min ({activeGreenhouseCount + activeOutfieldCount} valves live)
                    </div>
                </div>

                {/* Metric 3: Optimization Savings */}
                <div style={{ background: 'rgba(22, 46, 30, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ color: '#8aab90', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }} className="font-mono-data">
                        AI Automated Savings
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#e8a042', marginBottom: '4px' }} className="font-mono-data">
                        {selectedCurrency === 'USD' ? `$${(costSavedUGX / 3700).toFixed(2)}` : `${costSavedUGX.toLocaleString()} UGX`}
                    </div>
                    <div style={{ color: '#8aab90', fontSize: '12px' }}>
                        Saved {litersSaved.toFixed(0)} Liters vs manual scheduling
                    </div>
                </div>

                {/* Metric 4: Power Overhead */}
                <div style={{ background: 'rgba(22, 46, 30, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ color: '#8aab90', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }} className="font-mono-data">
                        Pump Power Overhead
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#f5efe6', marginBottom: '4px' }} className="font-mono-data">
                        {powerConsumptionKw} kW
                    </div>
                    <div style={{ color: '#8aab90', fontSize: '12px' }}>
                        {activePumpCount} main pump{activePumpCount !== 1 ? 's' : ''} drawing power
                    </div>
                </div>
            </div>

            {/* Main Grid: Analytical Chart & Consumer List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* Weekly Consumption Graph */}
                <div style={{ background: 'rgba(22, 46, 30, 0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '24px' }}>
                    <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: '#f5efe6', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Weekly Consumption Breakdown
                    </h3>
                    <p style={{ fontSize: '13px', color: '#8aab90', marginBottom: '24px' }}>
                        Rainfall events correlate directly with lower outfield irrigation discharge.
                    </p>

                    {/* Bar Chart Visualization (using CSS divs) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        {historyData.map(d => {
                            const maxWeeklyVal = 950 // Max possible for graph limit
                            const ghPct = (d.greenhouse / maxWeeklyVal) * 100
                            const outPct = (d.outfield / maxWeeklyVal) * 100
                            const rainPct = (d.rainfall / 15) * 100 // Rainfall max 15mm

                            return (
                                <div key={d.day} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px', alignItems: 'center', gap: '16px' }}>
                                    <span className="font-mono-data" style={{ color: '#f5efe6', fontSize: '13px', fontWeight: 600 }}>{d.day}</span>

                                    {/* Stacked Bar container */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {/* Irrigation discharge bar */}
                                        <div style={{ height: '10px', background: 'rgba(245,239,230,0.05)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                                            <div style={{ width: `${ghPct}%`, height: '100%', background: '#4caf7d', transition: 'width 0.5s' }} title={`Greenhouse: ${d.greenhouse}L`} />
                                            <div style={{ width: `${outPct}%`, height: '100%', background: '#6abf93', borderLeft: '1px solid rgba(22,46,30,0.5)', transition: 'width 0.5s' }} title={`Outfield: ${d.outfield}L`} />
                                        </div>

                                        {/* Rain indicator bar */}
                                        {d.rainfall > 0 && (
                                            <div style={{ height: '3px', background: 'rgba(245,239,230,0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                                                <div style={{ width: `${rainPct}%`, height: '100%', background: '#45a5f5', transition: 'width 0.5s' }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Right label stats */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span className="font-mono-data" style={{ fontSize: '12px', color: '#f5efe6', fontWeight: 600 }}>
                                            {(d.greenhouse + d.outfield)} L
                                        </span>
                                        {d.rainfall > 0 && (
                                            <span className="font-mono-data" style={{ fontSize: '10px', color: '#45a5f5' }}>
                                                ☔ {d.rainfall} mm
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Legend and stats */}
                    <div style={{ display: 'flex', gap: '20px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(245,239,230,0.08)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8aab90' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#4caf7d' }} />
                            Greenhouse ({totalWaterGreenhouse.toLocaleString()} L)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8aab90' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6abf93' }} />
                            Outfield Garden ({totalWaterOutfield.toLocaleString()} L)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8aab90' }}>
                            <div style={{ width: '12px', height: '3px', borderRadius: '1px', background: '#45a5f5' }} />
                            Rainfall Sum ({totalRainfallWeek.toFixed(1)} mm)
                        </div>
                    </div>
                </div>

                {/* Right Column: Tariff & Invoices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Discharge Rate Tariff */}
                    <div style={{ background: 'rgba(22, 46, 30, 0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '24px' }}>
                        <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: '#f5efe6', marginBottom: '16px', textTransform: 'uppercase' }}>
                            Tariff Details
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ borderBottom: '1px solid rgba(245,239,230,0.08)', paddingBottom: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#8aab90', marginBottom: '4px' }} className="font-mono-data">AGRICULTURAL WATER RATE</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '16px', color: '#f5efe6', fontWeight: 650 }}>{tariffRate} UGX / Liter</div>
                                    <button
                                        onClick={() => {
                                            const res = prompt('Configure agricultural water tariff (UGX/Liter):', tariffRate.toString())
                                            if (res && !isNaN(Number(res))) {
                                                setTariffRate(Math.max(1, Number(res)))
                                            }
                                        }}
                                        style={{
                                            background: 'rgba(76,175,125,0.15)',
                                            border: '1px solid rgba(76,175,125,0.3)',
                                            borderRadius: '4px',
                                            color: '#4caf7d',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '8px 12px',
                                            minHeight: '44px',
                                            cursor: 'pointer',
                                            fontFamily: 'DM Sans, sans-serif'
                                        }}
                                    >
                                        Configure
                                    </button>
                                </div>
                                <div style={{ fontSize: '12px', color: '#8aab90', marginTop: '4px' }}>Subsidized Mbarara Municipality Scheme</div>
                            </div>

                            <div style={{ borderBottom: '1px solid rgba(245,239,230,0.08)', paddingBottom: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#8aab90', marginBottom: '4px' }} className="font-mono-data">GRID POWER REFERENCE</div>
                                <div style={{ fontSize: '16px', color: '#f5efe6', fontWeight: 650 }}>820 UGX / kWh</div>
                                <div style={{ fontSize: '12px', color: '#8aab90', marginTop: '2px' }}>Offsets from Solar Array active when sun intensity &gt; 15%</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: '#8aab90', marginBottom: '8px' }} className="font-mono-data">BILLING ALERTS</div>
                                <div style={{ background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#8aab90' }}>
                                    💡 <span style={{ color: '#4caf7d', fontWeight: 600 }}>Rain sensors online:</span> Soil moisture is expected to rise from the 12.4mm rainfall event, automatically throttling pump discharge to reduce costs by 45% today.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Ledger Card */}
                    <div style={{ background: 'rgba(22, 46, 30, 0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 239, 230, 0.08)', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: '#f5efe6', margin: 0, textTransform: 'uppercase' }}>
                                Invoice Ledger
                            </h3>
                            <button
                                onClick={() => {
                                    const invoiceId = `INV-${Math.floor(100 + Math.random() * 900)}`
                                    const nowStr = new Date().toISOString().split('T')[0]
                                    setInvoices([
                                        {
                                            id: invoiceId,
                                            date: nowStr,
                                            amountUGX: totalWaterConsumed * tariffRate,
                                            status: 'unpaid',
                                            greenhouseLiters: totalWaterGreenhouse,
                                            outfieldLiters: totalWaterOutfield
                                        },
                                        ...invoices
                                    ])
                                }}
                                style={{
                                    background: 'rgba(76,175,125,0.15)',
                                    border: '1px solid rgba(76,175,125,0.3)',
                                    borderRadius: '6px',
                                    color: '#4caf7d',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '8px 12px',
                                    minHeight: '44px',
                                    cursor: 'pointer',
                                    fontFamily: 'DM Sans, sans-serif'
                                }}
                            >
                                Generate Invoice
                            </button>
                        </div>

                        {/* List of Invoices */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {invoices.map(inv => (
                                <div key={inv.id} style={{
                                    background: 'rgba(5, 15, 8, 0.3)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: '1px solid rgba(245, 239, 230, 0.04)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="font-mono-data" style={{ fontSize: '12px', fontWeight: 700, color: '#f5efe6' }}>{inv.id}</span>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 850,
                                            textTransform: 'uppercase',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: inv.status === 'paid' ? 'rgba(76,175,125,0.15)' : 'rgba(232,160,66,0.15)',
                                            color: inv.status === 'paid' ? '#4caf7d' : '#e8a042',
                                            border: `1px solid ${inv.status === 'paid' ? 'rgba(76,175,125,0.3)' : 'rgba(232,160,66,0.3)'}`
                                        }}>
                                            {inv.status}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8aab90' }}>
                                        <span>Date: {inv.date}</span>
                                        <span className="font-mono-data" style={{ fontWeight: 600, color: '#f5efe6' }}>
                                            {selectedCurrency === 'USD' ? `$${((inv.amountUGX) / 3700).toFixed(2)}` : `${inv.amountUGX.toLocaleString()} UGX`}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#8aab90' }}>
                                        Breakdown: Greenhouse {inv.greenhouseLiters}L · Outfield {inv.outfieldLiters}L
                                    </div>
                                    {inv.status === 'unpaid' && (
                                        <button
                                            onClick={() => {
                                                setInvoices(invoices.map(i => i.id === inv.id ? { ...i, status: 'paid' as const } : i))
                                            }}
                                            style={{
                                                marginTop: '4px',
                                                width: '100%',
                                                background: 'rgba(76,175,125,0.15)',
                                                border: '1px solid rgba(76,175,125,0.3)',
                                                borderRadius: '4px',
                                                color: '#4caf7d',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                padding: '10px',
                                                minHeight: '44px',
                                                cursor: 'pointer',
                                                fontFamily: 'DM Sans, sans-serif'
                                            }}
                                        >
                                            💵 Mark Paid (Execute Billing Clear)
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
