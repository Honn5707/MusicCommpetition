import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAccount, getMyPage } from '../api/members.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { BattleCard } from '../components/BattleCard.tsx'
import type { BattleSummaryResponse, MemberPageResponse } from '../types/api.ts'

const PAGE_SIZE = 5

function Section({ title, battles }: { title: string; battles: BattleSummaryResponse[] }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-bold tracking-tight text-white">
        {title}
        <span className="ml-2 text-sm font-medium text-white/40">{battles.length}</span>
      </h2>
      {battles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-6 py-12 text-center">
          <p className="text-sm text-white/40">아직 듣기평가가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          {battles.map((battle) => (
            <BattleCard key={battle.battleId} battle={battle} />
          ))}
        </div>
      )}
    </section>
  )
}

// 회원탈퇴 확인 모달. 되돌릴 수 없는 작업이라 비밀번호를 다시 입력받는다.
// 성공 시 onDeleted()로 로그아웃 + 리다이렉트를 상위에 위임한다.
function DeleteAccountModal({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!password) {
      setError('비밀번호를 입력해주세요.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await deleteAccount({ password })
      onDeleted()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '회원탈퇴에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="glass w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold tracking-tight text-white">회원탈퇴</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          탈퇴하면 계정과 관련된 정보가 삭제되며 <span className="text-rose-300">되돌릴 수 없습니다.</span>{' '}
          계속하려면 비밀번호를 입력하세요.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoComplete="current-password"
          autoFocus
          className="glass-input mt-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleDelete()
          }}
        />

        {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} disabled={submitting} className="btn-ghost flex-1">
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="flex-1 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-40"
          >
            {submitting ? '탈퇴 중…' : '탈퇴하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyPage() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)

  // 종료된 듣기평가는 페이지네이션되므로 페이지 상태를 따로 둔다.
  // 진행 중 듣기평가는 전체 리스트라 페이지와 무관하게 매번 함께 내려온다.
  const [page, setPage] = useState(0)
  const [retryKey, setRetryKey] = useState(0)
  const [data, setData] = useState<MemberPageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 로그인하지 않았으면 마이페이지 대신 로그인 화면으로 보낸다.
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/mypage' } })
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getMyPage(page, PAGE_SIZE)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : '마이페이지를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, navigate, page, retryKey])

  const finished = data?.finishedBattleSummaryResponse

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {loading && (
        <>
          <div className="h-28 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
          <div className="mt-10 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
            ))}
          </div>
        </>
      )}

      {!loading && error && (
        <div className="glass px-6 py-10 text-center">
          <p className="text-sm text-white/60">{error}</p>
          <button onClick={() => setRetryKey((k) => k + 1)} className="btn-ghost mt-4">
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="glass flex items-center justify-between gap-4 px-6 py-6">
            <div className="flex items-center gap-4">
              {/* 닉네임 첫 글자를 딴 아바타 */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-xl font-bold text-white">
                {data.nickname.slice(0, 1)}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">마이페이지</p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">{data.nickname}</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-white/40">보유 포인트</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-300">
                {data.pointBalance.toLocaleString()}
                <span className="ml-1 text-sm font-medium text-white/40">P</span>
              </p>
            </div>
          </div>

          <Section title="진행 중인 듣기평가" battles={data.currentBattleSummaryResponse} />

          <Section title="종료된 듣기평가" battles={finished?.content ?? []} />

          {finished && finished.content.length > 0 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-ghost disabled:cursor-not-allowed disabled:opacity-30"
              >
                이전
              </button>
              <span className="text-sm text-white/50">
                <span className="font-semibold text-white">{finished.page + 1}</span> /{' '}
                {Math.max(finished.totalPages, 1)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!finished.hasNext}
                className="btn-ghost disabled:cursor-not-allowed disabled:opacity-30"
              >
                다음
              </button>
            </div>
          )}

          {/* 계정 관리: 되돌릴 수 없는 작업이라 눈에 덜 띄게 하단에 배치 */}
          <div className="mt-14 border-t border-white/10 pt-6 text-right">
            <button
              onClick={() => setShowDelete(true)}
              className="text-sm font-medium text-white/40 transition-colors hover:text-rose-300"
            >
              회원탈퇴
            </button>
          </div>
        </>
      )}

      {showDelete && (
        <DeleteAccountModal
          onClose={() => setShowDelete(false)}
          onDeleted={() => {
            // 탈퇴 성공 → 로컬 토큰 정리(로그아웃) 후 홈으로.
            logout()
            navigate('/')
          }}
        />
      )}
    </div>
  )
}
