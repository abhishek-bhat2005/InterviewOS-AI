package com.interviewos.api.submission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class SubmissionDtos {

    private SubmissionDtos() {
    }

    public record CreateSubmissionRequest(
            @NotBlank @Size(max = 40) String language,
            @NotBlank @Size(max = 100_000) String sourceCode
    ) {
    }

    public record SubmissionResponse(
            UUID id,
            UUID problemId,
            String problemSlug,
            String problemTitle,
            String language,
            String sourceCode,
            SubmissionStatus status,
            Integer runtimeMs,
            Integer memoryKb,
            int passedTests,
            int totalTests,
            Instant submittedAt
    ) {
        static SubmissionResponse from(Submission submission) {
            return new SubmissionResponse(
                    submission.getId(),
                    submission.getProblem().getId(),
                    submission.getProblem().getSlug(),
                    submission.getProblem().getTitle(),
                    submission.getLanguage(),
                    submission.getSourceCode(),
                    submission.getStatus(),
                    submission.getRuntimeMs(),
                    submission.getMemoryKb(),
                    submission.getPassedTests(),
                    submission.getTotalTests(),
                    submission.getSubmittedAt());
        }
    }
}
