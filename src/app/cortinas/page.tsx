"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Printer, Sparkles, AlertCircle, ScissorsLineDashed, History, Tag } from "lucide-react";
import type { Ambiente, AmbienteStatus } from "@/src/app/medicoes/types";
import type { Obra } from "@/src/app/obras/types";
import { useCurrentUser } from "@/src/app/providers/UserProvider";
import { ACTIVE_OBRA_KEY } from "@/src/lib/constants";
import { parseJsonOrThrow } from "@/src/lib/http";
import { AppLayout } from "@/src/app/components/AppLayout";
import { useToast } from "@/src/app/components/Toast";
import { AmbienteHistoryModal } from "@/src/app/components/AmbienteHistoryModal";
import type { CurrentUser } from "@/src/lib/getCurrentUser";

const CORTINA_STATUSES: AmbienteStatus[] = [
  "em_producao",
  "producao_calha",
  "producao_cortina",
];

export default function CortinasPage() {
  const { user } = useCurrentUser();
  const isInstaller = user?.role === "instalador";
  const { showToast, ToastContainer } = useToast();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Ambiente | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [historyAmbiente, setHistoryAmbiente] = useState<Ambiente | null>(null);


  useEffect(() => {
    if (typeof window === "undefined" || isInstaller) return;
    const stored = window.localStorage.getItem(ACTIVE_OBRA_KEY);
    if (stored) setObraId(stored);
  }, [isInstaller]);

  useEffect(() => {
    if (isInstaller) return;
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
  }, [obraId, isInstaller]);

  useEffect(() => {
    if (isInstaller || !obraId) return;
    const fetchAmbientes = async () => {
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
    fetchAmbientes();
  }, [obraId, isInstaller]);

  const ambientesCortina = useMemo(() => {
    return ambientes.filter((amb) => {
      const status = (amb.status ?? "medicao_pendente") as AmbienteStatus;
      if (!CORTINA_STATUSES.includes(status)) {
        return false;
      }
      const cortinaFinalizada = Boolean(amb.workflow?.producaoCortinaFim);
      return !cortinaFinalizada;
    });
  }, [ambientes]);

  const handleUpdate = useCallback(
    async (
      ambienteId: string,
      payload: Partial<Pick<Ambiente, "status" | "producaoCortinaResponsavel">>,
      successMessage: string
    ) => {
      if (isInstaller) return;
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
    [isInstaller, showToast]
  );

  const handleClaim = useCallback(
    (amb: Ambiente) => {
      if (!user || isInstaller) return;
      const proximoStatus =
        (amb.status ?? "medicao_pendente") === "producao_calha" ? "producao_cortina" : "producao_cortina";
      const mensagem =
        proximoStatus === "producao_cortina" && (amb.status ?? "medicao_pendente") === "producao_calha"
          ? "Cortina recebida da calha e atribuída para costura."
          : "Cortina atribuída para costura.";

      handleUpdate(
        amb._id,
        { status: proximoStatus, producaoCortinaResponsavel: user._id },
        mensagem
      );
    },
    [handleUpdate, isInstaller, user]
  );

  const handleFinish = useCallback(
    (amb: Ambiente) => {
      if (isInstaller) return;
      handleUpdate(
        amb._id,
        { status: "estoque_deposito" },
        "Cortina finalizada e enviada para o depósito."
      );
    },
    [handleUpdate, isInstaller]
  );

  const handleRelease = useCallback(
    (amb: Ambiente) => {
      if (isInstaller) return;
      handleUpdate(
        amb._id,
        { status: "producao_calha", producaoCortinaResponsavel: undefined },
        "Cortina devolvida para revisão de calha."
      );
    },
    [handleUpdate, isInstaller]
  );

  const obraSelecionada = useMemo(() => obras.find((o) => o._id === obraId), [obras, obraId]);

  const filteredCount = ambientesCortina.length;

  if (isInstaller) {
    return (
      <AppLayout>
        <ToastContainer />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-slate-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              Área exclusiva da produção
            </h1>
            <p className="text-sm text-slate-500">
              Somente a equipe de costura/produção pode acessar as cortinas. Procure o gerente se precisar visualizar esta etapa.
            </p>
            <Link
              href="/instalacao"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
            >
              Ir para instalação
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ToastContainer />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">linha de produção</p>
              <h1 className="text-xl font-semibold text-slate-900">Cortinas & Costura</h1>
              <p className="text-sm text-slate-500">Controle dos tecidos, ajustes e acabamento antes da instalação.</p>
            </div>
          </div>
          <Link
            href="/calhas"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ScissorsLineDashed className="w-4 h-4" />
            Ver calhas
          </Link>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Obra selecionada</p>
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  {obras.length === 0 && <option>Carregando...</option>}
                  {obras.map((obra) => (
                    <option key={obra._id} value={obra._id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 bg-slate-50">
                <div>
                  <p className="text-xs text-slate-500">Cortinas pendentes</p>
                  <p className="text-lg font-semibold text-slate-900">{filteredCount}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
                  {loading ? "Sincronizando..." : "Atualizado"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Lista de costura</p>
                <h2 className="text-lg font-semibold text-slate-900">
                  {obraSelecionada?.nome ?? "Selecione uma obra"}
                </h2>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <Printer className="w-4 h-4" />
                Imprimir etiquetas
              </button>
            </header>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Código</th>
                    <th className="px-4 py-3 text-left font-semibold">Ambiente</th>
                    <th className="px-4 py-3 text-left font-semibold">Tecidos</th>
                    <th className="px-4 py-3 text-left font-semibold">Ajustes</th>
                    <th className="px-4 py-3 text-left font-semibold">Responsável</th>
                    <th className="px-4 py-3 text-left font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ambientesCortina.map((amb) => (
                    <CortinaRow
                      key={amb._id}
                      ambiente={amb}
                      usuarioAtual={user}
                      updating={updatingId === amb._id}
                      onSelectEtiqueta={() => setSelected(amb)}
                      onShowHistory={() => setHistoryAmbiente(amb)}
                      onClaim={() => handleClaim(amb)}
                      onFinish={() => handleFinish(amb)}
                      onRelease={() => handleRelease(amb)}
                    />
                  ))}
                  {ambientesCortina.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        Nenhuma cortina aguardando produção.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="lg:hidden space-y-4 p-5 pt-0">
              {ambientesCortina.map((amb) => (
                <MobileCortinaCard
                  key={`mobile-${amb._id}`}
                  ambiente={amb}
                  usuarioAtual={user}
                  updating={updatingId === amb._id}
                  onSelectEtiqueta={() => setSelected(amb)}
                  onShowHistory={() => setHistoryAmbiente(amb)}
                  onClaim={() => handleClaim(amb)}
                  onFinish={() => handleFinish(amb)}
                  onRelease={() => handleRelease(amb)}
                />
              ))}
              {ambientesCortina.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Nenhuma cortina aguardando produção.
                </div>
              )}
            </div>
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Etiqueta da cortina</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-500 hover:text-slate-900"
                >
                  Fechar
                </button>
              </header>
              <div className="p-6 space-y-4">
                <CortinaLabel ambiente={selected} obra={obraSelecionada} />
                <button
                  onClick={() => window.print()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir etiqueta
                </button>
              </div>
            </div>
          </div>
        )}
        {historyAmbiente && (
          <AmbienteHistoryModal ambiente={historyAmbiente} onClose={() => setHistoryAmbiente(null)} />
        )}
      </div>
    </AppLayout>
  );
}

function CortinaRow({
  ambiente,
  usuarioAtual,
  updating,
  onSelectEtiqueta,
  onShowHistory,
  onClaim,
  onFinish,
  onRelease,
}: {
  ambiente: Ambiente;
  usuarioAtual: CurrentUser | null;
  updating: boolean;
  onSelectEtiqueta: () => void;
  onShowHistory: () => void;
  onClaim: () => void;
  onFinish: () => void;
  onRelease: () => void;
}) {
  const responsavelId = ambiente.producaoCortinaResponsavel;
  const claimed = Boolean(responsavelId);
  const isMine = usuarioAtual && responsavelId === usuarioAtual._id;

  const ajustesPrincipal = ambiente.variaveis?.regras?.voileAlturaDesconto;
  const ajustesSecundario = ambiente.variaveis?.regras?.blackoutAlturaDesconto;

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-4 py-3.5 font-bold text-slate-900">{ambiente.codigo}</td>
      <td className="px-4 py-3.5 text-slate-600">{ambiente.quarto || "-"}</td>
      <td className="px-4 py-3.5">
        <p className="text-sm font-semibold text-slate-900">
          {ambiente.variaveis?.tecidoPrincipal ?? "Tecido principal"}
        </p>
        {ambiente.variaveis?.tecidoSecundario && (
          <p className="text-xs text-slate-500">{ambiente.variaveis.tecidoSecundario}</p>
        )}
      </td>
      <td className="px-4 py-3.5 text-slate-600">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Voile</p>
        <p className="text-sm font-bold text-slate-900">{ajustesPrincipal ?? 0} cm</p>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">Blackout</p>
        <p className="text-sm font-bold text-slate-900">{ajustesSecundario ?? 0} cm</p>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
            claimed ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {claimed ? (isMine ? "Você" : "Em produção") : "Disponível"}
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
          <button
            onClick={onSelectEtiqueta}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            Etiqueta
          </button>
          {!claimed && (
            <button
              onClick={onClaim}
              disabled={updating}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {updating ? "Atualizando..." : "Pegar"}
            </button>
          )}
          {claimed && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onFinish}
                disabled={updating}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {updating ? "Atualizando..." : "Concluir"}
              </button>
              {isMine && (
                <button
                  onClick={onRelease}
                  disabled={updating}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                >
                  Liberar
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function MobileCortinaCard({
  ambiente,
  usuarioAtual,
  updating,
  onSelectEtiqueta,
  onShowHistory,
  onClaim,
  onFinish,
  onRelease,
}: {
  ambiente: Ambiente;
  usuarioAtual: CurrentUser | null;
  updating: boolean;
  onSelectEtiqueta: () => void;
  onShowHistory: () => void;
  onClaim: () => void;
  onFinish: () => void;
  onRelease: () => void;
}) {
  const responsavelId = ambiente.producaoCortinaResponsavel;
  const claimed = Boolean(responsavelId);
  const isMine = usuarioAtual && responsavelId === usuarioAtual._id;
  const ajustesPrincipal = ambiente.variaveis?.regras?.voileAlturaDesconto;
  const ajustesSecundario = ambiente.variaveis?.regras?.blackoutAlturaDesconto;

  return (
    <div className="rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-400">Código</p>
          <p className="text-lg font-bold text-slate-900">{ambiente.codigo}</p>
          <p className="text-xs text-slate-500">{ambiente.quarto || "-"}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
            claimed ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {claimed ? (isMine ? "Você" : "Em produção") : "Disponível"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p className="uppercase text-[0.65rem] text-slate-400">Tecido principal</p>
          <p className="text-sm font-semibold text-slate-900">
            {ambiente.variaveis?.tecidoPrincipal ?? "Não definido"}
          </p>
          <p className="text-xs text-slate-500">Desconto: {ajustesPrincipal ?? 0} cm</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p className="uppercase text-[0.65rem] text-slate-400">Tecido secundário</p>
          <p className="text-sm font-semibold text-slate-900">
            {ambiente.variaveis?.tecidoSecundario ?? "Não definido"}
          </p>
          <p className="text-xs text-slate-500">Desconto: {ajustesSecundario ?? 0} cm</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <button
          onClick={onShowHistory}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <History className="w-3.5 h-3.5" />
          Histórico
        </button>
        <button
          onClick={onSelectEtiqueta}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <Tag className="w-3.5 h-3.5" />
          Etiqueta
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        {!claimed && (
          <button
            onClick={onClaim}
            disabled={updating}
            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {updating ? "Atualizando..." : "Pegar"}
          </button>
        )}
        {claimed && (
          <>
            <button
              onClick={onFinish}
              disabled={updating}
              className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {updating ? "Atualizando..." : "Concluir"}
            </button>
            {isMine && (
              <button
                onClick={onRelease}
                disabled={updating}
                className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
              >
                Liberar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CortinaLabel({ ambiente, obra }: { ambiente: Ambiente; obra?: Obra | null }) {
  return (
    <div className="rounded-2xl border-2 border-slate-900 overflow-hidden print:break-inside-avoid bg-white">
      <div className="px-4 py-3 border-b border-slate-900 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Etiqueta de cortina</p>
          <h3 className="text-lg font-bold text-slate-900">{ambiente.codigo}</h3>
          <p className="text-xs text-slate-500">{obra?.nome}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{ambiente.quarto}</p>
          {ambiente.medidas?.largura && <p>{ambiente.medidas.largura} cm de vão</p>}
        </div>
      </div>
      <div className="px-4 py-4 grid grid-cols-2 gap-3 border-b border-slate-100">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Tecido principal</p>
          <p className="text-base font-bold text-slate-900">
            {ambiente.variaveis?.tecidoPrincipal ?? "Não definido"}
          </p>
          <p className="text-xs text-slate-500">
            Desconto: {ambiente.variaveis?.regras?.voileAlturaDesconto ?? 0} cm
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Tecido secundário</p>
          <p className="text-base font-bold text-slate-900">
            {ambiente.variaveis?.tecidoSecundario ?? "Não definido"}
          </p>
          <p className="text-xs text-slate-500">
            Desconto: {ambiente.variaveis?.regras?.blackoutAlturaDesconto ?? 0} cm
          </p>
        </div>
      </div>
      <div className="px-4 py-3 text-xs text-slate-600 space-y-1">
        <p>
          Responsável: <span className="font-semibold">{ambiente.producaoCortinaResponsavel ? "Equipe de cortina" : "Não atribuído"}</span>
        </p>
        <p>
          Observações: <span className="font-semibold">{ambiente.observacoes ?? "-"}</span>
        </p>
      </div>
    </div>
  );
}
