import axios from "axios";
import { getToken } from "./auth";

const API = "http://localhost:3001/users";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMe() {
  const res = await axios.get(`${API}/me`, { headers: authHeaders() });
  return res.data;
}

export async function updateMe(payload) {
  const res = await axios.patch(`${API}/me`, payload, { headers: authHeaders() });
  return res.data;
}

export async function changePassword(oldPassword, newPassword) {
  const res = await axios.post(`${API}/change-password`, { oldPassword, newPassword }, { headers: authHeaders() });
  return res.data;
}



