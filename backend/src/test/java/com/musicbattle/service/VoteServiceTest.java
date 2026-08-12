//package com.musicbattle.service;
//
//import com.musicbattle.config.BattleRuleProperties;
//import com.musicbattle.domain.Match;
//import com.musicbattle.domain.MatchEntry;
//import com.musicbattle.domain.enums.EntrySide;
//import com.musicbattle.repository.MatchEntryRepository;
//import com.musicbattle.repository.MatchRepository;
//import com.musicbattle.repository.VoteRepository;
//import com.musicbattle.web.dto.VoteRequest;
//import com.musicbattle.web.dto.VoteResult;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.data.redis.core.StringRedisTemplate;
//import org.springframework.data.redis.core.ValueOperations;
//
//import java.time.Duration;
//import java.util.Optional;
//
//import static org.assertj.core.api.Assertions.assertThat;
//import static org.assertj.core.api.Assertions.assertThatThrownBy;
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.Mockito.when;
//import static org.junit.jupiter.api.Assertions.assertThrows;
//
//@ExtendWith(MockitoExtension.class)
//class VoteServiceTest {
//
//    @Mock
//    private MatchRepository matchRepository;
//    @Mock
//    private MatchEntryRepository matchEntryRepository;
//    @Mock
//    private VoteRepository voteRepository;
//    @Mock
//    private BattleRuleProperties rules;
//    @Mock
//    private StringRedisTemplate redisTemplate;
//
//    @InjectMocks
//    private VoteService voteService;
//
//
//    @Test
//    void goodVote() {
//
//        Match match = Match.builder().battleId(1L).roundNo(1).build();
//        match.openVoting(3600);
//
//
//        // ② 실제 MatchEntry 객체를 만든다 (matchId를 위 match와 일치시켜야 함)
//        //    근데 match.getId()가 지금 null이야 - 왜냐면 실제 DB에 save()를 안 했으니까
//        //    auto-increment id가 안 채워졌거든. 그래서 테스트에서는 임의로 값을 지정해줘야 해.
//        //    -> 리플렉션 없이 그냥 손으로 세팅하기는 어려우니, 여기서는 matchId를 1L로
//        //       "약속"해두고 아래 스텁에서도 그 값으로 조회되게 맞춘다.
//        MatchEntry matchEntry = MatchEntry.builder()
//                .matchId(1L)
//                .videoId("dQw4w9WgXcQ")
//                .songTitle("테스트곡")
//                .durationSec(180)
//                .embeddable(true)
//                .submitterMemberId(10L)
//                .side(EntrySide.A)
//                .build();
//
//        // ③ 요청 DTO 준비 - 로그인 회원(voterMemberId=99L)이 투표하는 상황
//        VoteRequest request = new VoteRequest(1L, 99L, "fingerprint-abc", false);
//
//        // ④ matchRepository.findById(1L) 을 호출하면 위에서 만든 match를 리턴하도록 스텁
//        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
//
//        // ⑤ matchEntryRepository.findById(1L) 을 호출하면 위에서 만든 matchEntry를 리턴
//        when(matchEntryRepository.findById(1L)).thenReturn(Optional.of(matchEntry));
//
//        // ⑥ Redis 락 - opsForValue()가 리턴하는 ValueOperations도 Mock으로 만들어서 연결
//        ValueOperations<String, String> valueOps = org.mockito.Mockito.mock(ValueOperations.class);
//        when(redisTemplate.opsForValue()).thenReturn(valueOps);
//        when(valueOps.setIfAbsent(any(), any(), any(Duration.class))).thenReturn(true); // 락 획득 성공 시뮬레이션
//
//        // ⑦ 가중치 설정값 - rules.getVote().getWeightMember() 가 3을 리턴하도록 스텁
//        //    BattleRuleProperties.Vote 는 그냥 평범한 POJO라, Mock 말고 진짜 객체를 만들어도 됨
//        BattleRuleProperties.Vote voteRule = new BattleRuleProperties.Vote();
//        voteRule.setWeightMember(3);
//        voteRule.setWeightAnonymous(1);
//        when(rules.getVote()).thenReturn(voteRule);
//
//        // ⑧ anti-abuse 설정값 (락 TTL) - 어떤 값이든 상관없지만 메서드 호출 자체는 막히면 안 되니 스텁
//        BattleRuleProperties.AntiAbuse antiAbuse = new BattleRuleProperties.AntiAbuse();
//        antiAbuse.setVoteLockTtlSeconds(86400);
//        when(rules.getAntiAbuse()).thenReturn(antiAbuse);
//
//        // ── when: 실제로 테스트하고 싶은 동작을 실행 ──────────
//
//        VoteResult result = null; // 실제 리턴 타입 확인 필요 (VoteResult가 web.dto에 있으면 그거 import)
//        // (VoteResult가 web/dto/VoteResult.java 로 독립된 파일이면 import com.musicbattle.web.dto.VoteResult; 로)
//
//        var voteResult = voteService.vote(1L, request, "ip-hash-xyz");
//
//        // ── then: 결과가 예상과 맞는지 검증 ────────────────────
//
//        assertThat(voteResult.score()).isEqualTo(3); // 로그인 회원이니 +3 가중치가 반영됐어
//    }
//    @Test
//    void notVote() {
//
//        Match match = Match.builder().battleId(1L).roundNo(1).build();
//
//
//        // ③ 요청 DTO 준비 - 로그인 회원(voterMemberId=99L)이 투표하는 상황
//        VoteRequest request = new VoteRequest(1L, 99L, "fingerprint-abc", false);
//
//        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
//
//        assertThrows(IllegalStateException.class, ()->voteService.vote(1L, request, "ip-hash"));
//
//
//
//    }
//
//
//    @Test
//    void doubledVote() {
//        Match match = Match.builder().battleId(1L).roundNo(1).build();
//
//        MatchEntry matchEntry = MatchEntry.builder()
//                .matchId(1L)
//                .videoId("dQw4w9WgXcQ")
//                .songTitle("테스트곡")
//                .durationSec(180)
//                .embeddable(true)
//                .submitterMemberId(10L)
//                .side(EntrySide.A)
//                .build();
//
//        VoteRequest request = new VoteRequest(1L, 99L, "fingerprint-abc", false);
//        match.openVoting(3600);
//        BattleRuleProperties.AntiAbuse antiAbuse = new BattleRuleProperties.AntiAbuse();
//        antiAbuse.setVoteLockTtlSeconds(86400);
//
//        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
//        when(matchEntryRepository.findById(1L)).thenReturn(Optional.of(matchEntry));
//        ValueOperations<String, String> valueOps = org.mockito.Mockito.mock(ValueOperations.class);
//        when(redisTemplate.opsForValue()).thenReturn(valueOps);
//        when(valueOps.setIfAbsent(any(), any(), any(Duration.class))).thenReturn(false);  // 락 획득 실패 = 이미 투표함
//        when(rules.getAntiAbuse()).thenReturn(antiAbuse);
//        assertThrows(IllegalStateException.class, () -> voteService.vote(1L, request, "ip-hash"));
//
//
//
//
//
//    }
//
//    @Test
//    void notMatchEntry() {
//
//        Match match = Match.builder().battleId(1L).roundNo(1).build();
//
//        MatchEntry matchEntry = MatchEntry.builder()
//                .matchId(2L)
//                .videoId("dQw4w9WgXcQ")
//                .songTitle("테스트곡")
//                .durationSec(180)
//                .embeddable(true)
//                .submitterMemberId(10L)
//                .side(EntrySide.A)
//                .build();
//        // ③ 요청 DTO 준비 - 로그인 회원(voterMemberId=99L)이 투표하는 상황
//        VoteRequest request = new VoteRequest(1L, 99L, "fingerprint-abc", false);
//        match.openVoting(3600);
//
//        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
//        when(matchEntryRepository.findById(1L)).thenReturn(Optional.of(matchEntry));
//
//        assertThrows(IllegalStateException.class, ()->voteService.vote(1L, request, "ip-hash"));
//
//
//
//    }
//}