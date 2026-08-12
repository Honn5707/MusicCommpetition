import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext.tsx'
import BattleListPage from './pages/BattleListPage.tsx'
import BattleDetailPage from './pages/BattleDetailPage.tsx'
import CreateBattlePage from './pages/CreateBattlePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MyPage from './pages/MyPage.tsx'

function NavBar() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-6 py-4 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2 text-base font-bold tracking-tight text-white">
        <span className="inline-block h-4 w-4 rounded-md bg-indigo-500" />
        듣기평가
      </Link>
      <div className="flex items-center gap-5">
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
      <NavBar />
      <Routes>
        <Route path="/" element={<BattleListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/battles/new" element={<CreateBattlePage />} />
        <Route path="/battles/:battleId" element={<BattleDetailPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </BrowserRouter>
  )
}
