// src/components/Header.tsx
import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import { api } from "../api";
import { toAbsolute } from "../lib/url";
import { Link } from "react-router-dom";

type HeaderProps = {
  lang: Lang;
  onChangeLang: (v: Lang) => void;
  loggedIn: boolean;
  onLogout: () => void;
  logoUrl?: string;
  // ❌ onOpenProfile حذّفناه لأنه ما عاد يُستخدم
};

// نعرّف النوع حسب ما يرجع السيرفر، ثم نعمل mapping
type MeApi = { email: string; full_name: string; avatar_path: string | null; role?: string };
type Me = { email: string; fullName: string; avatarUrl: string };

export default function Header({
  lang,
  onChangeLang,
  loggedIn,
  onLogout,
  logoUrl,
}: HeaderProps) {
  /* شعار التطبيق من localStorage أو prop أو الافتراضي */
  const [storedLogo, setStoredLogo] = useState<string | null>(null);

  useEffect(() => {
    const load = () => setStoredLogo(localStorage.getItem("app_logo"));
    load();
    window.addEventListener("app_logo_changed", load);
    return () => window.removeEventListener("app_logo_changed", load);
  }, []);

  const finalLogo = useMemo(() => {
    if (storedLogo && storedLogo.trim()) return toAbsolute(storedLogo);
    if (logoUrl && logoUrl.trim()) return toAbsolute(logoUrl);
    return toAbsolute("/uploads/logo-default.png");
  }, [storedLogo, logoUrl]);

  const [imgSrc, setImgSrc] = useState(finalLogo);
  useEffect(() => setImgSrc(finalLogo), [finalLogo]);
  const onLogoError = () => setImgSrc(toAbsolute("/uploads/logo-default.png"));


  /* بيانات المستخدم (للأفاتار والاسم) */
  const [me, setMe] = useState<Me | null>(null);
  const [avatar, setAvatar] = useState<string>(toAbsolute("/uploads/avatar-default.png"));

  useEffect(() => {
    if (!loggedIn) {
      setMe(null);
      setAvatar(toAbsolute("/uploads/avatar-default.png"));
      return;
    }
    (async () => {
      try {
        // ✅ المسار الصحيح حسب الراوت اللي بنيناه بالسيرفر
        const res = await api.get<MeApi>("/user/me");
        const apiUser = res.data;
        const mapped: Me = {
          email: apiUser.email,
          fullName: apiUser.full_name,
          avatarUrl: apiUser.avatar_path || "/uploads/avatar-default.png",
        };
        setMe(mapped);
        setAvatar(toAbsolute(mapped.avatarUrl));
      } catch {
        // تجاهل الخطأ وخلي fallback
      }
    })();

    // استماع لتغيير الأفاتار من أي صفحة (مثل صفحة البروفايل)
    const onChanged = () => {
      const v = localStorage.getItem("avatar_url") || "/uploads/avatar-default.png";
      setAvatar(toAbsolute(v));
    };
    window.addEventListener("avatar_changed", onChanged);
    return () => window.removeEventListener("avatar_changed", onChanged);
  }, [loggedIn]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="#">
          <img src={imgSrc} alt="Logo" height={28} onError={onLogoError} style={{ objectFit: "contain" }} />
          <span>{t(lang, "appTitle")}</span>
        </a>

        <div className="ms-auto d-flex align-items-center gap-3">
          {/* اللغة */}
          <select
            className="form-select form-select-sm"
            value={lang}
            onChange={(e) => onChangeLang(e.target.value as Lang)}
            style={{ width: 140 }}
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="de">Deutsch</option>
          </select>

          {/* قائمة المستخدم */}
          {loggedIn && (
            <div className="dropdown">
              <button
                className="btn btn-outline-light d-flex align-items-center gap-2 dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src={avatar}
                  onError={(e) => {
                    e.currentTarget.src = toAbsolute("/uploads/avatar-default.png");
                  }}
                  alt="avatar"
                  width={28}
                  height={28}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
                <span className="d-none d-md-inline">{me?.fullName || "User"}</span>
              </button>

              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  {/* ✅ انتقال مباشر لصفحة البروفايل */}
                  <Link to="/profile" className="dropdown-item">
                    <i className="bi bi-person-circle me-2" />
                    Profile
                  </Link>
                </li>

                <li><hr className="dropdown-divider" /></li>

                <li>
                  <button className="dropdown-item text-danger" onClick={onLogout}>
                    <i className="bi bi-box-arrow-right me-2" />
                    {t(lang, "logout")}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
