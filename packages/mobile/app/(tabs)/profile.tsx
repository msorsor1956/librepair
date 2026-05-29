import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Image, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient, clearToken } from "../../lib/auth";
import { api } from "../../lib/api";

export default function ProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await authClient.getSession();
      return res.data;
    },
  });

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
    }
  }, [session]);

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          await authClient.signOut();
          await clearToken();
          qc.clear();
          router.replace("/sign-in");
        },
      },
    ]);
  }

  async function handleSave() {
    try {
      await authClient.updateUser({ name });
      qc.invalidateQueries({ queryKey: ["session"] });
      setEditing(false);
      Alert.alert("Saved", "Profile updated.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to update profile.");
    }
  }

  const user = session?.user;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Profile</Text>

      {isLoading ? (
        <ActivityIndicator color="#e02020" style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <Text style={styles.userName}>{user?.name ?? "User"}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
          </View>

          {/* Fields */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Info</Text>
              {!editing ? (
                <TouchableOpacity onPress={() => setEditing(true)}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputReadonly]}
              value={name}
              onChangeText={setName}
              editable={editing}
              placeholderTextColor="#555"
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputReadonly]}
              value={user?.email ?? ""}
              editable={false}
            />

            {editing && (
              <View style={styles.editBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setName(user?.name ?? ""); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Account info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Member Since</Text>
              <Text style={styles.infoVal}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "—"}
              </Text>
            </View>
          </View>

          {/* Sign out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 60 },
  pageTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 24, marginTop: 8 },
  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#e02020", alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  userName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  userEmail: { color: "#666", fontSize: 14, marginTop: 4 },
  section: {
    backgroundColor: "#111", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#222", marginBottom: 16,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  editLink: { color: "#e02020", fontSize: 14, fontWeight: "600" },
  fieldLabel: { color: "#666", fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#1a1a1a", borderRadius: 8, borderWidth: 1, borderColor: "#2a2a2a",
    color: "#fff", paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, marginBottom: 14,
  },
  inputReadonly: { color: "#888", borderColor: "#1a1a1a" },
  editBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, backgroundColor: "#1a1a1a", borderRadius: 8, paddingVertical: 12,
    alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a",
  },
  cancelBtnText: { color: "#888", fontWeight: "600" },
  saveBtn: { flex: 2, backgroundColor: "#e02020", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  infoKey: { color: "#666", fontSize: 14 },
  infoVal: { color: "#c0c0c0", fontSize: 14, fontWeight: "600" },
  signOutBtn: {
    backgroundColor: "#1a0a0a", borderRadius: 12, paddingVertical: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#3a1a1a", marginTop: 8,
  },
  signOutText: { color: "#e02020", fontWeight: "700", fontSize: 16 },
});
