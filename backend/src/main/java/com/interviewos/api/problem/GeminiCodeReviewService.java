package com.interviewos.api.problem;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.api.config.GeminiProperties;
import com.interviewos.api.problem.CodeReviewDtos.ReviewRequest;
import com.interviewos.api.problem.CodeReviewDtos.ReviewResponse;
import com.interviewos.api.problem.CodeReviewDtos.Verdict;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GeminiCodeReviewService {

    private static final Logger log = LoggerFactory.getLogger(GeminiCodeReviewService.class);
    private static final String DISCLAIMER =
            "AI assessment only. A code judge is still required for guaranteed Accepted or Wrong Answer results.";

    private final ProblemService problemService;
    private final GeminiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public GeminiCodeReviewService(
            ProblemService problemService,
            GeminiProperties properties,
            ObjectMapper objectMapper
    ) {
        this.problemService = problemService;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public ReviewResponse review(UUID problemId, ReviewRequest request) {
        if (!properties.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Gemini review is not configured. Add GEMINI_API_KEY and rebuild the backend.");
        }

        Problem problem = problemService.requirePublished(problemId);
        String prompt = buildPrompt(problem, request);

        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                JsonNode response = requestReview(attempt == 1
                        ? prompt
                        : prompt + "\nReturn only the requested JSON object with every required field.");
                GeminiResult result = parseResult(response);
                return new ReviewResponse(
                        result.verdict(),
                        result.headline(),
                        result.summary(),
                        result.issues() == null ? List.of() : result.issues(),
                        result.timeComplexity(),
                        result.spaceComplexity(),
                        properties.model(),
                        DISCLAIMER);
            } catch (RestClientResponseException exception) {
                if (exception.getStatusCode().value() == 429) {
                    throw new ResponseStatusException(
                            HttpStatus.TOO_MANY_REQUESTS,
                            "Gemini request limit reached for this API key. Try again after the quota resets.");
                }
                log.warn("Gemini review attempt {} failed with status {}", attempt, exception.getStatusCode().value());
            } catch (RestClientException | InvalidGeminiReviewException exception) {
                log.warn("Gemini review attempt {} failed: {}", attempt, exception.getMessage());
            }
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Gemini could not produce a valid review right now. Try again shortly.");
    }

    private JsonNode requestReview(String prompt) {
        return restClient.post()
                .uri("/v1beta/models/{model}:generateContent", properties.model())
                .header("x-goog-api-key", properties.apiKey())
                .body(requestBody(prompt))
                .retrieve()
                .body(JsonNode.class);
    }

    private GeminiResult parseResult(JsonNode response) {
        JsonNode textNode = response == null
                ? null
                : response.at("/candidates/0/content/parts/0/text");
        if (textNode == null || !textNode.isTextual()) {
            throw new InvalidGeminiReviewException("Gemini returned an empty review");
        }
        String responseText = textNode.asText().trim();
        int objectStart = responseText.indexOf('{');
        int objectEnd = responseText.lastIndexOf('}');
        String jsonText = objectStart >= 0 && objectEnd > objectStart
                ? responseText.substring(objectStart, objectEnd + 1)
                : responseText;
        try {
            GeminiResult result = objectMapper.readValue(jsonText, GeminiResult.class);
            if (result.verdict() == null
                    || !StringUtils.hasText(result.headline())
                    || !StringUtils.hasText(result.summary())
                    || !StringUtils.hasText(result.timeComplexity())
                    || !StringUtils.hasText(result.spaceComplexity())) {
                throw new InvalidGeminiReviewException("Gemini omitted required review fields");
            }
            return result;
        } catch (JsonProcessingException exception) {
            throw new InvalidGeminiReviewException("Gemini returned malformed review JSON", exception);
        }
    }

    private Map<String, Object> requestBody(String prompt) {
        Map<String, Object> stringSchema = Map.of("type", "STRING");
        Map<String, Object> schema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "verdict", Map.of("type", "STRING", "enum", List.of("LOOKS_CORRECT", "NEEDS_CHANGES", "INVALID")),
                        "headline", stringSchema,
                        "summary", stringSchema,
                        "issues", Map.of("type", "ARRAY", "items", stringSchema, "maxItems", 4),
                        "timeComplexity", stringSchema,
                        "spaceComplexity", stringSchema),
                "required", List.of("verdict", "headline", "summary", "issues", "timeComplexity", "spaceComplexity"));

        return Map.of(
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseSchema", schema,
                        "temperature", 0.1,
                        "maxOutputTokens", 1600));
    }

    private String buildPrompt(Problem problem, ReviewRequest request) {
        StringBuilder examples = new StringBuilder();
        problem.getExamples().forEach(example -> examples
                .append("Input: ").append(example.getInputText())
                .append("\nExpected output: ").append(example.getOutputText()).append("\n"));

        return """
                You are a strict technical interview code reviewer. Assess whether the submitted solution is
                likely correct for the full problem, not only the visible examples. Do not claim that you executed
                the code. Return LOOKS_CORRECT only when the algorithm, syntax, edge cases, and complexity appear
                correct. Return NEEDS_CHANGES for a logical flaw or missed edge case. Return INVALID for incomplete
                code, placeholder code, or likely compilation/syntax failure. Keep the summary concise.

                Problem: %s
                Description: %s
                Constraints:
                %s
                Visible examples:
                %s
                Language: %s
                Submitted code:
                ```%s
                %s
                ```
                """.formatted(
                problem.getTitle(),
                problem.getDescription(),
                problem.getConstraintsText(),
                examples,
                request.language(),
                request.language().toLowerCase(),
                request.sourceCode());
    }

    private record GeminiResult(
            Verdict verdict,
            String headline,
            String summary,
            List<String> issues,
            String timeComplexity,
            String spaceComplexity
    ) {
    }

    private static final class InvalidGeminiReviewException extends RuntimeException {

        private InvalidGeminiReviewException(String message) {
            super(message);
        }

        private InvalidGeminiReviewException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
