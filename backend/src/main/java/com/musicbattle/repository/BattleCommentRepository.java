package com.musicbattle.repository;

import com.musicbattle.domain.BattleComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BattleCommentRepository extends JpaRepository<BattleComment, Long> {
//    @Query("select m from BattleComment m where m.battleId = :battleId")
        List<BattleComment> findTop30ByBattleIdOrderBySendTimeDesc(Long battleId);

//    @Query("select m from BattleComment m where m.battleId = :battleId and m.sendTime >= :afterTime")
        List<BattleComment> findByBattleIdAndSendTimeGreaterThanEqual(Long battleId, LocalDateTime afterTime);
}
