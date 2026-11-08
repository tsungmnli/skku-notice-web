"use client";

import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { theme } from "@/theme";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { BottomTabs } from "@/components/common/BottomTabs";
import { AuthProvider } from "@/components/common/AuthProvider";
import { ReadsSync } from "@/components/common/ReadsSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Notifications position="top-center" />
        <AuthProvider>
          <ReadsSync />
          <Header />
          <main>{children}</main>
          <Footer />
          <BottomTabs />
        </AuthProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
