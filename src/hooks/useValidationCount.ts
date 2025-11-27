"use client";

import { useEffect, useState } from "react";

export function useValidationCount(userRole: string | undefined) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch for gerente role
    if (userRole !== "gerente") {
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ambientes", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          // Count environments with status aguardando_validacao
          const pendingCount = data.filter(
            (amb: { status?: string }) =>
              amb.status === "aguardando_validacao"
          ).length;
          setCount(pendingCount);
        }
      } catch (error) {
        console.error("Erro ao buscar contagem de validações:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchCount();

    // Fetch every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [userRole]);

  return { count, loading };
}
