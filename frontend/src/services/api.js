const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001/api/v1";

async function request(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`Error API ${response.status}`);
  return response.json();
}

function params(filters = {}) {
  const search = new URLSearchParams();
  if (filters.department) search.set("department", filters.department);
  if (filters.municipality) search.set("municipality", filters.municipality);
  if (filters.category) search.set("category", filters.category);
  const value = search.toString();
  return value ? `?${value}` : "";
}

export const api = {
  metadata: () => request("/metadata"),
  municipalities: (filters) => request(`/municipalities${params(filters)}`),
};
