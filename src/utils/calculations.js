export function calcAvgPrice(entries) {
  const totalCost = entries.reduce((s, e) => s + e.quantity * e.buyPrice, 0)
  const totalQty = entries.reduce((s, e) => s + e.quantity, 0)
  return totalQty > 0 ? totalCost / totalQty : 0
}

export function calcPnL(holding, currentPrice) {
  const avgPrice = calcAvgPrice(holding.entries)
  const totalQty = holding.entries.reduce((s, e) => s + e.quantity, 0)
  const currentValue = totalQty * currentPrice
  const investedValue = totalQty * avgPrice
  return {
    currentValue,
    investedValue,
    pnl: currentValue - investedValue,
    pnlPct: investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0,
    totalQty,
    avgPrice,
  }
}

// Convert a native-currency value to USD
export function toUSD(value, currency, usdToKrw) {
  if (currency === 'KRW') return value / usdToKrw
  return value // USDT and USD are ~1:1
}

export function formatCurrency(value, currency) {
  if (currency === 'KRW') return formatKRW(value)
  return formatUSD(value)
}

export function getCurrencySymbol(currency) {
  if (currency === 'KRW') return '₩'
  if (currency === 'USDT') return 'USDT '
  return '$'
}

export function formatKRW(value) {
  if (value === null || value === undefined) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000_000).toFixed(2)}조원`
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(2)}억원`
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000)}만원`
  return `${sign}₩${Math.round(abs).toLocaleString('ko-KR')}`
}

export function formatKRWFull(value) {
  if (value === null || value === undefined) return '—'
  return `₩${Math.round(value).toLocaleString('ko-KR')}`
}

export function formatUSD(value) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatUSDT(value) {
  if (value === null || value === undefined) return '—'
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
}

export function formatNumber(value, decimals = 4) {
  if (value === 0) return '0'
  if (Math.abs(value) < 0.0001) return value.toExponential(2)
  return value.toFixed(decimals).replace(/\.?0+$/, '')
}
