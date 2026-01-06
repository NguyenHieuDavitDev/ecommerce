// api/categories.js
import axios from "axios";

const CATEGORY_API = "http://localhost:3001/categories";

export async function listCategories() {
  const res = await axios.get(CATEGORY_API);
  return res.data;
}
