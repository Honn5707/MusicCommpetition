package com.musicbattle.web.dto;

import java.util.List;

public record MemberPageResponse(List<BattleSummaryResponse> currentBattleSummaryResponse, PageResponse<BattleSummaryResponse> finishedBattleSummaryResponse,  String nickname, int pointBalance) {
}
