import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// 미국 동부시간(ET) 기준 오늘 날짜 반환 (YYYY-MM-DD)
function getTodayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

export function usePortfolioSnapshots(user, totalValue, days = 30) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const savedTodayRef = useRef(false)

  // 스냅샷 불러오기
  const loadSnapshots = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceStr = since.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

      const { data, error: err } = await supabase
        .from('portfolio_snapshots')
        .select('date, value')
        .eq('user_id', user.id)
        .gte('date', sinceStr)
        .order('date', { ascending: true })

      if (err) throw err

      const points = (data ?? []).map((row) => ({
        date: new Date(row.date + 'T00:00:00'),
        value: parseFloat(row.value),
      }))
      setHistory(points)
    } catch (e) {
      setError('스냅샷을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [user?.id, days])

  // 오늘 스냅샷 저장 (아직 저장 안 된 경우)
  const saveTodaySnapshot = useCallback(async () => {
    if (!user || !totalValue || totalValue <= 0) return
    if (savedTodayRef.current) return

    const today = getTodayET()
    try {
      // 오늘 이미 저장됐는지 확인
      const { data } = await supabase
        .from('portfolio_snapshots')
        .select('id, value')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (data) {
        // 이미 있으면 최신 금액으로 업데이트
        await supabase
          .from('portfolio_snapshots')
          .update({ value: totalValue })
          .eq('user_id', user.id)
          .eq('date', today)
      } else {
        // 없으면 새로 저장
        await supabase
          .from('portfolio_snapshots')
          .insert({ user_id: user.id, date: today, value: totalValue })
      }

      savedTodayRef.current = true
      await loadSnapshots()
    } catch (e) {
      console.error('스냅샷 저장 실패:', e)
    }
  }, [user?.id, totalValue, loadSnapshots])

  // 처음 로드
  useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  // totalValue가 확정되면 오늘 스냅샷 저장
  useEffect(() => {
    if (totalValue > 0 && !savedTodayRef.current) {
      saveTodaySnapshot()
    }
  }, [totalValue, saveTodaySnapshot])

  // days 바뀌면 ref 초기화 없이 데이터만 다시 로드
  useEffect(() => {
    loadSnapshots()
  }, [days])

  return { history, loading, error, refetch: loadSnapshots }
}
