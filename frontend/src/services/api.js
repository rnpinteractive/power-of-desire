const API_BASE_URL = "https://pod.makehimbeg.com/api";

export const api = {
  baseURL: API_BASE_URL,
  async fetch(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    return response;
  },
};
