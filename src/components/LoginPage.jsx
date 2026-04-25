import { useState } from 'react'
import { Wallet, Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabaseConfigured } from '../lib/supabase'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('가입 완료! 이메일을 확인해서 인증을 완료해주세요.')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      const msg = err.message || '오류가 발생했어요'
      if (msg.includes('Invalid login')) setError('이메일 또는 비밀번호가 틀렸어요')
      else if (msg.includes('already registered')) setError('이미 가입된 이메일이에요')
      else if (msg.includes('Password should')) setError('비밀번호는 6자 이상이어야 해요')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mx-auto mb-4">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">CryptoTrack</h1>
          <p className="text-gray-500 text-sm mt-1">내 코인 포트폴리오, 어디서든</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-7 backdrop-blur-sm shadow-2xl">
          {/* Tab */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                mode === 'login' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                mode === 'signup' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <><span>로그인</span><ArrowRight size={16} /></>
              ) : (
                <><UserPlus size={16} /><span>계정 만들기</span></>
              )}
            </button>
          </form>

          {!supabaseConfigured && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-3 flex gap-3">
              <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-300/80 leading-relaxed">
                <p className="font-semibold text-yellow-300 mb-1">Supabase 설정 필요</p>
                <p><code className="bg-yellow-500/10 px-1 rounded">.env</code> 파일에 Supabase URL과 API 키를 입력해야 로그인이 활성화돼요.</p>
                <p className="mt-1 text-yellow-400/60">supabase.com → 프로젝트 → Settings → API</p>
              </div>
            </div>
          )}
          <p className="text-center text-xs text-gray-600 mt-4">
            로그인하면 포트폴리오가 클라우드에 저장되어<br />어느 기기에서든 확인할 수 있어요
          </p>
        </div>
      </div>
    </div>
  )
}
