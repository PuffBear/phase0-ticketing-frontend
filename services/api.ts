export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const parseJSON = async <T,>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data && data.error) || 'Request failed.');
  }
  return data as T;
};

export const apiPost = async <T,>(path: string, payload: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return parseJSON<T>(response);
};

export const apiGet = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    credentials: 'include'
  });
  return parseJSON<T>(response);
};

export const apiDelete = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return parseJSON<T>(response);
};
