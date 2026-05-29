import { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

type ServiceMode = "in_shop" | "home_service";

export default function BookScreen() {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [serviceMode, setServiceMode] = useState<ServiceMode>("in_shop");
  const [serviceName, setServiceName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const { data: vehicles, isLoading: vLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await api.vehicles.$get();
      if (!res.ok) return [];
      return ((await res.json()) as unknown) as any[];
    },
  });

  const { data: services, isLoading: sLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.services.$get();
      if (!res.ok) return [];
      return ((await res.json()) as unknown) as any[];
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await api.appointments.$post({
        json: {
          vehicleId,
          serviceId,
          serviceType: serviceMode,
          scheduledDate,
          address: serviceMode === "home_service" ? address : undefined,
          notes: notes || undefined,
        },
      });
      if (!res.ok) {
        const err = await res.json() as any;
        throw new Error(err?.message ?? "Booking failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      Alert.alert("Booked!", "Your appointment has been scheduled.", [
        { text: "OK", onPress: resetForm },
      ]);
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  function resetForm() {
    setStep(1); setVehicleId(""); setServiceId("");
    setScheduledDate(""); setAddress(""); setNotes(""); setServiceName("");
  }

  const fee = serviceMode === "home_service" ? "$35" : "$25";

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Book Appointment</Text>

      {/* Step indicator */}
      <View style={styles.steps}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepRow}>
            <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
            </View>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </View>
        ))}
      </View>
      <Text style={styles.stepLabel}>
        {step === 1 ? "Select Vehicle & Service" : step === 2 ? "Date & Service Type" : "Confirm Booking"}
      </Text>

      {/* STEP 1: Vehicle + Service */}
      {step === 1 && (
        <View>
          <Text style={styles.label}>Select Vehicle</Text>
          {vLoading ? (
            <ActivityIndicator color="#e02020" />
          ) : !vehicles || vehicles.length === 0 ? (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>No vehicles found. Add one in the Vehicles tab first.</Text>
            </View>
          ) : (
            vehicles.map((v: any) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.selectCard, vehicleId === String(v.id) && styles.selectCardActive]}
                onPress={() => setVehicleId(String(v.id))}
              >
                <Text style={[styles.selectCardTitle, vehicleId === String(v.id) && styles.selectCardTitleActive]}>
                  {v.year} {v.make} {v.model}
                </Text>
                {v.licensePlate && <Text style={styles.selectCardSub}>{v.licensePlate}</Text>}
              </TouchableOpacity>
            ))
          )}

          <Text style={[styles.label, { marginTop: 20 }]}>Select Service</Text>
          {sLoading ? (
            <ActivityIndicator color="#e02020" />
          ) : !services || services.length === 0 ? (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>No services available yet.</Text>
            </View>
          ) : (
            services.map((s: any) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.selectCard, serviceId === String(s.id) && styles.selectCardActive]}
                onPress={() => { setServiceId(String(s.id)); setServiceName(s.name); }}
              >
                <View style={styles.serviceRow}>
                  <Text style={[styles.selectCardTitle, serviceId === String(s.id) && styles.selectCardTitleActive]}>
                    {s.name}
                  </Text>
                  <Text style={styles.servicePrice}>${s.basePrice}</Text>
                </View>
                {s.description && <Text style={styles.selectCardSub}>{s.description}</Text>}
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity
            style={[styles.btn, (!vehicleId || !serviceId) && styles.btnDisabled]}
            onPress={() => setStep(2)}
            disabled={!vehicleId || !serviceId}
          >
            <Text style={styles.btnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: Date & Type */}
      {step === 2 && (
        <View>
          <Text style={styles.label}>Service Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeCard, serviceMode === "in_shop" && styles.typeCardActive]}
              onPress={() => setServiceMode("in_shop")}
            >
              <Text style={[styles.typeCardTitle, serviceMode === "in_shop" && styles.typeCardTitleActive]}>In-Shop</Text>
              <Text style={styles.typeCardFee}>$25 booking fee</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeCard, serviceMode === "home_service" && styles.typeCardActive]}
              onPress={() => setServiceMode("home_service")}
            >
              <Text style={[styles.typeCardTitle, serviceMode === "home_service" && styles.typeCardTitleActive]}>Home Service</Text>
              <Text style={styles.typeCardFee}>$35 booking fee</Text>
            </TouchableOpacity>
          </View>

          {serviceMode === "home_service" && (
            <>
              <Text style={styles.label}>Your Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Full address"
                placeholderTextColor="#555"
                value={address}
                onChangeText={setAddress}
              />
            </>
          )}

          <Text style={styles.label}>Preferred Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2025-08-15"
            placeholderTextColor="#555"
            value={scheduledDate}
            onChangeText={setScheduledDate}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            placeholder="Any details for the mechanic..."
            placeholderTextColor="#555"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(1)}>
              <Text style={styles.btnBackText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnHalf, (!scheduledDate || (serviceMode === "home_service" && !address)) && styles.btnDisabled]}
              onPress={() => setStep(3)}
              disabled={!scheduledDate || (serviceMode === "home_service" && !address)}
            >
              <Text style={styles.btnText}>Review →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 3: Confirm */}
      {step === 3 && (
        <View>
          <Text style={styles.label}>Confirm Your Booking</Text>
          <View style={styles.summaryCard}>
            {[
              ["Service", serviceName],
              ["Type", serviceMode === "in_shop" ? "In-Shop" : "Home Service"],
              ["Booking Fee", fee],
              ["Date", scheduledDate],
              ...(serviceMode === "home_service" ? [["Address", address]] : []),
              ...(notes ? [["Notes", notes]] : []),
            ].map(([k, v]) => (
              <View key={k} style={styles.summaryRow}>
                <Text style={styles.summaryKey}>{k}</Text>
                <Text style={styles.summaryVal}>{v}</Text>
              </View>
            ))}
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(2)}>
              <Text style={styles.btnBackText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnHalf, bookMutation.isPending && styles.btnDisabled]}
              onPress={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
            >
              <Text style={styles.btnText}>{bookMutation.isPending ? "Booking..." : "Confirm Booking"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 24, marginTop: 8 },
  steps: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  stepRow: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#1a1a1a",
    borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center",
  },
  stepDotActive: { backgroundColor: "#e02020", borderColor: "#e02020" },
  stepNum: { color: "#555", fontSize: 12, fontWeight: "700" },
  stepNumActive: { color: "#fff" },
  stepLine: { width: 36, height: 2, backgroundColor: "#222", marginHorizontal: 4 },
  stepLineActive: { backgroundColor: "#e02020" },
  stepLabel: { color: "#888", fontSize: 13, textAlign: "center", marginBottom: 24 },
  label: { color: "#c0c0c0", fontSize: 14, fontWeight: "600", marginBottom: 10 },
  hintBox: { backgroundColor: "#111", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#222", marginBottom: 12 },
  hintText: { color: "#666", fontSize: 13 },
  selectCard: {
    backgroundColor: "#111", borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: "#2a2a2a", marginBottom: 8,
  },
  selectCardActive: { borderColor: "#e02020", backgroundColor: "#1a0505" },
  selectCardTitle: { color: "#888", fontSize: 15, fontWeight: "600" },
  selectCardTitleActive: { color: "#fff" },
  selectCardSub: { color: "#555", fontSize: 12, marginTop: 3 },
  serviceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  servicePrice: { color: "#e02020", fontWeight: "700", fontSize: 14 },
  typeRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  typeCard: {
    flex: 1, backgroundColor: "#111", borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center",
  },
  typeCardActive: { borderColor: "#e02020", backgroundColor: "#1a0505" },
  typeCardTitle: { color: "#888", fontWeight: "700", fontSize: 14, marginBottom: 4 },
  typeCardTitleActive: { color: "#fff" },
  typeCardFee: { color: "#555", fontSize: 12 },
  input: {
    backgroundColor: "#111", borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a",
    color: "#fff", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 14,
  },
  btn: {
    backgroundColor: "#e02020", borderRadius: 10, paddingVertical: 14,
    alignItems: "center", marginTop: 20,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  btnBack: {
    flex: 1, backgroundColor: "#1a1a1a", borderRadius: 10, paddingVertical: 14,
    alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a",
  },
  btnBackText: { color: "#c0c0c0", fontWeight: "600", fontSize: 15 },
  btnHalf: { flex: 2, backgroundColor: "#e02020", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  summaryCard: {
    backgroundColor: "#111", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#222", marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
  },
  summaryKey: { color: "#666", fontSize: 14 },
  summaryVal: { color: "#fff", fontSize: 14, fontWeight: "600", maxWidth: "55%", textAlign: "right" },
});
