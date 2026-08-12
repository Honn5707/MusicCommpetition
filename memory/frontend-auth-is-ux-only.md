---
name: frontend-auth-is-ux-only
description: MusicBattle — 프론트의 권한 기반 UI 노출은 UX일 뿐, 서버 @AuthenticationPrincipal 검증이 진짜 경계
metadata:
  type: feedback
---

MusicBattle 프로젝트에서 삭제/항복 등 권한이 필요한 액션의 버튼 노출을 `currentUserId === hostMemberId` 같은 프론트 조건으로 숨기는 것은 순전히 UX 목적이다. 실제 허용 여부는 항상 서버가 JWT `@AuthenticationPrincipal`로 결정한다.

**Why:** 프론트 상태는 신뢰 경계가 아니다. 응답 DTO에 회원 ID(`hostMemberId`, `challengerMemberId`)를 UX용으로 내려주더라도 그 값으로 보안 판단을 하면 안 된다.

**How to apply:** 이런 UX용 필드를 DTO/타입에 추가하는 건 괜찮지만, 서버 쪽 검증 로직(`@AuthenticationPrincipal` 비교 등)은 절대 건드리지 말 것. 프론트 조건이 통과해도 서버가 거부하면 ApiError 메시지로 처리한다.
