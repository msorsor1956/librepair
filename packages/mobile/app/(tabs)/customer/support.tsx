import { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Linking,
} from "react-native";
import { baseURL, getToken } from "../../../lib/auth";

const FAQ = [
  { q: "How do I book a service?", a: "Tap 'Book a Service' from the overview screen or the Appointments tab. Select your vehicle, service type, and preferred time." },
  { q: "Can I cancel an appointment?", a: "Yes — contact us at least 24 hours before your appointment. Call or use the support form below." },
  { q: "How long does a typical oil change take?", a: "Usually 30-45 minutes. We'll notify you when your vehicle is ready." },
  { q: "Do you offer a warranty?", a: "Yes — all services come with a 90-day or 3,000-mile warranty, whichever comes first." },
  { q: "How do I add a vehicle?", a: "Go to the Vehicles tab and tap '+ Add'. Enter your vehicle's make, model, and year." },
];

export default function CustomerSupport() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    if (!subject || !message) {
      Alert.alert("Error", "Please fill in subject and message.");
      return;
    }
    setSending(true);
    try {
      const token = getToken();
      const res = await fetch(`${baseURL}/api/customer/support`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      if (!res.ok) throw new Error("Failed to send");
      Alert.alert("Message Sent", "We'll get back to you within 24 hours.");
      setSubject("");
      setMessage("");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Quick Contact</Text>
      <View style={styles.contactRow}>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL("tel:+15550001234")}
        >
          <Text style={styles.contactEmoji}>📞</Text>
          <Text style={styles.contactLabel}>Call Us</Text>
          <Text style={styles.contactSub}>(555) 000-1234</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL("mailto:support@librepair.com")}
        >
          <Text style={styles.contactEmoji}>✉️</Text>
          <Text style={styles.contactLabel}>Email Us</Text>
          <Text style={styles.contactSub}>support@librepair.com</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>FAQ</Text>
      {FAQ.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.faqCard}
          onPress={() => setExpanded(expanded === i ? null : i)}
        >
          <View style={styles.faqTop}>
            <Text style={styles.faqQ}>{item.q}</Text>
            <Text style={styles.faqIcon}>{expanded === i ? "−" : "+"}</Text>
          </View>
          {expanded === i && <Text style={styles.faqA}>{item.a}</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Send a Message</Text>
      <TextInput
        style={styles.input}
        placeholder="Subject"
        placeholderTextColor="#555"
        value={subject}
        onChangeText={setSubject}
      />
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Describe your issue or question..."
        placeholderTextColor="#555"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={[styles.sendBtn, sending && styles.btnDisabled]}
        onPress={sendMessage}
        disabled={sending}
      >
        <Text style={styles.sendBtnText}>{sending ? "Sending..." : "Send Message"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 14, marginTop: 8 },
  contactRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  contactCard: {
    flex: 1, backgroundColor: "#1a1a1a", borderRadius: 12, padding: 20,
    alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a",
  },
  contactEmoji: { fontSize: 32, marginBottom: 8 },
  contactLabel: { color: "#fff", fontWeight: "600", fontSize: 15 },
  contactSub: { color: "#555", fontSize: 12, marginTop: 4, textAlign: "center" },
  faqCard: {
    backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  faqTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQ: { color: "#fff", fontWeight: "600", fontSize: 14, flex: 1, marginRight: 8 },
  faqIcon: { color: "#e02020", fontSize: 20, fontWeight: "700" },
  faqA: { color: "#666", fontSize: 13, marginTop: 12, lineHeight: 20 },
  input: {
    backgroundColor: "#1a1a1a", borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a",
    color: "#fff", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12,
  },
  textarea: { height: 120, paddingTop: 14 },
  sendBtn: {
    backgroundColor: "#e02020", borderRadius: 10, padding: 16,
    alignItems: "center", marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
