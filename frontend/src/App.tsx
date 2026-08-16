import { Route, Routes } from "react-router-dom";
import { CalendarView } from "./pages/CalendarView";
import { DailyView } from "./pages/DailyView";
import { Header } from "./components/Header";

export function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="mx-auto max-h-screen overflow-hidden max-w-5xl px-6 py-8">
        {/* Links to monthly and daily views (monthly view is default) */}
        <Routes>
          <Route path="/" element={<CalendarView />} />
          <Route path="/daily" element={<DailyView />} />
        </Routes>
      </main>
    </div>
  );
}
