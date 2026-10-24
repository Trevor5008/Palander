import { Navigate, useLocation } from "react-router-dom";

export function DailyRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/", search }} replace />;
}
