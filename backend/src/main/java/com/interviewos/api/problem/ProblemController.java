package com.interviewos.api.problem;

import com.interviewos.api.common.PageResponse;
import com.interviewos.api.problem.ProblemDtos.ProblemDetail;
import com.interviewos.api.problem.ProblemDtos.ProblemSummary;
import com.interviewos.api.problem.CodeReviewDtos.ReviewRequest;
import com.interviewos.api.problem.CodeReviewDtos.ReviewResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    private final ProblemService problemService;
    private final GeminiCodeReviewService codeReviewService;

    public ProblemController(ProblemService problemService, GeminiCodeReviewService codeReviewService) {
        this.problemService = problemService;
        this.codeReviewService = codeReviewService;
    }

    @GetMapping
    PageResponse<ProblemSummary> list(
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return problemService.list(difficulty, topic, search, page, size);
    }

    @GetMapping("/{slug}")
    ProblemDetail get(@PathVariable String slug) {
        return problemService.getBySlug(slug);
    }

    @PostMapping("/{problemId}/review")
    ReviewResponse review(
            @PathVariable UUID problemId,
            @Valid @RequestBody ReviewRequest request
    ) {
        return codeReviewService.review(problemId, request);
    }
}
