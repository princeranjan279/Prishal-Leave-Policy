const TOKEN_KEY = 'prishal_auth_token';

/** Module-level token store — restored from localStorage on page load. */
let _token: string | null = localStorage.getItem(TOKEN_KEY);

export function setAuthToken(token: string | null): void {
  _token = token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
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
