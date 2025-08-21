// src/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  withCredentials: false, // لأنك تستخدم Bearer وليس Cookies
});

// عند تحميل الملف (قبل أي ريندر) لو فيه توكن مسبق، احقه في الهيدر
const bootToken = localStorage.getItem("token");
if (bootToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${bootToken}`;
}

// دالة موحّدة لتعيين/إزالة التوكن على نفس الإنستانس
export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  }
}
