package com.musicbattle.web;


import com.musicbattle.service.BattleService;
import com.musicbattle.web.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/battles")
@RequiredArgsConstructor
public class BattleController {
    private final BattleService battleService;
    @PostMapping
    public ResponseEntity<BattleCreateResult> create(@Valid @RequestBody CreateBattleRequest request,
                                                     @AuthenticationPrincipal Long hostMemberId){
        BattleCreateResult requestResult = battleService.createOneVsOneBattle(request, hostMemberId);

        return ResponseEntity.ok(requestResult);

    }
    @GetMapping
    public ResponseEntity<PageResponse<BattleSummaryResponse>> list(
            @PageableDefault(size = 5) Pageable pageable
    ) {
        return ResponseEntity.ok(battleService.getBattleList(pageable));

    }

    @PostMapping("/{battleId}/challenge")
    public ResponseEntity<MatchCreateResult> challenge(@PathVariable Long battleId,
                                          @Valid @RequestBody ChallengeRequest request,
                                          @AuthenticationPrincipal Long challengerId){
        battleService.joinAsChallenger(battleId, request, challengerId);

        return ResponseEntity.ok(battleService.joinAsChallenger(battleId, request, challengerId));
    }

    @GetMapping("/{battleId}")
    public ResponseEntity<BattleDetailResponse> detail(@PathVariable Long battleId){
        BattleDetailResponse result =  battleService.getBattleDetail(battleId);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{battleId}")
    public ResponseEntity<Void> delete(@PathVariable Long battleId,
                                       @AuthenticationPrincipal Long memberId){
        battleService.hostBattleDelete(battleId, memberId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{battleId}/surrender")
    public ResponseEntity<Void> surrender(@PathVariable Long battleId,
                                          @AuthenticationPrincipal Long memberId){
        battleService.battleSurrender(battleId, memberId);
        return  ResponseEntity.ok().build();
    }



}
