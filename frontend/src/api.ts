export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// TODO: Move to API service file
export async function fetchHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}
