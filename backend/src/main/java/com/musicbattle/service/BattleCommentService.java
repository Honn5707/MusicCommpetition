package com.musicbattle.service;

import com.musicbattle.config.BattleRuleProperties;
import com.musicbattle.domain.BattleComment;
import com.musicbattle.domain.Member;
import com.musicbattle.repository.BattleCommentRepository;
import com.musicbattle.repository.BattleRepository;
import com.musicbattle.repository.MemberRepository;
import com.musicbattle.web.dto.BattleCommentRequest;
import com.musicbattle.web.dto.BattleCommentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BattleCommentService {
    private final BattleRepository battleRepository;
    private final MemberRepository memberRepository;
    private final BattleCommentRepository battleCommentRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate redisTemplate;
    private final BattleRuleProperties rules;


    //rest로 요청받으면 등록 후, 브로드캐스팅
    @Transactional //엔티티 추가할떄는 트랜잭션 처리 하자... <<잊어버리지 말기..
    public void battleCommentAdd(Long battleId, Long memberId, BattleCommentRequest request){
        if(!battleRepository.existsById(battleId)) throw new IllegalStateException("존재하지 않는 battleId 입니다");
        String key = "comment:rate:"+battleId+":"+memberId;
        Long count =  redisTemplate.opsForValue().increment(key);
        if(count!=null && count > 3) throw new IllegalStateException("메세지를 연속해서 작성하였습니다.");

        if(count!=null&& count == 1) redisTemplate.expire(key, rules.getMessage().getMessageLockDuration());


        BattleComment battleComment = BattleComment.builder().battleId(battleId).senderId(memberId).comment(request.comment()).build();
        battleCommentRepository.save(battleComment);
        messagingTemplate.convertAndSend("/topic/battle/"+battleId, "success");

    }

    //채팅 내용을 불러오기위한 서비스 로직 afterTime<<null일 수 있음
    public List<BattleCommentResponse> battleCommentListRetrieve(Long battleId, LocalDateTime afterTime){
        if(!battleRepository.existsById(battleId)) throw new IllegalStateException("존재하지 않는 battleId 입니다");
        List<BattleComment> comments;
        if(afterTime == null) comments = battleCommentRepository.findTop30ByBattleIdOrderBySendTimeDesc(battleId);
        else comments = battleCommentRepository.findByBattleIdAndSendTimeGreaterThanEqual(battleId, afterTime);

        //닉네임을 조회하기 위한 Map생성(쿼리 조회는 1회만)
        Map<Long, String> nicknameMap = memberRepository.findAllById(comments.stream().map(BattleComment::getSenderId).distinct().toList()).stream().collect(Collectors.toMap(Member::getId, Member::getNickname));

        List<BattleCommentResponse> battleCommentResponses =  comments.stream().map(obj -> {
            return new BattleCommentResponse(obj.getId(), obj.getComment(), nicknameMap.getOrDefault(obj.getSenderId(),"nullMemberId"), obj.getSendTime());

        }).toList();
        return battleCommentResponses;
    }
}
