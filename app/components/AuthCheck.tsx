"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyToken } from "../lib/jwt";
import LoadingSpinner from "./LoadingSpinner";

interface AuthCheckProps {
  children: React.ReactNode;
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const sessionToken = localStorage.getItem("sessionToken");
        if (!sessionToken) {
          router.push("/login");
          return;
        }

        await verifyToken(sessionToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Authentication failed:", error);
        localStorage.removeItem("sessionToken");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
