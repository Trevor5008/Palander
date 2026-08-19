import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CalendarView } from "./pages/CalendarView";
import { WeeklyView } from "./pages/WeeklyView";
import { DailyView } from "./pages/DailyView";
import { LoginView } from "./pages/LoginView";

export function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="mx-auto max-h-screen overflow-hidden max-w-5xl px-6 py-8">
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<CalendarView />} />
            <Route path="/weekly" element={<WeeklyView />} />
            <Route path="/daily" element={<DailyView />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
