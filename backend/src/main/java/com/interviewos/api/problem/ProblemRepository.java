package com.interviewos.api.problem;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProblemRepository extends JpaRepository<Problem, UUID> {

    @Query(value = """
            select distinct problem from Problem problem
            left join problem.topics topic
            where problem.published = true
              and (:difficulty is null or problem.difficulty = :difficulty)
              and (:topic is null or topic.slug = :topic)
              and (:hasSearch = false or lower(problem.title) like :searchPattern
                   or lower(problem.description) like :searchPattern)
            """,
            countQuery = """
            select count(distinct problem.id) from Problem problem
            left join problem.topics topic
            where problem.published = true
              and (:difficulty is null or problem.difficulty = :difficulty)
              and (:topic is null or topic.slug = :topic)
              and (:hasSearch = false or lower(problem.title) like :searchPattern
                   or lower(problem.description) like :searchPattern)
            """)
    Page<Problem> findPublished(
            @Param("difficulty") Difficulty difficulty,
            @Param("topic") String topic,
            @Param("hasSearch") boolean hasSearch,
            @Param("searchPattern") String searchPattern,
            Pageable pageable);

    Optional<Problem> findBySlugAndPublishedTrue(String slug);
}
