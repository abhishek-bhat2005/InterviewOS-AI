package com.interviewos.api.problem;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "problems")
public class Problem {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(nullable = false, length = 240)
    private String title;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    @Column(name = "constraints_text")
    private String constraintsText;

    @Column(name = "estimated_minutes")
    private Short estimatedMinutes;

    @Column(name = "acceptance_rate", precision = 5, scale = 2)
    private BigDecimal acceptanceRate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Frequency frequency;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "problem_topics",
            joinColumns = @JoinColumn(name = "problem_id"),
            inverseJoinColumns = @JoinColumn(name = "topic_id"))
    private Set<Topic> topics = new LinkedHashSet<>();

    @OneToMany(mappedBy = "problem", fetch = FetchType.LAZY)
    @OrderBy("position ASC")
    private List<ProblemExample> examples = new ArrayList<>();

    @OneToMany(mappedBy = "problem", fetch = FetchType.LAZY)
    @OrderBy("language ASC")
    private List<StarterCode> starterCode = new ArrayList<>();

    protected Problem() {
    }

    public UUID getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public String getConstraintsText() {
        return constraintsText;
    }

    public Short getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public BigDecimal getAcceptanceRate() {
        return acceptanceRate;
    }

    public Frequency getFrequency() {
        return frequency;
    }

    public boolean isPublished() {
        return published;
    }

    public Set<Topic> getTopics() {
        return topics;
    }

    public List<ProblemExample> getExamples() {
        return examples;
    }

    public List<StarterCode> getStarterCode() {
        return starterCode;
    }
}
