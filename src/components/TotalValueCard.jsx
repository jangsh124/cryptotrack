import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatUSD } from '../utils/calculations'

export default function TotalValueCard({ totalValue, totalInvested, totalPnL, totalPnLPct, loading, lastUpdated, onRefresh }) {
  const isProfit = totalPnL >= 0

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-blue-600 via-blue-500 to-violet-600 shadow-2xl shadow-blue-500/20">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute -bottom-12 -left-6 w-52 h-52 bg-white/5 rounded-full" />

      <div className="relative">
        <p className="text-blue-100 text-sm font-medium mb-1">총 보유자산</p>
        <div className="flex items-end gap-3 mb-4">
          <span className="text-5xl font-black text-white tracking-tight leading-none">
            {formatUSD(totalValue)}
          </span>
        </div>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold mb-5 ${
          isProfit ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-100'
        }`}>
          {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isProfit ? '+' : ''}{formatUSD(totalPnL)} ({isProfit ? '+' : ''}{totalPnLPct.toFixed(2)}%)
        </div>

        <div className="flex justify-between">
          <div>
            <p className="text-blue-200 text-xs mb-1">투자원금</p>
            <p className="text-white font-bold text-base">{formatUSD(totalInvested)}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs mb-1">평가손익</p>
            <p className={`font-bold text-base ${isProfit ? 'text-green-300' : 'text-red-300'}`}>
              {isProfit ? '+' : ''}{formatUSD(totalPnL)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs mb-1">수익률</p>
            <p className={`font-bold text-base ${isProfit ? 'text-green-300' : 'text-red-300'}`}>
              {isProfit ? '+' : ''}{totalPnLPct.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
