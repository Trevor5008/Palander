import { Link } from "react-router-dom";

export function Header() {
  return (
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
  );
}