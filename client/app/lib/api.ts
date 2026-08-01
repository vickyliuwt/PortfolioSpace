// lib/api.ts
// axios base, cookies on

import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL,
  withCredentials: true, // send session cookie
});

export default api;
