// 서버가 내려주는 ISO 문자열(LocalDateTime 직렬화, 예: "2026-08-21T15:04:00")을
// 화면 표시용으로 포맷한다. 파싱 실패 시 원문을 그대로 돌려준다.
export function formatDateTime(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
