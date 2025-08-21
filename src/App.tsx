// App shell with language dropdown, login/home/tracker/reports switching + admin-guard
import { useCallback, useEffect, useMemo, useState } from "react";
import { setAuthToken, api } from "./api";
import LoginRegister from "./pages/LoginRegister";
import TimeTracker from "./components/TimeTracker";
import Home from "./pages/Home";
import Reports from "./pages/Reports";
import AdminLogo from "./pages/AdminLogo";
import Header from "./components/Header";
import { motion } from "framer-motion";
import type { Lang } from "./i18n";
import toast from "react-hot-toast";

type Me = {
  email: string;
  full_name: string;
  avatar_path: string | null;
  role?: string; // "admin" | "user"
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));

  // تبويبات العرض (بدون Router)
  const [showTracker, setShowTracker] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showAdminLogo, setShowAdminLogo] = useState(false);

  // لغة الواجهة
  const [lang, setLang] = useState<Lang>((localStorage.getItem("lang") as Lang) || "en");

  // شعار الواجهة (يتم تحديثه عند إطلاق حدث app_logo_changed)
  const [logoUrl, setLogoUrl] = useState<string>(localStorage.getItem("app_logo") || "/logo.png");

  // بيانات المستخدم (للحراسة على صفحات الأدمن)
  const [me, setMe] = useState<Me | null>(null);
  const isAdmin = useMemo(() => me?.role === "admin", [me?.role]);

  // جهّز التوكن إن وُجد عند الإقلاع
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setAuthToken(token);
  }, []);

  // اجلب بياناتي عند الدخول
  useEffect(() => {
    async function fetchMe() {
      if (!loggedIn) {
        setMe(null);
        return;
      }
      try {
        const res = await api.get<Me>("/user/me");
        setMe(res.data);
      } catch {
        // إن فشل الطلب (401 مثلاً) نعتبره خروج
        setMe(null);
      }
    }
    fetchMe();
  }, [loggedIn]);

  // دالة ترجيع للواجهة الرئيسية (تغلق أي تبويب داخلي)
  const goHome = useCallback(() => {
    setShowTracker(false);
    setShowReports(false);
    setShowAdminLogo(false);
    // لا حاجة لإعادة توجيه Router لأننا نتحكم بالحالة داخليًا
  }, []);

  // الاستماع لتغيير الشعار: حدّث اللوغو وارجع للواجهة
  useEffect(() => {
    const onLogoChanged = () => {
      const updated = localStorage.getItem("app_logo") || "/logo.png";
      setLogoUrl(updated);
      goHome(); // رجوع تلقائي للواجهة
    };
    window.addEventListener("app_logo_changed", onLogoChanged);
    return () => window.removeEventListener("app_logo_changed", onLogoChanged);
  }, [goHome]);

  // تسجيل الخروج
  const logout = useCallback(() => {
    setAuthToken(null);
    setLoggedIn(false);
    setMe(null);
    goHome();
  }, [goHome]);

  // تغيير اللغة
  const onChangeLang = useCallback((v: Lang) => {
    setLang(v);
    localStorage.setItem("lang", v);
  }, []);

  // حارس فتح صفحة الشعار (Admin فقط)
  const openAdminLogoGuarded = useCallback(() => {
    if (!isAdmin) {
      toast.error("Only admins can access Brand Logo settings.");
      return;
    }
    setShowAdminLogo(true);
  }, [isAdmin]);

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <Header
        lang={lang}
        onChangeLang={onChangeLang}
        loggedIn={loggedIn}
        onLogout={logout}
        logoUrl={logoUrl}
      />

      {/* Body */}
      <div className="container py-5 flex-fill">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {!loggedIn ? (
            <LoginRegister onLoggedIn={() => setLoggedIn(true)} />
          ) : showAdminLogo && isAdmin ? (
            <AdminLogo />
          ) : showReports ? (
            <Reports lang={lang} onBack={() => setShowReports(false)} />
          ) : showTracker ? (
            <TimeTracker lang={lang} onBack={() => setShowTracker(false)} />
          ) : (
            <Home
              lang={lang}
              onGoTrack={() => setShowTracker(true)}
              onGoReports={() => setShowReports(true)}
              canManageBrand={isAdmin}             // لا نعرض زر Admin إلا للأدمن
              onGoAdminLogo={openAdminLogoGuarded} // مع حارس
            />
          )}
        </motion.div>
      </div>

      <footer className="py-4 bg-white border-top">
        <div className="container text-center text-muted small">
          Time Tracker App © {new Date().getFullYear()} | {"All rights reserved."}
        </div>
      </footer>
    </div>
  );
}
