package com.interviewos.api.interview;

import com.interviewos.api.interview.InterviewDtos.ContinueRequest;
import com.interviewos.api.interview.InterviewDtos.ContinueResponse;
import com.interviewos.api.interview.InterviewDtos.StartRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final GeminiInterviewService interviewService;

    public InterviewController(GeminiInterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping("/start")
    ContinueResponse start(@Valid @RequestBody StartRequest request) {
        return interviewService.start(request);
    }

    @PostMapping("/respond")
    ContinueResponse respond(@Valid @RequestBody ContinueRequest request) {
        return interviewService.respond(request);
    }
}
