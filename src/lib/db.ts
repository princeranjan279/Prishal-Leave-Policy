/** Module-level token store (cleared on logout). */
let _token: string | null = null;

export function setAuthToken(token: string | null): void {
  _token = token;
}

export function getAuthToken(): string | null {
  return _token;
}

/**
 * Make an authenticated request to the backend API.
 * Throws with the server's error message on non-2xx responses.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const res = await fetch(`/api${path}`, { ...options, headers });

  const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }

  return body as T;
}
