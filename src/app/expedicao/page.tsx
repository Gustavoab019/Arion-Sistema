"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Truck,
  ClipboardList,
  AlertCircle,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
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
  if (!amb.logs) return null;
  for (let i = amb.logs.length - 1; i >= 0; i -= 1) {
    if (amb.logs[i].status === status) {
      return amb.logs[i];
    }
  }
  return null;
};

export default function ExpedicaoPage() {
  const { user } = useCurrentUser();
  const userId = user?._id;
  const { showToast, ToastContainer } = useToast();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Ambiente | null>(null);
  const [romaneio, setRomaneio] = useState("");
  const [instaladorId, setInstaladorId] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyAmbiente, setHistoryAmbiente] = useState<Ambiente | null>(null);

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

  const obraSelecionada = useMemo(
    () => obras.find((obra) => obra._id === obraId),
    [obras, obraId]
  );

  const instaladores = useMemo(() => {
    return (
      obraSelecionada?.responsaveis?.filter((resp) => resp.role === "instalador") ??
      []
    );
  }, [obraSelecionada]);

  const responsavelNome = useCallback(
    (userRef?: string) => {
      if (!userRef) return null;
      const resp = obraSelecionada?.responsaveis?.find(
        (responsavel) => responsavel.userId === userRef
      );
      return resp?.nome ?? null;
    },
    [obraSelecionada]
  );

  const prontosParaExpedicao = useMemo(
    () =>
      ambientes.filter(
        (amb) => (amb.status ?? "medicao_pendente") === "estoque_deposito"
      ),
    [ambientes]
  );

  const emTransito = useMemo(
    () =>
      ambientes.filter((amb) => (amb.status ?? "medicao_pendente") === "em_transito"),
    [ambientes]
  );

  const handleSelecionar = (amb: Ambiente) => {
    setSelected(amb);
    setRomaneio(amb.expedicaoRomaneio ?? "");
    setInstaladorId(amb.instaladorResponsavel ?? "");
  };

  const resetForm = () => {
    setSelected(null);
    setRomaneio("");
    setInstaladorId("");
  };

  const handleRomaneio = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selected) return;
      const romaneioValue = romaneio.trim();
      if (!romaneioValue) {
        showToast("Informe o identificador do romaneio.", "error");
        return;
      }
      if (instaladores.length > 0 && !instaladorId) {
        showToast("Selecione o instalador responsável.", "error");
        return;
      }

      const payload: Record<string, unknown> = {
        status: "em_transito",
        expedicaoRomaneio: romaneioValue,
        expedicaoRetiradoEm: new Date().toISOString(),
      };
      const responsavel = instaladorId || userId;
      if (responsavel) {
        payload.expedicaoRetiradoPor = responsavel;
      }
      if (instaladorId) {
        payload.instaladorResponsavel = instaladorId;
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
        showToast("Romaneio registrado e ambiente enviado para expedição.", "success");
        resetForm();
      } catch (err) {
        console.error("Erro ao gerar romaneio:", err);
        showToast(
          err instanceof Error ? err.message : "Erro ao salvar romaneio.",
          "error"
        );
      } finally {
        setSaving(false);
      }
    },
    [instaladorId, instaladores.length, romaneio, selected, showToast, userId]
  );

  const handleLiberarInstalacao = useCallback(
    async (amb: Ambiente) => {
      try {
        const res = await fetch(`/api/ambientes/${amb._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "aguardando_instalacao" }),
        });
        const atualizado = await parseJsonOrThrow<Ambiente>(res);
        setAmbientes((prev) =>
          prev.map((item) => (item._id === atualizado._id ? atualizado : item))
        );
        showToast(`${amb.codigo} liberado para instalação.`, "success");
      } catch (err) {
        console.error("Erro ao liberar instalação:", err);
        showToast(
          err instanceof Error ? err.message : "Erro ao atualizar ambiente.",
          "error"
        );
      }
    },
    [showToast]
  );

  return (
    <AppLayout>
      <ToastContainer />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                expedição & romaneio
              </p>
              <h1 className="text-xl font-semibold text-slate-900">
                Separação para instaladores
              </h1>
              <p className="text-sm text-slate-500">
                Gere romaneios, registre retiradas e acompanhe o trajeto até a instalação.
              </p>
            </div>
          </div>
          <Link
            href="/deposito"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ClipboardList className="w-4 h-4" />
            Voltar para depósito
          </Link>
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
                <p className="text-xs text-slate-500">Prontos para expedição</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {prontosParaExpedicao.length}
                </p>
                <p className="text-xs text-slate-400">{emTransito.length} em trânsito</p>
              </div>
            </div>

            {selected && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Gerar romaneio
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {selected.codigo}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selected.quarto} • {selected.depositoPalete ?? "Sem palete"}
                    </p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                </div>

                <form onSubmit={handleRomaneio} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Romaneio / NF
                    </label>
                    <input
                      value={romaneio}
                      onChange={(e) => setRomaneio(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10"
                      placeholder="Ex: ROM-2024-015"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Instalador responsável
                    </label>
                    <select
                      value={instaladorId}
                      onChange={(e) => setInstaladorId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10"
                    >
                      <option value="">Selecionar...</option>
                      {instaladores.map((inst) => (
                        <option key={inst.userId} value={inst.userId}>
                          {inst.nome}
                        </option>
                      ))}
                    </select>
                    {instaladores.length === 0 && (
                      <p className="text-[0.65rem] text-slate-400 mt-1">
                        Cadastre instaladores na obra para registrar retiradas.
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    {saving ? "Enviando..." : "Enviar para expedição"}
                  </button>
                </form>
              </div>
            )}
          </aside>

          <section className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <header className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Prontos para expedição
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
                      <th className="px-4 py-3 text-left font-semibold">Palete</th>
                      <th className="px-4 py-3 text-left font-semibold">Local</th>
                      <th className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prontosParaExpedicao.map((amb) => (
                      <tr key={amb._id} className="border-t border-slate-100 last:border-b">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{amb.codigo}</p>
                            <p className="text-xs text-slate-500">{amb.quarto}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-700">{amb.depositoPalete ?? "—"}</td>
                        <td className="px-4 py-4 text-slate-700">{amb.depositoLocal ?? "—"}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleSelecionar(amb)}
                              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              Romaneio
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
                    ))}
                    {prontosParaExpedicao.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                          Nada pronto para expedição nesta obra.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <header className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Em trânsito
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Romaneios ativos
                  </h2>
                </div>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Ambiente</th>
                      <th className="px-4 py-3 text-left font-semibold">Romaneio</th>
                      <th className="px-4 py-3 text-left font-semibold">Retirado</th>
                      <th className="px-4 py-3 text-left font-semibold">Instalador</th>
                      <th className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emTransito.map((amb) => {
                      const retirado = amb.expedicaoRetiradoEm
                        ? formatDateTime(amb.expedicaoRetiradoEm)
                        : "—";
                      const instalador =
                        responsavelNome(amb.instaladorResponsavel) ??
                        getLastLogByStatus(amb, "em_transito")?.userNome ??
                        "—";
                      return (
                        <tr key={amb._id} className="border-t border-slate-100 last:border-b">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{amb.codigo}</p>
                              <p className="text-xs text-slate-500">{amb.quarto}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-700">
                            {amb.expedicaoRomaneio ?? "—"}
                          </td>
                          <td className="px-4 py-4 text-slate-700">{retirado}</td>
                          <td className="px-4 py-4 text-slate-700">{instalador}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleLiberarInstalacao(amb)}
                                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Liberar instalação
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
                    {emTransito.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                          Nenhum romaneio ativo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="px-4 py-3 text-xs text-slate-500">
                  Sincronizando ambientes...
                </div>
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
