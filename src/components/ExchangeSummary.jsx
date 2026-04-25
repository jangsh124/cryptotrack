import { Building2, AlertCircle } from 'lucide-react'
import { formatUSD, calcPnL, toUSD } from '../utils/calculations'
import { getCurrency } from '../hooks/useExchangePrices'

export default function ExchangeSummary({ holdings, exchangePrices, usdToKrw, errors }) {
  const byExchange = {}
  holdings.forEach((h) => {
    const currency = getCurrency(h.exchange)
    const price = exchangePrices[h.exchange]?.[h.symbol.toUpperCase()] ?? 0
    const { currentValue, investedValue } = calcPnL(h, price)
    const valueUSD = toUSD(currentValue, currency, usdToKrw)
    const investedUSD = toUSD(investedValue, currency, usdToKrw)
    if (!byExchange[h.exchange]) byExchange[h.exchange] = { valueUSD: 0, investedUSD: 0, count: 0, currency }
    byExchange[h.exchange].valueUSD += valueUSD
    byExchange[h.exchange].investedUSD += investedUSD
    byExchange[h.exchange].count += 1
  })

  const entries = Object.entries(byExchange).sort((a, b) => b[1].valueUSD - a[1].valueUSD)
  const total = entries.reduce((s, [, d]) => s + d.valueUSD, 0)
  if (entries.length === 0) return null

  return (
    <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Building2 size={14} className="text-gray-500" />
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">거래소별 현황</h3>
      </div>
      <div className="space-y-4">
        {entries.map(([exchange, data]) => {
          const pnl = data.valueUSD - data.investedUSD
          const isProfit = pnl >= 0
          const pct = total > 0 ? (data.valueUSD / total) * 100 : 0
          const hasError = errors?.[exchange]
          return (
            <div key={exchange}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{exchange}</span>
                  <span className="text-xs text-gray-600">{data.count}개</span>
                  {hasError && <AlertCircle size={12} className="text-yellow-500" title="API 오류, CoinGecko 대체 사용중" />}
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">{formatUSD(data.valueUSD)}</span>
                  <span className={`text-xs ml-2 font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{formatUSD(pnl)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
