// src/app/login/page.tsx
// Update handleSubmit function:

"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Change default redirect to /dashboard
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        // Redirect to dashboard
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Login</h1>

        {error && (
          <div
            style={{
              background: "#fee",
              color: "#c33",
              padding: "0.75rem",
              borderRadius: "4px",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              placeholder="your@email.com"
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          <p style={{ color: "#666", marginTop: "1rem", fontWeight: "bold" }}>
            Test Credentials:
          </p>
          <div
            style={{
              background: "#f8f9fa",
              padding: "1rem",
              borderRadius: "4px",
              marginTop: "0.5rem",
            }}
          >
            <p
              style={{
                color: "#333",
                fontSize: "0.85rem",
                margin: "0.25rem 0",
              }}
            >
              <strong>Customer:</strong> customer@example.com
            </p>
            <p
              style={{
                color: "#666",
                fontSize: "0.85rem",
                margin: "0.25rem 0",
              }}
            >
              Password: password123
            </p>
          </div>
          <div
            style={{
              background: "#f8f9fa",
              padding: "1rem",
              borderRadius: "4px",
              marginTop: "0.5rem",
            }}
          >
            <p
              style={{
                color: "#333",
                fontSize: "0.85rem",
                margin: "0.25rem 0",
              }}
            >
              <strong>Admin:</strong> admin@shop.com
            </p>
            <p
              style={{
                color: "#666",
                fontSize: "0.85rem",
                margin: "0.25rem 0",
              }}
            >
              Password: password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
