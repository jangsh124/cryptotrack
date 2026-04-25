import { TrendingUp, TrendingDown, Minus, ExternalLink, ChevronRight } from 'lucide-react'
import { useNewsData } from '../hooks/useNewsData'

const OUTLOOKS = {
  BTC: { sentiment: 'bullish', summary: '반감기 이후 기관 매수세 지속. ETF 유입 증가.' },
  ETH: { sentiment: 'bullish', summary: '이더리움 ETF 승인 기대감, 스테이킹 수요 증가.' },
  SOL: { sentiment: 'bullish', summary: '생태계 확장 및 밈코인 시즌 수혜. 높은 TPS 주목.' },
  BNB: { sentiment: 'neutral', summary: 'BNB체인 생태계 안정적. 규제 불확실성 관찰 필요.' },
  XRP: { sentiment: 'bullish', summary: 'SEC 소송 마무리 수혜. 국경간 결제 수요 증가.' },
  ADA: { sentiment: 'neutral', summary: '개발 진행 중이나 시장 점유율 하락 추세.' },
  DOGE: { sentiment: 'neutral', summary: '밈코인 섹터 약세. 커뮤니티 의존도 높음.' },
  AVAX: { sentiment: 'bullish', summary: '서브넷 생태계 성장, 기관 채택 사례 증가.' },
  NEAR: { sentiment: 'bullish', summary: 'AI x 블록체인 내러티브 수혜.' },
  ARB:  { sentiment: 'bullish', summary: 'Layer2 경쟁 속 높은 TVL 유지. 생태계 성장.' },
}

const cfg = {
  bullish: { Icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-400/8 border-emerald-400/15', label: '강세', dot: 'bg-emerald-400' },
  bearish: { Icon: TrendingDown, color: 'text-red-400',     bg: 'bg-red-400/8 border-red-400/15',         label: '약세', dot: 'bg-red-400' },
  neutral: { Icon: Minus,        color: 'text-yellow-400',  bg: 'bg-yellow-400/8 border-yellow-400/15',   label: '중립', dot: 'bg-yellow-400' },
}

function timeAgo(ts) {
  const diff = Date.now() / 1000 - ts
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

export default function MarketOutlook({ holdings, onMoreNews }) {
  const symbols = [...new Set(holdings.map((h) => h.symbol.toUpperCase()))]
  const coins = symbols.filter((s) => OUTLOOKS[s]).slice(0, 4)
  const { articles, loading } = useNewsData(symbols.slice(0, 5), 6)

  return (
    <div className="bg-white/5 border border-white/8 rounded-3xl p-6 space-y-6">
      {/* Outlooks */}
      {coins.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">시장 전망</h3>
          <div className="space-y-2.5">
            {coins.map((sym) => {
              const outlook = OUTLOOKS[sym]
              const { Icon, color, bg, label, dot } = cfg[outlook.sentiment]
              return (
                <div key={sym} className={`flex gap-3 p-3.5 rounded-2xl border ${bg}`}>
                  <div className={`mt-0.5 shrink-0 ${color}`}><Icon size={15} /></div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-white">{sym}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      <span className={`text-xs font-bold ${color}`}>{label}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{outlook.summary}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent News */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">최근 뉴스</h3>
          <button
            onClick={onMoreNews}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            더보기 <ChevronRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">뉴스를 불러올 수 없어요</p>
        ) : (
          <div className="space-y-2">
            {articles.slice(0, 4).map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                {a.imageurl && (
                  <img src={a.imageurl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-white/5"
                    onError={(e) => { e.target.style.display='none' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white line-clamp-2 group-hover:text-blue-300 transition-colors leading-snug">
                    {a.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-gray-600">{a.source_info?.name ?? a.source}</span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-600">{timeAgo(a.published_on)}</span>
                  </div>
                </div>
                <ExternalLink size={11} className="text-gray-700 group-hover:text-gray-500 shrink-0 mt-0.5 transition-colors" />
              </a>
            ))}
          </div>
        )}

        <button
          onClick={onMoreNews}
          className="w-full mt-3 py-2.5 rounded-xl border border-white/8 text-xs font-semibold text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
        >
          <span>뉴스 전체보기</span>
          <ChevronRight size={13} />
        </button>
      </div>

      <p className="text-xs text-gray-700 text-center">※ 투자 참고용이며 투자 권유가 아닙니다</p>
    </div>
  )
}
