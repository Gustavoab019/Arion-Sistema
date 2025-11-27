"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RefreshCw, AlertCircle, Printer, ClipboardList, History } from "lucide-react";
import type { Ambiente, AmbienteStatus } from "@/src/app/medicoes/types";
import type { Obra } from "@/src/app/obras/types";
import { useCurrentUser } from "@/src/app/providers/UserProvider";
import { ACTIVE_OBRA_KEY } from "@/src/lib/constants";
import { parseJsonOrThrow } from "@/src/lib/http";
import { AppLayout } from "@/src/app/components/AppLayout";
import { AmbienteHistoryModal } from "@/src/app/components/AmbienteHistoryModal";
import { useToast } from "@/src/app/components/Toast";

const STATUS_TARGET: AmbienteStatus = "aguardando_instalacao";

export default function InstalacaoPage() {
  const { user } = useCurrentUser();
  const { showToast, ToastContainer } = useToast();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [historyAmbiente, setHistoryAmbiente] = useState<Ambiente | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(ACTIVE_OBRA_KEY);
      if (stored) setObraId(stored);
    }
  }, []);

  useEffect(() => {
    const loadObras = async () => {
      try {
        const res = await fetch("/api/obras", { credentials: "include" });
        const data = await parseJsonOrThrow<Obra[]>(res);
        setObras(data);
        if (!obraId && data.length > 0) setObraId(data[0]._id);
      } catch (err) {
        console.error("Erro ao carregar obras:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar obras.");
      }
    };
    loadObras();
  }, [obraId]);

  useEffect(() => {
    if (!obraId) return;
    const loadAmbientes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ambientes?obraId=${obraId}`, { credentials: "include" });
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
    loadAmbientes();
  }, [obraId]);

  const filaInstalacao = useMemo(
    () => ambientes.filter((amb) => (amb.status ?? "medicao_pendente") === STATUS_TARGET),
    [ambientes]
  );

  const handleUpdate = useCallback(
    async (
      ambienteId: string,
      payload: Partial<Pick<Ambiente, "status" | "instaladorResponsavel" | "instaladoPor" >>,
      successMessage: string
    ) => {
      setUpdatingId(ambienteId);
      try {
        const res = await fetch(`/api/ambientes/${ambienteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const atualizado = await parseJsonOrThrow<Ambiente>(res);
        setAmbientes((prev) => prev.map((amb) => (amb._id === atualizado._id ? atualizado : amb)));
        showToast(successMessage, "success");
      } catch (err) {
        console.error("Erro ao atualizar ambiente:", err);
        showToast(
          err instanceof Error ? err.message : "Erro ao atualizar ambiente.",
          "error"
        );
      } finally {
        setUpdatingId(null);
      }
    },
    [showToast]
  );

  const handleClaim = useCallback(
    (amb: Ambiente) => {
      if (!user) return;
      handleUpdate(
        amb._id,
        { status: STATUS_TARGET, instaladorResponsavel: user._id },
        "Instalação atribuída para sua equipe."
      );
    },
    [handleUpdate, user]
  );

  const handleFinish = useCallback(
    (amb: Ambiente) => {
      handleUpdate(
        amb._id,
        { status: "instalado", instaladoPor: user?._id },
        "Ambiente marcado como instalado."
      );
    },
    [handleUpdate, user]
  );

  const obraSelecionada = useMemo(() => obras.find((o) => o._id === obraId), [obras, obraId]);

  return (
    <AppLayout>
      <ToastContainer />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">campo e instalação</p>
              <h1 className="text-xl font-semibold text-slate-900">Fila de instaladores</h1>
              <p className="text-sm text-slate-500">
                Ambiente prontos para agendamento e finalização em obra.
              </p>
            </div>
          </div>
          <Link
            href="/cortinas"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ClipboardList className="w-4 h-4" />
            Voltar para produção
          </Link>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <header className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Ambientes aguardando instalação</p>
              <h2 className="text-lg font-semibold text-slate-900">{obraSelecionada?.nome ?? "Selecione uma obra"}</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900"
              >
                {obras.map((obra) => (
                  <option key={obra._id} value={obra._id}>
                    {obra.nome}
                  </option>
                ))}
              </select>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </header>

          {loading && (
            <div className="px-5 py-2 text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Sincronizando ambientes...
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">Ambiente</th>
                  <th className="px-4 py-3 text-left font-semibold">Calha / Cortina</th>
                  <th className="px-4 py-3 text-left font-semibold">Responsável</th>
                  <th className="px-4 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filaInstalacao.map((amb) => (
                  <InstalacaoRow
                    key={amb._id}
                    ambiente={amb}
                    updating={updatingId === amb._id}
                    isMine={Boolean(user && amb.instaladorResponsavel === user._id)}
                    onClaim={() => handleClaim(amb)}
                    onFinish={() => handleFinish(amb)}
                    onShowHistory={() => setHistoryAmbiente(amb)}
                  />
                ))}
                {filaInstalacao.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      Nenhum ambiente aguardando instalação.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {historyAmbiente && (
        <AmbienteHistoryModal ambiente={historyAmbiente} onClose={() => setHistoryAmbiente(null)} />
      )}
    </AppLayout>
  );
}

function InstalacaoRow({
  ambiente,
  updating,
  isMine,
  onClaim,
  onFinish,
  onShowHistory,
}: {
  ambiente: Ambiente;
  updating: boolean;
  isMine: boolean;
  onClaim: () => void;
  onFinish: () => void;
  onShowHistory: () => void;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-4 py-3.5 font-bold text-slate-900">{ambiente.codigo}</td>
      <td className="px-4 py-3.5 text-slate-600">{ambiente.quarto ?? "-"}</td>
      <td className="px-4 py-3.5 text-slate-600">
        <p className="text-xs uppercase tracking-wide text-slate-500">Calha</p>
        <p className="text-sm font-semibold text-slate-900">{ambiente.variaveis?.calha ?? "-"}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500 mt-2">Tecidos</p>
        <p className="text-sm font-semibold text-slate-900">
          {ambiente.variaveis?.tecidoPrincipal || "-"}
        </p>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
          ambiente.instaladorResponsavel ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
        }`}>
          {ambiente.instaladorResponsavel ? (isMine ? "Você" : "Atribuído") : "Disponível"}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
          <button
            onClick={onShowHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <History className="w-3.5 h-3.5" />
            Histórico
          </button>
          {!ambiente.instaladorResponsavel && (
            <button
              onClick={onClaim}
              disabled={updating}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {updating ? "Atualizando..." : "Assumir"}
            </button>
          )}
          {ambiente.instaladorResponsavel && (
            <button
              onClick={onFinish}
              disabled={updating}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {updating ? "Atualizando..." : "Finalizar"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
