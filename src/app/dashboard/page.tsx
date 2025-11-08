"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  MapPin,
  PlusCircle,
  Ruler,
} from "lucide-react";
import { useCurrentUser } from "../providers/UserProvider";
import type { Ambiente } from "@/src/app/medicoes/types";
import type { Obra } from "@/src/app/obras/types";
import { ACTIVE_OBRA_KEY } from "@/src/lib/constants";
import { parseJsonOrThrow } from "@/src/lib/http";

type Summary = {
  pending: number;
  review: number;
  done: number;
};

export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeObraId, setActiveObraId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ACTIVE_OBRA_KEY);
    if (stored) {
      setActiveObraId(stored);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ambRes, obrasRes] = await Promise.all([
          fetch("/api/ambientes", { credentials: "include" }),
          fetch("/api/obras", { credentials: "include" }),
        ]);
        const [ambData, obrasData] = await Promise.all([
          parseJsonOrThrow<Ambiente[]>(ambRes),
          parseJsonOrThrow<Obra[]>(obrasRes),
        ]);
        if (!active) return;
        setAmbientes(ambData);
        setObras(obrasData);
      } catch (err) {
        if (!active) return;
        console.error("Erro ao carregar dashboard:", err);
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo<Summary>(() => {
    return ambientes.reduce(
      (acc, amb) => {
        if (amb.status === "completo") acc.done += 1;
        else if (amb.status === "revisar") acc.review += 1;
        else acc.pending += 1;
        return acc;
      },
      { pending: 0, review: 0, done: 0 }
    );
  }, [ambientes]);

  const total = stats.pending + stats.review + stats.done;
  const completion = total ? Math.round((stats.done / total) * 100) : 0;
  const recentAmbientes = ambientes.slice(0, 5);
  const activeObra = obras.find((o) => o._id === activeObraId) ?? obras[0] ?? null;

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                {userLoading ? "Carregando..." : `Bem-vindo, ${user?.nome ?? "usuário"}`}
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Visão geral das medições
              </h1>
            </div>
            {activeObra && (
              <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm">
                <MapPin className="w-4 h-4" />
                {activeObra.nome}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/medicoes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
            >
              <ClipboardList className="w-4 h-4" />
              Ir para medições
            </Link>
            <Link
              href="/obras"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white transition"
            >
              <PlusCircle className="w-4 h-4" />
              Gerenciar obras
            </Link>
            <Link
              href="/calhas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white transition"
            >
              <Ruler className="w-4 h-4" />
              Área de calhas
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              andamento geral
            </p>
            <h2 className="text-lg font-semibold text-slate-900 mt-1">
              {completion}% concluído
            </h2>
            <p className="text-sm text-slate-500">Baseado em {total} ambientes</p>
            <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
          {summaryCard("Pendentes", stats.pending, "bg-amber-50 text-amber-800")}
          {summaryCard("Revisar", stats.review, "bg-red-50 text-red-800")}
          {summaryCard("OK", stats.done, "bg-emerald-50 text-emerald-800")}
        </section>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <header className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Atividade recente
                </h3>
                <p className="text-xs text-slate-500">
                  Últimos ambientes cadastrados ou atualizados
                </p>
              </div>
              <Link
                href="/medicoes"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
              >
                ver tudo
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </header>
            {loading ? (
              <p className="text-sm text-slate-400">Carregando...</p>
            ) : recentAmbientes.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma medição registrada ainda.</p>
            ) : (
              <ul className="space-y-3">
                {recentAmbientes.map((amb) => (
                  <li
                    key={amb._id}
                    className="flex items-start justify-between gap-3 border border-slate-100 rounded-2xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {amb.codigo}
                      </p>
                      <p className="text-xs text-slate-500">
                        {amb.medidoPor ? `Medido por ${amb.medidoPor}` : "Sem responsável"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(amb.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={amb.status || "pendente"} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Obras em andamento
                </h3>
                <p className="text-xs text-slate-500">últimas obras cadastradas</p>
              </div>
              <Activity className="w-4 h-4 text-slate-400" />
            </header>
            {loading ? (
              <p className="text-sm text-slate-400">Carregando...</p>
            ) : obras.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma obra cadastrada.</p>
            ) : (
              <ul className="space-y-3">
                {obras.slice(0, 3).map((obra) => (
                  <li
                    key={obra._id}
                    className="border border-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{obra.nome}</p>
                      <p className="text-xs text-slate-500">
                        ID: <span className="font-mono text-slate-600">{obra._id}</span>
                      </p>
                    </div>
                    <Link
                      href="/medicoes"
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      ver medições
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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
  const config: Record<string, { bg: string; text: string }> = {
    pendente: { bg: "bg-amber-100", text: "text-amber-800" },
    revisar: { bg: "bg-red-100", text: "text-red-800" },
    completo: { bg: "bg-emerald-100", text: "text-emerald-800" },
  };
  const { bg, text } = config[status || "pendente"] || config.pendente;
  const label =
    status === "completo" ? "Completo" : status === "revisar" ? "Revisar" : "Pendente";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "Sem data";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
