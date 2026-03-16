class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get<T = unknown>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = unknown>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};
