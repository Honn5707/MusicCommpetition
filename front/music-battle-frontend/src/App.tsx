import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom'
import { useAuth } from './auth/AuthContext.tsx'
import InfoDrawer from './components/InfoDrawer.tsx'
import logoUrl from './assets/logo.jpg'
import BattleListPage from './pages/BattleListPage.tsx'
import BattleDetailPage from './pages/BattleDetailPage.tsx'
import CreateBattlePage from './pages/CreateBattlePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MyPage from './pages/MyPage.tsx'
import OauthCallbackPage from './pages/OauthCallbackPage.tsx'
import OauthRegisterPage from './pages/OauthRegisterPage.tsx'
import FollowsPage from './pages/FollowsPage.tsx'
import MemberProfilePage from './pages/MemberProfilePage.tsx'

// 새 페이지가 로드되거나 다른 페이지로 이동할 때마다 텍스트 입력칸을 모두 비운다.
// 입력들은 useState('')로 관리되어 이동/새로고침 시 이미 비지만, 브라우저 자동완성이나
// 뒤로가기 복원(bfcache)으로 값이 남는 경우까지 확실히 지우기 위한 안전장치다.
function InputResetter() {
  const location = useLocation()

  useEffect(() => {
    const clear = () => {
      document
        .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          'input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), textarea',
        )
        .forEach((el) => {
          if (el.value) el.value = ''
        })
    }
    clear()
    // 자동완성이 렌더 직후 늦게 채우는 경우까지 대비해 한 번 더 비운다.
    const timer = window.setTimeout(clear, 0)
    // 뒤로/앞으로 가기로 캐시된 페이지가 복원될 때도 비운다.
    window.addEventListener('pageshow', clear)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pageshow', clear)
    }
  }, [location.pathname])

  return null
}

function NavBar() {
  const { isAuthenticated } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <nav className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[#f5f6f4] px-[2%] pb-2 pt-3.5">
        {/* 하단 보더 — 그린→스카이→블루 그라데이션 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-brand-500 via-sky-400 to-blue-600" />
        <Link to="/" className="group flex items-center" aria-label="오늘 뭐 듣지? 홈">
          {/* 로고 위아래 여백이 커서 세로로 크롭(위아래 ~5%만 남김) */}
          <span className="flex h-8 items-center overflow-hidden sm:h-9">
            <img
              src={logoUrl}
              alt="오늘 뭐 듣지?"
              className="h-[135%] w-auto mix-blend-multiply transition-transform group-hover:scale-105"
            />
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="내 정보 열기"
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:scale-[1.03] hover:border-black/20"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span className="hidden sm:inline">내 정보</span>
            </button>
          ) : (
            <Link to="/login" className="btn-primary px-4 py-1.5">
              로그인
            </Link>
          )}
        </div>
      </nav>
      <InfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <InputResetter />
      <NavBar />
      <Routes>
        {/* 상태별 목록 페이지 (기본 = 투표중) */}
        <Route path="/" element={<BattleListPage filter="VOTING" />} />
        <Route path="/recruiting" element={<BattleListPage filter="RECRUITING" />} />
        <Route path="/finished" element={<BattleListPage filter="FINISHED" />} />
        <Route path="/login" element={<LoginPage />} />
        {/* 소셜 로그인: 구글 콜백 도착지(프론트 경로) + 신규 회원 닉네임 확정 */}
        {/* 구글 redirect_uri = /oauth/callback (provider 없으면 google 기본값) */}
        <Route path="/oauth/callback" element={<OauthCallbackPage />} />
        <Route path="/oauth/:provider/callback" element={<OauthCallbackPage />} />
        <Route path="/oauth/register" element={<OauthRegisterPage />} />
        <Route path="/battles/new" element={<CreateBattlePage />} />
        <Route path="/battles/:battleId" element={<BattleDetailPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/follows" element={<FollowsPage />} />
        <Route path="/members/:memberId" element={<MemberProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}
