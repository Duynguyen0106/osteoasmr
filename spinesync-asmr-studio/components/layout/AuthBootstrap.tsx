"use client";

import { useEffect } from "react";
import { ensureStudioSession } from "@/lib/api-client";

export function AuthBootstrap() {
  useEffect(() => {
    void ensureStudioSession();
  }, []);
  return null;
}
