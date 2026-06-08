import { apiRequest, setAuthToken } from './db';

export async function signUp(name: string, email: string, pass: string) {
  const data = await apiRequest<{ user: any, token: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password: pass })
  });
  setAuthToken(data.token);
  return data.user;
}

export async function signIn(email: string, pass: string) {
  const data = await apiRequest<{ user: any, token: string }>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass })
  });
  setAuthToken(data.token);
  return data.user;
}

export function signOut() {
  setAuthToken(null);
}
