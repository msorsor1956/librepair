import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { authClient } from "../lib/auth";
import { AnimatedLogo } from "../components/AnimatedLogo";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      });
      setSent(true);
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
        <AnimatedLogo size={130} />

        {!sent ? (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.sub}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              <Text style={styles.btnText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.sub}>
              We sent a password reset link to{"\n"}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <View style={styles.successIcon}>
              <Text style={styles.successEmoji}>✉️</Text>
            </View>

            <Text style={styles.hint}>
              Check your spam folder if you don't see it within a few minutes.
            </Text>
          </>
        )}

        <TouchableOpacity onPress={() => router.push("/sign-in")} style={styles.link}>
          <Text style={styles.linkText}>← Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  container: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: "#fff", fontSize: 26, fontWeight: "700", marginBottom: 6, marginTop: 8, textAlign: "center" },
  sub: { color: "#666", fontSize: 14, marginBottom: 28, textAlign: "center", lineHeight: 22 },
  emailHighlight: { color: "#e02020", fontWeight: "600" },
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
  successIcon: { marginVertical: 24, alignItems: "center" },
  successEmoji: { fontSize: 64 },
  hint: { color: "#555", fontSize: 13, textAlign: "center", marginTop: 8 },
  link: { marginTop: 32 },
  linkText: { color: "#666", fontSize: 14, textAlign: "center" },
});
