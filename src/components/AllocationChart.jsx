import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { X, Maximize2 } from 'lucide-react'

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1']

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

function PieContent({ data, size = 200, innerR = 55, outerR = 90 }) {
  return (
    <>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR}
            paddingAngle={2} dataKey="value" labelLine={false} label={renderCustomLabel}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            formatter={(val) => [`$${val.toFixed(2)}`, '평가금액']}
            contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2.5 mt-2">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-sm font-semibold text-white">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">${item.value.toFixed(0)}</span>
              <span className="text-sm font-bold text-gray-300 w-12 text-right">{item.pct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function AllocationChart({ data }) {
  const [expanded, setExpanded] = useState(false)

  if (!data || data.length === 0) return null

  return (
    <>
      {/* Normal card */}
      <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">보유비중</h3>
          <button
            onClick={() => setExpanded(true)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all"
            title="크게 보기"
          >
            <Maximize2 size={14} />
          </button>
        </div>
        <PieContent data={data} size={200} innerR={50} outerR={85} />
      </div>

      {/* Expanded Modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">보유비중</h2>
              <button
                onClick={() => setExpanded(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-gray-500 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <PieContent data={data} size={300} innerR={75} outerR={130} />
          </div>
        </div>
      )}
    </>
  )
}
