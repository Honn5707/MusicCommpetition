---
name: design-system-glassmorphism
description: MusicBattle 프론트 디자인 시스템 — 깔끔한 다크 + 인디고/로즈 색. 새 UI는 공통 클래스 재사용
metadata:
  type: project
---

MusicBattle 프론트(`front/music-battle-frontend`)의 디자인 시스템. 공통 토큰은 `src/index.css`의 `@layer components`에 정의:

- `.glass` / `.glass-interactive` — 차분한 유리 카드(과한 blur·glow 없음), 호버 시 테두리만 밝아짐
- `.glass-input` — 유리 인풋(포커스 시 인디고 링)
- `.btn-primary` — 단색 인디고(indigo-500) 버튼
- `.btn-ghost` — 뉴트럴 유리 테두리 보조 버튼
- 배경: 딥슬레이트(#0b0d14)에 은은한 인디고 글로우 한 겹, Pretendard 폰트(body 전역)

**색 규칙(색감 절제해서 의도적으로):** 브랜드/호스트 = 인디고, 도전자 = 로즈, 위험(탈퇴 등) = 로즈-500. 텍스트 계층 white / white/60 / white/40.

**히스토리:** 처음엔 글래스모피즘+멀티 그라데이션+네온 글로우로 만들었으나 사용자가 "너무 화려하다"고 해서 깔끔한 다크 + 인디고/로즈 절제 팔레트로 정리함. 그라데이션 텍스트/네온 shadow는 쓰지 않는다.

**How to apply:** 새 화면은 위 클래스를 재사용해 일관성 유지. 주의: Tailwind 기본 불투명도 스케일에 `/12`·`/15`는 없다(빌드 깨짐) — `/10`,`/20` 또는 `/[0.12]` 형태를 쓸 것. 참고: [[frontend-auth-is-ux-only]]
