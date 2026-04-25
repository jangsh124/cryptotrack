import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DEMO_HOLDINGS = [
  {
    id: '1', symbol: 'BTC', exchange: 'Upbit',
    entries: [
      { quantity: 0.05, buyPrice: 78300000, date: '2024-10-15' },
      { quantity: 0.03, buyPrice: 83700000, date: '2024-11-20' },
    ],
  },
  {
    id: '2', symbol: 'ETH', exchange: 'Binance',
    entries: [{ quantity: 1.5, buyPrice: 2800, date: '2024-09-10' }],
  },
  {
    id: '3', symbol: 'SOL', exchange: 'OKX',
    entries: [{ quantity: 10, buyPrice: 145, date: '2024-12-01' }],
  },
]

function localLoad() {
  try {
    const s = localStorage.getItem('ct_holdings_v2')
    return s ? JSON.parse(s) : DEMO_HOLDINGS
  } catch { return DEMO_HOLDINGS }
}

function localSave(h) {
  localStorage.setItem('ct_holdings_v2', JSON.stringify(h))
}

export function useHoldings(user) {
  const [holdings, setHoldingsRaw] = useState(localLoad)
  const [syncing, setSyncing] = useState(false)

  // Load from Supabase when user logs in
  useEffect(() => {
    if (!user) return
    setSyncing(true)
    supabase
      .from('holdings')
      .select('data')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error(error); setSyncing(false); return }
        if (data?.data) {
          setHoldingsRaw(data.data)
          localSave(data.data)
        } else {
          // First login — upload local data
          const local = localLoad()
          saveToCloud(user.id, local)
        }
        setSyncing(false)
      })
  }, [user?.id])

  const saveToCloud = useCallback(async (userId, data) => {
    await supabase
      .from('holdings')
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }, [])

  const setHoldings = useCallback((updater) => {
    setHoldingsRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localSave(next)
      if (user) saveToCloud(user.id, next)
      return next
    })
  }, [user, saveToCloud])

  return { holdings, setHoldings, syncing }
}
