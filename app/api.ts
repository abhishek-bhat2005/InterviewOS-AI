const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

const ACCESS_TOKEN_KEY = "interviewos.accessToken";
const REFRESH_TOKEN_KEY = "interviewos.refreshToken";
const USER_KEY = "interviewos.user";

let refreshPromise: Promise<boolean> | null = null;

export type User = {
  id: string;
  email: string;
  fullName: string;
  preferredLanguage: string;
  targetRole: string | null;
  timezone: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
};

export type Topic = {
  slug: string;
  name: string;
};

export type ProblemSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  estimatedMinutes: number | null;
  acceptanceRate: number | null;
  frequency: "LOW" | "MEDIUM" | "HIGH" | null;
  topics: Topic[];
};

export type ProblemDetail = ProblemSummary & {
  constraints: string | null;
  examples: Array<{
    position: number;
    input: string;
    output: string;
    explanation: string | null;
  }>;
  starterCode: Record<string, string>;
};

export type Submission = {
  id: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  language: string;
  sourceCode: string;
  status: string;
  runtimeMs: number | null;
  memoryKb: number | null;
  passedTests: number;
  totalTests: number;
  submittedAt: string;
};

export type CodeReview = {
  verdict: "LOOKS_CORRECT" | "NEEDS_CHANGES" | "INVALID";
  headline: string;
  summary: string;
  issues: string[];
  timeComplexity: string;
  spaceComplexity: string;
  model: string;
  disclaimer: string;
};

export type InterviewStage =
  | "CLARIFYING"
  | "APPROACH"
  | "COMPLEXITY"
  | "CODING"
  | "EDGE_CASES";

export type InterviewMessage = {
  speaker: "INTERVIEWER" | "USER";
  text: string;
};

export type InterviewReply = {
  message: string;
  stage: InterviewStage;
  model: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function hasStoredSession(): boolean {
  return Boolean(getStoredToken(REFRESH_TOKEN_KEY));
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(USER_KEY);
    return value ? (JSON.parse(value) as User) : null;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export async function register(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<User> {
  const response = await apiRequest<TokenResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    false,
  );
  storeTokens(response);
  return response.user;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<User> {
  const response = await apiRequest<TokenResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    false,
  );
  storeTokens(response);
  return response.user;
}

export async function requestPasswordReset(email: string): Promise<string> {
  const response = await apiRequest<{ message: string }>(
    "/auth/forgot-password",
    { method: "POST", body: JSON.stringify({ email }) },
    false,
  );
  return response.message;
}

export async function resetPassword(token: string, password: string): Promise<string> {
  const response = await apiRequest<{ message: string }>(
    "/auth/reset-password",
    { method: "POST", body: JSON.stringify({ token, password }) },
    false,
  );
  return response.message;
}

export async function getCurrentUser(): Promise<User> {
  const user = await apiRequest<User>("/auth/me");
  storeUser(user);
  return user;
}

export async function logout(): Promise<void> {
  const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
  const revokeSession = refreshToken
    ? apiRequest<void>(
        "/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
        false,
      )
    : Promise.resolve();

  // Signing out locally must not wait for a sleeping or unavailable API.
  clearSession();
  await revokeSession.catch(() => undefined);
}

export async function getProblems(): Promise<PageResponse<ProblemSummary>> {
  return apiRequest<PageResponse<ProblemSummary>>("/problems?size=100");
}

export async function getProblem(slug: string): Promise<ProblemDetail> {
  return apiRequest<ProblemDetail>(`/problems/${encodeURIComponent(slug)}`);
}

export async function createSubmission(
  problemId: string,
  input: { language: string; sourceCode: string },
): Promise<Submission> {
  return apiRequest<Submission>(`/problems/${problemId}/submissions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function reviewCode(
  problemId: string,
  input: { language: string; sourceCode: string },
): Promise<CodeReview> {
  return apiRequest<CodeReview>(`/problems/${problemId}/review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function continueInterview(input: {
  problemSlug: string;
  language: string;
  messages: InterviewMessage[];
}): Promise<InterviewReply> {
  return apiRequest<InterviewReply>("/interviews/respond", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function startInterview(input: {
  problemSlug: string;
  language: string;
}): Promise<InterviewReply> {
  return apiRequest<InterviewReply>("/interviews/start", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getSubmissions(): Promise<PageResponse<Submission>> {
  return apiRequest<PageResponse<Submission>>("/submissions?size=100");
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retryWithRefresh = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const accessToken = getStoredToken(ACCESS_TOKEN_KEY);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retryWithRefresh && hasStoredSession()) {
    const refreshed = await refreshSession();
    if (refreshed) return apiRequest<T>(path, init, false);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.message ?? "The InterviewOS API request failed", response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = performRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      clearSession();
      return false;
    }
    storeTokens((await response.json()) as TokenResponse);
    return true;
  } catch {
    return false;
  }
}

function storeTokens(response: TokenResponse): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  storeUser(response.user);
}

function storeUser(user: User): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getStoredToken(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}
