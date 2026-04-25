import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { RefreshCw } from 'lucide-react'
import { formatUSD } from '../utils/calculations'

const RANGES = [
  { label: '7일', days: 7 },
  { label: '30일', days: 30 },
  { label: '90일', days: 90 },
]

function formatDate(date, days) {
  if (days <= 7) return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  if (days <= 30) return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-base">{formatUSD(val)}</p>
    </div>
  )
}

export default function PortfolioChart({ history, loading, error, days, onChangeRange, onRefetch }) {
  const [hoveredValue, setHoveredValue] = useState(null)

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">포트폴리오 추이</h3>
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="flex gap-1.5">
            {[1,2,3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!history || history.length < 2) {
    return (
      <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">포트폴리오 추이</h3>
          <div className="flex gap-1.5">
            {RANGES.map((r) => (
              <button key={r.days} onClick={() => onChangeRange(r.days)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${days === r.days ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-40 flex flex-col items-center justify-center gap-3">
          {error ? (
            <>
              <p className="text-gray-600 text-sm">{error}</p>
              {onRefetch && (
                <button onClick={onRefetch} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <RefreshCw size={12} /> 다시 시도
                </button>
              )}
            </>
          ) : (
            <p className="text-gray-600 text-sm">시세 데이터를 불러오는 중이에요...</p>
          )}
        </div>
      </div>
    )
  }

  const first = history[0]?.value ?? 0
  const last = history[history.length - 1]?.value ?? 0
  const displayed = hoveredValue ?? last
  const change = displayed - first
  const changePct = first > 0 ? (change / first) * 100 : 0
  const isProfit = change >= 0

  const chartData = history.map((p) => ({
    date: formatDate(p.date, days),
    value: p.value,
  }))

  const minVal = Math.min(...history.map((p) => p.value))
  const maxVal = Math.max(...history.map((p) => p.value))
  const padding = (maxVal - minVal) * 0.1

  return (
    <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">포트폴리오 추이</h3>
          <p className="text-3xl font-black text-white tracking-tight">{formatUSD(displayed)}</p>
          <div className={`flex items-center gap-1.5 mt-1 text-sm font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            <span>{isProfit ? '▲' : '▼'}</span>
            <span>{isProfit ? '+' : ''}{formatUSD(change)}</span>
            <span className="text-gray-600">|</span>
            <span>{isProfit ? '+' : ''}{changePct.toFixed(2)}%</span>
            <span className="text-gray-600 font-normal text-xs">기간 대비</span>
          </div>
        </div>
        <div className="flex gap-1.5 mt-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => onChangeRange(r.days)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                days === r.days
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 -mx-2">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart
            data={chartData}
            onMouseMove={(e) => {
              if (e.activePayload?.[0]) setHoveredValue(e.activePayload[0].value)
            }}
            onMouseLeave={() => setHoveredValue(null)}
            margin={{ top: 5, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isProfit ? '#3B82F6' : '#EF4444'} stopOpacity={0.35} />
                <stop offset="85%" stopColor={isProfit ? '#3B82F6' : '#EF4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: '#4B5563', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minVal - padding, maxVal + padding]}
              hide
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isProfit ? '#3B82F6' : '#EF4444'}
              strokeWidth={2.5}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{ r: 4, fill: isProfit ? '#3B82F6' : '#EF4444', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
