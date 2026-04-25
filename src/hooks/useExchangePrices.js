import { useState, useEffect, useCallback } from 'react'

export const EXCHANGE_CURRENCY = {
  Upbit: 'KRW',
  Bithumb: 'KRW',
  Binance: 'USDT',
  OKX: 'USDT',
  Bybit: 'USDT',
  Coinbase: 'USD',
  Kraken: 'USD',
  '개인지갑1': 'USD',
  '개인지갑2': 'USD',
  '개인지갑3': 'USD',
  기타: 'USD',
}

export function getCurrency(exchange) {
  return EXCHANGE_CURRENCY[exchange] || 'USD'
}

export function isPersonalWallet(exchange) {
  return exchange?.startsWith('개인지갑')
}

async function fetchUpbit(symbols) {
  const markets = symbols.map((s) => `KRW-${s.toUpperCase()}`).join(',')
  const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`)
  if (!res.ok) throw new Error('Upbit API failed')
  const data = await res.json()
  const prices = {}, changes = {}
  data.forEach((item) => {
    const sym = item.market.replace('KRW-', '')
    prices[sym] = item.trade_price
    changes[sym] = item.signed_change_rate * 100
  })
  return { prices, changes, currency: 'KRW' }
}

async function fetchBithumb(symbols) {
  const res = await fetch('https://api.bithumb.com/public/ticker/ALL_KRW')
  if (!res.ok) throw new Error('Bithumb API failed')
  const data = await res.json()
  if (data.status !== '0000') throw new Error('Bithumb error')
  const prices = {}, changes = {}
  symbols.forEach((sym) => {
    const s = sym.toUpperCase()
    if (data.data[s]) {
      prices[s] = parseFloat(data.data[s].closing_price)
      changes[s] = parseFloat(data.data[s].fluctate_rate_24H)
    }
  })
  return { prices, changes, currency: 'KRW' }
}

async function fetchBinance(symbols) {
  const pairs = symbols.map((s) => `"${s.toUpperCase()}USDT"`).join(',')
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${pairs}]`)
  if (!res.ok) throw new Error('Binance API failed')
  const data = await res.json()
  const prices = {}, changes = {}
  data.forEach((item) => {
    const sym = item.symbol.replace('USDT', '')
    prices[sym] = parseFloat(item.lastPrice)
    changes[sym] = parseFloat(item.priceChangePercent)
  })
  return { prices, changes, currency: 'USDT' }
}

