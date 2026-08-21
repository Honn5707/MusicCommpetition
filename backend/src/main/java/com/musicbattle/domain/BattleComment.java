package com.musicbattle.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "battle_comment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BattleComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "battle_id", nullable = false)
    private Long battleId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "send_time", nullable = false)
    private LocalDateTime sendTime;

    @Column(name = "comment", nullable = false)
    private String comment;

}
