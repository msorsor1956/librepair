import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { baseURL, captureToken } from "../lib/auth";
import { AnimatedLogo } from "../components/AnimatedLogo";

type Step = "phone" | "otp";

export default function SignInPhone() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOTP() {
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) {
      Alert.alert("Error", "Enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/api/phone-auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+1${clean}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send OTP");
      setStep("otp");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    if (otp.length !== 6) {
      Alert.alert("Error", "Enter the 6-digit code.");
      return;
    }
    const clean = phone.replace(/\D/g, "");
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/api/phone-auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+1${clean}`, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      if (data.token) {
        const { setToken } = await import("../lib/auth");
        await setToken(data.token);
      }
      router.replace("/(tabs)/");
    } catch (e: any) {
      Alert.alert("Error", e.message);
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
        <AnimatedLogo size={140} />

        <Text style={styles.title}>
          {step === "phone" ? "Sign In with Phone" : "Enter Verification Code"}
        </Text>
        <Text style={styles.sub}>
          {step === "phone"
            ? "We'll send a one-time code to your phone"
            : `Code sent to +1${phone.replace(/\D/g, "")}`}
        </Text>

        {step === "phone" ? (
          <>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇺🇸 +1</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="(555) 000-0000"
                placeholderTextColor="#555"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={14}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={sendOTP}
              disabled={loading}
            >
              <Text style={styles.btnText}>{loading ? "Sending..." : "Send Code"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="000000"
              placeholderTextColor="#555"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={verifyOTP}
              disabled={loading}
            >
              <Text style={styles.btnText}>{loading ? "Verifying..." : "Verify & Sign In"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep("phone"); setOtp(""); }} style={styles.link}>
              <Text style={styles.linkText}>Change number? <Text style={styles.linkAccent}>Go back</Text></Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={sendOTP} style={styles.link}>
              <Text style={styles.linkText}>Didn't get the code? <Text style={styles.linkAccent}>Resend</Text></Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.push("/sign-in")} style={[styles.link, { marginTop: 24 }]}>
          <Text style={styles.linkText}>← Back to Email Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  container: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 6, marginTop: 8, textAlign: "center" },
  sub: { color: "#666", fontSize: 14, marginBottom: 28, textAlign: "center" },
  phoneRow: { flexDirection: "row", width: "100%", marginBottom: 14 },
  countryCode: {
    height: 50, backgroundColor: "#1a1a1a", borderRadius: 10, borderWidth: 1,
    borderColor: "#2a2a2a", paddingHorizontal: 14, alignItems: "center", justifyContent: "center", marginRight: 8,
  },
  countryCodeText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  phoneInput: {
    flex: 1, height: 50, backgroundColor: "#1a1a1a", borderRadius: 10,
    borderWidth: 1, borderColor: "#2a2a2a", color: "#fff", paddingHorizontal: 16, fontSize: 15,
  },
  input: {
    width: "100%", height: 50, backgroundColor: "#1a1a1a", borderRadius: 10,
    borderWidth: 1, borderColor: "#2a2a2a", color: "#fff", paddingHorizontal: 16,
    fontSize: 15, marginBottom: 14,
  },
  otpInput: { textAlign: "center", fontSize: 28, fontWeight: "700", letterSpacing: 10 },
  btn: {
    width: "100%", height: 50, backgroundColor: "#e02020", borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginTop: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { marginTop: 16 },
  linkText: { color: "#666", fontSize: 14, textAlign: "center" },
  linkAccent: { color: "#e02020", fontWeight: "600" },
});
