package com.musicbattle.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.cglib.core.Local;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "follow", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"follower_id", "following_id"})
})//중복된 테이블 방지
public class Follow {

    @Id
    @GeneratedValue(strategy =  GenerationType.IDENTITY)
    @Column
    private Long id;

    //팔로우를 요청한 사람
    @Column
    private Long followerId;


    //팔로우를 요청받은 사람
    @Column
    private Long followingId;

    @Column
    private LocalDateTime followTime;

    @Builder
    public Follow(Long followerId, Long followingId){
        this.followerId = followerId;
        this.followingId = followingId;
        this.followTime = LocalDateTime.now();
    }


}
