import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, ActivityIndicator } from "react-native";
import { authClient, getTokenAsync } from "../lib/auth";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getTokenAsync();
      const inAuthGroup = segments[0] === "(tabs)";

      if (!token) {
        // No token — send to sign-in
        if (inAuthGroup) router.replace("/sign-in");
      } else {
        // Has token — check session
        try {
          const { data } = await authClient.getSession();
          if (!data?.session) {
            if (inAuthGroup) router.replace("/sign-in");
          } else {
            if (!inAuthGroup) router.replace("/(tabs)/");
          }
        } catch {
          if (inAuthGroup) router.replace("/sign-in");
        }
      }
      setChecking(false);
    })();
  }, [segments]);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#e02020" size="large" />
      </View>
    );
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
