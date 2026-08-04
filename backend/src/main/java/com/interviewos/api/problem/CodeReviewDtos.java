package com.interviewos.api.problem;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class CodeReviewDtos {

    private CodeReviewDtos() {
    }

    public record ReviewRequest(
            @NotBlank @Size(max = 40) String language,
            @NotBlank @Size(max = 100_000) String sourceCode
    ) {
    }

    public record ReviewResponse(
            Verdict verdict,
            String headline,
            String summary,
            List<String> issues,
            String timeComplexity,
            String spaceComplexity,
            String model,
            String disclaimer
    ) {
    }

    public enum Verdict {
        LOOKS_CORRECT,
        NEEDS_CHANGES,
        INVALID
    }
}
