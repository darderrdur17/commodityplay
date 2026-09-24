"use client";

import { useEffect, useState } from "react";

export function useGoogleSignInAvailable(initial = false) {
  const [available, setAvailable] = useState(initial);

  useEffect(() => {
    if (initial) return;
    fetch("/api/auth/google-status")
      .then((response) => response.json())
      .then((payload: { available?: boolean } | null) => {
        setAvailable(Boolean(payload?.available));
      })
      .catch(() => setAvailable(false));
  }, [initial]);

  return available;
}
