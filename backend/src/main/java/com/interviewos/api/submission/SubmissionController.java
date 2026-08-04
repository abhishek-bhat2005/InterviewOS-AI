package com.interviewos.api.submission;

import com.interviewos.api.common.PageResponse;
import com.interviewos.api.submission.SubmissionDtos.CreateSubmissionRequest;
import com.interviewos.api.submission.SubmissionDtos.SubmissionResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
@RequestMapping("/api")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping("/problems/{problemId}/submissions")
    ResponseEntity<SubmissionResponse> create(
            Authentication authentication,
            @PathVariable UUID problemId,
            @Valid @RequestBody CreateSubmissionRequest request
    ) {
        SubmissionResponse response = submissionService.create(authentication.getName(), problemId, request);
        return ResponseEntity.created(URI.create("/api/submissions/" + response.id())).body(response);
    }

    @GetMapping("/submissions")
    PageResponse<SubmissionResponse> history(
            Authentication authentication,
            @RequestParam(required = false) UUID problemId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return submissionService.history(authentication.getName(), problemId, page, size);
    }

    @GetMapping("/submissions/{submissionId}")
    SubmissionResponse get(Authentication authentication, @PathVariable UUID submissionId) {
        return submissionService.get(authentication.getName(), submissionId);
    }
}
