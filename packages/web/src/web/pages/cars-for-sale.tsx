import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, ChevronLeft, ChevronRight, Play, Tag, Gauge, Palette, Calendar, Star, Search } from "lucide-react";
import { Navbar } from "../components/navbar";
import { hc } from "hono/client";
import type { AppType } from "../../api";

const client = hc<AppType>(import.meta.env.VITE_API_URL ?? "");

interface CarListing {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  color: string | null;
  condition: string;
  description: string | null;
  videoUrl: string | null;
  photos: string[];
  contactPhone: string | null;
  contactEmail: string | null;
  status: string;
  featured: boolean;
  createdAt: number;
}

const conditionColor: Record<string, string> = {
  excellent: "#22c55e",
  good: "#3b82f6",
  fair: "#f59e0b",
};

const statusColor: Record<string, string> = {
  available: "#22c55e",
  reserved: "#f59e0b",
  sold: "#e02020",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
}
function formatMileage(m: number) {
  return new Intl.NumberFormat("en-US").format(m) + " mi";
}

export default function CarsForSalePage() {
  const [listings, setListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CarListing | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [filter, setFilter] = useState<"all" | "available" | "sold" | "reserved">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/inventory`);
        const data = await res.json();
        setListings(data.listings ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = listings.filter((l) => {
    const matchFilter = filter === "all" || l.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.make.toLowerCase().includes(q) ||
      l.model.toLowerCase().includes(q) ||
      String(l.year).includes(q);
    return matchFilter && matchSearch;
  });

  const openListing = (l: CarListing) => {
    setSelected(l);
    setPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (!selected) return;
    setPhotoIndex((i) => (i + 1) % (selected.photos.length || 1));
  };

  const prevPhoto = () => {
    if (!selected) return;
    setPhotoIndex((i) => (i - 1 + (selected.photos.length || 1)) % (selected.photos.length || 1));
  };

  return (
    <div style={{ backgroundColor: "var(--color-bg)", color: "var(--color-white)", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <section className="pt-[100px] pb-12 px-6 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-8" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
        </div>
        <div className="max-w-[1280px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)", border: "1px solid rgba(224,32,32,0.2)" }}>
              <Tag size={12} /> Vehicles For Sale
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              CARS FOR <span className="text-gradient">SALE</span>
            </h1>
            <p className="text-lg max-w-xl" style={{ color: "var(--color-silver)" }}>
              Browse our certified pre-owned inventory. Every vehicle inspected by our expert mechanics.
            </p>
          </motion.div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-silver)" }} />
              <input
                type="text"
                placeholder="Search make, model, year..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "available", "sold", "reserved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-all"
                  style={{
                    backgroundColor: filter === f ? "var(--color-red)" : "var(--color-surface)",
                    color: filter === f ? "#fff" : "var(--color-silver)",
                    border: `1px solid ${filter === f ? "var(--color-red)" : "var(--color-border)"}`,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 md:px-10 pb-20">
        <div className="max-w-[1280px] mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl animate-pulse h-80" style={{ backgroundColor: "var(--color-surface)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🚗</div>
              <p className="text-xl font-semibold mb-2">No listings found</p>
              <p style={{ color: "var(--color-silver)" }}>Check back soon for new inventory.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  onClick={() => openListing(listing)}
                  className="rounded-xl overflow-hidden cursor-pointer group transition-transform hover:-translate-y-1"
                  style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  {/* Photo */}
                  <div className="relative h-52 bg-black overflow-hidden">
                    {listing.photos.length > 0 ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--color-silver)" }}>
                        <span className="text-5xl">🚗</span>
                      </div>
                    )}
                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                        style={{ backgroundColor: `${statusColor[listing.status]}22`, color: statusColor[listing.status], border: `1px solid ${statusColor[listing.status]}44` }}>
                        {listing.status}
                      </span>
                    </div>
                    {listing.featured && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                          style={{ backgroundColor: "rgba(212,160,23,0.15)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.4)" }}>
                          <Star size={10} fill="#D4A017" /> Featured
                        </span>
                      </div>
                    )}
                    {listing.videoUrl && (
                      <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(224,32,32,0.9)" }}>
                        <Play size={12} className="text-white" />
                      </div>
                    )}
                    {listing.photos.length > 1 && (
                      <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "var(--color-silver)" }}>
                        1/{listing.photos.length}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-base leading-tight" style={{ fontFamily: "Rajdhani, sans-serif" }}>{listing.title}</h3>
                      <span className="text-lg font-bold whitespace-nowrap" style={{ color: "var(--color-red)" }}>{formatPrice(listing.price)}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs mb-3" style={{ color: "var(--color-silver)" }}>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {listing.year}</span>
                      <span className="flex items-center gap-1"><Gauge size={11} /> {formatMileage(listing.mileage)}</span>
                      {listing.color && <span className="flex items-center gap-1"><Palette size={11} /> {listing.color}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold capitalize"
                        style={{ backgroundColor: `${conditionColor[listing.condition]}18`, color: conditionColor[listing.condition] }}>
                        {listing.condition}
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-silver)" }}>
                        {listing.photos.length} photo{listing.photos.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto py-8 px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-4xl rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              {/* Media area */}
              <div className="relative bg-black" style={{ minHeight: "320px" }}>
                {/* Video embed */}
                {selected.videoUrl ? (
                  <div className="relative">
                    <div className="aspect-video w-full">
                      {selected.videoUrl.includes("youtube.com") || selected.videoUrl.includes("youtu.be") ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${getYoutubeId(selected.videoUrl)}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Car video"
                        />
                      ) : (
                        <video src={selected.videoUrl} controls className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                ) : selected.photos.length > 0 ? (
                  <div className="relative aspect-video">
                    <img src={selected.photos[photoIndex]} alt={selected.title} className="w-full h-full object-cover" />
                    {selected.photos.length > 1 && (
                      <>
                        <button onClick={prevPhoto}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                          <ChevronLeft size={18} className="text-white" />
                        </button>
                        <button onClick={nextPhoto}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                          <ChevronRight size={18} className="text-white" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {selected.photos.map((_, idx) => (
                            <button key={idx} onClick={() => setPhotoIndex(idx)}
                              className="w-2 h-2 rounded-full transition-all"
                              style={{ backgroundColor: idx === photoIndex ? "white" : "rgba(255,255,255,0.4)" }} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center text-6xl">🚗</div>
                )}

                {/* Close */}
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-10"
                  style={{ backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <X size={16} className="text-white" />
                </button>

                {/* Status */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                    style={{ backgroundColor: `${statusColor[selected.status]}22`, color: statusColor[selected.status], border: `1px solid ${statusColor[selected.status]}44` }}>
                    {selected.status}
                  </span>
                </div>
              </div>

              {/* Photo thumbnail strip (when video shown) */}
              {selected.videoUrl && selected.photos.length > 0 && (
                <div className="flex gap-2 px-5 py-3 overflow-x-auto" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {selected.photos.map((p, idx) => (
                    <button key={idx} onClick={() => { /* open photo modal or scroll */ }}
                      className="flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all"
                      style={{ borderColor: idx === photoIndex ? "var(--color-red)" : "transparent" }}>
                      <img src={p} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Details */}
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>{selected.title}</h2>
                    <p className="text-sm" style={{ color: "var(--color-silver)" }}>{selected.year} · {selected.make} {selected.model}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: "var(--color-red)", fontFamily: "Rajdhani" }}>{formatPrice(selected.price)}</div>
                    {selected.featured && (
                      <span className="text-xs flex items-center justify-end gap-1 mt-1" style={{ color: "#D4A017" }}>
                        <Star size={10} fill="#D4A017" /> Featured listing
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Year", value: String(selected.year), icon: <Calendar size={14} /> },
                    { label: "Mileage", value: formatMileage(selected.mileage), icon: <Gauge size={14} /> },
                    { label: "Color", value: selected.color ?? "—", icon: <Palette size={14} /> },
                    { label: "Condition", value: selected.condition, icon: <Star size={14} /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="rounded-lg p-3" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                      <div className="flex items-center gap-1.5 mb-1 text-xs" style={{ color: "var(--color-silver)" }}>
                        {icon} {label}
                      </div>
                      <div className="font-semibold capitalize text-sm">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {selected.description && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide" style={{ color: "var(--color-silver)" }}>Description</h4>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-white)", opacity: 0.85 }}>{selected.description}</p>
                  </div>
                )}

                {/* Photo grid */}
                {selected.photos.length > 1 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: "var(--color-silver)" }}>Photos ({selected.photos.length})</h4>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {selected.photos.map((p, idx) => (
                        <div key={idx} className="aspect-video rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => setPhotoIndex(idx)}
                          style={{ border: idx === photoIndex ? "2px solid var(--color-red)" : "2px solid transparent" }}>
                          <img src={p} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                {(selected.contactPhone || selected.contactEmail) && (
                  <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: "var(--color-silver)" }}>Contact Us About This Vehicle</h4>
                    <div className="flex flex-wrap gap-3">
                      {selected.contactPhone && (
                        <a href={`tel:${selected.contactPhone}`}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "var(--color-red)", color: "#fff" }}>
                          <Phone size={15} /> Call {selected.contactPhone}
                        </a>
                      )}
                      {selected.contactEmail && (
                        <a href={`mailto:${selected.contactEmail}?subject=Interest in ${selected.title}`}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "var(--color-surface2)", color: "var(--color-white)", border: "1px solid var(--color-border)" }}>
                          <Mail size={15} /> Email Us
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}
