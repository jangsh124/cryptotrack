import { useState, useMemo } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell, PieChart, Pie,
} from 'recharts'
import { useMarketStats } from '../hooks/useMarketStats'
import { calcPnL, formatUSD, toUSD } from '../utils/calculations'
import { getCurrency } from '../hooks/useExchangePrices'

// ─── Fear & Greed ───────────────────────────────────────────────
const FG_COLORS = {
  'Extreme Fear': '#EF4444',
  Fear: '#F97316',
  Neutral: '#EAB308',
  Greed: '#84CC16',
  'Extreme Greed': '#10B981',
}
const FG_KO = {
  'Extreme Fear': '극단적 공포',
  Fear: '공포',
  Neutral: '중립',
  Greed: '탐욕',
  'Extreme Greed': '극단적 탐욕',
}

function FearGreedGauge({ value, label }) {
  const color = FG_COLORS[label] ?? '#6B7280'
  const rotation = (value / 100) * 180 - 90
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full">
          {/* Track */}
          <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" strokeLinecap="round" />
          {/* Segments */}
          {[
            { color: '#EF4444', dash: '28 141', offset: '0' },
            { color: '#F97316', dash: '28 141', offset: '-28' },
            { color: '#EAB308', dash: '28 141', offset: '-56' },
            { color: '#84CC16', dash: '28 141', offset: '-84' },
            { color: '#10B981', dash: '28 141', offset: '-112' },
          ].map((s, i) => (
            <path key={i} d="M 10 100 A 90 90 0 0 1 190 100" fill="none"
              stroke={s.color} strokeWidth="18" strokeLinecap="round" strokeOpacity="0.8"
              strokeDasharray={s.dash} strokeDashoffset={s.offset} />
          ))}
          {/* Needle */}
          <g transform={`rotate(${rotation}, 100, 100)`}>
            <line x1="100" y1="100" x2="100" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="100" r="5" fill="white" />
          </g>
        </svg>
      </div>
      <div className="text-center -mt-2">
        <p className="text-5xl font-black" style={{ color }}>{value}</p>
        <p className="text-sm font-bold mt-1" style={{ color }}>{FG_KO[label] ?? label}</p>
      </div>
    </div>
  )
}

// ─── Dominance Bar ───────────────────────────────────────────────
const DOM_COLORS = ['#F97316', '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#6B7280']
const DOM_NAMES = { btc: 'BTC', eth: 'ETH', bnb: 'BNB', xrp: 'XRP', sol: 'SOL' }

