import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { authClient, getTokenAsync } from "../lib/auth";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [checking, setChecking] = useState(true);
  const { data: applicationSession, isPending } = authClient.useSession();

  useEffect(() => {
    (async () => {
      const token = await getTokenAsync();
      const pathSegments = segments as readonly string[];
      // inAuthGroup = user is in any (tabs) group (main app area)
      const inTabsGroup = pathSegments[0] === "(tabs)";

      if (!token) {
        // No token — send to sign-in if in protected area
        if (inTabsGroup) router.replace("/sign-in");
      } else {
        // Has token — verify session
        try {
          const { data } = await authClient.getSession();
          if (!data?.session) {
            if (inTabsGroup) router.replace("/sign-in");
          } else {
            // Authenticated: redirect to correct area based on role
            const role = (data.user as any)?.role;
            if (!inTabsGroup) {
              // On sign-in/sign-up screens — redirect to appropriate dashboard
              if (role === "admin" || role === "mechanic") {
                router.replace("/(tabs)/");
              } else {
                router.replace("/(tabs)/customer/");
              }
            }
          }
        } catch {
          if (inTabsGroup) router.replace("/sign-in");
        }
      }
      setChecking(false);
    })();
  }, [segments, router]);

  if (checking || isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#e02020" size="large" />
      </View>
    );
  }

  const applicationUser = applicationSession?.user;
  if (applicationUser && applicationUser.role !== "admin" && applicationUser.approvalStatus !== "approved") {
    const rejected = applicationUser.approvalStatus === "rejected";
    return <View style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", padding: 28 }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 12 }}>{rejected ? "Account request rejected" : "Approval pending"}</Text>
      <Text style={{ color: "#888", textAlign: "center", lineHeight: 21 }}>{rejected ? (applicationUser.approvalNotes || "Contact LIBrepair support if you believe this is an error.") : "An administrator must approve your account before you can access protected features."}</Text>
      <TouchableOpacity onPress={() => void authClient.signOut()} style={{ marginTop: 24, backgroundColor: "#e02020", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Sign out</Text>
      </TouchableOpacity>
    </View>;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
