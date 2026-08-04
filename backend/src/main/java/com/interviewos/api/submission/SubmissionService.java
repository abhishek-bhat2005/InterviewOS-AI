package com.interviewos.api.submission;

import com.interviewos.api.common.PageResponse;
import com.interviewos.api.problem.Problem;
import com.interviewos.api.problem.ProblemService;
import com.interviewos.api.submission.SubmissionDtos.CreateSubmissionRequest;
import com.interviewos.api.submission.SubmissionDtos.SubmissionResponse;
import com.interviewos.api.user.User;
import com.interviewos.api.user.UserRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ProblemService problemService;

    public SubmissionService(
            SubmissionRepository submissionRepository,
            UserRepository userRepository,
            ProblemService problemService
    ) {
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.problemService = problemService;
    }

    @Transactional
    public SubmissionResponse create(String email, UUID problemId, CreateSubmissionRequest request) {
        User user = requireUser(email);
        Problem problem = problemService.requirePublished(problemId);
        Submission submission = submissionRepository.save(new Submission(
                user,
                problem,
                request.language().trim().toUpperCase(Locale.ROOT),
                request.sourceCode()));
        return SubmissionResponse.from(submission);
    }

    @Transactional(readOnly = true)
    public PageResponse<SubmissionResponse> history(
            String email,
            UUID problemId,
            int page,
            int size
    ) {
        User user = requireUser(email);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
        Page<Submission> submissions = problemId == null
                ? submissionRepository.findByUserId(user.getId(), pageable)
                : submissionRepository.findByUserIdAndProblemId(user.getId(), problemId, pageable);
        return PageResponse.from(submissions.map(SubmissionResponse::from));
    }

    @Transactional(readOnly = true)
    public SubmissionResponse get(String email, UUID submissionId) {
        User user = requireUser(email);
        return submissionRepository.findByIdAndUserId(submissionId, user.getId())
                .map(SubmissionResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
