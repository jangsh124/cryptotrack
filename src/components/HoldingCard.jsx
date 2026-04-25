import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react'
import { calcPnL, formatNumber, formatKRW, formatKRWFull, formatUSD, formatUSDT } from '../utils/calculations'
import { getCurrency } from '../hooks/useExchangePrices'

const COIN_COLORS = {
  BTC: { bg: 'from-orange-500/20 to-yellow-500/10', accent: '#F97316', dot: 'bg-orange-400' },
  ETH: { bg: 'from-blue-500/20 to-indigo-500/10', accent: '#6366F1', dot: 'bg-blue-400' },
  SOL: { bg: 'from-violet-500/20 to-purple-500/10', accent: '#8B5CF6', dot: 'bg-violet-400' },
  BNB: { bg: 'from-yellow-500/20 to-amber-500/10', accent: '#F59E0B', dot: 'bg-yellow-400' },
  XRP: { bg: 'from-cyan-500/20 to-blue-500/10', accent: '#06B6D4', dot: 'bg-cyan-400' },
  ADA: { bg: 'from-blue-600/20 to-cyan-500/10', accent: '#3B82F6', dot: 'bg-blue-500' },
  DOGE: { bg: 'from-yellow-400/20 to-orange-400/10', accent: '#FBBF24', dot: 'bg-yellow-300' },
  AVAX: { bg: 'from-red-500/20 to-rose-500/10', accent: '#EF4444', dot: 'bg-red-400' },
}
const DEFAULT_COIN = { bg: 'from-gray-500/20 to-gray-600/10', accent: '#6B7280', dot: 'bg-gray-400' }

const EXCHANGE_BADGE = {
  Binance: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  Upbit: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  Bithumb: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  Coinbase: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
  Bybit: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  OKX: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
  Kraken: 'bg-violet-400/10 text-violet-400 border-violet-400/20',
}
const DEFAULT_BADGE = 'bg-gray-400/10 text-gray-400 border-gray-400/20'

function fmtPrice(value, currency) {
  if (value === null || value === undefined) return '—'
  if (currency === 'KRW') return formatKRWFull(value)
  if (currency === 'USDT') return formatUSDT(value)
  return formatUSD(value)
}

function fmtValue(value, currency) {
  if (value === null || value === undefined) return '—'
  if (currency === 'KRW') return formatKRW(value)
  if (currency === 'USDT') return `${value.toFixed(2)} USDT`
  return formatUSD(value)
}

export default function HoldingCard({ holding, currentPrice, priceChange24h, onDelete, onAddEntry }) {
  const [expanded, setExpanded] = useState(false)
  const currency = getCurrency(holding.exchange)
  const price = currentPrice ?? 0
  const { currentValue, investedValue, pnl, pnlPct, totalQty, avgPrice } = calcPnL(holding, price)
  const isProfit = pnl >= 0
  const change24h = priceChange24h ?? 0
  const coin = COIN_COLORS[holding.symbol.toUpperCase()] || DEFAULT_COIN
  const badge = EXCHANGE_BADGE[holding.exchange] || DEFAULT_BADGE
  const hasPrice = currentPrice !== null && currentPrice !== undefined

  return (
    <div className={`rounded-2xl border border-white/5 overflow-hidden bg-gradient-to-br ${coin.bg} bg-gray-900`}>
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${coin.accent}22` }}>
              <span className="font-black text-sm" style={{ color: coin.accent }}>
                {holding.symbol.slice(0, 3)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-base">{holding.symbol}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${badge}`}>
                  {holding.exchange}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-medium">
                  {currency}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {hasPrice ? fmtPrice(price, currency) : '로딩중...'}
                </span>
                {hasPrice && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    change24h >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
                  }`}>
                    {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-white text-base">
              {hasPrice ? fmtValue(currentValue, currency) : '—'}
            </p>
            <p className={`text-sm font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {hasPrice ? `${isProfit ? '+' : ''}${pnlPct.toFixed(2)}%` : '—'}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl px-3 py-2">
            <p className="text-gray-500 text-xs mb-0.5">보유수량</p>
            <p className="text-white text-sm font-semibold">{formatNumber(totalQty)}</p>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2">
            <p className="text-gray-500 text-xs mb-0.5">평단가</p>
            <p className="text-white text-sm font-semibold">{fmtPrice(avgPrice, currency)}</p>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2">
            <p className="text-gray-500 text-xs mb-0.5">평가손익</p>
            <p className={`text-sm font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {hasPrice ? `${isProfit ? '+' : ''}${fmtValue(Math.abs(pnl), currency)}` : '—'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end text-gray-600">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 bg-black/20 px-5 py-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">매수 내역</span>
            <div className="flex gap-3">
              <button onClick={() => onAddEntry(holding.id)} className="flex items-center gap-1 text-xs text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                <Plus size={12} /> 추가매수
              </button>
              <button onClick={() => onDelete(holding.id)} className="flex items-center gap-1 text-xs text-red-400 font-semibold hover:text-red-300 transition-colors">
                <Trash2 size={12} /> 삭제
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {holding.entries.map((entry, i) => (
              <div key={i} className="flex justify-between items-center text-xs bg-white/5 rounded-xl px-3 py-2.5">
                <span className="text-gray-500">{entry.date || `매수 ${i + 1}`}</span>
                <span className="text-gray-300">{formatNumber(entry.quantity)} {holding.symbol}</span>
                <span className="text-white font-semibold">{fmtPrice(entry.buyPrice, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
