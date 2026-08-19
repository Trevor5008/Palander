import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <h1 className="text-xl font-semibold">Palander</h1>
        <div className="flex items-center gap-4 text-sm">
          <nav className="flex gap-4">
            <Link to="/" className="hover:text-blue-600">
              Calendar
            </Link>
            <Link to="/weekly" className="hover:text-blue-600">
              Weekly
            </Link>
            <Link to="/daily" className="hover:text-blue-600">
              Daily
            </Link>
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
