"use client";

import { useEffect, useState } from "react";

export function useGoogleSignInAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((response) => response.json())
      .then((providers: Record<string, unknown> | null) => {
        setAvailable(Boolean(providers?.google));
      })
      .catch(() => setAvailable(false));
  }, []);

  return available;
}
