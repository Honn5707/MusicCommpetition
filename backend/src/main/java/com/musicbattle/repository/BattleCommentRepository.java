package com.musicbattle.repository;

import com.musicbattle.domain.BattleComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BattleCommentRepository extends JpaRepository<BattleComment, Long> {
//    @Query("select m from BattleComment m where m.battleId = :battleId")
        List<BattleComment> findTop30ByBattleIdOrderBySendTimeDesc(Long battleId);

//    @Query("select m from BattleComment m where m.battleId = :battleId and m.sendTime >= :afterTime")
        List<BattleComment> findByBattleIdAndSendTimeGreaterThanEqual(Long battleId, LocalDateTime afterTime);
}
