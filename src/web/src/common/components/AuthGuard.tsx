import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "../stores/auth.store";
import LoadingScreen from "./LoadingScreen";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore(useShallow((s) => ({ isAuthenticated: s.isAuthenticated, loading: s.loading })));

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore(useShallow((s) => ({ isAuthenticated: s.isAuthenticated, loading: s.loading })));

  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}
