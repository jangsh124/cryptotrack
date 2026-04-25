import { useState, useMemo } from 'react' // v2
import { Plus, LayoutGrid, List, Wallet, RefreshCw, LogOut, Cloud, CloudOff, BarChart2, Newspaper } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { useHoldings } from './hooks/useHoldings'
import { useExchangePrices, getCurrency } from './hooks/useExchangePrices'
import { usePortfolioHistory } from './hooks/usePortfolioHistory'
import { calcPnL, toUSD } from './utils/calculations'
import TotalValueCard from './components/TotalValueCard'
import AllocationChart from './components/AllocationChart'
import HoldingCard from './components/HoldingCard'
import AddHoldingModal from './components/AddHoldingModal'
import MarketOutlook from './components/MarketOutlook'
import ExchangeSummary from './components/ExchangeSummary'
import PortfolioChart from './components/PortfolioChart'
import LoginPage from './components/LoginPage'
import NewsPage from './pages/NewsPage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { holdings, setHoldings, syncing } = useHoldings(user)

  const [page, setPage] = useState('dashboard') // 'dashboard' | 'news'
  const [showAdd, setShowAdd] = useState(false)
  const [addingToId, setAddingToId] = useState(null)
  const [view, setView] = useState('list')
  const [filterExchange, setFilterExchange] = useState('전체')
  const [chartDays, setChartDays] = useState(30)

  const { exchangePrices, exchangeChanges, usdToKrw, loading, lastUpdated, errors, refetch, getPrice, getChange } =
    useExchangePrices(holdings)

  const { history: portfolioHistory, loading: historyLoading, error: historyError, refetch: refetchHistory } =
    usePortfolioHistory(holdings, usdToKrw, chartDays)

  const exchanges = useMemo(() => {
    const exs = [...new Set(holdings.map((h) => h.exchange))]
    return ['전체', ...exs]
  }, [holdings])

  const filteredHoldings = useMemo(() =>
    filterExchange === '전체' ? holdings : holdings.filter((h) => h.exchange === filterExchange),
    [holdings, filterExchange]
  )

  const { totalValue, totalInvested, totalPnL, totalPnLPct } = useMemo(() => {
    let tv = 0, ti = 0
    holdings.forEach((h) => {
      const currency = getCurrency(h.exchange)
      const price = getPrice(h.exchange, h.symbol) ?? 0
      const { currentValue, investedValue } = calcPnL(h, price)
      tv += toUSD(currentValue, currency, usdToKrw)
      ti += toUSD(investedValue, currency, usdToKrw)
    })
    const pnl = tv - ti
    return { totalValue: tv, totalInvested: ti, totalPnL: pnl, totalPnLPct: ti > 0 ? (pnl / ti) * 100 : 0 }
  }, [holdings, exchangePrices, usdToKrw])

  const allocationData = useMemo(() => {
    // Merge same coins across exchanges
    const bySymbol = {}
    holdings.forEach((h) => {
      const currency = getCurrency(h.exchange)
      const price = getPrice(h.exchange, h.symbol) ?? 0
      const { currentValue } = calcPnL(h, price)
      const valueUSD = toUSD(currentValue, currency, usdToKrw)
      const sym = h.symbol.toUpperCase()
      bySymbol[sym] = (bySymbol[sym] ?? 0) + valueUSD
    })
    return Object.entries(bySymbol)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
  }, [holdings, exchangePrices, usdToKrw, totalValue])

  const handleAddHolding = ({ symbol, exchange, quantity, buyPrice, date }) => {
    if (addingToId) {
      setHoldings((prev) =>
        prev.map((h) => h.id === addingToId
          ? { ...h, entries: [...h.entries, { quantity, buyPrice, date }] }
          : h
        )
      )
    } else {
      const existing = holdings.find(
        (h) => h.symbol.toUpperCase() === symbol && h.exchange === exchange
      )
      if (existing) {
        setHoldings((prev) =>
          prev.map((h) => h.id === existing.id
            ? { ...h, entries: [...h.entries, { quantity, buyPrice, date }] }
            : h
          )
        )
      } else {
        setHoldings((prev) => [
          ...prev,
          { id: Date.now().toString(), symbol, exchange, entries: [{ quantity, buyPrice, date }] },
        ])
      }
    }
    setAddingToId(null)
  }

  const handleDelete = (id) => {
    if (confirm('이 코인을 삭제할까요?')) {
      setHoldings((prev) => prev.filter((h) => h.id !== id))
    }
  }

  const handleAddEntry = (id) => { setAddingToId(id); setShowAdd(true) }
  const addingHolding = addingToId ? holdings.find((h) => h.id === addingToId) : null

  // Auth loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!user) return <LoginPage />

  // News page
  const holdingSymbols = [...new Set(holdings.map((h) => h.symbol.toUpperCase()))]
  if (page === 'news') {
    return <NewsPage onBack={() => setPage('dashboard')} holdingSymbols={holdingSymbols} />
  }
  if (page === 'analytics') {
    return <AnalyticsPage onBack={() => setPage('dashboard')} holdings={holdings} getPrice={getPrice} usdToKrw={usdToKrw} />
  }

  const userEmail = user.email?.split('@')[0] ?? '사용자'

  const SyncBadge = () => (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
      syncing ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'
    }`}>
      {syncing ? <CloudOff size={11} /> : <Cloud size={11} />}
      {syncing ? '동기화 중...' : '저장됨'}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-white/5 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">CryptoTrack</span>
          <span className="text-xs text-gray-600 ml-1">USD/KRW {usdToKrw.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3">
          <SyncBadge />
          <span className="text-sm text-gray-500">{userEmail}</span>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {lastUpdated ? lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '업데이트'}
          </button>
          <button
            onClick={() => setPage('analytics')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-400 text-sm transition-all"
          >
            <BarChart2 size={15} /> 분석
          </button>
          <button
            onClick={() => setPage('news')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 text-sm transition-all"
          >
            <Newspaper size={15} /> 뉴스
          </button>
          <button
            onClick={() => { setAddingToId(null); setShowAdd(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-90 active:scale-95 transition-all text-sm"
          >
            <Plus size={16} /> 코인 추가
          </button>
          <button
            onClick={signOut}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
            title="로그아웃"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md px-4 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Wallet size={15} className="text-white" />
          </div>
          <span className="text-lg font-extrabold text-white">CryptoTrack</span>
          <SyncBadge />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('list')} className={`p-2 rounded-xl transition-colors ${view === 'list' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}><List size={16} /></button>
          <button onClick={() => setView('chart')} className={`p-2 rounded-xl transition-colors ${view === 'chart' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setPage('analytics')} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-violet-400 transition-colors"><BarChart2 size={16} /></button>
          <button onClick={() => setPage('news')} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-blue-400 transition-colors"><Newspaper size={16} /></button>
          <button onClick={signOut} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-red-400 transition-colors"><LogOut size={16} /></button>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-screen-xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 space-y-5">
            <TotalValueCard totalValue={totalValue} totalInvested={totalInvested} totalPnL={totalPnL} totalPnLPct={totalPnLPct} loading={loading} lastUpdated={lastUpdated} onRefresh={refetch} />
            <AllocationChart data={allocationData} />
            <ExchangeSummary holdings={holdings} exchangePrices={exchangePrices} usdToKrw={usdToKrw} errors={errors} />
            <MarketOutlook holdings={holdings} onMoreNews={() => setPage('news')} />
          </div>
          <div className="col-span-8 space-y-5">
            <PortfolioChart history={portfolioHistory} loading={historyLoading} error={historyError} days={chartDays} onChangeRange={setChartDays} onRefetch={refetchHistory} />
            <div className="flex items-center gap-2">
              {exchanges.map((ex) => (
                <button key={ex} onClick={() => setFilterExchange(ex)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filterExchange === ex ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}>{ex}</button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredHoldings.length === 0 ? (
                <div className="bg-white/5 rounded-3xl p-16 text-center"><p className="text-gray-500 text-sm">보유 코인이 없어요</p></div>
              ) : (
                filteredHoldings.map((holding) => (
                  <HoldingCard key={holding.id} holding={holding}
                    currentPrice={getPrice(holding.exchange, holding.symbol)}
                    priceChange24h={getChange(holding.exchange, holding.symbol)}
                    onDelete={handleDelete} onAddEntry={handleAddEntry}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden max-w-md mx-auto pb-24 px-4 space-y-3 mt-2">
        <TotalValueCard totalValue={totalValue} totalInvested={totalInvested} totalPnL={totalPnL} totalPnLPct={totalPnLPct} loading={loading} lastUpdated={lastUpdated} onRefresh={refetch} />
        <ExchangeSummary holdings={holdings} exchangePrices={exchangePrices} usdToKrw={usdToKrw} errors={errors} />
        <PortfolioChart history={portfolioHistory} loading={historyLoading} days={chartDays} onChangeRange={setChartDays} />
        {view === 'chart' ? (
          <AllocationChart data={allocationData} />
        ) : (
          <>
            {exchanges.length > 2 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {exchanges.map((ex) => (
                  <button key={ex} onClick={() => setFilterExchange(ex)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      filterExchange === ex ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'
                    }`}>{ex}</button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {filteredHoldings.map((holding) => (
                <HoldingCard key={holding.id} holding={holding}
                  currentPrice={getPrice(holding.exchange, holding.symbol)}
                  priceChange24h={getChange(holding.exchange, holding.symbol)}
                  onDelete={handleDelete} onAddEntry={handleAddEntry}
                />
              ))}
            </div>
          </>
        )}
        <MarketOutlook holdings={holdings} />
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => { setAddingToId(null); setShowAdd(true) }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold px-6 py-3.5 rounded-full shadow-xl shadow-blue-500/30 hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus size={18} /> 코인 추가
        </button>
      </div>

      {showAdd && (
        <AddHoldingModal
          onClose={() => { setShowAdd(false); setAddingToId(null) }}
          onAdd={handleAddHolding}
          existingHolding={addingHolding}
        />
      )}
    </div>
  )
}
