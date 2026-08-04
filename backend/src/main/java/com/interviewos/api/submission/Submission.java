package com.interviewos.api.submission;

import com.interviewos.api.problem.Problem;
import com.interviewos.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "submissions")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false, length = 40)
    private String language;

    @Column(name = "source_code", nullable = false)
    private String sourceCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private SubmissionStatus status;

    @Column(name = "runtime_ms")
    private Integer runtimeMs;

    @Column(name = "memory_kb")
    private Integer memoryKb;

    @Column(name = "passed_tests", nullable = false)
    private int passedTests;

    @Column(name = "total_tests", nullable = false)
    private int totalTests;

    @Column(name = "judge_reference")
    private String judgeReference;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;

    protected Submission() {
    }

    public Submission(User user, Problem problem, String language, String sourceCode) {
        this.user = user;
        this.problem = problem;
        this.language = language;
        this.sourceCode = sourceCode;
        this.status = SubmissionStatus.QUEUED;
        this.submittedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Problem getProblem() {
        return problem;
    }

    public String getLanguage() {
        return language;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public SubmissionStatus getStatus() {
        return status;
    }

    public Integer getRuntimeMs() {
        return runtimeMs;
    }

    public Integer getMemoryKb() {
        return memoryKb;
    }

    public int getPassedTests() {
        return passedTests;
    }

    public int getTotalTests() {
        return totalTests;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }
}
