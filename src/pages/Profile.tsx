// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { api } from "../api";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/user/me").then((res) => {
      setUser(res.data);
      setFullName(res.data.full_name);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (password && password !== confirmPassword) {
      setMsg("❌ Passwords do not match");
      return;
    }

    const formData = new FormData();
    if (fullName) formData.append("full_name", fullName);
    if (avatarFile) formData.append("avatar", avatarFile);
    if (password) formData.append("password", password);

    try {
      const res = await api.put("/user/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg("✅ Profile updated!");
      setUser(res.data);
      setPassword("");
      setConfirmPassword("");
      setAvatarFile(null);

      if (res.data.avatar_path) {
        localStorage.setItem("avatar_url", res.data.avatar_path);
        window.dispatchEvent(new Event("avatar_changed"));
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Update failed");
    }
  }

  if (!user) return <p>Loading...</p>;

  return (
    <div className="container py-5">
      <h2 className="mb-4">Profile</h2>
      {msg && <div className="alert alert-info">{msg}</div>}

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        {/* Avatar */}
        <div className="mb-3 text-center">
          <img
            src={user.avatar_path || "/uploads/avatar-default.png"}
            alt="avatar"
            className="rounded-circle mb-2"
            style={{ width: 100, height: 100, objectFit: "cover" }}
          />
          <input
            type="file"
            className="form-control"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          />
        </div>

        {/* Full name */}
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-control"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {/* Change password */}
        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-primary">Update Profile</button>
      </form>
    </div>
  );
}
