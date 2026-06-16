import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, Alert,
} from "react-native";
import { baseURL, getToken } from "../../../lib/auth";

export default function CustomerVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ make: "", model: "", year: "", licensePlate: "", vin: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const token = getToken();
      const res = await fetch(`${baseURL}/api/customer/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setVehicles(await res.json());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  async function addVehicle() {
    if (!form.make || !form.model || !form.year) {
      Alert.alert("Error", "Make, model, and year are required.");
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${baseURL}/api/customer/vehicles`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add vehicle");
      setShowAdd(false);
      setForm({ make: "", model: "", year: "", licensePlate: "", vin: "" });
      load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#e02020" />}
      >
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>My Vehicles</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#e02020" style={{ marginTop: 40 }} />
        ) : vehicles.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🚗</Text>
            <Text style={styles.emptyText}>No vehicles yet</Text>
            <Text style={styles.emptyHint}>Add your first vehicle to get started</Text>
          </View>
        ) : (
          vehicles.map((v) => (
            <View key={v.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardEmoji}>🚗</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{v.year} {v.make} {v.model}</Text>
                {v.licensePlate && <Text style={styles.cardSub}>Plate: {v.licensePlate}</Text>}
                {v.vin && <Text style={styles.cardSub}>VIN: {v.vin}</Text>}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Vehicle</Text>

            {[
              { key: "make", placeholder: "Make (e.g. Toyota)" },
              { key: "model", placeholder: "Model (e.g. Camry)" },
              { key: "year", placeholder: "Year (e.g. 2020)", keyboard: "numeric" },
              { key: "licensePlate", placeholder: "License Plate (optional)" },
              { key: "vin", placeholder: "VIN (optional)" },
            ].map(({ key, placeholder, keyboard }) => (
              <TextInput
                key={key}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#555"
                value={(form as any)[key]}
                onChangeText={(v) => setForm(f => ({ ...f, [key]: v }))}
                keyboardType={(keyboard as any) ?? "default"}
              />
            ))}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={addVehicle}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Add Vehicle"}</Text>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  addBtn: { backgroundColor: "#e02020", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyCard: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 40, alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  emptyHint: { color: "#555", fontSize: 13, marginTop: 6, textAlign: "center" },
  card: {
    backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 12,
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a",
  },
  cardIcon: { width: 48, height: 48, backgroundColor: "#2a2a2a", borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 14 },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardTitle: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cardSub: { color: "#555", fontSize: 13, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#111", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 20 },
  input: {
    width: "100%", height: 50, backgroundColor: "#1a1a1a", borderRadius: 10,
    borderWidth: 1, borderColor: "#2a2a2a", color: "#fff", paddingHorizontal: 16,
    fontSize: 15, marginBottom: 12,
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 50, backgroundColor: "#1a1a1a", borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2a2a2a" },
  cancelBtnText: { color: "#999", fontWeight: "600" },
  saveBtn: { flex: 1, height: 50, backgroundColor: "#e02020", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
});
