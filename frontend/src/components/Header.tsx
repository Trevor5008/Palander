import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LAYOUT_WIDTH_DEFAULT } from "../constants/layout";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCurrentTime } from "../hooks/useCurrentTime";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "font-display rounded-md px-2.5 py-1 text-sm transition-colors",
    isActive
      ? "bg-nav-active-bg text-nav-active-text"
      : "text-text-muted hover:bg-surface hover:text-today",
  ].join(" ");
}

type HeaderProps = {
  widthClass?: string;
};

export function Header({ widthClass = LAYOUT_WIDTH_DEFAULT }: HeaderProps) {
  const { user, logout } = useAuth();
  const { preference, cyclePreference } = useTheme();
  const navigate = useNavigate();
  const { search } = useLocation();
  const dateQuery = search || "";
  const now = useCurrentTime(1000);
  const clockLabel = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  const themeLabel =
    preference === "dark"
      ? "Theme: dark (click for light)"
      : preference === "light"
        ? "Theme: light (click for system)"
        : "Theme: system (click for dark)";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-border bg-surface px-6 py-4">
      <div
        className={`mx-auto grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 ${widthClass}`}
      >
        <h1 className="text-2xl text-text">Palander</h1>
        <time
          dateTime={now.toISOString()}
          className="font-sans text-lg tabular-nums tracking-wide text-text"
          aria-live="off"
        >
          {clockLabel}
        </time>
        <div className="flex items-center justify-end gap-4 text-sm">
          <nav className="flex items-center gap-1" aria-label="Views">
            <NavLink to={{ pathname: "/", search: dateQuery }} end className={navLinkClass}>
              Daily
            </NavLink>
            <NavLink to="/planning" className={navLinkClass}>
              Planning
            </NavLink>
            <NavLink to={{ pathname: "/weekly", search: dateQuery }} className={navLinkClass}>
              Weekly
            </NavLink>
            <NavLink to={{ pathname: "/monthly", search: dateQuery }} className={navLinkClass}>
              Monthly
            </NavLink>
          </nav>
          <button
            type="button"
            onClick={cyclePreference}
            className="rounded-md border border-border p-1.5 text-text-muted hover:border-today hover:text-today"
            aria-label={themeLabel}
            title={themeLabel}
          >
            {preference === "light" ? (
              <SunIcon className="h-5 w-5" aria-hidden />
            ) : (
              <MoonIcon className="h-5 w-5" aria-hidden />
            )}
          </button>
          {user && (
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <span className="text-text-muted">{user.username}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-text-muted hover:text-today"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}