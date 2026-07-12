// Auth helper utilities

import api from './api';

/**
 * Perform login request and return the server response.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: any}>}
 */
export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response; // contains { data: { token, user } }
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
