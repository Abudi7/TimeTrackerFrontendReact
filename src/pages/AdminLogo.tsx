// src/pages/AdminLogo.tsx
import { useEffect, useState } from "react";
import { api } from "../api";
import { motion } from "framer-motion";

// حوّل أي URL نسبي إلى مطلق بناءً على baseURL للـ api
function toAbsoluteUrl(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = ((api as any)?.defaults?.baseURL as string) || "http://localhost:4000";
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

export default function AdminLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(toAbsoluteUrl("/logo.png"));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.get("/admin/logo");
      const url = res?.data?.logoUrl as string | undefined;
      setLogoUrl(toAbsoluteUrl(url || "/logo.png"));
    } catch {
      // إبقِ الافتراضي
      setLogoUrl(toAbsoluteUrl("/logo.png"));
    }
  }

  useEffect(() => {
    load();
    return () => {
      // تنظيف معاينة مؤقتة إن وُجدت
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setErr(null);
    setMsg(null);
    // حرر المعاينة القديمة
    if (preview) URL.revokeObjectURL(preview);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function upload() {
    if (!file) {
      setErr("Please choose an image first");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      setLoading(true);
      const res = await api.post("/admin/logo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const serverUrl = toAbsoluteUrl(res.data.logoUrl);
      setMsg("Logo updated successfully ✅");
      setLogoUrl(serverUrl);
      // خزّنه محليًا حتى يلتقطه الهيدر فورًا
      localStorage.setItem("app_logo", serverUrl);
      // نبّه الـ App لتحديث الهيدر فورًا
      window.dispatchEvent(new Event("app_logo_changed"));
      // نظّف حالة الاختيار
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setFile(null);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function resetToDefault() {
    // رجّع للّوجو الافتراضي (محليًا)
    localStorage.removeItem("app_logo");
    window.dispatchEvent(new Event("app_logo_changed"));
    setLogoUrl(toAbsoluteUrl("/logo.png"));
    setPreview(null);
    setFile(null);
    setMsg("Back to default logo ✅");
    setErr(null);
  }

  function onImgError() {
    const fallback = toAbsoluteUrl("/logo.png");
    if (logoUrl !== fallback) setLogoUrl(fallback);
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <motion.div
            className="card border-0 shadow rounded-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="card-body p-4">
              <h5 className="mb-3">Brand Logo</h5>

              {err && <div className="alert alert-danger">{err}</div>}
              {msg && <div className="alert alert-success">{msg}</div>}

              <div className="mb-3 text-center">
                <div className="mb-2 text-muted">Current Logo</div>
                <img
                  src={preview || logoUrl}
                  alt="Logo preview"
                  style={{ maxHeight: 100, objectFit: "contain" }}
                  onError={onImgError}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Choose an image (PNG / JPG / WEBP / SVG)</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="form-control"
                  onChange={onPick}
                />
                <div className="form-text">
                  Max size: 3 MB. Recommended transparent PNG or WEBP.
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-primary"
                  onClick={upload}
                  disabled={loading || !file}
                >
                  {loading ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <span className="spinner-border spinner-border-sm" />
                      Uploading...
                    </span>
                  ) : (
                    "Save Logo"
                  )}
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview(null);
                    setFile(null);
                    setErr(null);
                    setMsg(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-outline-danger ms-auto"
                  onClick={resetToDefault}
                  disabled={loading}
                  title="Back to default logo"
                >
                  Reset to default
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
