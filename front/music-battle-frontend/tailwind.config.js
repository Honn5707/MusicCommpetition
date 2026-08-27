/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // 모던 UI 폰트(미로딩 시 시스템 폰트로 폴백)
        sans: ['Pretendard', 'Pretendard Variable', 'system-ui', 'Apple SD Gothic Neo', 'sans-serif'],
      },
      colors: {
        white: '#ffffff',
        // ── 포인트(액센트) 컬러: 부드러운 그린(덜 쨍하게) ──
        brand: {
          50: '#eff9f2',
          100: '#dbf1e1',
          200: '#b9e3c6',
          300: '#8fd0a5',
          400: '#63bd84',
          500: '#48b073', // 메인(살짝 뮤트된 그린)
          600: '#399a60', // hover / 텍스트
          700: '#2c7c4d', // 밝은 배경 위 텍스트
        },
        // 유일한 보조 포인트 — 팔로우 하트에서만 쓰는 핑크(rose).
        rose: {
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
      },
      keyframes: {
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
