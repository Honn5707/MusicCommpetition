// // 백엔드가 요구하는 fingerprintId. 정교한 브라우저 핑거프린팅 라이브러리 도입은 범위 밖이라,
// // 브라우저마다 한 번 생성해 localStorage에 보관하는 임시 랜덤 식별자로 대체한다.
// // (같은 브라우저면 계속 같은 값을 재사용해 중복 투표 1차 방어에 쓰인다.)
// const KEY = 'music-battle:fingerprint'
//
// function generateFallbackId(): string {
//   // crypto.randomUUID()가 없는 환경(HTTP 등)을 위한 대체 로직
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0
//     const v = c === 'x' ? r : (r & 0x3) | 0x8
//     return v.toString(16)
//   })
// }
//
// export function getFingerprintId(): string {
//   let id = localStorage.getItem(KEY)
//   if (!id) {
//     id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : generateFallbackId()
//     localStorage.setItem(KEY, id)
//   }
//   return id
// }