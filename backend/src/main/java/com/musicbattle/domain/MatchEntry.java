package com.musicbattle.domain;

import com.musicbattle.domain.enums.EntrySide;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "match_entry", uniqueConstraints = @UniqueConstraint(columnNames = {"match_id", "side"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    @Column(name = "video_id", nullable = false)
    private String videoId;

    @Column(name = "song_title", nullable = false)
    private String songTitle;

    @Column(name = "channel_title")
    private String channelTitle;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "duration_sec", nullable = false)
    private Integer durationSec;

    @Column(name = "embeddable", nullable = false)
    private boolean embeddable;

    @Column(name = "submitter_member_id", nullable = false)
    private Long submitterMemberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntrySide side;

    // 실시간 응답 속도를 위한 캐시. 진실의 원천은 vote 테이블 합계.
    // VoteService 가 투표마다 원자적으로(@Version 낙관적 락) 갱신한다.
    @Column(name = "vote_score", nullable = false)
    private int voteScore = 0;

    @Column(name = "raw_vote_count", nullable = false)
    private int rawVoteCount = 0;

    @Version
    private Long version;

    @Builder
    public MatchEntry(Long matchId, String videoId, String songTitle, String channelTitle,
                      String thumbnailUrl, Integer durationSec, boolean embeddable, Long submitterMemberId, EntrySide side) {
        this.matchId = matchId;
        this.videoId = videoId;
        this.songTitle = songTitle;
        this.channelTitle = channelTitle;
        this.thumbnailUrl = thumbnailUrl;
        this.durationSec = durationSec;
        this.embeddable = embeddable;
        this.submitterMemberId = submitterMemberId;
        this.side = side;
    }

    public void addVote(int weight) {
        this.voteScore += weight;
        this.rawVoteCount += 1;
    }
}
