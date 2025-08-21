import { useTheme } from "../theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolved, setTheme } = useTheme();

  return (
    <div className={`dropdown ${className}`}>
      <button
        className="btn btn-outline-secondary btn-sm dropdown-toggle d-inline-flex align-items-center gap-2"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title="Theme"
      >
        <i className={`bi ${resolved === "dark" ? "bi-moon-stars" : "bi-sun"}`} />
        <span>{theme === "system" ? "System" : theme[0].toUpperCase() + theme.slice(1)}</span>
      </button>
      <ul className="dropdown-menu dropdown-menu-end">
        <li>
          <button className={`dropdown-item ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
            <i className="bi bi-sun me-2" /> Light
          </button>
        </li>
        <li>
          <button className={`dropdown-item ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
            <i className="bi bi-moon-stars me-2" /> Dark
          </button>
        </li>
        <li>
          <button className={`dropdown-item ${theme === "system" ? "active" : ""}`} onClick={() => setTheme("system")}>
            <i className="bi bi-circle-half me-2" /> System
          </button>
        </li>
      </ul>
    </div>
  );
}
