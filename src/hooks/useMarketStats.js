import { useState, useEffect } from 'react'

export function useMarketStats() {
  const [fearGreed, setFearGreed] = useState(null)
  const [dominance, setDominance] = useState(null)
  const [globalData, setGlobalData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      setLoading(true)
      try {
        const [fgRes, globalRes] = await Promise.allSettled([
          fetch('https://api.alternative.me/fng/?limit=30'),
          fetch('https://api.coingecko.com/api/v3/global'),
        ])

        if (fgRes.status === 'fulfilled' && fgRes.value.ok) {
          const data = await fgRes.value.json()
          if (!cancelled) setFearGreed(data.data ?? [])
        }

        if (globalRes.status === 'fulfilled' && globalRes.value.ok) {
          const data = await globalRes.value.json()
          if (!cancelled) {
            setGlobalData(data.data)
            setDominance(data.data?.market_cap_percentage ?? {})
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [])

  return { fearGreed, dominance, globalData, loading }
}
