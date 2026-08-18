import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../auth/token";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!getToken() || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
