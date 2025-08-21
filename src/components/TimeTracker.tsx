// src/components/TimeTracker.tsx
// Shows today's total, history, and NOW also a Sessions table (project/tags/note) + rich CSV export

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import ProjectSelect from "./ProjectSelect";
import TagsMultiSelect from "./TagsMultiSelect";
import { type Lang, t } from "../i18n";

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec
    .toString()
    .padStart(2, "0")}`;
}
function prettyDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
  });
}
function prettyTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

type DayTotal = { day: string; total_seconds: number };

// NEW: richer types coming from /time/entries
type Tag = { id: number; name: string; color: string | null };
type Entry = {
  id: number;
  start_at: string;
  end_at: string | null;
  note: string | null;
  project_id: number | null;
  project_name: string | null;
  project_color: string | null;
  tags: Tag[];
};

const WORKDAY_SECONDS = 8 * 3600;

export default function TimeTracker({
  onBack,
  lang,
}: {
  onBack: () => void;
  lang: Lang;
}) {
  const [totalToday, setTotalToday] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // live elapsed
  const [nowTick, setNowTick] = useState(0);
  const baseFetchedAt = useRef<number>(Date.now());
  const displayTotalToday = useMemo(() => {
    if (!running) return totalToday;
    const delta = Math.floor((nowTick - baseFetchedAt.current) / 1000);
    return totalToday + Math.max(0, delta);
  }, [totalToday, running, nowTick]);
  const progress = Math.min(100, Math.round((displayTotalToday / WORKDAY_SECONDS) * 100));

  const [history, setHistory] = useState<DayTotal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // NEW: full entries with project/tags/note
  const [entries, setEntries] = useState<Entry[]>([]);

  // start form
  const [projectId, setProjectId] = useState<number | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [note, setNote] = useState<string>("");

  const offsetMinutes = -new Date().getTimezoneOffset();

  const loadToday = async () => {
    const res = await api.get(`/time/today?offsetMinutes=${offsetMinutes}`);
    setTotalToday(res.data.total_seconds ?? 0);
    setRunning(res.data.running ?? false);
    baseFetchedAt.current = Date.now();
    setNowTick(Date.now());
  };
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/time/history?days=60&offsetMinutes=${offsetMinutes}`);
      setHistory(res.data.history ?? []);
    } finally {
      setLoadingHistory(false);
    }
  };
  const loadEntries = async () => {
    const res = await api.get("/time/entries");
    setEntries(res.data.entries ?? []);
  };

  useEffect(() => {
    Promise.all([loadToday(), loadHistory(), loadEntries()]);
  }, []);
  useEffect(() => {
    const int = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  // send project/note/tags
  const start = async () => {
    try {
      setLoading(true);
      await api.post("/time/start", {
        project_id: projectId,
        note: note || null,
        tags: tagIds,
      });
      await Promise.all([loadToday(), loadHistory(), loadEntries()]);
    } finally {
      setLoading(false);
    }
  };
  const stop = async () => {
    try {
      setLoading(true);
      await api.post("/time/end", {
        project_id: projectId,
        note: note || null,
        tags: tagIds,
      });
      await Promise.all([loadToday(), loadHistory(), loadEntries()]);
    } finally {
      setLoading(false);
    }
  };

  // CSV helpers
  function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
    const escape = (v: any) => {
      const s = String(v ?? "");
      if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const csv = [headers.join(",")].concat(rows.map((r) => r.map(escape).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportHistoryCsv() {
    const headers = ["Date", "Pretty", "TotalSeconds", "Formatted"];
    const rows = history.map((h) => [h.day, prettyDate(h.day), h.total_seconds, formatSeconds(h.total_seconds)]);
    downloadCsv(`daily_totals_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }
  // NEW: export sessions with project/tags/note
  function exportEntriesCsv() {
    const headers = [
      "ID",
      "Date",
      "StartAtLocal",
      "EndAtLocal",
      "DurationSeconds",
      "DurationFormatted",
      "Project",
      "Tags",
      "Note",
    ];
    const rows = entries.map((e) => {
      const start = new Date(e.start_at);
      const end = e.end_at ? new Date(e.end_at) : null;
      const secs = end ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000)) : 0;
      const project = e.project_name ?? "";
      const tags = e.tags?.length ? e.tags.map((t) => t.name).join(" | ") : "";
      return [
        e.id,
        start.toLocaleDateString(),
        prettyTime(e.start_at),
        prettyTime(e.end_at),
        secs,
        formatSeconds(secs),
        project,
        tags,
        e.note ?? "",
      ];
    });
    downloadCsv(`sessions_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-xxl-10">
        {/* Top bar */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <motion.button
            className="btn btn-gradient-soft rounded-pill"
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            title={t(lang, "backHome")}
          >
            {t(lang, "backHome")}
          </motion.button>

          <div className="d-flex gap-2">
            <motion.button
              className="btn btn-soft rounded-pill"
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
              onClick={exportHistoryCsv}
              title={t(lang, "exportDays")}
            >
              {t(lang, "exportDays")}
            </motion.button>
            <motion.button
              className="btn btn-soft rounded-pill"
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
              onClick={exportEntriesCsv}
              title={t(lang, "exportSessions")}
            >
              {t(lang, "exportSessions")}
            </motion.button>
          </div>
        </div>

        {/* Heading */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="display-6 fw-bold gradient-text-3d mb-2">
            {t(lang, "dashboardTitle")}
          </h2>
          <p className="text-muted mb-0">{t(lang, "stayFocused")}</p>
        </motion.div>

        {/* Today card */}
        <motion.div
          className="card border-0 shadow-lg rounded-4 overflow-hidden glassy-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="card-body p-5 text-center">
            <div className="text-muted mb-2">{t(lang, "todaysTime")}</div>

            <motion.div
              className="display-3 fw-bold gradient-number"
              key={displayTotalToday}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              style={{ textShadow: "3px 3px 10px rgba(0,0,0,.25)" }}
            >
              {formatSeconds(displayTotalToday)}
            </motion.div>

            {/* Project / Tags / Note */}
            <div className="row g-3 mt-4 align-items-center justify-content-center">
              <div className="col-12 col-lg-3">
                <label className="form-label">Project</label>
                <ProjectSelect value={projectId} onChange={setProjectId} />
              </div>
              <div className="col-12 col-lg-5">
                <label className="form-label">Tags</label>
                <TagsMultiSelect value={tagIds} onChange={setTagIds} />
              </div>
              <div className="col-12">
                <label className="form-label">Note</label>
                <textarea
                  className="form-control"
                  placeholder="What are you working on?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>0h</span>
                <span>{Math.floor(WORKDAY_SECONDS / 3600)}h {t(lang, "target")}</span>
              </div>
              <div className="progress progress-animated rounded-pill" style={{ height: 14 }}>
                <div
                  className="progress-bar gradient-bar"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="small text-muted mt-2">{progress}% of daily goal</div>
            </div>

            {/* Actions */}
            <div className="mt-4 d-flex gap-3 justify-content-center flex-wrap">
              {!running ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ y: -1 }}
                  className="btn btn-lg px-4 rounded-pill btn-gradient"
                  onClick={start}
                  disabled={loading}
                >
                  <i className="bi bi-play-fill me-2" /> {t(lang, "start")}
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ y: -1 }}
                  className="btn btn-lg px-4 rounded-pill btn-gradient-danger"
                  onClick={stop}
                  disabled={loading}
                >
                  <i className="bi bi-stop-fill me-2" /> {t(lang, "stop")}
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1 }}
                className="btn rounded-pill btn-soft"
                onClick={() => Promise.all([loadToday(), loadHistory(), loadEntries()])}
                disabled={loading}
              >
                <i className="bi bi-arrow-repeat me-2" /> {t(lang, "refresh")}
              </motion.button>
            </div>

            <div className="small text-muted mt-3">
              {t(lang, "status")}:{" "}
              {running ? (
                <span className="text-success">Active</span>
              ) : (
                <span className="text-secondary">Stopped</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* History (daily totals) */}
        <motion.div
          className="mt-4 card border-0 shadow-sm rounded-4 glassy-card-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">{t(lang, "historyTitle")}</h5>
              <small className="text-muted">{t(lang, "lastNDays")}</small>
            </div>

            {loadingHistory && (
              <div className="py-3">
                <div className="placeholder-wave">
                  <div className="placeholder shimmer col-12 mb-2" style={{ height: 14 }} />
                  <div className="placeholder shimmer col-10 mb-2" style={{ height: 14 }} />
                  <div className="placeholder shimmer col-8 mb-2" style={{ height: 14 }} />
                </div>
              </div>
            )}

            {!loadingHistory && history.length > 0 && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr className="text-muted">
                      <th style={{ width: 140 }}>Date</th>
                      <th>Pretty</th>
                      <th className="text-end" style={{ width: 160 }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <AnimatePresence initial={false}>
                    <tbody>
                      {history.map((d) => (
                        <motion.tr
                          key={d.day}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                          className="border-top"
                        >
                          <td className="text-muted">{d.day}</td>
                          <td>{prettyDate(d.day)}</td>
                          <td className="text-end fw-semibold">
                            {formatSeconds(d.total_seconds)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </AnimatePresence>
                </table>
              </div>
            )}

            {!loadingHistory && history.length === 0 && (
              <div className="text-center text-muted py-3">{t(lang, "noHistory")}</div>
            )}
          </div>
        </motion.div>

        {/* NEW: Sessions table (project/tags/note) */}
        <motion.div
          className="mt-4 card border-0 shadow-sm rounded-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.07 }}
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">Sessions (Last 200)</h5>
              <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={exportEntriesCsv}>
                Export CSV (Sessions)
              </button>
            </div>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="text-muted">
                    <th style={{ minWidth: 120 }}>Date</th>
                    <th style={{ minWidth: 90 }}>Start</th>
                    <th style={{ minWidth: 90 }}>End</th>
                    <th style={{ minWidth: 110 }}>Duration</th>
                    <th style={{ minWidth: 160 }}>Project</th>
                    <th style={{ minWidth: 200 }}>Tags</th>
                    <th style={{ minWidth: 220 }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const start = new Date(e.start_at);
                    const end = e.end_at ? new Date(e.end_at) : null;
                    const secs = end ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000)) : 0;
                    return (
                      <tr key={e.id} className="border-top">
                        <td className="text-muted">{start.toLocaleDateString()}</td>
                        <td>{prettyTime(e.start_at)}</td>
                        <td>{prettyTime(e.end_at)}</td>
                        <td className="fw-semibold">{formatSeconds(secs)}</td>
                        <td>
                          {e.project_name ? (
                            <span
                              className="badge rounded-pill"
                              style={{
                                background: e.project_color || "#6c757d",
                                color: "#fff",
                              }}
                            >
                              {e.project_name}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {e.tags?.length ? (
                            <div className="d-flex flex-wrap gap-1">
                              {e.tags.map((t) => (
                                <span
                                  key={t.id}
                                  className="badge rounded-pill"
                                  style={{
                                    background: t.color || "#adb5bd",
                                    color: "#fff",
                                  }}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-truncate" style={{ maxWidth: 320 }}>
                          {e.note || <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {entries.length === 0 && <div className="text-center text-muted">No sessions yet.</div>}
          </div>
        </motion.div>
      </div>

      <style>{`
        .gradient-text-3d {
          background: linear-gradient(45deg, #ff6ec4, #7873f5, #4facfe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 2px 2px 0 rgba(0,0,0,.08), 6px 8px 18px rgba(0,0,0,.18);
        }
        .gradient-number {
          background: linear-gradient(90deg, #00d4ff, #7a5cff, #ff6ec4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glassy-card {
          background: linear-gradient(135deg, rgba(13,110,253,0.08) 0%, rgba(25,135,84,0.08) 100%);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.35);
        }
        .glassy-card-2 {
          background: linear-gradient(135deg, rgba(120,115,245,0.06) 0%, rgba(79,172,254,0.06) 100%);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.3);
        }
        .btn-gradient {
          background: linear-gradient(135deg, #00d4ff, #7a5cff);
          color: #fff;
          border: none;
          box-shadow: 0 6px 18px rgba(122,92,255,0.35);
        }
        .btn-gradient:hover { filter: brightness(1.05); box-shadow: 0 10px 28px rgba(122,92,255,0.45); }
        .btn-gradient-danger {
          background: linear-gradient(135deg, #ff6a88, #ff99ac);
          color: #fff; border: none;
          box-shadow: 0 6px 18px rgba(255,106,136,0.35);
        }
        .btn-gradient-danger:hover { filter: brightness(1.05); box-shadow: 0 10px 28px rgba(255,106,136,0.45); }
        .btn-soft { background: linear-gradient(135deg, rgba(0,0,0,.02), rgba(0,0,0,.06)); border: 1px solid rgba(0,0,0,.06); color: #333; }
        .btn-gradient-soft { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 1px solid rgba(0,0,0,.08); color: #333; }
        .progress-animated { background: rgba(0,0,0,.06); overflow: hidden; position: relative; }
        .gradient-bar { background: linear-gradient(90deg, #00d4ff, #7a5cff, #ff6ec4); background-size: 200% 100%; animation: slide 2.5s linear infinite; border-radius: 999px; }
        @keyframes slide { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent); animation: shimmer 1.2s infinite; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
