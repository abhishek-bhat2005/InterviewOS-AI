package com.interviewos.api.auth;

import com.interviewos.api.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class PasswordResetMailService {
    private final JavaMailSender mailSender;
    private final String frontendUrl;
    private final String fromEmail;
    private final long tokenMinutes;

    public PasswordResetMailService(
            JavaMailSender mailSender,
            @Value("${interviewos.password-reset.frontend-url}") String frontendUrl,
            @Value("${interviewos.password-reset.from-email}") String fromEmail,
            @Value("${interviewos.password-reset.token-minutes}") long tokenMinutes
    ) {
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
        this.fromEmail = fromEmail;
        this.tokenMinutes = tokenMinutes;
    }

    @Async
    public void send(User user, String rawToken) {
        String resetUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                .queryParam("resetToken", rawToken)
                .build().encode().toUriString();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(user.getEmail());
        message.setSubject("Reset your InterviewOS password");
        message.setText("Hi " + user.getFullName() + ",\n\nUse this secure link to reset your password:\n"
                + resetUrl + "\n\nThis link expires in " + tokenMinutes + " minutes and can be used once."
                + "\nIf you did not request this, you can ignore this email.\n\nInterviewOS AI");
        mailSender.send(message);
    }
}
