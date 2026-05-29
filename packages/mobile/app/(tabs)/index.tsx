import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "../../lib/auth";
import { api } from "../../lib/api";

export default function HomeScreen() {
  const router = useRouter();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await authClient.getSession();
      return res.data;
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await api.appointments.$get();
      if (!res.ok) return [];
      return ((await res.json()) as unknown) as any[];
    },
  });

  const upcoming = appointments?.filter(
    (a: any) => a.status === "pending" || a.status === "confirmed"
  ) ?? [];

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
      </View>

      {/* Greeting */}
      <View style={styles.greetBox}>
        <Text style={styles.greetSub}>Good to see you,</Text>
        <Text style={styles.greetName}>Hey, {firstName} 👋</Text>
      </View>

      {/* Quick actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionPrimary} onPress={() => router.push("/(tabs)/book")}>
          <Text style={styles.actionPrimaryText}>+ Book Appointment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionSecondary} onPress={() => router.push("/(tabs)/vehicles")}>
          <Text style={styles.actionSecondaryText}>My Vehicles</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming */}
      <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
      {upcoming.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No upcoming appointments</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/book")}>
            <Text style={styles.emptyLink}>Book one now →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        upcoming.slice(0, 3).map((appt: any) => (
          <View key={appt.id} style={styles.apptCard}>
            <View style={styles.apptTop}>
              <Text style={styles.apptService}>{appt.service?.name ?? "Service"}</Text>
              <View style={[styles.badge, { backgroundColor: appt.status === "confirmed" ? "#1a4a1a" : "#2a2a0a" }]}>
                <Text style={[styles.badgeText, { color: appt.status === "confirmed" ? "#4caf50" : "#ffc107" }]}>
                  {appt.status}
                </Text>
              </View>
            </View>
            <Text style={styles.apptDate}>
              {appt.scheduledAt
                ? new Date(appt.scheduledAt).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                  })
                : "Date TBD"}
            </Text>
            {appt.vehicle && (
              <Text style={styles.apptVehicle}>
                {appt.vehicle.year} {appt.vehicle.make} {appt.vehicle.model}
              </Text>
            )}
          </View>
        ))
      )}

      {/* Services chips */}
      <Text style={styles.sectionTitle}>Quick Book</Text>
      <View style={styles.servicesRow}>
        {["Oil Change", "Brake Repair", "Tire Service", "Diagnostics"].map((s) => (
          <TouchableOpacity key={s} style={styles.serviceChip} onPress={() => router.push("/(tabs)/book")}>
            <Text style={styles.serviceChipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24, marginTop: 8 },
  logo: { width: 160, height: 50 },
  greetBox: { marginBottom: 24 },
  greetSub: { color: "#666", fontSize: 14 },
  greetName: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 2 },
  actions: { flexDirection: "row", gap: 12, marginBottom: 32 },
  actionPrimary: {
    flex: 1, backgroundColor: "#e02020", borderRadius: 10,
    paddingVertical: 14, alignItems: "center",
  },
  actionPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  actionSecondary: {
    flex: 1, backgroundColor: "#1a1a1a", borderRadius: 10,
    paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a",
  },
  actionSecondaryText: { color: "#c0c0c0", fontWeight: "600", fontSize: 14 },
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 12 },
  emptyCard: {
    backgroundColor: "#111", borderRadius: 12, padding: 20,
    alignItems: "center", borderWidth: 1, borderColor: "#222", marginBottom: 24,
  },
  emptyText: { color: "#666", marginBottom: 8 },
  emptyLink: { color: "#e02020", fontWeight: "600" },
  apptCard: {
    backgroundColor: "#111", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#222", marginBottom: 12,
  },
  apptTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  apptService: { color: "#fff", fontWeight: "700", fontSize: 15, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  apptDate: { color: "#888", fontSize: 13, marginBottom: 4 },
  apptVehicle: { color: "#c0c0c0", fontSize: 13 },
  servicesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceChip: {
    backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  serviceChipText: { color: "#c0c0c0", fontSize: 13, fontWeight: "600" },
});