async function fetchOKX(symbols) {
  const results = await Promise.allSettled(
    symbols.map(async (sym) => {
      const res = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${sym.toUpperCase()}-USDT`)
      if (!res.ok) throw new Error('OKX failed')
      const data = await res.json()
      if (data.code !== '0' || !data.data?.[0]) throw new Error('OKX no data')
      const d = data.data[0]
      const open = parseFloat(d.open24h)
      const last = parseFloat(d.last)
      const change = open > 0 ? ((last - open) / open) * 100 : 0
      return { sym: sym.toUpperCase(), price: last, change }
    })
  )
  const prices = {}, changes = {}
  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      prices[r.value.sym] = r.value.price
      changes[r.value.sym] = r.value.change
    }
  })
  return { prices, changes, currency: 'USDT' }
}

async function fetchCoinGecko(symbols) {
  const COINGECKO_IDS = {
    BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
    XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche-2',
    DOT: 'polkadot', MATIC: 'matic-network', LINK: 'chainlink', UNI: 'uniswap',
    ATOM: 'cosmos', LTC: 'litecoin', NEAR: 'near', ARB: 'arbitrum',
    OP: 'optimism', SUI: 'sui', TRX: 'tron', TON: 'the-open-network',
    SHIB: 'shiba-inu', PEPE: 'pepe', WLD: 'worldcoin-wld',
  }
  const ids = symbols.map((s) => COINGECKO_IDS[s.toUpperCase()] || s.toLowerCase()).join(',')
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
  if (!res.ok) throw new Error('CoinGecko failed')
  const data = await res.json()
  const prices = {}, changes = {}
  symbols.forEach((sym) => {
    const id = COINGECKO_IDS[sym.toUpperCase()] || sym.toLowerCase()
    if (data[id]) {
      prices[sym.toUpperCase()] = data[id].usd
      changes[sym.toUpperCase()] = data[id].usd_24h_change ?? 0
    }
  })
  return { prices, changes, currency: 'USD' }
}

async function fetchKrwRate() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.rates?.KRW ?? 1380
  } catch {
    return 1380
  }
}

export function useExchangePrices(holdings) {
  const [exchangePrices, setExchangePrices] = useState({})
  const [exchangeChanges, setExchangeChanges] = useState({})
  const [usdToKrw, setUsdToKrw] = useState(1380)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [errors, setErrors] = useState({})

  const fetchAll = useCallback(async () => {
    if (!holdings || holdings.length === 0) return
    setLoading(true)

    // Group symbols by exchange
    const byExchange = {}
    holdings.forEach((h) => {
      const ex = h.exchange
      if (!byExchange[ex]) byExchange[ex] = []
      if (!byExchange[ex].includes(h.symbol.toUpperCase())) {
        byExchange[ex].push(h.symbol.toUpperCase())
      }
    })

    const newPrices = {}
    const newChanges = {}
    const newErrors = {}

    // Fetch KRW exchange rate
    const krwRate = await fetchKrwRate()
    setUsdToKrw(krwRate)

    // Symbols that need CoinGecko fallback
    const fallbackSymbols = []

    await Promise.allSettled(
      Object.entries(byExchange).map(async ([exchange, symbols]) => {
        try {
          let result
          if (exchange === 'Upbit') result = await fetchUpbit(symbols)
          else if (exchange === 'Bithumb') result = await fetchBithumb(symbols)
          else if (exchange === 'Binance') result = await fetchBinance(symbols)
          else if (exchange === 'OKX' || exchange.startsWith('개인지갑')) result = await fetchOKX(symbols)
          else {
            fallbackSymbols.push(...symbols)
            return
          }

          if (!newPrices[exchange]) newPrices[exchange] = {}
          if (!newChanges[exchange]) newChanges[exchange] = {}
          Object.entries(result.prices).forEach(([sym, price]) => {
            newPrices[exchange][sym] = price
          })
          Object.entries(result.changes).forEach(([sym, change]) => {
            newChanges[exchange][sym] = change
          })
        } catch (e) {
          newErrors[exchange] = e.message
          fallbackSymbols.push(...symbols)
        }
      })
    )

    // Fetch fallbacks from CoinGecko
    if (fallbackSymbols.length > 0) {
      try {
        const { prices, changes } = await fetchCoinGecko([...new Set(fallbackSymbols)])
        Object.entries(byExchange).forEach(([exchange, symbols]) => {
          if (exchange !== 'Upbit' && exchange !== 'Bithumb' && exchange !== 'Binance' && exchange !== 'OKX' && !exchange.startsWith('개인지갑')) {
            if (!newPrices[exchange]) newPrices[exchange] = {}
            if (!newChanges[exchange]) newChanges[exchange] = {}
            symbols.forEach((sym) => {
              if (prices[sym] !== undefined) newPrices[exchange][sym] = prices[sym]
              if (changes[sym] !== undefined) newChanges[exchange][sym] = changes[sym]
            })
          }
          // Also fill in failed exchanges
          if (newErrors[exchange]) {
            if (!newPrices[exchange]) newPrices[exchange] = {}
            if (!newChanges[exchange]) newChanges[exchange] = {}
            symbols.forEach((sym) => {
              if (prices[sym] !== undefined) newPrices[exchange][sym] = prices[sym]
              if (changes[sym] !== undefined) newChanges[exchange][sym] = changes[sym]
            })
          }
        })
      } catch {}
    }

    setExchangePrices(newPrices)
    setExchangeChanges(newChanges)
    setErrors(newErrors)
    setLastUpdated(new Date())
    setLoading(false)
  }, [JSON.stringify(holdings.map((h) => ({ e: h.exchange, s: h.symbol })))])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Helper: get price for a specific holding
  const getPrice = (exchange, symbol) =>
    exchangePrices[exchange]?.[symbol.toUpperCase()] ?? null

  const getChange = (exchange, symbol) =>
    exchangeChanges[exchange]?.[symbol.toUpperCase()] ?? null

  return { exchangePrices, exchangeChanges, usdToKrw, loading, lastUpdated, errors, refetch: fetchAll, getPrice, getChange }
}
