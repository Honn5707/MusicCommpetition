package com.musicbattle.service;


import com.musicbattle.domain.Battle;
import com.musicbattle.domain.Match;
import com.musicbattle.domain.MatchEntry;
import com.musicbattle.domain.Member;
import com.musicbattle.domain.enums.EntrySide;
import com.musicbattle.domain.enums.MatchStatus;
import com.musicbattle.domain.enums.Provider;
import com.musicbattle.repository.*;
import com.musicbattle.util.BattleSummaryAssembler;
import com.musicbattle.util.RecaptchaUtilities;
import com.musicbattle.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final MatchEntryRepository matchEntryRepository;
    private final BattleSummaryAssembler battleSummaryAssembler;
    private final MatchRepository matchRepository;
    private final BattleService battleService;
    private final RecaptchaUtilities recaptchaUtilities;
    private final StringRedisTemplate redisTemplate;
    private final EmailService emailService;

    @Transactional
    public MemberRegisterResult register(MemberRegisterRequest request){

        if(!emailService.isVerified(request.email()))
            throw new IllegalStateException("이메일 인증을 하지 않았습니다!");

        if(memberRepository.findByEmail(request.email()).isPresent())
            throw new IllegalStateException("이미 존재하는 이메일:"+request.email());

        String providerId = request.providerId();
        if(memberRepository.findByProviderId(providerId).isPresent()) throw new IllegalStateException("이미 존재하는 ID:"+providerId);

        String nickname = request.nickname();
        if(memberRepository.findByNickname(nickname).isPresent()) throw new IllegalStateException("이미 존재하는 닉네임:"+nickname);

        Provider provider = request.provider();
//        String recaptchaToken = request.recaptchaToken();
//        recaptchaUtilities.certify(recaptchaToken);
        //모든 조건을 확인 한 후 엔티티 등록

        Member newMember;
        if(request.provider() == Provider.LOCAL) {
            newMember = Member.builder().provider(provider).providerId(providerId).nickname(nickname).password(passwordEncoder.encode(request.password())).email(request.email()).build();
        }

        newMember = Member.builder().provider(provider).providerId(providerId).nickname(nickname).password(null).email(request.email()).build();

        memberRepository.save(newMember);
        redisTemplate.delete(emailService.VERIFY_KEY_PREFIX+request.email());


        //응답값으로 id전송
        return new MemberRegisterResult(newMember.getId());




    }


    @Transactional
    public MemberPageResponse memberPage(Long memberId, Pageable pageable){
        //memberId 조회를 통해 배틀에 속한 list를 DTO로 리턴
        Member member = memberRepository.findById(memberId).orElseThrow(()->new IllegalStateException("조회가 불가능한 회원"));
        String nickname = member.getNickname();
        int pointBalance = member.getPointBalance();
        List<BattleSummaryResponse> currentBattleSummaryResponse = matchEntryRepository.listOfCurrentMatches(memberId, MatchStatus.FINISHED).stream().map(
                battleSummaryAssembler::battleSummary).toList();

         Page<Match> finishedMatchPage = matchEntryRepository.listOfFinishedMatches(memberId, MatchStatus.FINISHED,pageable);
        List<BattleSummaryResponse> finishedSummaries = finishedMatchPage.getContent().stream()
                .map(battleSummaryAssembler::battleSummary)
                .toList();
         PageResponse<BattleSummaryResponse> finishedBattleSummaryResponse = new PageResponse<>(
                 finishedSummaries,
                 finishedMatchPage.getNumber(),
                 finishedMatchPage.getSize(),
                 finishedMatchPage.getTotalElements(),
                 finishedMatchPage.getTotalPages(),
                 finishedMatchPage.hasNext()
        );

        return new MemberPageResponse(currentBattleSummaryResponse, finishedBattleSummaryResponse, nickname, pointBalance);

    }

    //회원탈퇴
    @Transactional
    public void deleteMember(Long memberId, DeleteAccountRequest deleteAccountRequest){
        Member member = memberRepository.findById(memberId).orElseThrow(()->new IllegalStateException("조회할 수 없는 ID"));
        if(member.getPassword() == null) throw new IllegalStateException("외부로그인 방식. 잘못된 접근");
        //변환 해시값은 매번 변하기에 PasswordEncoder내부 메서드 matches사용
        //비밀번호가 일치하지 않다면 예외 발생
        if(!passwordEncoder.matches(deleteAccountRequest.password(), member.getPassword())) throw new IllegalStateException("비밀번호가 틀렸습니다");

        //recruiting상태의 배틀 조회
        List<Match> matches = matchRepository.findMatchesByMemberAndStatus(memberId, MatchStatus.RECRUITING);

        for(Match match: matches)battleService.forceBattleDelete(match.getBattleId());
        memberRepository.delete(member);
    }

}
