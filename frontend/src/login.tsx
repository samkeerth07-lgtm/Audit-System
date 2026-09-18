import { useState } from "react";
import type { FormEvent } from "react";

interface LoginProps {
  onLogin: (token: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      onLogin(data.access_token);
    } catch {
      setError("Could not connect to the backend");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Mini Audit Review System</h1>
        <p>Sign in to continue</p>

        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit">Sign In</button>
        </form>
      </div>
    </div>
  );
}

export default Login;