// 서버가 내려주는 LocalDateTime 값을 Date 로 파싱한다.
// - ISO 문자열("2026-08-21T15:04:00")
// - Jackson이 배열로 직렬화한 경우([2026, 8, 21, 15, 4, 0, ...]) 도 처리
// 실패하면 null.
export function parseServerDate(v?: string | number[] | null): Date | null {
  if (v == null) return null
  if (Array.isArray(v)) {
    // Java LocalDateTime = [year, month, day, hour, minute, second, nano]
    const [y, mo = 1, d = 1, h = 0, mi = 0, s = 0] = v
    if (y == null) return null
    return new Date(y, mo - 1, d, h, mi, s)
  }
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

// 화면 표시용 포맷("2026.08.21 15:04"). 파싱 실패 시 원문 문자열/그대로 반환.
export function formatDateTime(iso?: string | null): string | null {
  if (!iso) return null
  const d = parseServerDate(iso)
  if (!d) return typeof iso === 'string' ? iso : null
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
