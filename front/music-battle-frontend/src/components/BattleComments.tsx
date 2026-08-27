import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import { getComments, postComment } from '../api/comments.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { getToken } from '../auth/token.ts'
import type { BattleCommentResponse } from '../types/api.ts'

// SockJS를 쓰지 않으므로 ws:// 로 직접 연결한다. 미설정 시 개발 기본값 사용.
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

// 기존 목록에 새로 온 것만(id 기준 중복 제거) 추가하고, 오래된→최신 순으로 정렬한다.
// 백엔드 증분 조회가 GreaterThanEqual(경계 포함)이라 경계 댓글이 다시 올 수 있어 중복 제거가 필수.
function mergeComments(
  prev: BattleCommentResponse[],
  incoming: BattleCommentResponse[],
): BattleCommentResponse[] {
  const seen = new Set(prev.map((c) => c.id))
  const added = incoming.filter((c) => !seen.has(c.id))
  if (added.length === 0) return prev
  return [...prev, ...added].sort(
    (a, b) => a.sendTime.localeCompare(b.sendTime) || a.id - b.id,
  )
}

// 증분 조회 기준이 되는 "지금까지 받은 가장 최근 sendTime".
function maxSendTime(list: BattleCommentResponse[]): string | undefined {
  if (list.length === 0) return undefined
  return list.reduce((max, c) => (c.sendTime > max ? c.sendTime : max), list[0].sendTime)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 배틀 상세 페이지의 실시간 댓글(채팅).
// 원칙: REST는 데이터(작성/조회), 웹소켓은 "새 댓글 발생" 신호만. 신호를 받으면 REST로 증분 조회한다.
export default function BattleComments({ battleId }: { battleId: number }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  const [comments, setComments] = useState<BattleCommentResponse[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 웹소켓 콜백(클로저)에서 최신 목록을 읽기 위한 ref.
  const commentsRef = useRef<BattleCommentResponse[]>([])
  useEffect(() => {
    commentsRef.current = comments
  }, [comments])

  const scrollRef = useRef<HTMLDivElement>(null)

  // 최신 상태 기준으로 증분 조회 후 병합. afterTime 조회가 실패하면 최근 30개로 폴백한다.
  const refresh = useCallback(async () => {
    const after = maxSendTime(commentsRef.current)
    try {
      const incoming = await getComments(battleId, after)
      setComments((prev) => mergeComments(prev, incoming))
    } catch {
      try {
        const all = await getComments(battleId)
        setComments((prev) => mergeComments(prev, all))
      } catch {
        /* 조회 실패는 조용히 무시 — 다음 신호나 전송 시 다시 시도된다 */
      }
    }
  }, [battleId])

  // 최초 로딩(최근 30개).
  useEffect(() => {
    let cancelled = false
    getComments(battleId)
      .then((list) => {
        if (!cancelled) setComments((prev) => mergeComments(prev, list))
      })
      .catch(() => {
        /* 초기 조회 실패는 빈 목록으로 둔다 */
      })
    return () => {
      cancelled = true
    }
  }, [battleId])

  // 웹소켓(STOMP) 연결. 인터셉터가 토큰 없음을 허용하므로 익명 사용자도 실시간 수신이 가능하다.
  // (로그인 상태면 Authorization 헤더로 세션에 memberId가 실린다. 수신 자체엔 인증이 필요 없다.)
  useEffect(() => {
    const token = getToken()

    const client = new Client({
      brokerURL: WS_URL,
      // 인터셉터가 "Bearer " 접두사를 벗겨 토큰을 검증한다. 토큰이 없으면 익명으로 연결된다.
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/battle/${battleId}`, () => {
          // 신호만 온다(내용 없음) → REST로 다시 조회해 화면 갱신.
          void refresh()
        })
      },
    })
    client.activate()

    // 페이지를 벗어나면 연결 정리.
    return () => {
      void client.deactivate()
    }
  }, [battleId, refresh])

  // 새 댓글이 붙으면 맨 아래로 스크롤.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [comments])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    setSending(true)
    setError(null)
    try {
      await postComment(battleId, text)
      setInput('')
      // 갱신은 본인이 받은 신호로 되지만, 신호가 늦거나 유실돼도 보이도록 즉시 한 번 더 조회(중복 제거됨).
      void refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '댓글 전송에 실패했습니다.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="glass flex flex-col p-5">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">실시간 댓글</h2>

      <div ref={scrollRef} className="flex max-h-80 min-h-40 flex-col gap-3 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="my-auto text-center text-sm text-gray-400">
            아직 댓글이 없어요. 첫 댓글을 남겨보세요.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-700">{c.nickname}</span>
                <span className="text-xs text-gray-400">{formatTime(c.sendTime)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-gray-700">{c.comment}</p>
            </div>
          ))
        )}
      </div>

      {error && <p className="mt-2 text-sm text-gray-600">{error}</p>}

      {isAuthenticated ? (
        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="댓글 (최대 30자)"
            maxLength={30}
            className="glass-input py-2.5"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn-primary shrink-0 px-4 disabled:opacity-40"
          >
            {sending ? '전송 중…' : '전송'}
          </button>
        </form>
      ) : (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
          댓글을 작성하려면{' '}
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="font-medium text-gray-600 hover:underline"
          >
            로그인
          </Link>
          하세요.
        </div>
      )}
    </section>
  )
}
