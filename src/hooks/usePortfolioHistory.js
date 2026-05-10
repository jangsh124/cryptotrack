import { useState, useEffect, useCallback } from 'react'
import { getCurrency } from './useExchangePrices'

const COINGECKO_IDS = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
  XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche-2',
  DOT: 'polkadot', MATIC: 'matic-network', LINK: 'chainlink', UNI: 'uniswap',
  ATOM: 'cosmos', LTC: 'litecoin', NEAR: 'near', ARB: 'arbitrum',
  OP: 'optimism', SUI: 'sui', TRX: 'tron', TON: 'the-open-network',
  SHIB: 'shiba-inu', PEPE: 'pepe', WLD: 'worldcoin-wld',
}

function getCoinGeckoId(symbol) {
  return COINGECKO_IDS[symbol.toUpperCase()] || symbol.toLowerCase()
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchHistoryWithRetry(symbol, days, retries = 2) {
  const id = getCoinGeckoId(symbol)
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`
      )
      if (res.status === 429) {
        await sleep(2000 * (i + 1))
        continue
      }
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      return (data.prices ?? []).map(([ts, price]) => ({ ts, price }))
    } catch (e) {
      if (i === retries) throw e
      await sleep(1500)
    }
  }
  return []
}

export function usePortfolioHistory(holdings, usdToKrw, days = 30, totalValue = 0) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const compute = useCallback(async () => {
    if (!holdings || holdings.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const symbols = [...new Set(holdings.map((h) => h.symbol.toUpperCase()))]

      // Sequential fetching to avoid rate limits
      const priceHistory = {}
      for (const sym of symbols) {
        try {
          const data = await fetchHistoryWithRetry(sym, days)
          if (data.length > 0) priceHistory[sym] = data
          await sleep(400)
        } catch {
          // skip this symbol
        }
      }

      const firstSym = Object.keys(priceHistory)[0]
      if (!firstSym) {
        setError('가격 데이터를 불러올 수 없어요. 잠시 후 다시 시도해주세요.')
        return
      }

      const timestamps = priceHistory[firstSym].map((p) => p.ts)

      const portfolioPoints = timestamps.map((ts) => {
        let totalUSD = 0
        let hasAnyHolding = false
        holdings.forEach((h) => {
          const sym = h.symbol.toUpperCase()
          const symHistory = priceHistory[sym]
          if (!symHistory) return

          const point = symHistory.find((p) => Math.abs(p.ts - ts) < 86400000 * 2)
          if (!point) return

          const totalQty = h.entries
            .filter((e) => new Date(e.date).getTime() <= ts)
            .reduce((s, e) => s + e.quantity, 0)

          if (totalQty > 0) {
            totalUSD += totalQty * point.price
            hasAnyHolding = true
          }
        })
        return hasAnyHolding ? { ts, date: new Date(ts), value: totalUSD } : null
      }).filter(Boolean)

      // 실제 현재 총액 기준으로 스케일링 (거래소별 가격 차이 보정)
      if (portfolioPoints.length > 0 && totalValue > 0) {
        const lastRaw = portfolioPoints[portfolioPoints.length - 1].value
        if (lastRaw > 0) {
          const scale = totalValue / lastRaw
          portfolioPoints.forEach((p) => { p.value = p.value * scale })
        }
      }

      setHistory(portfolioPoints)
    } catch (e) {
      setError('포트폴리오 추이를 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(holdings.map((h) => ({ s: h.symbol, entries: h.entries }))), days])

  useEffect(() => {
    compute()
  }, [compute])

  return { history, loading, error, refetch: compute }
}
