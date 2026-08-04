package com.interviewos.api.interview;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class InterviewDtos {

    private InterviewDtos() {
    }

    public record StartRequest(
            @NotBlank @Size(max = 160) String problemSlug,
            @NotBlank @Size(max = 40) String language
    ) {
    }

    public record ContinueRequest(
            @NotBlank @Size(max = 160) String problemSlug,
            @NotBlank @Size(max = 40) String language,
            @NotEmpty @Size(max = 30) List<@Valid Message> messages
    ) {
    }

    public record Message(
            @NotNull Speaker speaker,
            @NotBlank @Size(max = 4_000) String text
    ) {
    }

    public record ContinueResponse(
            String message,
            Stage stage,
            String model
    ) {
    }

    public enum Speaker {
        INTERVIEWER,
        USER
    }

    public enum Stage {
        CLARIFYING,
        APPROACH,
        COMPLEXITY,
        CODING,
        EDGE_CASES
    }
}