function DominanceChart({ dominance }) {
  const data = Object.entries(dominance ?? {})
    .slice(0, 6)
    .map(([key, val]) => ({ name: (DOM_NAMES[key] ?? key.toUpperCase()), value: parseFloat(val.toFixed(1)) }))
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis hide domain={[0, 'dataMax + 5']} />
        <Tooltip
          formatter={(v) => [`${v}%`, '도미넌스']}
          contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={DOM_COLORS[i]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Fear & Greed 30d history ────────────────────────────────────
function FGHistory({ data }) {
  if (!data?.length) return null
  const chartData = [...data].reverse().slice(-14).map((d) => ({
    date: new Date(d.timestamp * 1000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    value: parseInt(d.value),
    label: d.value_classification,
  }))
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={chartData} barCategoryGap="15%">
        <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
        <YAxis hide domain={[0, 100]} />
        <Tooltip
          formatter={(v, _, props) => [`${v} — ${FG_KO[props.payload.label] ?? props.payload.label}`]}
          contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={FG_COLORS[d.label] ?? '#6B7280'} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Portfolio: Avg vs Current ───────────────────────────────────
function AvgVsCurrentChart({ holdings, getPrice, usdToKrw }) {
  const data = holdings.map((h) => {
    const currency = getCurrency(h.exchange)
    const price = getPrice(h.exchange, h.symbol)
    if (price === null || price === undefined) return null
    const { avgPrice, pnlPct } = calcPnL(h, price)
    const avgUSD = toUSD(avgPrice, currency, usdToKrw)
    const curUSD = toUSD(price, currency, usdToKrw)
    const label = `${h.symbol} (${h.exchange})`
    return { name: label, avgUSD, curUSD, pnlPct, isProfit: pnlPct >= 0 }
  }).filter(Boolean).filter(d => d.curUSD > 0 || d.avgUSD > 0)

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600 text-sm">
        가격 데이터를 불러오는 중이에요. 잠시 후 새로고침해주세요.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 70)}>
      <BarChart data={data} layout="vertical" barCategoryGap="30%" margin={{ left: 8 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          formatter={(v, name) => [formatUSD(v), name === '평단가' ? '평단가' : '현재가']}
          contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
        />
        <Bar dataKey="avgUSD" name="평단가" fill="rgba(255,255,255,0.18)" radius={[0, 4, 4, 0]} />
        <Bar dataKey="curUSD" name="현재가" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.isProfit ? '#10B981' : '#EF4444'} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── ROI Cards ───────────────────────────────────────────────────
function ROICards({ holdings, getPrice, usdToKrw }) {
  const items = holdings.map((h) => {
    const currency = getCurrency(h.exchange)
    const price = getPrice(h.exchange, h.symbol) ?? 0
    const { pnlPct, pnl, currentValue } = calcPnL(h, price)
    const pnlUSD = toUSD(pnl, currency, usdToKrw)
    const curUSD = toUSD(currentValue, currency, usdToKrw)
    return { symbol: h.symbol, exchange: h.exchange, pnlPct, pnlUSD, curUSD }
  }).filter(d => d.curUSD > 0).sort((a, b) => b.pnlPct - a.pnlPct)

  if (!items.length) return null
  const best = items[0]
  const worst = items[items.length - 1]

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-2xl p-4">
        <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-2">최고 수익</p>
        <p className="text-xl font-black text-white">{best.symbol}</p>
        <p className="text-xs text-gray-500 mb-2">{best.exchange}</p>
        <p className="text-2xl font-black text-emerald-400">+{best.pnlPct.toFixed(2)}%</p>
        <p className="text-xs text-emerald-400/70 mt-0.5">{formatUSD(best.pnlUSD)}</p>
      </div>
      <div className="bg-red-500/8 border border-red-500/15 rounded-2xl p-4">
        <p className="text-xs text-red-400 font-bold uppercase tracking-widest mb-2">최저 수익</p>
        <p className="text-xl font-black text-white">{worst.symbol}</p>
        <p className="text-xs text-gray-500 mb-2">{worst.exchange}</p>
        <p className="text-2xl font-black text-red-400">{worst.pnlPct.toFixed(2)}%</p>
        <p className="text-xs text-red-400/70 mt-0.5">{formatUSD(worst.pnlUSD)}</p>
      </div>
    </div>
  )
}

// ─── Portfolio Pie by Exchange ────────────────────────────────────
const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#F97316']

function ExchangePie({ holdings, getPrice, usdToKrw }) {
  const byExchange = {}
  holdings.forEach((h) => {
    const currency = getCurrency(h.exchange)
    const price = getPrice(h.exchange, h.symbol) ?? 0
    const { currentValue } = calcPnL(h, price)
    const usd = toUSD(currentValue, currency, usdToKrw)
    byExchange[h.exchange] = (byExchange[h.exchange] ?? 0) + usd
  })
  const data = Object.entries(byExchange).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  if (data.length < 2) return null
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={3} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => [formatUSD(v)]} contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 flex-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="text-gray-300 font-medium">{d.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">{formatUSD(d.value)}</span>
              <span className="text-white font-bold text-xs w-10 text-right">{((d.value / total) * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────
export default function AnalyticsPage({ onBack, holdings, getPrice, usdToKrw }) {
  const [tab, setTab] = useState('market')
  const { fearGreed, dominance, globalData, loading } = useMarketStats()

  const latestFG = fearGreed?.[0]
  const totalMcap = globalData?.total_market_cap?.usd
  const mcapChange = globalData?.market_cap_change_percentage_24h_usd

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 py-4">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-violet-400" />
              <h1 className="text-lg font-bold text-white">분석</h1>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 gap-1">
            <button onClick={() => setTab('market')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'market' ? 'bg-violet-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
              <Activity size={14} /> 시장
            </button>
            <button onClick={() => setTab('portfolio')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'portfolio' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
              <TrendingUp size={14} /> 내 포트폴리오
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-lg mx-auto px-4 lg:px-8 py-6">

        {/* ── MARKET TAB ── */}
        {tab === 'market' && (
          <div className="space-y-5">
            {/* Total Market Cap */}
            {globalData && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 bg-white/5 border border-white/8 rounded-2xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">글로벌 시가총액</p>
                  <p className="text-3xl font-black text-white">
                    ${totalMcap ? (totalMcap / 1e12).toFixed(2) : '—'}T
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${mcapChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {mcapChange >= 0 ? '▲' : '▼'} {Math.abs(mcapChange ?? 0).toFixed(2)}% (24h)
                  </p>
                </div>
                <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">활성 코인</p>
                  <p className="text-3xl font-black text-white">{globalData.active_cryptocurrencies?.toLocaleString()}</p>
                  <p className="text-xs text-gray-600 mt-1">거래소 {globalData.markets?.toLocaleString()}개</p>
                </div>
              </div>
            )}

            {/* Fear & Greed */}
            <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-5">공포 & 탐욕 지수</p>
              {loading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : latestFG ? (
                <>
                  <FearGreedGauge value={parseInt(latestFG.value)} label={latestFG.value_classification} />
                  <p className="text-xs text-gray-600 text-center mt-3 mb-5">
                    {new Date(latestFG.timestamp * 1000).toLocaleDateString('ko-KR')} 기준
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">최근 14일 추이</p>
                  <FGHistory data={fearGreed} />
                </>
              ) : (
                <p className="text-center text-gray-600 text-sm py-8">데이터를 불러올 수 없어요</p>
              )}
            </div>

            {/* Dominance */}
            <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-5">코인 도미넌스</p>
              {loading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : dominance ? (
                <DominanceChart dominance={dominance} />
              ) : (
                <p className="text-center text-gray-600 text-sm py-8">데이터를 불러올 수 없어요</p>
              )}
            </div>
          </div>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {tab === 'portfolio' && (
          <div className="space-y-5">
            {/* Best / Worst */}
            <ROICards holdings={holdings} getPrice={getPrice} usdToKrw={usdToKrw} />

            {/* Avg vs Current */}
            <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-2">평단가 vs 현재가</p>
              <p className="text-xs text-gray-600 mb-5">회색 = 평단가 · 컬러 = 현재가 (초록: 수익 / 빨강: 손실)</p>
              <AvgVsCurrentChart holdings={holdings} getPrice={getPrice} usdToKrw={usdToKrw} />
            </div>

            {/* Exchange breakdown pie */}
            <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-5">거래소별 자산 분배</p>
              <ExchangePie holdings={holdings} getPrice={getPrice} usdToKrw={usdToKrw} />
            </div>

            {/* Holdings table */}
            <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">보유 코인 수익률 순위</p>
              <div className="space-y-2">
                {holdings
                  .map((h) => {
                    const currency = getCurrency(h.exchange)
                    const price = getPrice(h.exchange, h.symbol) ?? 0
                    const { pnlPct, pnl, currentValue } = calcPnL(h, price)
                    return { ...h, pnlPct, pnlUSD: toUSD(pnl, currency, usdToKrw), curUSD: toUSD(currentValue, currency, usdToKrw) }
                  })
                  .filter(h => h.curUSD > 0)
                  .sort((a, b) => b.pnlPct - a.pnlPct)
                  .map((h, i) => {
                    const isProfit = h.pnlPct >= 0
                    const barPct = Math.min(Math.abs(h.pnlPct) / 100 * 100, 100)
                    return (
                      <div key={h.id} className="flex items-center gap-3 py-2">
                        <span className="text-gray-600 text-xs w-4 text-right">{i + 1}</span>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5">
                          <span className="text-xs font-bold text-gray-300">{h.symbol.slice(0,3)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-semibold text-white">{h.symbol} <span className="text-xs text-gray-600">{h.exchange}</span></span>
                            <span className={`text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isProfit ? '+' : ''}{h.pnlPct.toFixed(2)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${isProfit ? 'bg-emerald-500' : 'bg-red-500'}`}
                              style={{ width: `${barPct}%` }} />
                          </div>
                        </div>
                        <span className={`text-xs font-medium w-20 text-right ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isProfit ? '+' : ''}{formatUSD(h.pnlUSD)}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
