import { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function VehiclesScreen() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await api.vehicles.$get();
      if (!res.ok) return [];
      return ((await res.json()) as unknown) as any[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await api.vehicles.$post({
        json: {
          make,
          model,
          year: parseInt(year),
          vin: vin || undefined,
          licensePlate: licensePlate || undefined,
        },
      });
      if (!res.ok) throw new Error("Failed to add vehicle");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setModalVisible(false);
      setMake(""); setModel(""); setYear(""); setVin(""); setLicensePlate("");
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await (api.vehicles as any)[":id"].$delete({ param: { id } });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  function confirmDelete(id: number, label: string) {
    Alert.alert("Delete Vehicle", `Remove ${label}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(String(id)) },
    ]);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>My Vehicles</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#e02020" style={{ marginTop: 40 }} />
        ) : !vehicles || vehicles.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyText}>No vehicles yet</Text>
            <Text style={styles.emptyHint}>Add your first vehicle to get started</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyBtnText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((v: any) => (
            <View key={v.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle}>{v.year} {v.make} {v.model}</Text>
                {v.licensePlate && <Text style={styles.cardSub}>Plate: {v.licensePlate}</Text>}
                {v.vin && <Text style={styles.cardSub}>VIN: {v.vin}</Text>}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(v.id, `${v.year} ${v.make} ${v.model}`)}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Vehicle</Text>

            {[
              { label: "Make *", val: make, set: setMake, ph: "e.g. Toyota" },
              { label: "Model *", val: model, set: setModel, ph: "e.g. Camry" },
              { label: "Year *", val: year, set: setYear, ph: "e.g. 2020", keyboard: "numeric" as any },
              { label: "License Plate", val: licensePlate, set: setLicensePlate, ph: "e.g. ABC-1234" },
              { label: "VIN (optional)", val: vin, set: setVin, ph: "17-char VIN" },
            ].map(({ label, val, set, ph, keyboard }) => (
              <View key={label}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={ph}
                  placeholderTextColor="#555"
                  value={val}
                  onChangeText={set}
                  keyboardType={keyboard}
                />
              </View>
            ))}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!make || !model || !year) && styles.saveBtnDisabled]}
                onPress={() => addMutation.mutate()}
                disabled={!make || !model || !year || addMutation.isPending}
              >
                <Text style={styles.saveBtnText}>{addMutation.isPending ? "Saving..." : "Add Vehicle"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 8 },
  pageTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  addBtn: { backgroundColor: "#e02020", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 6 },
  emptyHint: { color: "#666", fontSize: 14, marginBottom: 24 },
  emptyBtn: { backgroundColor: "#e02020", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#111", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#222", marginBottom: 12,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  cardLeft: { flex: 1 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cardSub: { color: "#666", fontSize: 13, marginTop: 3 },
  deleteBtn: { color: "#e02020", fontSize: 18, paddingLeft: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#111", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: "#222",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 20 },
  fieldLabel: { color: "#888", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#1a1a1a", borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a",
    color: "#fff", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 14,
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, backgroundColor: "#1a1a1a", borderRadius: 10, paddingVertical: 14,
    alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a",
  },
  cancelBtnText: { color: "#888", fontWeight: "600" },
  saveBtn: { flex: 2, backgroundColor: "#e02020", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#fff", fontWeight: "700" },
});
