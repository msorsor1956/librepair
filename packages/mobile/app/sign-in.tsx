import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { authClient, setToken, captureToken } from "../lib/auth";
import { AnimatedLogo } from "../components/AnimatedLogo";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.signIn.email(
        { email, password },
        {
          onResponse: (ctx) => captureToken(ctx.response),
        }
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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AnimatedLogo size={200} />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.sub}>Sign in to your LIBrepair account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
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
  sub: { color: "#888", fontSize: 14, marginBottom: 32, textAlign: "center" },
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
  link: { marginTop: 24 },
  linkText: { color: "#888", fontSize: 14 },
  linkAccent: { color: "#e02020", fontWeight: "600" },
});
