// src/pages/LoginRegister.tsx
import { useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import ThemeToggle from "../components/ThemeToggle";

/* ===================== Helpers: validation & animations ===================== */
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function validateEmail(v: string) {
  if (!v) return "Email is required";
  if (!emailRegex.test(v)) return "Please enter a valid email address";
  return null;
}
function validateFullName(v: string) {
  if (!v) return "Full name is required";
  if (v.trim().length < 3) return "Full name must be at least 3 characters";
  return null;
}
function validatePassword(v: string) {
  if (!v) return "Password is required";
  if (v.length < 6) return "Password must be at least 6 characters";
  return null;
}

const fadeSlide = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.3 },
};

/* ============================== Component =================================== */
export default function LoginRegister({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");

  // fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // ui
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  // messages
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // inline validation
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; fullName?: boolean }>({});

  const emailError = useMemo(() => validateEmail(email), [email]);
  const passError = useMemo(() => validatePassword(password), [password]);
  const nameError = useMemo(() => (tab === "register" ? validateFullName(fullName) : null), [fullName, tab]);

  const resetAlerts = () => {
    setErr(null);
    setOk(null);
  };

  useEffect(() => {
    resetAlerts();
    setTouched({});
  }, [tab]);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();
    if (emailError || passError) {
      setErr(emailError || passError);
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      setAuthToken(res.data.token);
      setOk("Login successful ✅");
      setTimeout(() => onLoggedIn(), 500);
    } catch (error: any) {
      setErr(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function doRegister(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();
    if (nameError || emailError || passError) {
      setErr(nameError || emailError || passError);
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/register", { email, password, fullName });
      setOk("Account created successfully ✅ — You can now log in");
      setTab("login");
    } catch (error: any) {
      setErr(error?.response?.data?.message || "Account creation failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleCredential(credential?: string) {
    resetAlerts();
    if (!credential) {
      setErr("Google login failed: no credential");
      return;
    }
    try {
      setSocialLoading(true);
      const res = await api.post("/auth/google", { idToken: credential });
      setAuthToken(res.data.token);
      setOk("Logged in with Google ✅");
      setTimeout(() => onLoggedIn(), 400);
    } catch (e: any) {
      const m = e?.response?.data?.message || e?.message || "Google login failed";
      // لو واجهت FedCM من جديد
      if (/fedcm|third-?party|token/i.test(String(m))) {
        setErr("Google login blocked by browser. Disable blockers or try Incognito.");
      } else {
        setErr(m);
      }
    } finally {
      setSocialLoading(false);
    }
  }
  

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center position-relative"
      style={{
        background: `
          radial-gradient(1100px 500px at 10% 10%, var(--bg-bubble1), transparent 60%),
          radial-gradient(900px 400px at 90% 15%, var(--bg-bubble2), transparent 60%),
          linear-gradient(135deg, rgba(13,110,253,0.06) 0%, rgba(122,92,255,0.08) 100%)
        `,
      }}
    >
      {/* Theme toggle pinned to top-right */}
      <div className="position-absolute top-0 end-0 p-3">
        <ThemeToggle />
      </div>

      <div className="container py-4">
        <div className="row g-4 align-items-stretch justify-content-center">
          <div className="col-12 col-md-10 col-lg-8 col-xl-6">
            <motion.div
              className="card rounded-4 border-0 shadow-xl auth-glass overflow-hidden"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              {/* Header: brand + tabs */}
              <div className="card-header border-0 bg-transparent px-4 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div className="brand-badge d-inline-flex align-items-center justify-content-center">
                      <i className="bi bi-stopwatch" />
                    </div>
                    <h5 className="m-0 fw-bold">TimeTracker</h5>
                  </div>

                  {/* Tabs modern (pills) */}
                  <div className="tabs-pill">
                    <button
                      className={`pill ${tab === "login" ? "active" : ""}`}
                      onClick={() => setTab("login")}
                    >
                      Login
                    </button>
                    <button
                      className={`pill ${tab === "register" ? "active" : ""}`}
                      onClick={() => setTab("register")}
                    >
                      Register
                    </button>
                  </div>
                </div>
                <div className="px-1 pt-2 pb-3 text-muted small">
                  Welcome! Track your time smarter.
                </div>
              </div>

              {/* Alerts */}
              <div className="px-4">
                <AnimatePresence initial={false}>
                  {err && (
                    <motion.div key="err" className="alert alert-danger rounded-3 mb-3" {...fadeSlide}>
                      {err}
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {ok && (
                    <motion.div key="ok" className="alert alert-success rounded-3 mb-3" {...fadeSlide}>
                      {ok}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Body */}
              <div className="card-body p-4 pt-0">
                <AnimatePresence mode="wait">
                  {tab === "login" ? (
                    <motion.form key="login" {...fadeSlide} onSubmit={doLogin} noValidate>
                      {/* email */}
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <div className="input-group input-group-lg modern-input">
                          <span className="input-group-text">
                            <i className="bi bi-envelope" />
                          </span>
                          <input
                            className={`form-control ${touched.email && emailError ? "is-invalid" : touched.email ? "is-valid" : ""}`}
                            type="email"
                            value={email}
                            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        {touched.email && emailError && <div className="invalid-feedback d-block">{emailError}</div>}
                      </div>

                      {/* password */}
                      <div className="mb-4">
                        <label className="form-label">Password</label>
                        <div className="input-group input-group-lg modern-input">
                          <span className="input-group-text">
                            <i className="bi bi-shield-lock" />
                          </span>
                          <input
                            className={`form-control ${touched.password && passError ? "is-invalid" : touched.password ? "is-valid" : ""}`}
                            type={showPass ? "text" : "password"}
                            value={password}
                            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPass((s) => !s)}
                            aria-label={showPass ? "Hide password" : "Show password"}
                          >
                            {showPass ? <i className="bi bi-eye-slash" /> : <i className="bi bi-eye" />}
                          </button>
                        </div>
                        {touched.password && passError && <div className="invalid-feedback d-block">{passError}</div>}
                        <div className="d-flex justify-content-between small mt-1">
                          <div className="form-check">
                            <input id="remember" className="form-check-input" type="checkbox" />
                            <label htmlFor="remember" className="form-check-label">Remember me</label>
                          </div>
                          <button type="button" className="btn btn-link p-0">Forgot password?</button>
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        className="btn btn-gradient w-100 btn-lg rounded-3 mb-3"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ y: -1 }}
                      >
                        {loading ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="spinner-border spinner-border-sm" role="status" />
                            Logging in...
                          </span>
                        ) : (
                          <>
                            <i className="bi bi-box-arrow-in-right me-2" />
                            Login
                          </>
                        )}
                      </motion.button>

                      {/* Divider */}
                      <div className="d-flex align-items-center my-3">
                        <div className="flex-grow-1 border-top" />
                        <span className="px-3 text-muted small">or</span>
                        <div className="flex-grow-1 border-top" />
                      </div>

                      {/* Google login */}
                      <div className={`d-flex justify-content-center ${socialLoading ? "opacity-75 pe-none" : ""}`}>
                        <GoogleLogin
                          onSuccess={(cred) => onGoogleCredential(cred.credential)}
                          onError={() => setErr("Google login failed")}
                          theme="outline"
                          shape="pill"
                          size="large"
                          text="signin_with"
                        />
                      </div>

                      <div className="text-center mt-3 small text-muted">
                        Don’t have an account?{" "}
                        <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => setTab("register")}>
                          Create one
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form key="register" {...fadeSlide} onSubmit={doRegister} noValidate>
                      {/* full name */}
                      <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <div className="input-group input-group-lg modern-input">
                          <span className="input-group-text">
                            <i className="bi bi-person" />
                          </span>
                          <input
                            className={`form-control ${touched.fullName && nameError ? "is-invalid" : touched.fullName ? "is-valid" : ""}`}
                            value={fullName}
                            onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        {touched.fullName && nameError && <div className="invalid-feedback d-block">{nameError}</div>}
                      </div>

                      {/* email */}
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <div className="input-group input-group-lg modern-input">
                          <span className="input-group-text">
                            <i className="bi bi-envelope" />
                          </span>
                          <input
                            className={`form-control ${touched.email && emailError ? "is-invalid" : touched.email ? "is-valid" : ""}`}
                            type="email"
                            value={email}
                            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        {touched.email && emailError && <div className="invalid-feedback d-block">{emailError}</div>}
                      </div>

                      {/* password */}
                      <div className="mb-4">
                        <label className="form-label">Password</label>
                        <div className="input-group input-group-lg modern-input">
                          <span className="input-group-text">
                            <i className="bi bi-shield-lock" />
                          </span>
                          <input
                            className={`form-control ${touched.password && passError ? "is-invalid" : touched.password ? "is-valid" : ""}`}
                            type={showPass ? "text" : "password"}
                            value={password}
                            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPass((s) => !s)}
                            aria-label={showPass ? "Hide password" : "Show password"}
                          >
                            {showPass ? <i className="bi bi-eye-slash" /> : <i className="bi bi-eye" />}
                          </button>
                        </div>
                        {touched.password && passError && <div className="invalid-feedback d-block">{passError}</div>}
                      </div>

                      {/* ✅ زر التسجيل بنفس ستايل زر الدخول (تدرّج أزرق) */}
                      <motion.button
                        type="submit"
                        className="btn btn-gradient w-100 btn-lg rounded-3 mb-3"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ y: -1 }}
                      >
                        {loading ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="spinner-border spinner-border-sm" role="status" />
                            Creating account...
                          </span>
                        ) : (
                          <>
                            <i className="bi bi-person-plus me-2" />
                            Create account
                          </>
                        )}
                      </motion.button>

                      {/* Divider */}
                      <div className="d-flex align-items-center my-3">
                        <div className="flex-grow-1 border-top" />
                        <span className="px-3 text-muted small">or</span>
                        <div className="flex-grow-1 border-top" />
                      </div>

                      {/* Google sign-up */}
                      <div className={`d-flex justify-content-center ${socialLoading ? "opacity-75 pe-none" : ""}`}>
                        <GoogleLogin
                          onSuccess={(cred) => onGoogleCredential(cred.credential)}
                          onError={() => setErr("Google login failed")}
                          theme="outline"
                          shape="pill"
                          size="large"
                          text="signup_with"
                        />
                      </div>

                      <div className="text-center mt-3 small text-muted">
                        Already have an account?{" "}
                        <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => setTab("login")}>
                          Login
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Theme-aware styles */}
      <style>{`
        :root {
          --bg-bubble1: rgba(0, 212, 255, .22);
          --bg-bubble2: rgba(122, 92, 255, .22);
          --glass-bg: rgba(255, 255, 255, 0.86);
          --gradient-1: linear-gradient(135deg, #00d4ff, #7a5cff);
          --gradient-2: linear-gradient(135deg, #7a5cff, #4facfe);
          --ring: 0 0 0 0.35rem rgba(0, 212, 255, .20);
        }
        [data-bs-theme="dark"] {
          --bg-bubble1: rgba(0, 212, 255, .12);
          --bg-bubble2: rgba(122, 92, 255, .12);
          --glass-bg: rgba(18, 18, 22, 0.65);
          --ring: 0 0 0 0.35rem rgba(0, 212, 255, .12);
        }
        .auth-glass { background: var(--glass-bg); }
        .shadow-xl { box-shadow: 0 22px 70px rgba(0,0,0,.12); }

        .brand-badge {
          width: 38px; height: 38px;
          border-radius: 12px;
          background: var(--gradient-1);
          color: #fff; font-size: 18px;
          box-shadow: 0 8px 24px rgba(122,92,255,.35);
        }

        .tabs-pill {
          display: inline-flex;
          padding: 4px;
          background: rgba(0,0,0,.06);
          border-radius: 999px;
          gap: 4px;
        }
        [data-bs-theme="dark"] .tabs-pill { background: rgba(255,255,255,.06); }
        .tabs-pill .pill {
          border: 0;
          padding: 8px 16px;
          border-radius: 999px;
          background: transparent;
          font-weight: 600;
          transition: transform .15s ease;
        }
        .tabs-pill .pill:hover { transform: translateY(-1px); }
        .tabs-pill .pill.active {
          color: #fff;
          background: var(--gradient-2);
          box-shadow: 0 8px 24px rgba(122,92,255,.35);
        }

        .modern-input .form-control {
          border: 1px solid rgba(0,0,0,.08);
        }
        [data-bs-theme="dark"] .modern-input .form-control {
          border-color: rgba(255,255,255,.12);
          background-color: rgba(255,255,255,.04);
          color: #fff;
        }
        .modern-input .form-control:focus {
          box-shadow: var(--ring);
          border-color: transparent;
        }

        .btn-gradient {
          background: var(--gradient-1);
          border: none; color: #fff;
          box-shadow: 0 10px 24px rgba(122,92,255,.35);
        }
        .btn-gradient:hover {
          filter: brightness(1.05);
          box-shadow: 0 16px 36px rgba(122,92,255,.45);
        }
      `}</style>
    </div>
  );
}
