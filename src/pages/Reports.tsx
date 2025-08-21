// src/pages/Reports.tsx
// Modern, multi-visual reports page using Recharts + Framer Motion + Bootstrap
// - KPI cards (Total / Average / Best Day)
// - Range selector (7/30/90 days)
// - Bar chart (daily hours), Line chart (trend), Pie chart (weekday distribution)
// - Nice gradients and subtle animations

import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { type Lang, t } from "../i18n";

type DayTotal = { day: string; total_seconds: number };

const COLORS = ["#6C5CE7", "#00D4FF", "#FF6EC4", "#26de81", "#fdcb6e", "#a29bfe", "#55efc4"];

export default function Reports({
  lang,
  onBack,
}: {
  lang: Lang;
  onBack: () => void;
}) {
  const [days, setDays] = useState<7 | 30 | 90>(7);
  const [data, setData] = useState<DayTotal[]>([]);
  const [loading, setLoading] = useState(true);

  const offsetMinutes = -new Date().getTimezoneOffset();

  // Fetch history based on range
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`/time/history?days=${days}&offsetMinutes=${offsetMinutes}`);
        const hist: DayTotal[] = res.data.history || [];
        setData(hist);
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  // Map API -> chart friendly arrays
  const dailyHours = useMemo(
    () =>
      [...data]
        .reverse() // chronological
        .map((x) => ({
          dateISO: x.day,
          dayLabel: new Date(x.day).toLocaleDateString(undefined, {
            month: days === 7 ? "short" : "2-digit",
            day: "2-digit",
          }),
          hours: +(x.total_seconds / 3600).toFixed(2),
        })),
    [data, days]
  );

  // KPIs
  const kpis = useMemo(() => {
    const totalSec = data.reduce((s, d) => s + d.total_seconds, 0);
    const totalHours = +(totalSec / 3600).toFixed(2);
    const countDays = data.length || 1;
    const avgHours = +(totalHours / countDays).toFixed(2);
    const best = data.reduce(
      (acc, d) => (d.total_seconds > acc.total_seconds ? d : acc),
      { day: "", total_seconds: 0 } as DayTotal
    );
    const bestHours = +(best.total_seconds / 3600).toFixed(2);
    const bestPretty = best.day
      ? new Date(best.day).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "2-digit" })
      : "-";
    return { totalHours, avgHours, bestHours, bestPretty };
  }, [data]);

  // Weekday distribution (Pie)
  const weekdayDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) {
      const wd = new Date(d.day).toLocaleDateString(undefined, { weekday: "short" });
      const hours = d.total_seconds / 3600;
      map.set(wd, (map.get(wd) || 0) + hours);
    }
    // keep Mon..Sun order by locale (approx by sorting by weekday index)
    const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
    arr.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    return arr;
  }, [data]);

  return (
    <div className="container">
      {/* Top bar: Back + Range selector */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <motion.button
          className="btn btn-gradient-soft rounded-pill"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
        >
          ← {t(lang, "backHome")}
        </motion.button>

        <div className="btn-group" role="group" aria-label="range">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              className={`btn ${days === n ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setDays(n as 7 | 30 | 90)}
            >
              Last {n} days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <motion.div
            className="card border-0 shadow-sm rounded-4 kpi-card kpi-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="card-body p-4">
              <div className="small text-uppercase text-muted mb-1">Total Hours</div>
              <div className="display-6 fw-bold gradient-number">{kpis.totalHours}</div>
              <div className="text-muted small">in the last {days} days</div>
            </div>
          </motion.div>
        </div>

        <div className="col-12 col-md-4">
          <motion.div
            className="card border-0 shadow-sm rounded-4 kpi-card kpi-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="card-body p-4">
              <div className="small text-uppercase text-muted mb-1">Avg / Day</div>
              <div className="display-6 fw-bold gradient-number">{kpis.avgHours}</div>
              <div className="text-muted small">hours per day</div>
            </div>
          </motion.div>
        </div>

        <div className="col-12 col-md-4">
          <motion.div
            className="card border-0 shadow-sm rounded-4 kpi-card kpi-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className="card-body p-4">
              <div className="small text-uppercase text-muted mb-1">Best Day</div>
              <div className="display-6 fw-bold gradient-number">{kpis.bestHours}</div>
              <div className="text-muted small">{kpis.bestPretty}</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="row g-4 mt-1">
        {/* Bar Chart: Daily hours */}
        <div className="col-12 col-lg-6">
          <motion.div
            className="card border-0 shadow rounded-4 p-3 glassy-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h5 className="mb-3">Daily Hours</h5>
            {loading ? (
              <div className="placeholder-wave">
                <div className="placeholder shimmer col-12 mb-2" style={{ height: 280 }} />
              </div>
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={dailyHours}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00D4FF" />
                        <stop offset="100%" stopColor="#7A5CFF" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="dayLabel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Line Chart: Trend */}
        <div className="col-12 col-lg-6">
          <motion.div
            className="card border-0 shadow rounded-4 p-3 glassy-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h5 className="mb-3">Trend</h5>
            {loading ? (
              <div className="placeholder-wave">
                <div className="placeholder shimmer col-12 mb-2" style={{ height: 280 }} />
              </div>
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={dailyHours}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FF6EC4" />
                        <stop offset="100%" stopColor="#00D4FF" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="dayLabel" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="url(#lineGrad)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Pie Chart: Weekday distribution */}
        <div className="col-12">
          <motion.div
            className="card border-0 shadow rounded-4 p-3 glassy-card-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h5 className="mb-3">Weekday Distribution</h5>
            {loading ? (
              <div className="placeholder-wave">
                <div className="placeholder shimmer col-12 mb-2" style={{ height: 280 }} />
              </div>
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={weekdayDist}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={3}
                      label
                    >
                      {weekdayDist.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Page styles */}
      <style>{`
        .gradient-number {
          background: linear-gradient(90deg, #00d4ff, #7a5cff, #ff6ec4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .kpi-card {
          background: linear-gradient(135deg, rgba(0,212,255,0.08), rgba(122,92,255,0.08));
          border: 1px solid rgba(0,0,0,0.05);
        }
        .kpi-1 { box-shadow: 0 8px 24px rgba(0, 212, 255, 0.15); }
        .kpi-2 { box-shadow: 0 8px 24px rgba(122, 92, 255, 0.15); }
        .kpi-3 { box-shadow: 0 8px 24px rgba(255, 110, 196, 0.15); }

        .glassy-card {
          background: linear-gradient(135deg, rgba(0,212,255,0.07), rgba(122,92,255,0.07));
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.25);
        }
        .glassy-card-2 {
          background: linear-gradient(135deg, rgba(255,110,196,0.06), rgba(79,172,254,0.06));
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.25);
        }
        .btn-gradient-soft {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          border: 1px solid rgba(0,0,0,.08);
          color: #333;
        }
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after {
          content: "";
          position: absolute; inset: 0; transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
