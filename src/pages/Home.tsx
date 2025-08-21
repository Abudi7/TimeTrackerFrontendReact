// 3D gradient header + CTA buttons (Track / Reports) with i18n + admin button guard
import { motion } from "framer-motion";
import { type Lang, t } from "../i18n";

export default function Home({
  onGoTrack,
  onGoReports,
  onGoAdminLogo,
  canManageBrand,
  lang,
}: {
  onGoTrack: () => void;
  onGoReports: () => void;
  onGoAdminLogo: () => void;
  canManageBrand: boolean;
  lang: Lang;
}) {
  return (
    <motion.div
      className="text-center py-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <motion.h1
        className="fw-bold mb-4 display-3 gradient-text"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        🎉 {t(lang, "welcome")} <br /> {t(lang, "appTitle")}
      </motion.h1>

      <motion.p
        className="lead text-muted mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {t(lang, "tagline")}
      </motion.p>

      <div className="d-flex justify-content-center gap-3 flex-wrap">
        <motion.button
          className="btn btn-lg px-5 py-3 fancy-btn"
          whileHover={{ scale: 1.08, rotate: 1.5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onGoTrack}
        >
          {t(lang, "goTrack")} ⏱️
        </motion.button>

        <motion.button
          className="btn btn-outline-secondary btn-lg rounded-pill px-4"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoReports}
        >
          Go to Reports 📊
        </motion.button>

        {canManageBrand && (
          <motion.button
            className="btn btn-warning btn-lg rounded-pill px-4"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoAdminLogo}
          >
            🖼️ Admin Logo
          </motion.button>
        )}
      </div>

      <style>{`
        .gradient-text {
          background: linear-gradient(45deg, #ff6ec4, #7873f5, #4facfe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 3px 3px 8px rgba(0,0,0,0.25);
        }
        .fancy-btn {
          background: linear-gradient(135deg, #ff6ec4, #7873f5, #4facfe);
          border: none;
          border-radius: 50px;
          color: white;
          font-size: 1.2rem;
          font-weight: 700;
          box-shadow: 0px 6px 22px rgba(120,115,245,0.35);
          transition: all 0.3s ease;
        }
        .fancy-btn:hover {
          box-shadow: 0px 10px 32px rgba(120,115,245,0.55);
          filter: brightness(1.05);
        }
      `}</style>
    </motion.div>
  );
}
