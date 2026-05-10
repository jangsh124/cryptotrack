import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// 미국 동부시간(ET) 기준 날짜 반환 (YYYY-MM-DD)
function getTodayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

export function usePortfolioSnapshots(user, totalValue, days = 30) {
  const [snapshots, setSnapshots] = useState([]) // DB에 저장된 과거 데이터
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const saveTimerRef = useRef(null)
  const lastSavedValueRef = useRef(null)

  // 과거 스냅샷 불러오기 (오늘 제외 — 오늘은 실시간으로 표시)
  const loadSnapshots = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceStr = since.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      const todayStr = getTodayET()

      const { data, error: err } = await supabase
        .from('portfolio_snapshots')
        .select('date, value')
        .eq('user_id', user.id)
        .gte('date', sinceStr)
        .lt('date', todayStr) // 오늘 제외 (실시간으로 표시)
        .order('date', { ascending: true })

      if (err) throw err
      setSnapshots(data ?? [])
    } catch (e) {
      setError('스냅샷을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [user?.id, days])

  // 오늘 스냅샷 저장/업데이트 (값이 바뀔 때마다 1분 딜레이 후 저장)
  const saveTodaySnapshot = useCallback(async (value) => {
    if (!user || !value || value <= 0) return
    if (value === lastSavedValueRef.current) return

    const today = getTodayET()
    try {
      const { data: existing } = await supabase
        .from('portfolio_snapshots')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('portfolio_snapshots')
          .update({ value })
          .eq('user_id', user.id)
          .eq('date', today)
      } else {
        await supabase
          .from('portfolio_snapshots')
          .insert({ user_id: user.id, date: today, value })
      }
      lastSavedValueRef.current = value
    } catch (e) {
      console.error('스냅샷 저장 실패:', e)
    }
  }, [user?.id])

  // 처음 로드
  useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  // totalValue가 바뀔 때마다 딜레이 후 저장 (너무 자주 저장 방지)
  useEffect(() => {
    if (!totalValue || totalValue <= 0) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTodaySnapshot(totalValue)
    }, 5000) // 5초 후 저장
    return () => clearTimeout(saveTimerRef.current)
  }, [totalValue, saveTodaySnapshot])

  // 과거 스냅샷 + 오늘 실시간 값을 합쳐서 차트 데이터 생성
  const history = [
    ...snapshots.map((row) => ({
      date: new Date(row.date + 'T12:00:00'),
      value: parseFloat(row.value),
    })),
    // 오늘 실시간 값 (항상 마지막에 추가)
    ...(totalValue > 0 ? [{
      date: new Date(),
      value: totalValue,
      isToday: true,
    }] : []),
  ]

  return { history, loading, error, refetch: loadSnapshots }
}
