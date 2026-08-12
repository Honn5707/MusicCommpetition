---
name: product-naming-and-features
description: 제품명은 UI상 '듣기평가'(코드/식별자는 battle 유지). 유튜브 검색은 선택적 env
metadata:
  type: project
---

**브랜드명:** 사용자 화면 문구는 "듣기평가"로 통일했다(이전 "음악 배틀"이 테스트버전 같다는 피드백). 단, 코드 식별자·API 경로·타입명(`battle`, `Battle`, `/api/battles`, `BattleSummaryResponse` 등)과 repo명은 그대로 "battle"이다. 즉 **UI 문구=듣기평가 / 코드=battle** 이중 체계다. 호스트/도전자/투표 같은 역할·액션 단어는 그대로 둔다(사용자가 "브랜드/소개 문구 위주"만 요청).

**유튜브 검색(선택 기능):** `VITE_YOUTUBE_API_KEY` 환경변수가 있으면 곡 등록 폼(생성/도전)에 '검색' 탭이 켜지고 없으면 'YouTube 링크 붙여넣기'로 폴백한다. 관련 코드: `src/lib/youtubeSearch.ts`, `src/components/YoutubeSearchBox.tsx`, `.env.example`.

**공용 카드:** 목록/마이페이지의 배틀 카드는 `src/components/BattleCard.tsx`(StatusBadge/ScoreBar 포함)로 통합. 호버 시 상세가 grid-rows 0fr→1fr 트릭으로 펼쳐진다. 참고: [[design-system-glassmorphism]]
