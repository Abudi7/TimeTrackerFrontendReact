// src/context/LogoContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";

type LogoCtx = {
  logoUrl: string;                 // الرابط النهائي للشعار (مطلق)
  setLogoUrl: (u: string) => void; // لتحديثه يدويًا إن أردت
};

const LogoContext = createContext<LogoCtx | undefined>(undefined);

function toAbsolute(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = ((api as any)?.defaults?.baseURL as string) || "http://localhost:4000";
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverLogo, setServerLogo] = useState<string>("");      // من /admin/logo
  const [localLogo, setLocalLogo] = useState<string | null>(null); // من localStorage

  // اقرأ من السيرفر مرّة واحدة
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/logo"); // { logoUrl: "/uploads/..." }
        const url = res?.data?.logoUrl as string | undefined;
        if (url) setServerLogo(toAbsolute(url));
      } catch {
        // تجاهل — سيسقط على الافتراضي لاحقًا
      }
    })();
  }, []);

  // راقب تغيّر شعار الواجهة (عند رفع لوجو جديد في AdminLogo)
  useEffect(() => {
    const load = () => setLocalLogo(localStorage.getItem("app_logo"));
    load();
    window.addEventListener("storage", (e) => e.key === "app_logo" && load());
    window.addEventListener("app_logo_changed", load);
    return () => {
      window.removeEventListener("app_logo_changed", load);
    };
  }, []);

  // حدّد النهائي: (محلي) ← (سيرفر) ← (افتراضي)
  const finalLogo = useMemo(() => {
    if (localLogo && localLogo.trim()) return toAbsolute(localLogo);
    if (serverLogo && serverLogo.trim()) return serverLogo;
    return toAbsolute("/uploads/logo-default.png"); // ضع ملف افتراضي هنا لتفادي 404
  }, [localLogo, serverLogo]);

  const setLogoUrl = (u: string) => {
    localStorage.setItem("app_logo", u);
    window.dispatchEvent(new Event("app_logo_changed"));
  };

  return (
    <LogoContext.Provider value={{ logoUrl: finalLogo, setLogoUrl }}>
      {children}
    </LogoContext.Provider>
  );
};

// Hook مريح للاستخدام من أي مكان
export function useLogo() {
  const ctx = useContext(LogoContext);
  if (!ctx) throw new Error("useLogo must be used within LogoProvider");
  return ctx;
}
