import axios from "axios";

const API_URL = "http://localhost:3001/auth";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function requestLogin(username, password) {
  const res = await axios.post(`${API_URL}/login`, { username, password });
  return res.data;
}

export async function verifyLogin(challengeId, code) {
  const res = await axios.post(`${API_URL}/login/verify`, { challengeId, code });
  localStorage.setItem("token", res.data.access_token);
  return res.data;
}

export async function register(username, password, role = "user", email) {
  const payload = { username, password, role };
  if (email) payload.email = email;
  const res = await axios.post(`${API_URL}/register`, payload);
  return res.data;
}

export function logout() {
  const token = getToken();
  if (token) {
    axios.post(`${API_URL}/logout`, {}, { headers: authHeaders() }).catch(() => {});
  }
  localStorage.removeItem("token");
  localStorage.removeItem("profile");
}

export function getToken() {
  return localStorage.getItem("token");
}
