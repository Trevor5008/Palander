import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginView() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState("dev");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-6">
      <h2 className="font-display mb-6 text-center text-3xl text-text">Sign in</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-border bg-surface p-6"
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-text">Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
            className="w-full rounded border border-border bg-bg px-3 py-2 text-text"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-text">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded border border-border bg-bg px-3 py-2 text-text"
          />
        </label>
        {error && (
          <p className="rounded bg-danger-muted px-3 py-2 text-sm text-danger">{error}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-today px-4 py-2 text-sm font-medium text-bg hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-text-muted">
        Dev account: <code>dev</code> / <code>dev</code>
      </p>
    </div>
  );
}