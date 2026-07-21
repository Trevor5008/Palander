import { Link, Route, Routes } from "react-router-dom";
import { CalendarView } from "./pages/CalendarView";
import { DailyView } from "./pages/DailyView";

export function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-semibold">Palander</h1>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:text-blue-600">
              Calendar
            </Link>
            <Link to="/daily" className="hover:text-blue-600">
              Daily
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Routes>
          <Route path="/" element={<CalendarView />} />
          <Route path="/daily" element={<DailyView />} />
        </Routes>
      </main>
    </div>
  );
}
