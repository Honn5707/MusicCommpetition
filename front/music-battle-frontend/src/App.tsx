import { useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import { useAuth } from './auth/AuthContext.tsx'
import BattleListPage from './pages/BattleListPage.tsx'
import BattleDetailPage from './pages/BattleDetailPage.tsx'
import CreateBattlePage from './pages/CreateBattlePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MyPage from './pages/MyPage.tsx'
import OauthCallbackPage from './pages/OauthCallbackPage.tsx'
import OauthRegisterPage from './pages/OauthRegisterPage.tsx'

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
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.04] px-4 pb-2 pt-[21px] backdrop-blur-xl sm:px-6">
      <Link to="/" className="flex items-center gap-2 text-sm font-bold tracking-tight text-white">
        <span className="inline-block h-3 w-3 rounded-md bg-indigo-500" />
        듣기평가
      </Link>
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          to="/battles/new"
          className="text-sm font-medium text-white/60 transition-colors hover:text-white"
        >
          듣기평가 만들기
        </Link>
        {isAuthenticated ? (
          <>
            <Link
              to="/mypage"
              className="text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              마이페이지
            </Link>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-primary px-4 py-1.5">
            로그인
          </Link>
        )}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <InputResetter />
      <NavBar />
      <Routes>
        <Route path="/" element={<BattleListPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* 소셜 로그인: 구글 콜백 도착지 + 신규 회원 닉네임 확정 */}
        <Route path="/oauth/:provider/callback" element={<OauthCallbackPage />} />
        <Route path="/oauth/register" element={<OauthRegisterPage />} />
        <Route path="/battles/new" element={<CreateBattlePage />} />
        <Route path="/battles/:battleId" element={<BattleDetailPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
      {/* 화면 가장자리 나무 액자 (장식용) */}
      <div aria-hidden className="board-frame" />
    </BrowserRouter>
  )
}
