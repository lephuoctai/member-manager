import React from "react";
import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";
import { Box, Spinner, Text } from "zmp-ui";

import { useAuth } from "@/hooks/useAuth";
import HomePage from "@/pages/index";
import RegisterPage from "@/pages/register";
import SettingsPage from "@/pages/settings";
import MembersPage from "@/pages/members";
import MemberDetailPage from "@/pages/member-detail";

const AppContent = () => {
  const { isLoading, isRegistered } = useAuth();

  if (isLoading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black gap-4">
        <Spinner visible />
        <Text className="text-gray-400 text-sm">Đang tải...</Text>
      </Box>
    );
  }

  return (
    <ZMPRouter>
      <AnimationRoutes>
        {isRegistered ? (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/member-detail" element={<MemberDetailPage />} />
          </>
        ) : (
          <Route path="*" element={<RegisterPage />} />
        )}
      </AnimationRoutes>
    </ZMPRouter>
  );
};

const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>
        <AppContent />
      </SnackbarProvider>
    </App>
  );
};

export default Layout;

