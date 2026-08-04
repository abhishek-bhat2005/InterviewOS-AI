package com.interviewos.api.problem;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class StarterCodeId implements Serializable {
    private UUID problem;
    private String language;

    public StarterCodeId() {
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (!(object instanceof StarterCodeId that)) return false;
        return Objects.equals(problem, that.problem) && Objects.equals(language, that.language);
    }

    @Override
    public int hashCode() {
        return Objects.hash(problem, language);
    }
}
