package com.interviewos.api.submission;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    Page<Submission> findByUserId(UUID userId, Pageable pageable);

    Page<Submission> findByUserIdAndProblemId(UUID userId, UUID problemId, Pageable pageable);

    Optional<Submission> findByIdAndUserId(UUID id, UUID userId);
}
