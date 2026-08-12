package com.musicbattle.domain.enums;

/**
 * Match 상태머신: RECRUITING -> VOTING -> CALCULATING -> FINISHED
 * 전이는 MatchLifecycleService 에서만 수행한다 (다른 곳에서 status 직접 set 금지 - 실무 룰).
 */
public enum MatchStatus {
    RECRUITING,
    VOTING,
    CALCULATING,
    FINISHED
}
