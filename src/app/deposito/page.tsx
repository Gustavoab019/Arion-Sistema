"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  ClipboardCheck,
  PackageCheck,
  AlertCircle,
  Pencil,
  CheckSquare,
  MoveRight,
  History,
} from "lucide-react";
import { AppLayout } from "../components/AppLayout";
import { AmbienteHistoryModal } from "@/src/app/components/AmbienteHistoryModal";
import { useToast } from "@/src/app/components/Toast";
import type { Ambiente, AmbienteStatus } from "@/src/app/medicoes/types";
import type { Obra } from "@/src/app/obras/types";
import { ACTIVE_OBRA_KEY } from "@/src/lib/constants";
import { parseJsonOrThrow } from "@/src/lib/http";
import { useCurrentUser } from "../providers/UserProvider";

const TARGET_STATUS: AmbienteStatus[] = ["producao_cortina", "estoque_deposito"];

const STATUS_BADGE: Record<
  AmbienteStatus,
  { label: string; bg: string; text: string }
> = {
  producao_cortina: {
    label: "Aguardando depósito",
    bg: "bg-amber-100",
    text: "text-amber-800",
  },
  estoque_deposito: {
    label: "No depósito",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
  },
  em_transito: {
    label: "Separado para expedição",
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
  aguardando_instalacao: {
    label: "Fila instalação",
    bg: "bg-indigo-100",
    text: "text-indigo-800",
  },
  medicao_pendente: {
    label: "Medição pendente",
    bg: "bg-slate-100",
    text: "text-slate-600",
  },
  aguardando_validacao: {
    label: "Validar variáveis",
    bg: "bg-sky-100",
    text: "text-sky-800",
  },
  em_producao: {
    label: "Em produção",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  producao_calha: {
    label: "Produção calha",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  instalado: {
    label: "Instalado",
    bg: "bg-slate-200",
    text: "text-slate-900",
  },
};

const STATUS_ORDER: Record<AmbienteStatus, number> = {
  producao_cortina: 0,
  estoque_deposito: 1,
  em_transito: 2,
  aguardando_instalacao: 3,
  medicao_pendente: 10,
  aguardando_validacao: 11,
  em_producao: 12,
  producao_calha: 13,
  instalado: 50,
};

const formatDateTime = (input?: string) => {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getLastLogByStatus = (amb: Ambiente, status: AmbienteStatus) => {
  if (!amb.logs || amb.logs.length === 0) return null;
  for (let i = amb.logs.length - 1; i >= 0; i -= 1) {
    const log = amb.logs[i];
    if (log.status === status) {
      return log;
    }
  }
  return null;
};

type DepositoFormState = {
  palete: string;
  local: string;
};

export default function DepositoPage() {
  const { user } = useCurrentUser();
  const userId = user?._id;
  const { showToast, ToastContainer } = useToast();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Ambiente | null>(null);
  const [historyAmbiente, setHistoryAmbiente] = useState<Ambiente | null>(null);
  const [formState, setFormState] = useState<DepositoFormState>({
    palete: "",
    local: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ACTIVE_OBRA_KEY);
    if (stored) {
      setObraId(stored);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadObras = async () => {
      try {
        const res = await fetch("/api/obras", { credentials: "include" });
        const data = await parseJsonOrThrow<Obra[]>(res);
        if (!active) return;
        setObras(data);
        if (!obraId && data.length > 0) {
          setObraId(data[0]._id);
        }
      } catch (err) {
        if (!active) return;
        console.error("Erro ao carregar obras:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar obras.");
      }
    };
    loadObras();
    return () => {
      active = false;
    };
  }, [obraId]);

  useEffect(() => {
    if (!obraId) return;
    let active = true;
    const loadAmbientes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ambientes?obraId=${obraId}`, {
          credentials: "include",
        });
        const data = await parseJsonOrThrow<Ambiente[]>(res);
        if (!active) return;
        setAmbientes(data);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(ACTIVE_OBRA_KEY, obraId);
        }
      } catch (err) {
        if (!active) return;
        console.error("Erro ao carregar ambientes:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar ambientes.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAmbientes();
    return () => {
      active = false;
    };
  }, [obraId]);

  const depositList = useMemo(() => {
    return ambientes
      .filter((amb) =>
        TARGET_STATUS.includes((amb.status ?? "medicao_pendente") as AmbienteStatus)
      )
      .sort((a, b) => {
        const aStatus = (a.status ?? "medicao_pendente") as AmbienteStatus;
        const bStatus = (b.status ?? "medicao_pendente") as AmbienteStatus;
        return (STATUS_ORDER[aStatus] ?? 99) - (STATUS_ORDER[bStatus] ?? 99);
      });
  }, [ambientes]);

  const stats = useMemo(() => {
    return depositList.reduce(
      (acc, amb) => {
        const status = (amb.status ?? "medicao_pendente") as AmbienteStatus;
        if (status === "producao_cortina") acc.pendentes += 1;
        if (status === "estoque_deposito") acc.armazenados += 1;
        return acc;
      },
      { pendentes: 0, armazenados: 0 }
    );
  }, [depositList]);

  const obraSelecionada = useMemo(
    () => obras.find((obra) => obra._id === obraId),
    [obras, obraId]
  );

  const handleSelectAmbiente = (amb: Ambiente) => {
    setSelected(amb);
    setFormState({
      palete: amb.depositoPalete ?? "",
      local: amb.depositoLocal ?? "",
    });
  };

  const handleSaveDeposito = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selected) return;
      const palete = formState.palete.trim();
      const local = formState.local.trim();
      if (!palete && !local) {
        showToast("Informe pelo menos o palete ou localização.", "error");
        return;
      }

      const payload: Record<string, unknown> = {
        depositoPalete: palete || undefined,
        depositoLocal: local || undefined,
      };
      if (!selected.depositoRecebidoPor && userId) {
        payload.depositoRecebidoPor = userId;
      }
      if (!selected.depositoRecebidoEm) {
        payload.depositoRecebidoEm = new Date().toISOString();
      }
      if ((selected.status ?? "medicao_pendente") !== "estoque_deposito") {
        payload.status = "estoque_deposito";
      }

      setSaving(true);
      try {
        const res = await fetch(`/api/ambientes/${selected._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const atualizado = await parseJsonOrThrow<Ambiente>(res);
        setAmbientes((prev) =>
          prev.map((amb) => (amb._id === atualizado._id ? atualizado : amb))
        );
        setSelected(atualizado);
        const jaNoDeposito = (selected.status ?? "medicao_pendente") === "estoque_deposito";
        showToast(
          jaNoDeposito ? "Informações do depósito atualizadas." : "Entrada registrada no depósito.",
          "success"
        );
      } catch (err) {
        console.error("Erro ao salvar no depósito:", err);
        showToast(
          err instanceof Error ? err.message : "Erro ao salvar dados.",
          "error"
        );
      } finally {
        setSaving(false);
      }
    },
    [formState.local, formState.palete, selected, showToast, userId]
  );

  const handleCancelar = () => {
    setSelected(null);
    setFormState({ palete: "", local: "" });
  };

  return (
    <AppLayout>
      <ToastContainer />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                depósito & logística
              </p>
              <h1 className="text-xl font-semibold text-slate-900">
                Entrada e paletização
              </h1>
              <p className="text-sm text-slate-500">
                Registre quando calhas e cortinados chegam ao estoque para expedição.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cortinas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <PackageCheck className="w-4 h-4" />
              Produção
            </Link>
            <Link
              href="/expedicao"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              <MoveRight className="w-4 h-4" />
              Expedição
            </Link>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <aside className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Obra selecionada
                </p>
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  {obras.map((obra) => (
                    <option key={obra._id} value={obra._id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500">Total recebidos</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.armazenados}
                </p>
                <p className="text-xs text-slate-400">
                  {stats.pendentes} aguardando check-in
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Pendentes</span>
                  <span className="font-semibold">{stats.pendentes}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Armazenados</span>
                  <span className="font-semibold">{stats.armazenados}</span>
                </div>
              </div>
            </div>

            {selected && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Atualizar depósito
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {selected.codigo}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selected.quarto} • {selected.variaveis?.calha ?? "Calha não definida"}
                    </p>
                  </div>
                  <button
                    onClick={handleCancelar}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                </div>
                <form onSubmit={handleSaveDeposito} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Palete / Identificação
                    </label>
                    <input
                      value={formState.palete}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, palete: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10"
                      placeholder="Ex: Palete A03"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Localização no depósito
                    </label>
                    <input
                      value={formState.local}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, local: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10"
                      placeholder="Rua 2 - Nicho 14"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    {saving ? "Salvando..." : "Guardar no depósito"}
                  </button>
                </form>
              </div>
            )}
          </aside>

          <section className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <header className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Ambientes prontos para depósito
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {obraSelecionada?.nome ?? "Selecione uma obra"}
                  </h2>
                </div>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Ambiente</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Palete</th>
                      <th className="px-4 py-3 text-left font-semibold">Local</th>
                      <th className="px-4 py-3 text-left font-semibold">Entrada</th>
                      <th className="px-4 py-3 text-left font-semibold">Responsável</th>
                      <th className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depositList.map((amb) => {
                      const status = (amb.status ?? "medicao_pendente") as AmbienteStatus;
                      const badge = STATUS_BADGE[status] ?? STATUS_BADGE.medicao_pendente;
                      const entrada = amb.depositoRecebidoEm
                        ? formatDateTime(amb.depositoRecebidoEm)
                        : "—";
                      const responsavel =
                        getLastLogByStatus(amb, "estoque_deposito")?.userNome ?? "—";

                      return (
                        <tr
                          key={amb._id}
                          className="border-t border-slate-100 last:border-b"
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{amb.codigo}</p>
                              <p className="text-xs text-slate-500">{amb.quarto}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-700">{amb.depositoPalete ?? "—"}</td>
                          <td className="px-4 py-4 text-slate-700">{amb.depositoLocal ?? "—"}</td>
                          <td className="px-4 py-4 text-slate-700">{entrada}</td>
                          <td className="px-4 py-4 text-slate-700">{responsavel}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleSelectAmbiente(amb)}
                                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
                              >
                                {status === "estoque_deposito" ? (
                                  <>
                                    <Pencil className="w-3.5 h-3.5" />
                                    Editar
                                  </>
                                ) : (
                                  <>
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    Dar entrada
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setHistoryAmbiente(amb)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                              >
                                <History className="w-3.5 h-3.5" />
                                Histórico
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {depositList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                          Nenhum ambiente aguardando depósito nesta obra.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="px-4 py-3 text-xs text-slate-500">Sincronizando ambientes...</div>
              )}
            </div>
          </section>
        </div>
      </div>
      {historyAmbiente && (
        <AmbienteHistoryModal ambiente={historyAmbiente} onClose={() => setHistoryAmbiente(null)} />
      )}
    </AppLayout>
  );
}
