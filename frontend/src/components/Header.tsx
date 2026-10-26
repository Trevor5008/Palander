import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LAYOUT_WIDTH_DEFAULT } from "../constants/layout";
import { useAuth } from "../context/AuthContext";
import { useCurrentTime } from "../hooks/useCurrentTime";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-md px-2.5 py-1 transition-colors",
    isActive
      ? "bg-blue-50 font-medium text-blue-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-blue-600",
  ].join(" ");
}

type HeaderProps = {
  widthClass?: string;
};

export function Header({ widthClass = LAYOUT_WIDTH_DEFAULT }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const dateQuery = search || "";
  const now = useCurrentTime(1000);
  const clockLabel = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div
        className={`mx-auto grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 ${widthClass}`}
      >
        <h1 className="text-xl font-semibold">Palander</h1>
        <time
          dateTime={now.toISOString()}
          className="font-mono text-lg tabular-nums tracking-wide text-gray-800"
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
          {user && (
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <span className="text-gray-600">{user.username}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-gray-500 hover:text-blue-600"
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
