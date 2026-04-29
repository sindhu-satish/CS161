import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const { login, register, supabaseConfigured } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!supabaseConfigured) {
      setError("Supabase is not configured. Copy .env.example to .env.local and add your project URL and anon key.");
      return;
    }
    setPending(true);
    try {
      if (isRegistering) {
        if (!name.trim()) {
          setError("Please enter your name.");
          return;
        }
        const res = await register(name.trim(), email.trim(), password);
        if (!res.ok) setError(res.error ?? "Registration failed.");
      } else {
        const res = await login(email.trim(), password);
        if (!res.ok) setError(res.error ?? "Sign in failed.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">FitTrack Pro</h1>
            <p className="text-sm text-muted-foreground">
              {isRegistering ? "Create your account" : "Welcome back"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          {isRegistering && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={handleSubmit}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 disabled:opacity-60"
          >
            {pending ? "Please wait…" : isRegistering ? "Create Account" : "Sign In"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="font-semibold text-primary"
          >
            {isRegistering ? "Sign In" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
