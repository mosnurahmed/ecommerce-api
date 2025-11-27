// src/app/dashboard/page.tsx
// Protected dashboard page

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Check authentication
  // কি করছি: Server-side session check করছি
  // কেন করছি: Unauthorized access prevent করতে
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  // কি করছি: যদি session না থাকে, login page এ redirect
  if (!session) {
    redirect("/login");
  }

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ marginBottom: "1rem" }}>Dashboard</h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "2rem",
            color: "#333",
          }}
        >
          Welcome back, <strong>{session.user?.name}</strong>!
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: "#f0f9ff",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e40af" }}>Role</h3>
            <p
              style={{
                margin: 0,
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#1e3a8a",
              }}
            >
              {session.user?.role}
            </p>
          </div>

          <div
            style={{
              background: "#f0fdf4",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#15803d" }}>Email</h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "#166534",
                wordBreak: "break-all",
              }}
            >
              {session.user?.email}
            </p>
          </div>

          <div
            style={{
              background: "#fef3c7",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid #fde68a",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#92400e" }}>
              User ID
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#78350f",
                fontFamily: "monospace",
              }}
            >
              {session.user?.id}
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#f9fafb",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "1rem",
              fontSize: "1.2rem",
            }}
          >
            Session Data
          </h2>
          <pre
            style={{
              background: "#1f2937",
              color: "#10b981",
              padding: "1rem",
              borderRadius: "4px",
              overflow: "auto",
              fontSize: "0.85rem",
              margin: 0,
            }}
          >
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <a
            href="/api/auth/signout"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "#dc2626",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            Logout
          </a>
        </div>
      </div>
    </div>
  );
}
