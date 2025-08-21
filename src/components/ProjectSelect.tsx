// src/components/ProjectSelect.tsx
// Project dropdown with inline "Add New" modal (name + color)
// - Lists user's projects
// - Create new project via modal then selects it
// - Refresh button

import { useEffect, useState } from "react";
import { api } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
type Project = { id: number; name: string; color?: string | null };

export default function ProjectSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
    
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("#7A5CFF");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects");
      setProjects(res.data.projects || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  const createProject = async () => {
    if (!name.trim()) return;
    try {
      setSaving(true);
      const res = await api.post("/projects", { name: name.trim(), color });
      const newProj: Project = res.data;
      await load();
      onChange(newProj.id);
      setShowAdd(false);
      setName("");
      toast.success("Project created");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create project";
      toast.error(msg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <div className="d-flex align-items-center gap-2">
        <select
          className="form-select"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          disabled={loading}
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          title="Refresh"
          onClick={load}
          disabled={loading}
        >
          <i className="bi bi-arrow-repeat" />
        </button>

        <button
          type="button"
          className="btn btn-sm btn-primary"
          title="Add Project"
          onClick={() => setShowAdd(true)}
        >
          <i className="bi bi-plus-lg" />
        </button>
      </div>

      {/* Add Project Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="modal-backdrop fade show"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            style={{ display: "block" }}
            onClick={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="modal d-block"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onClick={(e) => {
              // close when click outside dialog
              if (e.target === e.currentTarget) setShowAdd(false);
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow rounded-4">
                <div className="modal-header">
                  <h5 className="modal-title">Add Project</h5>
                  <button className="btn-close" onClick={() => setShowAdd(false)} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Client A – Website"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Color</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={color}
                        title="Pick color"
                        onChange={(e) => setColor(e.target.value)}
                      />
                      <span className="badge" style={{ background: color }}>
                        &nbsp;&nbsp;&nbsp;
                      </span>
                      <code className="small">{color}</code>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-light" onClick={() => setShowAdd(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={createProject} disabled={saving || !name.trim()}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
