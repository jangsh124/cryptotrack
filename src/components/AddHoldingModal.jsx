import { useState } from 'react'
import { X } from 'lucide-react'
import { getCurrency } from '../hooks/useExchangePrices'

const POPULAR_COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC', 'LINK', 'NEAR', 'ARB', 'OP', 'SUI', 'TON', 'SHIB', 'TRX', 'ATOM', 'WLD']
const EXCHANGES = ['Upbit', 'Bithumb', 'Binance', 'OKX', 'Bybit', 'Coinbase', 'Kraken', '개인지갑1', '개인지갑2', '개인지갑3', '기타']

const CURRENCY_LABEL = { KRW: '원 (₩)', USDT: 'USDT', USD: 'USD ($)' }
const CURRENCY_PLACEHOLDER = { KRW: '예: 95000000', USDT: '예: 65000', USD: '예: 65000' }

export default function AddHoldingModal({ onClose, onAdd, existingHolding }) {
  const [symbol, setSymbol] = useState(existingHolding?.symbol || '')
  const [exchange, setExchange] = useState(existingHolding?.exchange || 'Upbit')
  const [quantity, setQuantity] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [customSymbol, setCustomSymbol] = useState('')

  const finalSymbol = symbol || customSymbol
  const currency = getCurrency(existingHolding?.exchange || exchange)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!finalSymbol || !quantity || !buyPrice) return
    onAdd({
      symbol: finalSymbol.toUpperCase().trim(),
      exchange,
      quantity: parseFloat(quantity),
      buyPrice: parseFloat(buyPrice),
      date,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h2 className="text-base font-bold text-white">
            {existingHolding ? `${existingHolding.symbol} 추가매수` : '코인 추가'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {!existingHolding && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">코인 선택</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {POPULAR_COINS.map((c) => (
                    <button key={c} type="button"
                      onClick={() => { setSymbol(c); setCustomSymbol('') }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        symbol === c ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >{c}</button>
                  ))}
                </div>
                <input
                  type="text" placeholder="직접 입력 (예: PEPE)"
                  value={customSymbol}
                  onChange={(e) => { setCustomSymbol(e.target.value); setSymbol('') }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">거래소</label>
                <div className="flex flex-wrap gap-1.5">
                  {EXCHANGES.map((ex) => (
                    <button key={ex} type="button"
                      onClick={() => setExchange(ex)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        exchange === ex ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >{ex}</button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  선택된 거래소 기준통화: <span className="text-blue-400 font-semibold">{CURRENCY_LABEL[currency]}</span>
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">매수 수량</label>
            <input
              type="number" step="any" placeholder="0.00" value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              매수 단가 ({CURRENCY_LABEL[currency]})
            </label>
            <input
              type="number" step="any"
              placeholder={CURRENCY_PLACEHOLDER[currency]}
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">매수일</label>
            <input
              type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!finalSymbol && !existingHolding}
            className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold py-3.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            {existingHolding ? '추가매수 등록' : '추가하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
