const API_BASE_URL = import.meta.env.PROD 
  ? 'https://pod.makehimbeg.com/api'
  : 'http://localhost:3000/api';

export const api = {
  baseURL: API_BASE_URL,
  async fetch(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    return response;
  }
};
