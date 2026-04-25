import { useState, useEffect } from 'react'

export function useNewsData(symbols = [], limit = 50) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetch_() {
      setLoading(true)
      setError(null)
      try {
        const cats = symbols.length > 0 ? `&categories=${symbols.join(',')}` : ''
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest${cats}`
        )
        if (!res.ok) throw new Error('News fetch failed')
        const data = await res.json()
        if (!cancelled) setArticles(data.Data?.slice(0, limit) ?? [])
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch_()
    return () => { cancelled = true }
  }, [symbols.join(','), limit])

  return { articles, loading, error }
}
