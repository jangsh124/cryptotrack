import { useState } from 'react'
import { ArrowLeft, ExternalLink, RefreshCw, Search, Newspaper } from 'lucide-react'
import { useNewsData } from '../hooks/useNewsData'

const SENTIMENT_STYLE = {
  Positive: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  Negative: 'bg-red-400/10 text-red-400 border-red-400/20',
  Neutral: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
}

function timeAgo(ts) {
  const diff = Date.now() / 1000 - ts
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

function ArticleCard({ article }) {
  const sentiment = article.sentiment ?? 'Neutral'
  const sentimentKo = { Positive: '긍정', Negative: '부정', Neutral: '중립' }
  const tags = article.tags?.split('|').filter(Boolean).slice(0, 4) ?? []

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all"
    >
      {article.imageurl && (
        <img
          src={article.imageurl}
          alt=""
          className="w-20 h-20 rounded-xl object-cover shrink-0 bg-white/5"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-gray-600 font-medium">{article.source_info?.name ?? article.source}</span>
          <span className="text-gray-700">·</span>
          <span className="text-xs text-gray-600">{timeAgo(article.published_on)}</span>
          {sentiment !== 'Neutral' && (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${SENTIMENT_STYLE[sentiment]}`}>
              {sentimentKo[sentiment]}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors mb-2">
          {article.title}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
          {article.body?.slice(0, 150)}...
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map((t) => (
            <span key={t} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
              {t}
            </span>
          ))}
          <ExternalLink size={11} className="text-gray-700 ml-auto group-hover:text-gray-500 transition-colors" />
        </div>
      </div>
    </a>
  )
}

export default function NewsPage({ onBack, holdingSymbols }) {
  const [filter, setFilter] = useState('전체')
  const [search, setSearch] = useState('')

  const filterSymbols = filter === '전체' ? holdingSymbols : [filter]
  const { articles, loading, error } = useNewsData(filterSymbols, 80)

  const displayed = articles.filter((a) =>
    search ? a.title.toLowerCase().includes(search.toLowerCase()) : true
  )

  const positive = articles.filter((a) => a.sentiment === 'Positive').length
  const negative = articles.filter((a) => a.sentiment === 'Negative').length
  const sentimentPct = articles.length > 0 ? Math.round((positive / articles.length) * 100) : 50

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 py-4">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Newspaper size={18} className="text-blue-400" />
              <h1 className="text-lg font-bold text-white">크립토 뉴스</h1>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="뉴스 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-52"
            />
          </div>
        </div>
      </header>

      <div className="max-w-screen-lg mx-auto px-4 lg:px-8 py-6">
        {/* Sentiment Summary */}
        {articles.length > 0 && (
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-300">최근 뉴스 감성 분석</span>
              <span className="text-xs text-gray-600">{articles.length}개 기사</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 font-semibold w-12">긍정 {positive}</span>
              <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 rounded-l-full transition-all duration-700"
                  style={{ width: `${sentimentPct}%` }}
                />
                <div
                  className="h-full bg-red-500 rounded-r-full transition-all duration-700"
                  style={{ width: `${100 - sentimentPct}%` }}
                />
              </div>
              <span className="text-xs text-red-400 font-semibold w-12 text-right">부정 {negative}</span>
            </div>
          </div>
        )}

        {/* Coin Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {['전체', ...holdingSymbols].map((sym) => (
            <button
              key={sym}
              onClick={() => setFilter(sym)}
              className={`shrink-0 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                filter === sym
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <RefreshCw size={18} className="text-blue-400 animate-spin" />
            <span className="text-gray-500 text-sm">뉴스를 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-600 text-sm">{error}</div>
        ) : (
          <div className="space-y-3">
            {displayed.length === 0 ? (
              <div className="text-center py-16 text-gray-600 text-sm">검색 결과가 없어요</div>
            ) : (
              displayed.map((a) => <ArticleCard key={a.id} article={a} />)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
