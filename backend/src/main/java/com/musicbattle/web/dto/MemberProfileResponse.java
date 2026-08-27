package com.musicbattle.web.dto;

import java.util.List;

public record MemberProfileResponse(List<BattleSummaryResponse> currentBattleSummaryResponse, String nickname, Long followerCount, Long followingCount, boolean isFollowing) {
}
