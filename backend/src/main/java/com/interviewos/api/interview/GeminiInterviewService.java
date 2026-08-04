package com.interviewos.api.interview;

import com.fasterxml.jackson.databind.JsonNode;
import com.interviewos.api.config.GeminiProperties;
import com.interviewos.api.interview.InterviewDtos.ContinueRequest;
import com.interviewos.api.interview.InterviewDtos.ContinueResponse;
import com.interviewos.api.interview.InterviewDtos.Speaker;
import com.interviewos.api.interview.InterviewDtos.Stage;
import com.interviewos.api.interview.InterviewDtos.StartRequest;
import com.interviewos.api.problem.Problem;
import com.interviewos.api.problem.ProblemService;
import java.util.Map;
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
public class GeminiInterviewService {

    private static final Logger log = LoggerFactory.getLogger(GeminiInterviewService.class);

    private final ProblemService problemService;
    private final GeminiProperties properties;
    private final RestClient restClient;

    public GeminiInterviewService(
            ProblemService problemService,
            GeminiProperties properties
    ) {
        this.problemService = problemService;
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public ContinueResponse start(StartRequest request) {
        ensureConfigured();
        Problem problem = problemService.requirePublished(request.problemSlug());
        String message = generateMessage(buildOpeningPrompt(problem, request), 0.65);
        return new ContinueResponse(message, Stage.CLARIFYING, properties.model());
    }

    @Transactional(readOnly = true)
    public ContinueResponse respond(ContinueRequest request) {
        ensureConfigured();
        if (request.messages().getLast().speaker() != Speaker.USER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The latest interview message must be from the user");
        }

        Problem problem = problemService.requirePublished(request.problemSlug());
        String message = generateMessage(buildResponsePrompt(problem, request), 0.35);
        return new ContinueResponse(message, inferStage(request), properties.model());
    }

    private void ensureConfigured() {
        if (!properties.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI interview is not configured. Add GEMINI_API_KEY and rebuild the backend.");
        }
    }

    private String generateMessage(String prompt, double temperature) {
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                JsonNode response = restClient.post()
                        .uri("/v1beta/models/{model}:generateContent", properties.model())
                        .header("x-goog-api-key", properties.apiKey())
                        .body(requestBody(prompt, temperature))
                        .retrieve()
                        .body(JsonNode.class);
                return parseMessage(response);
            } catch (RestClientResponseException exception) {
                if (exception.getStatusCode().value() == 429) {
                    throw new ResponseStatusException(
                            HttpStatus.TOO_MANY_REQUESTS,
                            "Gemini request limit reached for this API key. Try again after the quota resets.");
                }
                log.warn("Gemini interview attempt {} failed with status {}", attempt, exception.getStatusCode().value());
            } catch (RestClientException | InvalidInterviewResponseException exception) {
                log.warn("Gemini interview attempt {} failed: {}", attempt, exception.getMessage());
            }
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Aria could not respond right now. Try again shortly.");
    }

    private String parseMessage(JsonNode response) {
        JsonNode textNode = response == null
                ? null
                : response.at("/candidates/0/content/parts/0/text");
        if (textNode == null || !textNode.isTextual() || !StringUtils.hasText(textNode.asText())) {
            throw new InvalidInterviewResponseException("Aria returned an empty response");
        }
        return textNode.asText().trim();
    }

    private Stage inferStage(ContinueRequest request) {
        long userTurns = request.messages().stream()
                .filter(message -> message.speaker() == Speaker.USER)
                .count();
        if (userTurns <= 1) return Stage.APPROACH;
        if (userTurns == 2) return Stage.COMPLEXITY;
        if (userTurns <= 4) return Stage.CODING;
        return Stage.EDGE_CASES;
    }

    private Map<String, Object> requestBody(String prompt, double temperature) {
        return Map.of(
                "contents", java.util.List.of(Map.of(
                        "role", "user",
                        "parts", java.util.List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", temperature,
                        "maxOutputTokens", 700));
    }

    private String buildOpeningPrompt(Problem problem, StartRequest request) {
        return """
                You are Aria, a professional technical interviewer. Start a fresh mock interview for the problem
                below. Ask exactly one concise opening question that is specific to this problem. Choose a useful
                starting angle such as clarifying requirements, identifying edge cases, or outlining an approach.
                Vary the wording between sessions. Do not reveal the solution. Do not ask about O(1) unless that
                complexity is an explicit core requirement of this particular problem. Keep the response under
                70 words and do not use markdown headings.

                Problem: %s
                Description: %s
                Constraints:
                %s
                Interview language: %s
                """.formatted(
                problem.getTitle(),
                problem.getDescription(),
                problem.getConstraintsText(),
                request.language());
    }

    private String buildResponsePrompt(Problem problem, ContinueRequest request) {
        StringBuilder transcript = new StringBuilder();
        request.messages().forEach(message -> transcript
                .append(message.speaker() == Speaker.INTERVIEWER ? "INTERVIEWER" : "CANDIDATE")
                .append(": ")
                .append(message.text().trim())
                .append('\n'));

        return """
                You are Aria, a professional and adaptive technical interviewer. Continue this mock interview
                by responding directly to the candidate's latest message. Briefly acknowledge or correct their
                reasoning, then ask exactly one relevant next question. Stay on the stated problem. If they ask
                for help, provide a small progressive hint rather than the full solution. Never repeat a previous
                question unless the candidate did not answer it. Keep the response under 90 words and do not use
                markdown headings.

                Problem: %s
                Description: %s
                Constraints:
                %s
                Interview language: %s

                Transcript:
                %s
                """.formatted(
                problem.getTitle(),
                problem.getDescription(),
                problem.getConstraintsText(),
                request.language(),
                transcript);
    }

    private static final class InvalidInterviewResponseException extends RuntimeException {

        private InvalidInterviewResponseException(String message) {
            super(message);
        }
    }
}
