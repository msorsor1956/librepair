import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
}

const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
  info:    { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  warning: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  success: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  error:   { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
};

const DISMISSED_KEY = "librepair_dismissed_announcements";

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
    setDismissed(stored);

    fetch(`${import.meta.env.VITE_SERVER_URL || ""}/api/announcements`)
      .then(r => r.ok ? r.json() : { announcements: [] })
      .then(d => setAnnouncements(d.announcements || []))
      .catch(() => {});
  }, []);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
  };

  const visible = announcements.filter(a => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, display: "flex", flexDirection: "column" }}>
      {visible.map(a => {
        const s = typeStyles[a.type] || typeStyles.info;
        return (
          <div
            key={a.id}
            style={{
              background: s.bg,
              borderBottom: `1px solid ${s.border}`,
              color: s.text,
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 14,
            }}
          >
            <div style={{ flex: 1, textAlign: "center" }}>
              {a.title && <strong style={{ marginRight: 8 }}>{a.title}:</strong>}
              {a.message}
            </div>
            <button
              onClick={() => dismiss(a.id)}
              style={{
                background: "transparent",
                border: "none",
                color: s.text,
                fontSize: 18,
                lineHeight: 1,
                cursor: "pointer",
                flexShrink: 0,
                opacity: 0.7,
                padding: "0 4px",
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
