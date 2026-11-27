const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const serviceMode = baseUrl ? 'azure-functions' : 'mock';

export async function apiRequest(path, options = {}) {
  if (!baseUrl) {
    throw new Error('Set VITE_API_BASE_URL to connect the Learning Hub frontend to its API.');
  }

  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Learning Hub API request failed (${response.status}).`);
  }

  return response.status === 204 ? null : response.json();
}
