import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { authClient, captureToken, signInWithGoogle } from "../lib/auth";
import { AnimatedLogo } from "../components/AnimatedLogo";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name || !email || !password || !confirm) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.signUp.email(
        { name, email, password },
        { onResponse: (ctx: { response: Response }) => captureToken(ctx.response) }
      );
      if (res.error) {
        Alert.alert("Sign Up Failed", res.error.message ?? "Could not create account.");
      } else {
        Alert.alert("Account Created", "Your account is waiting for administrator approval.", [
          { text: "OK", onPress: () => router.replace("/(tabs)/") },
        ]);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true);
    try {
      await signInWithGoogle();
      Alert.alert("Account Created", "Your account is waiting for administrator approval.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/") },
      ]);
    } catch (e: any) {
      Alert.alert("Google Sign Up Failed", e.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AnimatedLogo size={130} />

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.sub}>Join LIBrepair — your auto service partner</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 chars)"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#555"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Creating Account..." : "Create Account"}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => router.push("/sign-in-phone")}
        >
          <Text style={styles.socialBtnText}>📱  Sign Up with Phone</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignUp} disabled={loading}>
          <Text style={styles.socialBtnText}>Sign Up with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/sign-in")} style={styles.link}>
          <Text style={styles.linkText}>
            Already have an account?{" "}
            <Text style={styles.linkAccent}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  container: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: "#fff", fontSize: 26, fontWeight: "700", marginBottom: 6, marginTop: 8 },
  sub: { color: "#666", fontSize: 14, marginBottom: 28, textAlign: "center" },
  input: {
    width: "100%", height: 50, backgroundColor: "#1a1a1a", borderRadius: 10,
    borderWidth: 1, borderColor: "#2a2a2a", color: "#fff", paddingHorizontal: 16,
    fontSize: 15, marginBottom: 14,
  },
  btn: {
    width: "100%", height: 50, backgroundColor: "#e02020", borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginTop: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", width: "100%", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2a2a2a" },
  dividerText: { color: "#555", marginHorizontal: 12, fontSize: 13 },
  socialBtn: {
    width: "100%", height: 50, backgroundColor: "#1a1a1a", borderRadius: 10,
    borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  socialBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  link: { marginTop: 20 },
  linkText: { color: "#666", fontSize: 14 },
  linkAccent: { color: "#e02020", fontWeight: "600" },
});
