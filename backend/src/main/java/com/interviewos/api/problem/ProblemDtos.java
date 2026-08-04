package com.interviewos.api.problem;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ProblemDtos {

    private ProblemDtos() {
    }

    public record TopicResponse(String slug, String name) {
        static TopicResponse from(Topic topic) {
            return new TopicResponse(topic.getSlug(), topic.getName());
        }
    }

    public record ProblemSummary(
            UUID id,
            String slug,
            String title,
            String description,
            Difficulty difficulty,
            Short estimatedMinutes,
            BigDecimal acceptanceRate,
            Frequency frequency,
            List<TopicResponse> topics
    ) {
        static ProblemSummary from(Problem problem) {
            return new ProblemSummary(
                    problem.getId(), problem.getSlug(), problem.getTitle(), problem.getDescription(),
                    problem.getDifficulty(), problem.getEstimatedMinutes(), problem.getAcceptanceRate(),
                    problem.getFrequency(), problem.getTopics().stream().map(TopicResponse::from).toList());
        }
    }

    public record ExampleResponse(
            short position,
            String input,
            String output,
            String explanation
    ) {
        static ExampleResponse from(ProblemExample example) {
            return new ExampleResponse(
                    example.getPosition(), example.getInputText(), example.getOutputText(), example.getExplanation());
        }
    }

    public record ProblemDetail(
            UUID id,
            String slug,
            String title,
            String description,
            Difficulty difficulty,
            String constraints,
            Short estimatedMinutes,
            BigDecimal acceptanceRate,
            Frequency frequency,
            List<TopicResponse> topics,
            List<ExampleResponse> examples,
            Map<String, String> starterCode
    ) {
        static ProblemDetail from(Problem problem) {
            Map<String, String> code = problem.getStarterCode().stream().collect(
                    LinkedHashMap::new,
                    (map, starter) -> map.put(starter.getLanguage(), starter.getSourceCode()),
                    LinkedHashMap::putAll);
            return new ProblemDetail(
                    problem.getId(), problem.getSlug(), problem.getTitle(), problem.getDescription(),
                    problem.getDifficulty(), problem.getConstraintsText(), problem.getEstimatedMinutes(),
                    problem.getAcceptanceRate(), problem.getFrequency(),
                    problem.getTopics().stream().map(TopicResponse::from).toList(),
                    problem.getExamples().stream().map(ExampleResponse::from).toList(), code);
        }
    }
}
