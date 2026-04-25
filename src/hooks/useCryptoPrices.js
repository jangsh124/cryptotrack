import { useState, useEffect, useCallback } from 'react'

const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  ETC: 'ethereum-classic',
  XLM: 'stellar',
  ALGO: 'algorand',
  VET: 'vechain',
  ICP: 'internet-computer',
  FIL: 'filecoin',
  NEAR: 'near',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  SUI: 'sui',
  TRX: 'tron',
  TON: 'the-open-network',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  WLD: 'worldcoin-wld',
}

export function getCoingeckoId(symbol) {
  return COINGECKO_IDS[symbol.toUpperCase()] || symbol.toLowerCase()
}

export function useCryptoPrices(symbols) {
  const [prices, setPrices] = useState({})
  const [priceChange24h, setPriceChange24h] = useState({})
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState(null)

  const fetchPrices = useCallback(async () => {
    if (!symbols || symbols.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const ids = symbols.map(getCoingeckoId).join(',')
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      )
      if (!res.ok) throw new Error('Price fetch failed')
      const data = await res.json()
      const newPrices = {}
      const newChanges = {}
      symbols.forEach((sym) => {
        const id = getCoingeckoId(sym)
        if (data[id]) {
          newPrices[sym.toUpperCase()] = data[id].usd
          newChanges[sym.toUpperCase()] = data[id].usd_24h_change ?? 0
        }
      })
      setPrices(newPrices)
      setPriceChange24h(newChanges)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [symbols.join(',')])

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  return { prices, priceChange24h, loading, lastUpdated, error, refetch: fetchPrices }
}
