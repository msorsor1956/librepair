import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { baseURL, getToken } from "../../../lib/auth";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#2a2a1a", text: "#fbbf24" },
  confirmed: { bg: "#1a2a1a", text: "#4ade80" },
  "in-progress": { bg: "#1a1a2a", text: "#60a5fa" },
  completed: { bg: "#1a2a1a", text: "#4ade80" },
  cancelled: { bg: "#2a1a1a", text: "#f87171" },
};

export default function CustomerAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  async function load() {
    try {
      const token = getToken();
      const res = await fetch(`${baseURL}/api/customer/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAppointments(await res.json());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = appointments.filter(a => {
    if (filter === "upcoming") return a.status !== "completed" && a.status !== "cancelled";
    if (filter === "completed") return a.status === "completed";
    return true;
  });

  return (
    <View style={styles.root}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["all", "upcoming", "completed"] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#e02020" />}
      >
        {loading ? (
          <ActivityIndicator color="#e02020" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>No appointments</Text>
            <TouchableOpacity style={styles.bookBtn} onPress={() => router.push("/book")}>
              <Text style={styles.bookBtnText}>Book a Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((appt) => {
            const colors = STATUS_COLORS[appt.status] ?? STATUS_COLORS.pending;
            return (
              <View key={appt.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{appt.serviceType ?? "Service"}</Text>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>
                      {appt.status ?? "pending"}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  {appt.date && <Text style={styles.metaText}>📅 {new Date(appt.date).toLocaleDateString()}</Text>}
                  {appt.vehicle && <Text style={styles.metaText}>🚗 {appt.vehicle.year} {appt.vehicle.make} {appt.vehicle.model}</Text>}
                  {appt.mechanic && <Text style={styles.metaText}>🔧 {appt.mechanic.name}</Text>}
                </View>
                {appt.notes && <Text style={styles.notes}>{appt.notes}</Text>}
              </View>
            );
          })
        )}

        {!loading && (
          <TouchableOpacity style={styles.newApptBtn} onPress={() => router.push("/book")}>
            <Text style={styles.newApptBtnText}>+ Book New Service</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  filterRow: {
    flexDirection: "row", backgroundColor: "#111", padding: 8,
    borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
  },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  filterTabActive: { backgroundColor: "#1a1a1a" },
  filterTabText: { color: "#555", fontWeight: "600", fontSize: 13 },
  filterTabTextActive: { color: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  emptyCard: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 40, alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a", marginTop: 20 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#999", fontSize: 16 },
  bookBtn: { marginTop: 16, backgroundColor: "#e02020", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  bookBtnText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardService: { color: "#fff", fontWeight: "700", fontSize: 16, flex: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  cardMeta: { gap: 4 },
  metaText: { color: "#666", fontSize: 13 },
  notes: { marginTop: 10, color: "#555", fontSize: 13, fontStyle: "italic" },
  newApptBtn: {
    backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a", marginTop: 8,
    borderStyle: "dashed",
  },
  newApptBtnText: { color: "#555", fontWeight: "600" },
});
