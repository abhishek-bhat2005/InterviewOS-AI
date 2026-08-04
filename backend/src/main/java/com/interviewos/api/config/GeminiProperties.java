package com.interviewos.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "interviewos.gemini")
public record GeminiProperties(
        String apiKey,
        String model,
        String baseUrl
) {
    public boolean isConfigured() {
        return apiKey != null
                && !apiKey.isBlank()
                && !apiKey.startsWith("replace-with-");
    }
}
