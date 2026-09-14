import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl || "https://commodity-playbook-app.vercel.app";

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync("auth_token");
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync("auth_token", token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync("auth_token");
}

async function request<T>(
  path: string,
  options?: RequestInit & { bustCache?: boolean }
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options?.headers as Record<string, string>),
  };

  const url = options?.bustCache
    ? `${API_URL}${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`
    : `${API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export type ContentSlug =
  | "glossary"
  | "playbook"
  | "resume-templates"
  | "career-roadmap"
  | "interview-questions"
  | "knowledge-test"
  | "case-studies"
  | "desk-channel"
  | "job-openings";

/** Unified CMS sync — same database as web admin edits. */
export const contentApi = {
  get: <T>(slug: ContentSlug, query?: string) =>
    request<T>(
      `/api/mobile/content/${slug}${query ? `?${query}` : ""}`,
      { bustCache: true }
    ),

  getTiers: () =>
    request<{ tiers: Record<string, string> }>("/api/mobile/content/tiers", {
      bustCache: true,
    }),

  assetUrl: (id: string) => `${API_URL}/api/content/assets/${id}`,

  downloadAsset: async (id: string, fileName: string) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/content/assets/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Download failed");
    return { blob: await res.blob(), fileName };
  },
};

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: any }>("/api/mobile/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  me: () => request<{ user: any }>("/api/mobile/auth/me", { bustCache: true }),

  savePersona: (persona: string, track?: string) =>
    request<{ success: boolean; persona: string; track: string }>("/api/mobile/user/persona", {
      method: "POST",
      body: JSON.stringify({ persona, track }),
    }),

  getPersona: () =>
    request<{ persona: string | null; track: string | null; onboardingDone: boolean }>(
      "/api/mobile/user/persona",
      { bustCache: true }
    ),
};

export const playbookApi = {
  getProgress: () => request<any[]>("/api/user/progress"),
  updateProgress: (chapterId: string, progress: number) =>
    request("/api/user/progress", {
      method: "POST",
      body: JSON.stringify({ chapterId, progress }),
    }),
};

export const glossaryApi = {
  getAll: () =>
    contentApi.get<{
      terms: Array<{ term: string; definition: string; context?: string; category: string }>;
    }>("glossary"),
};

export const mentorApi = {
  getQuestions: () => request<any[]>("/api/mentor-connect"),
  submitQuestion: (segment: string, question: string, memberShareOptIn: boolean) =>
    request("/api/mentor-connect", {
      method: "POST",
      body: JSON.stringify({ segment, question, memberShareOptIn }),
    }),
};

export const communityApi = {
  getDeskChannel: () => contentApi.get<{ categories: any[]; questions: any[] }>("desk-channel"),
  getJobOpenings: () => contentApi.get<{ jobs: any[]; regions: any[]; levels: any[]; segments: any[] }>("job-openings"),
  joinWaitlist: (data: { email: string; name?: string; track: string; gdprOpt: boolean }) =>
    request("/api/waitlist", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const caseStudiesApi = {
  list: () => contentApi.get<{ studies: any[] }>("case-studies"),
  get: (slug: string) =>
    contentApi.get<{ card: any; sections: any[] | null }>("case-studies", `detail=${encodeURIComponent(slug)}`),
};

export const playbookMetaApi = {
  getChapters: () =>
    request<{
      requiredTier: string;
      sections: Record<string, any[]>;
      chapters: Array<{
        id: string;
        letter: string;
        title: string;
        subtitle: string;
        color: string;
        sectionCount: number;
        preview: boolean;
        unlocked: boolean;
      }>;
    }>("/api/mobile/playbook", { bustCache: true }),
};
