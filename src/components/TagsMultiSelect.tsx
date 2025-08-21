// src/components/TagsMultiSelect.tsx
// Multi-select for tags with inline "Add New" modal (name + color)
// - Uses react-select for multi selection
// - Create new tag → updates list and selects it
// - Refresh button

import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
type Tag = { id: number; name: string; color?: string | null };

export default function TagsMultiSelect({
  value,
  onChange,
}: {
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("#FF6EC4");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tags");
      setTags(res.data.tags || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const options = useMemo(
    () =>
      tags.map((t) => ({
        value: t.id,
        label: t.name,
      })),
    [tags]
  );

  const selected = options.filter((o) => value.includes(o.value));

  const createTag = async () => {
    if (!name.trim()) return;
    try {
      setSaving(true);
      const res = await api.post("/tags", { name: name.trim(), color });
      const newTag: Tag = res.data;
      await load();
      onChange(Array.from(new Set([...value, newTag.id])));
      setShowAdd(false);
      setName("");
      toast.success("Tag created");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create tag";
      toast.error(msg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="d-flex align-items-center gap-2">
        <div className="flex-grow-1">
          <Select
            isMulti
            isLoading={loading}
            options={options}
            value={selected}
            onChange={(vals) => onChange(vals.map((v) => (v as any).value))}
            placeholder="Select tags..."
            classNamePrefix="react-select"
          />
        </div>

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
          title="Add Tag"
          onClick={() => setShowAdd(true)}
        >
          <i className="bi bi-plus-lg" />
        </button>
      </div>

      {/* Add Tag Modal */}
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
              if (e.target === e.currentTarget) setShowAdd(false);
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow rounded-4">
                <div className="modal-header">
                  <h5 className="modal-title">Add Tag</h5>
                  <button className="btn-close" onClick={() => setShowAdd(false)} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Bug, Feature, Meeting"
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
                  <button className="btn btn-primary" onClick={createTag} disabled={saving || !name.trim()}>
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
