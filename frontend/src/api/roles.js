import axios from "axios";

const API_URL = "http://localhost:3001/roles";

export async function listRoles() {
  const res = await axios.get(API_URL);
  return res.data;
}

export async function createRole(payload) {
  const res = await axios.post(API_URL, payload);
  return res.data;
}

export async function updateRole(id, payload) {
  const res = await axios.patch(`${API_URL}/${id}`, payload);
  return res.data;
}

export async function deleteRole(id) {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
}


