import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { authClient, baseURL, getToken } from "../../../lib/auth";

export default function CustomerOverview() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const [apptRes, vehRes] = await Promise.all([
        fetch(`${baseURL}/api/customer/appointments`, { headers }),
        fetch(`${baseURL}/api/customer/vehicles`, { headers }),
      ]);
      if (apptRes.ok) setAppointments(await apptRes.json());
      if (vehRes.ok) setVehicles(await vehRes.json());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const upcoming = appointments.filter(a => a.status !== "completed" && a.status !== "cancelled");
  const user = session?.user;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#e02020" />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Hello, {user?.name?.split(" ")[0] ?? "there"} 👋
        </Text>
        <Text style={styles.greetingSub}>Your LIBrepair dashboard</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#e02020" style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{vehicles.length}</Text>
              <Text style={styles.statLabel}>Vehicles</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{upcoming.length}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{appointments.filter(a => a.status === "completed").length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          {/* Book CTA */}
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push("/book")}
          >
            <Text style={styles.bookBtnText}>+ Book a Service</Text>
          </TouchableOpacity>

          {/* Upcoming Appointments */}
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          {upcoming.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming appointments</Text>
              <Text style={styles.emptyHint}>Tap "Book a Service" to schedule one</Text>
            </View>
          ) : (
            upcoming.slice(0, 3).map((appt) => (
              <View key={appt.id} style={styles.apptCard}>
                <View style={styles.apptLeft}>
                  <Text style={styles.apptService}>{appt.serviceType ?? "Service"}</Text>
                  <Text style={styles.apptDate}>{appt.date ? new Date(appt.date).toLocaleDateString() : "TBD"}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: appt.status === "confirmed" ? "#1a3a1a" : "#2a2a1a" }]}>
                  <Text style={[styles.statusText, { color: appt.status === "confirmed" ? "#4ade80" : "#fbbf24" }]}>
                    {appt.status ?? "pending"}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* Vehicles */}
          <Text style={styles.sectionTitle}>My Vehicles</Text>
          {vehicles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No vehicles added yet</Text>
            </View>
          ) : (
            vehicles.slice(0, 3).map((v) => (
              <View key={v.id} style={styles.vehicleCard}>
                <Text style={styles.vehicleName}>{v.year} {v.make} {v.model}</Text>
                <Text style={styles.vehiclePlate}>{v.licensePlate ?? ""}</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { marginBottom: 24 },
  greetingText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  greetingSub: { color: "#555", fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: "#1a1a1a", borderRadius: 12,
    padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a",
  },
  statNum: { color: "#e02020", fontSize: 28, fontWeight: "700" },
  statLabel: { color: "#666", fontSize: 12, marginTop: 4 },
  bookBtn: {
    backgroundColor: "#e02020", borderRadius: 12, padding: 16,
    alignItems: "center", marginBottom: 28,
  },
  bookBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  emptyCard: {
    backgroundColor: "#1a1a1a", borderRadius: 12, padding: 24,
    alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a", marginBottom: 24,
  },
  emptyText: { color: "#555", fontSize: 15 },
  emptyHint: { color: "#444", fontSize: 13, marginTop: 6 },
  apptCard: {
    backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  apptLeft: {},
  apptService: { color: "#fff", fontWeight: "600", fontSize: 15 },
  apptDate: { color: "#666", fontSize: 13, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  vehicleCard: {
    backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  vehicleName: { color: "#fff", fontWeight: "600", fontSize: 15 },
  vehiclePlate: { color: "#555", fontSize: 13, marginTop: 2 },
});
