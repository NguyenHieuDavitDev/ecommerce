import axios from "axios";

const API_URL = "http://localhost:3001/blogs";

export const listBlogs = async (page = 1, limit = 10, search = "") => {
  const res = await axios.get(API_URL, { params: { page, limit, search } });
  return res.data;
};

// Hàm tìm blog theo id
export const findBlog = async (id) => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  };
  
export const createBlog = async (formData) => {
  const res = await axios.post(API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateBlog = async (id, formData) => {
  const res = await axios.put(`${API_URL}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteBlog = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};
