"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, RefreshCw, ArrowRight } from "lucide-react";
import type { Ambiente } from "@/src/app/medicoes/types";
import type { Obra } from "@/src/app/obras/types";
import { useCurrentUser } from "@/src/app/providers/UserProvider";
import { ACTIVE_OBRA_KEY } from "@/src/lib/constants";
import { parseJsonOrThrow } from "@/src/lib/http";

export default function CalhasPage() {
  const { user } = useCurrentUser();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(ACTIVE_OBRA_KEY);
      if (stored) setObraId(stored);
    }
  }, []);

  useEffect(() => {
    const fetchObras = async () => {
      try {
        const res = await fetch("/api/obras", { credentials: "include" });
        const data = await parseJsonOrThrow<Obra[]>(res);
        setObras(data);
        if (!obraId && data.length > 0) {
          setObraId(data[0]._id);
        }
      } catch (err) {
        console.error("Erro ao carregar obras:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar obras.");
      }
    };
    fetchObras();
  }, [obraId]);

  useEffect(() => {
    if (!obraId) return;
    const fetchAmbientes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ambientes?obraId=${obraId}`, {
          credentials: "include",
        });
        const data = await parseJsonOrThrow<Ambiente[]>(res);
        setAmbientes(data);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(ACTIVE_OBRA_KEY, obraId);
        }
      } catch (err) {
        console.error("Erro ao carregar ambientes:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar ambientes.");
      } finally {
        setLoading(false);
      }
    };
    fetchAmbientes();
  }, [obraId]);

  const summary = useMemo(() => {
    const base = { pendente: 0, revisar: 0, completo: 0 };
    return ambientes.reduce((acc, amb) => {
      const status = amb.status || "pendente";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, base);
  }, [ambientes]);

  const total = ambientes.length;
  const completion = total ? Math.round((summary.completo / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                {user ? `Olá, ${user.nome}` : "Calhas"}
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Produção de calhas
              </h1>
            </div>
            <Link
              href="/medicoes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
            >
              <ClipboardList className="w-4 h-4" />
              Ver medições
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                obra selecionada
              </p>
              <select
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none"
              >
                {obras.length === 0 && <option>Carregando...</option>}
                {obras.map((obra) => (
                  <option key={obra._id} value={obra._id}>
                    {obra.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-2">
              {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
              <span>{loading ? "Sincronizando..." : `${total} ambientes`}</span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              progresso da calha
            </p>
            <h2 className="text-lg font-semibold text-slate-900 mt-1">{completion}% concluído</h2>
            <p className="text-sm text-slate-500">Baseado em {total} ambientes</p>
            <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
          {summaryCard("Pendentes", summary.pendente, "bg-amber-50 text-amber-800")}
          {summaryCard("Revisar", summary.revisar, "bg-red-50 text-red-800")}
          {summaryCard("OK", summary.completo, "bg-emerald-50 text-emerald-800")}
        </section>
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm">
          <header className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Lista de cortes</h2>
              <p className="text-xs text-slate-500">
                Largura original, desconto e medida final para produção
              </p>
            </div>
            <Link
              href="/medicoes"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
            >
              ver medições
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Largura (cm)</th>
                  <th className="px-4 py-3 text-left">Desconto</th>
                  <th className="px-4 py-3 text-left">Final</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {ambientes.map((amb) => (
                  <tr
                    key={amb._id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">{amb.codigo}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {amb.medidas?.largura ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {amb.variaveis?.regras?.calhaDesconto ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {amb.calculado?.larguraCalha ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={amb.status || "pendente"} />
                    </td>
                  </tr>
                ))}
                {ambientes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                      Nenhum ambiente encontrado para esta obra.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function summaryCard(label: string, value: number, tone: string) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm ${tone}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Ambiente["status"] }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pendente: { bg: "bg-amber-100", text: "text-amber-800", label: "Pendente" },
    revisar: { bg: "bg-red-100", text: "text-red-800", label: "Revisar" },
    completo: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Completo" },
  };
  const { bg, text, label } = config[status || "pendente"];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  );
}
