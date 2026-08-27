import { Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { isCalendarPath, LAYOUT_HEADER_OFFSET } from "./constants/layout";
import { useLayoutWidth } from "./hooks/useLayoutWidth";
import { CalendarView } from "./pages/CalendarView";
import { WeeklyView } from "./pages/WeeklyView";
import { DailyView } from "./pages/DailyView";
import { LoginView } from "./pages/LoginView";

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const widthClass = useLayoutWidth();
  const isCalendar = isCalendarPath(pathname);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header widthClass={widthClass} />
      <main
        className={`mx-auto w-full ${widthClass} ${
          isCalendar
            ? "flex flex-col px-6 pb-4"
            : "max-h-screen overflow-hidden px-6 py-8"
        }`}
        style={isCalendar ? { height: `calc(100dvh - ${LAYOUT_HEADER_OFFSET})` } : undefined}
      >
        {children}
      </main>
    </div>
  );
}

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<CalendarView />} />
          <Route path="/weekly" element={<WeeklyView />} />
          <Route path="/daily" element={<DailyView />} />
        </Route>
      </Routes>
    </AppShell>
  );
}
