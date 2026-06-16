import { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { authClient, clearToken } from "../../../lib/auth";

export default function CustomerProfile() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const user = session?.user;

  async function saveProfile() {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await authClient.updateUser({ name });
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await authClient.signOut();
            await clearToken();
            router.replace("/sign-in");
          } catch {
            await clearToken();
            router.replace("/sign-in");
          }
        },
      },
    ]);
  }

  if (isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#e02020" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name ?? "Customer"}</Text>
        <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
      </View>

      {/* Profile Form */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile</Text>
          {!editing && (
            <TouchableOpacity onPress={() => { setName(user?.name ?? ""); setEditing(true); }}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor="#555"
            />
            <View style={styles.editBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={saveProfile}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{user?.name ?? "—"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{user?.email ?? "—"}</Text>
            </View>
          </>
        )}
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={styles.actionText}>Change Password</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.signOutBtn, loggingOut && styles.btnDisabled]}
        onPress={handleSignOut}
        disabled={loggingOut}
      >
        <Text style={styles.signOutText}>{loggingOut ? "Signing out..." : "Sign Out"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 60 },
  loading: { flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" },
  avatarSection: { alignItems: "center", paddingVertical: 32 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: "#e02020",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "700" },
  userName: { color: "#fff", fontSize: 22, fontWeight: "700" },
  userEmail: { color: "#555", fontSize: 14, marginTop: 4 },
  section: {
    backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  editBtn: { color: "#e02020", fontWeight: "600", fontSize: 14 },
  fieldRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  fieldLabel: { color: "#555", fontSize: 14 },
  fieldValue: { color: "#fff", fontSize: 14, fontWeight: "500" },
  input: {
    backgroundColor: "#111", borderRadius: 8, borderWidth: 1, borderColor: "#2a2a2a",
    color: "#fff", paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginVertical: 8,
  },
  editBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, height: 44, backgroundColor: "#111", borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2a2a2a" },
  cancelBtnText: { color: "#999", fontWeight: "600" },
  saveBtn: { flex: 1, height: 44, backgroundColor: "#e02020", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  actionText: { color: "#fff", fontSize: 15 },
  actionArrow: { color: "#555", fontSize: 20 },
  signOutBtn: {
    backgroundColor: "#2a1a1a", borderRadius: 12, padding: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#3a1a1a", marginTop: 8,
  },
  signOutText: { color: "#f87171", fontWeight: "700", fontSize: 16 },
});
