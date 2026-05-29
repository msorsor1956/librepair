import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DashboardLayout } from "../components/dashboard-layout";
import { authClient } from "../lib/auth";
import { api } from "../lib/api";
import { User, Phone, MapPin, Save, Camera } from "lucide-react";

export default function ProfilePage() {
  const qc = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  });

  const user = (session as any)?.data?.user;

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [saved, setSaved] = useState(false);

  // sync state when user loads
  useState(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; phone: string; address: string }) =>
      api.users.me.$put({ json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ name, phone, address });
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              marginBottom: "0.25rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            My Profile
          </h1>
          <p style={{ color: "var(--color-muted)", marginBottom: "2rem" }}>
            Manage your account details
          </p>

          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-accent) 0%, #a01010 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#fff",
                position: "relative",
                flexShrink: 0,
              }}
            >
              {initials}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 24,
                  height: 24,
                  background: "var(--color-surface)",
                  borderRadius: "50%",
                  border: "2px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Camera size={12} color="var(--color-muted)" />
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--color-primary)" }}>
                {user?.name || "User"}
              </div>
              <div style={{ color: "var(--color-muted)", fontSize: "0.875rem" }}>{user?.email}</div>
              <div
                style={{
                  display: "inline-block",
                  marginTop: "0.25rem",
                  padding: "0.2rem 0.75rem",
                  borderRadius: 99,
                  background: (user as any)?.role === "admin" ? "rgba(224,32,32,0.15)" : "rgba(192,192,192,0.1)",
                  color: (user as any)?.role === "admin" ? "var(--color-accent)" : "var(--color-muted)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {(user as any)?.role || "customer"}
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <User size={14} /> Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-primary)",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Phone size={14} /> Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-primary)",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <MapPin size={14} /> Home Address
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-primary)",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Email Address
              </label>
              <input
                value={user?.email || ""}
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-muted)",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  opacity: 0.6,
                  cursor: "not-allowed",
                }}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.25rem" }}>
                Email cannot be changed
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={updateMutation.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.875rem",
                background: saved
                  ? "rgba(34,197,94,0.2)"
                  : "linear-gradient(135deg, var(--color-accent) 0%, #a01010 100%)",
                color: saved ? "#22c55e" : "#fff",
                border: saved ? "1px solid #22c55e" : "none",
                borderRadius: 8,
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: updateMutation.isPending ? "not-allowed" : "pointer",
                transition: "all 0.3s",
              }}
            >
              <Save size={16} />
              {updateMutation.isPending ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
