import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { authClient, captureToken, signInWithGoogle } from "../lib/auth";
import { AnimatedLogo } from "../components/AnimatedLogo";

type Method = "email" | "phone";

export default function SignIn() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleEmailSignIn() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.signIn.email(
        { email, password },
        { onResponse: (ctx: { response: Response }) => captureToken(ctx.response) }
      );
      if (res.error) {
        Alert.alert("Sign In Failed", res.error.message ?? "Invalid credentials.");
      } else {
        router.replace("/(tabs)/");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/(tabs)/");
    } catch (e: any) {
      Alert.alert("Google Sign In Failed", e.message ?? "Please try again.");
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
        <AnimatedLogo size={160} />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.sub}>Sign in to your LIBrepair account</Text>

        {/* Method Tabs */}
        <View style={styles.tabs}>
          {(["email", "phone"] as Method[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.tab, method === m && styles.tabActive]}
              onPress={() => m === "phone" ? router.push("/sign-in-phone") : setMethod(m)}
            >
              <Text style={[styles.tabText, method === m && styles.tabTextActive]}>
                {m === "email" ? "Email" : "Phone"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Email Form */}
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
          placeholder="Password"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={() => router.push("/forgot-password")} style={styles.forgotWrap}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleEmailSignIn}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
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
          <Text style={styles.socialBtnText}>📱  Continue with Phone</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignIn} disabled={loading}>
          <Text style={styles.socialBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/sign-up")} style={styles.link}>
          <Text style={styles.linkText}>
            Don't have an account?{" "}
            <Text style={styles.linkAccent}>Sign Up</Text>
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
  tabs: { flexDirection: "row", backgroundColor: "#1a1a1a", borderRadius: 10, padding: 4, marginBottom: 24, width: "100%" },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#e02020" },
  tabText: { color: "#666", fontWeight: "600", fontSize: 14 },
  tabTextActive: { color: "#fff" },
  input: {
    width: "100%", height: 50, backgroundColor: "#1a1a1a", borderRadius: 10,
    borderWidth: 1, borderColor: "#2a2a2a", color: "#fff", paddingHorizontal: 16,
    fontSize: 15, marginBottom: 14,
  },
  forgotWrap: { alignSelf: "flex-end", marginBottom: 8, marginTop: -6 },
  forgotText: { color: "#e02020", fontSize: 13 },
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
