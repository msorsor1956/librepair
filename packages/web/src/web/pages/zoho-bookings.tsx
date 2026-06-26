import { motion } from "framer-motion";
import { Calendar, ExternalLink } from "lucide-react";

export default function ZohoBookingsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg, #0d0d0d)" }}>
      {/* Header */}
      <div className="px-6 pt-10 pb-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(224,32,32,0.12)", color: "var(--color-red, #e02020)" }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "Rajdhani, sans-serif", color: "var(--color-primary, #fff)" }}
              >
                Schedule an Appointment
              </h1>
              <p className="text-sm" style={{ color: "var(--color-muted, #aaa)" }}>
                Book a meeting or service with the LIBrepair team
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Zoho Bookings embed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-5xl mx-auto px-4 pb-12"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.03)",
            minHeight: 700,
          }}
        >
          <iframe
            src="https://librepair.zohobookings.com"
            width="100%"
            height="700"
            frameBorder="0"
            title="LIBrepair Appointment Booking"
            allow="camera; microphone; fullscreen"
            style={{ display: "block", border: "none" }}
          />
        </div>

        {/* Fallback link */}
        <div className="mt-4 text-center">
          <a
            href="https://librepair.zohobookings.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: "var(--color-red, #e02020)" }}
          >
            <ExternalLink size={14} />
            Open booking page in a new tab
          </a>
        </div>
      </motion.div>
    </div>
  );
}
