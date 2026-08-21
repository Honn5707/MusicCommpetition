package com.musicbattle.util;
import com.musicbattle.domain.Battle;
import com.musicbattle.domain.Match;
import com.musicbattle.domain.MatchEntry;
import com.musicbattle.domain.Member;
import com.musicbattle.domain.enums.EntrySide;
import com.musicbattle.repository.BattleRepository;
import com.musicbattle.repository.MatchEntryRepository;
import com.musicbattle.repository.MemberRepository;
import com.musicbattle.web.dto.BattleSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class BattleSummaryAssembler {
    private final BattleRepository battleRepository;
    private final MatchEntryRepository matchEntryRepository;
    private final MemberRepository memberRepository;

    public BattleSummaryResponse battleSummary(Match match){

        //battleId,title,hostSongTitle,challengerSongTitle,hostScore,challengerScore,matchStatus
        Battle battle = battleRepository.findById(match.getBattleId()).orElseThrow(()-> new IllegalStateException("배틀Id에 맞는 배틀 조회 불가능"));
        List<MatchEntry> matchEntryList = matchEntryRepository.findByMatchId(match.getId());
        MatchEntry hostPlayer = matchEntryList.stream().filter(matchEntry -> matchEntry.getSide() == EntrySide.A).findFirst().orElseThrow(()-> new IllegalStateException("호스트를 참조 할 수 없습니다"));
        MatchEntry challengerPlayer = matchEntryList.stream().filter(matchEntry -> matchEntry.getSide() == EntrySide.B).findFirst().orElse(null);

        String hostNickname = nicknameOf(hostPlayer.getSubmitterMemberId());

        if(challengerPlayer==null) return new BattleSummaryResponse(match.getBattleId(), battle.getTitle(), hostPlayer.getSongTitle(), null, hostPlayer.getVoteScore(), 0, match.getStatus(), hostNickname, null, null,match.getCreatedAt());
        String challengerNickname = nicknameOf(challengerPlayer.getSubmitterMemberId());
        return new BattleSummaryResponse(match.getBattleId(), battle.getTitle(), hostPlayer.getSongTitle(), challengerPlayer.getSongTitle(), hostPlayer.getVoteScore(), challengerPlayer.getVoteScore(), match.getStatus(), hostNickname, challengerNickname, match.getVotingEndsAt(), match.getCreatedAt());

    }

    private String nicknameOf(Long memberId){
        if(memberId == null) return null;
        return memberRepository.findById(memberId).map(Member::getNickname).orElse("알 수 없음");
    }
}