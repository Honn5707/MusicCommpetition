/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // 분필 손글씨 느낌(미로딩 시 시스템 폰트로 폴백)
        sans: ['Gaegu', 'Nanum Pen Script', 'Apple SD Gothic Neo', 'sans-serif'],
        hand: ['Nanum Pen Script', 'Gaegu', 'cursive'],
      },
      colors: {
        // 기본 "흰 분필"을 스타키한 순백 대신 살짝 따뜻한 미색으로.
        // (text-white / border-white / bg-white 전반에 적용된다)
        white: '#f3eddd',
        // ── 칠판 위 색분필 팔레트 ─────────────────────────────
        // 페이지들이 쓰던 indigo(호스트)/rose·fuchsia(도전자)를 그대로 두고
        // 값만 "파란 분필 / 분홍 분필"로 갈아끼워 코드 수정 없이 테마를 바꾼다.
        indigo: {
          50: '#eef4fa',
          100: '#dbe8f5',
          200: '#c1d8ec',
          300: '#a6c6e2', // 옅은 파란 분필 (text-indigo-300)
          400: '#82abd4',
          500: '#5a8cc2', // 흰 글씨와 함께 쓰는 배경
          600: '#4a76a6',
          700: '#3d6089',
          800: '#334e6f',
          900: '#2c405a',
        },
        rose: {
          50: '#fdf1f4',
          100: '#fbdde6',
          200: '#f6c6d4', // text-rose-200
          300: '#efa8bd', // 옅은 분홍 분필 (text-rose-300)
          400: '#e685a2',
          500: '#d86b8b',
          600: '#bf5674',
          700: '#9c4560',
        },
        fuchsia: {
          200: '#f3cfe1',
          300: '#eaa7c9', // 분홍 분필 링크
          400: '#df84b4',
          500: '#cf6a9d',
        },
        // 칠판/분필 원색(직접 참조가 필요할 때)
        chalk: {
          board: '#33453b',
          white: '#f2efe0',
        },
      },
      keyframes: {
        'chalk-in': {
          from: { opacity: '0', transform: 'translateY(8px)', filter: 'blur(6px)' },
          to: { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-1.2deg)' },
        },
      },
      animation: {
        'chalk-in': 'chalk-in 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
