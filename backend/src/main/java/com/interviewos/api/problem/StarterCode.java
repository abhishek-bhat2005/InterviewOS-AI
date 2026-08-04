package com.interviewos.api.problem;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@IdClass(StarterCodeId.class)
@Table(name = "starter_code")
public class StarterCode {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Id
    @Column(nullable = false, length = 40)
    private String language;

    @Column(name = "source_code", nullable = false)
    private String sourceCode;

    protected StarterCode() {
    }

    public String getLanguage() {
        return language;
    }

    public String getSourceCode() {
        return sourceCode;
    }
}
