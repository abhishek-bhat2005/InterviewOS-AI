package com.interviewos.api.problem;

import com.interviewos.api.common.PageResponse;
import com.interviewos.api.problem.ProblemDtos.ProblemDetail;
import com.interviewos.api.problem.ProblemDtos.ProblemSummary;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProblemService {

    private final ProblemRepository problemRepository;

    public ProblemService(ProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProblemSummary> list(
            Difficulty difficulty,
            String topic,
            String search,
            int page,
            int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        String normalizedTopic = StringUtils.hasText(topic) ? topic.trim().toLowerCase(Locale.ROOT) : null;
        boolean hasSearch = StringUtils.hasText(search);
        String searchPattern = hasSearch
                ? "%" + search.trim().toLowerCase(Locale.ROOT) + "%"
                : "%";
        Page<ProblemSummary> result = problemRepository
                .findPublished(difficulty, normalizedTopic, hasSearch, searchPattern, pageable)
                .map(ProblemSummary::from);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public ProblemDetail getBySlug(String slug) {
        return ProblemDetail.from(requirePublished(slug));
    }

    @Transactional(readOnly = true)
    public Problem requirePublished(String slug) {
        return problemRepository.findBySlugAndPublishedTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
    }

    @Transactional(readOnly = true)
    public Problem requirePublished(UUID id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
        if (!problem.isPublished()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }
        return problem;
    }
}
