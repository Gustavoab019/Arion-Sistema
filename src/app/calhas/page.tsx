"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, RefreshCw, ArrowRight, Printer, Tag, AlertCircle, Ruler, X, History } from "lucide-react";
import type { Ambiente, AmbienteStatus } from "@/src/app/medicoes/types";
import type { Obra } from "@/src/app/obras/types";
import { useCurrentUser } from "@/src/app/providers/UserProvider";
import { ACTIVE_OBRA_KEY } from "@/src/lib/constants";
import { parseJsonOrThrow } from "@/src/lib/http";
import { AppLayout } from "@/src/app/components/AppLayout";
import { useToast } from "@/src/app/components/Toast";
import { AmbienteHistoryModal } from "@/src/app/components/AmbienteHistoryModal";
import { calcularPecas, getTotalPecas } from "@/src/lib/calhas-config";
import type { CurrentUser } from "@/src/lib/getCurrentUser";

const STATUS_ORDER: AmbienteStatus[] = [
  "medicao_pendente",
  "aguardando_validacao",
  "em_producao",
  "producao_calha",
  "producao_cortina",
  "estoque_deposito",
  "em_transito",
  "aguardando_instalacao",
  "instalado",
];

type StatusSummary = Record<AmbienteStatus, number>;

const createSummaryBase = (): StatusSummary =>
  STATUS_ORDER.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as StatusSummary);

const QUICK_STATS = [
  {
    key: "medicao_pendente" as AmbienteStatus,
    label: "Medições pendentes",
    tone: "text-amber-600",
  },
  {
    key: "aguardando_validacao" as AmbienteStatus,
    label: "Aguardando validação",
    tone: "text-sky-600",
  },
  {
    key: "em_producao" as AmbienteStatus,
    label: "Em produção",
    tone: "text-emerald-600",
  },
];

const CARD_STATS = [
  {
    key: "em_producao" as AmbienteStatus,
    label: "Em produção",
    accent: "bg-emerald-50",
  },
  {
    key: "aguardando_instalacao" as AmbienteStatus,
    label: "Fila de instalação",
    accent: "bg-blue-50",
  },
  {
    key: "instalado" as AmbienteStatus,
    label: "Instalados",
    accent: "bg-slate-50",
  },
];

const STATUS_BADGE_CONFIG: Record<
  AmbienteStatus,
  { label: string; bg: string; text: string }
> = {
  medicao_pendente: {
    label: "Medição pendente",
    bg: "bg-amber-100",
    text: "text-amber-800",
  },
  aguardando_validacao: {
    label: "Validar variáveis",
    bg: "bg-sky-100",
    text: "text-sky-800",
  },
  em_producao: {
    label: "Em produção",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
  },
  producao_calha: {
    label: "Produção calha",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
  },
  producao_cortina: {
    label: "Produção cortina",
    bg: "bg-teal-100",
    text: "text-teal-800",
  },
  estoque_deposito: {
    label: "Depósito",
    bg: "bg-amber-100",
    text: "text-amber-800",
  },
  em_transito: {
    label: "Expedição",
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
  aguardando_instalacao: {
    label: "Fila instalação",
    bg: "bg-indigo-100",
    text: "text-indigo-800",
  },
  instalado: {
    label: "Instalado",
    bg: "bg-slate-200",
    text: "text-slate-900",
  },
};

export default function CalhasPage() {
  const { user } = useCurrentUser();
  const isInstaller = user?.role === "instalador";
  const { showToast, ToastContainer } = useToast();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "labels">("table");
  const [selectedAmbiente, setSelectedAmbiente] = useState<Ambiente | null>(null);
  const [historyAmbiente, setHistoryAmbiente] = useState<Ambiente | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
  }, [obraId, isInstaller]);

  const handleUpdateAmbiente = useCallback(
    async (
      ambienteId: string,
      payload: Partial<Pick<Ambiente, "status" | "producaoCalhaResponsavel">>,
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
        setAmbientes((prev) =>
          prev.map((amb) => (amb._id === atualizado._id ? atualizado : amb))
        );
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

  const handleClaimAmbiente = useCallback(
    (amb: Ambiente) => {
      if (!user || isInstaller) return;
      handleUpdateAmbiente(
        amb._id,
        { status: "producao_calha", producaoCalhaResponsavel: user._id },
        "Calha atribuída para produção."
      );
    },
    [handleUpdateAmbiente, isInstaller, user]
  );

  const handleFinishAmbiente = useCallback(
    (amb: Ambiente) => {
      if (isInstaller) return;
      handleUpdateAmbiente(
        amb._id,
        { status: "producao_cortina" },
        "Calha finalizada e enviada para a costura."
      );
    },
    [handleUpdateAmbiente, isInstaller]
  );

  const handleReleaseAmbiente = useCallback(
    (amb: Ambiente) => {
      if (isInstaller) return;
      handleUpdateAmbiente(
        amb._id,
        { status: "aguardando_validacao", producaoCalhaResponsavel: undefined },
        "Ambiente devolvido para validação."
      );
    },
    [handleUpdateAmbiente, isInstaller]
  );

  const summary = useMemo(() => {
    if (isInstaller) {
      return createSummaryBase();
    }
    return ambientes.reduce((acc, amb) => {
      const status = (amb.status ?? "medicao_pendente") as AmbienteStatus;
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, createSummaryBase());
  }, [ambientes, isInstaller]);

  const total = ambientes.length;
  const completion = total ? Math.round((summary.instalado / total) * 100) : 0;

  const obraSelecionada = useMemo(
    () => obras.find((o) => o._id === obraId),
    [obras, obraId]
  );

  const ambientesCalhas = useMemo(
    () =>
      ambientes.filter((amb) => {
        const status = (amb.status ?? "medicao_pendente") as AmbienteStatus;
        return status === "em_producao" || status === "producao_calha";
      }),
    [ambientes]
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <ToastContainer />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  linha de produção
                </p>
                <h1 className="text-xl font-semibold text-slate-900">Calhas e Etiquetas</h1>
                <p className="text-sm text-slate-500">
                  Controle completo do corte e conferência para cada ambiente
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {user ? `Equipe: ${user.nome}` : "Equipe Arion"}
                </p>
              </div>
            </div>
            <Link
              href="/medicoes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
            >
              <ClipboardList className="w-4 h-4" />
              Ir para medições
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Obra selecionada
                </p>
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
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
                  <p className="text-xs text-slate-500">Calhas pendentes</p>
                  <p className="text-lg font-semibold text-slate-900">{ambientesCalhas.length}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
                  {loading ? "Sincronizando..." : "Atualizado"}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Andamento
                </p>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">
                  {summary.instalado} de {total} ambientes instalados
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Resumo rápido
              </p>
              <div className="space-y-3">
                {QUICK_STATS.map((stat) => (
                  <QuickStat
                    key={stat.key}
                    label={stat.label}
                    value={summary[stat.key]}
                    tone={stat.tone}
                  />
                ))}
              </div>
              <button
                onClick={() => setViewMode((prev) => (prev === "table" ? "labels" : "table"))}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
              >
                {viewMode === "table" ? (
                  <>
                    <Tag className="w-4 h-4" />
                    Visualizar etiquetas
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Voltar para tabela
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              {CARD_STATS.map((stat) => (
                <StatCard
                  key={stat.key}
                  label={stat.label}
                  value={summary[stat.key]}
                  accent={stat.accent}
                />
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <header className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {viewMode === "table" ? "Lista de cortes" : "Etiquetas de produção"}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {obraSelecionada?.nome ?? "Selecione uma obra"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      viewMode === "table"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Tabela
                  </button>
                  <button
                    onClick={() => setViewMode("labels")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      viewMode === "labels"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Etiquetas
                  </button>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </button>
                </div>
              </header>

              {viewMode === "table" ? (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Código</th>
                          <th className="px-4 py-3 text-left font-semibold">Ambiente</th>
                          <th className="px-4 py-3 text-left font-semibold">Montagem</th>
                          <th className="px-4 py-3 text-left font-semibold">Peças calculadas</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                          <th className="px-4 py-3 text-left font-semibold">Responsável</th>
                          <th className="px-4 py-3 text-left font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ambientesCalhas.map((amb) => (
                          <TableRow
                            key={amb._id}
                            ambiente={amb}
                            usuarioAtual={user}
                            onSelectEtiqueta={() => setSelectedAmbiente(amb)}
                            onShowHistory={() => setHistoryAmbiente(amb)}
                            onClaim={() => handleClaimAmbiente(amb)}
                            onFinish={() => handleFinishAmbiente(amb)}
                            onRelease={() => handleReleaseAmbiente(amb)}
                            updating={updatingId === amb._id}
                          />
                        ))}
                        {ambientesCalhas.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                  <ClipboardList className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">
                                  Nenhum ambiente encontrado
                                </p>
                                <p className="text-xs text-slate-400">
                                  Selecione uma obra ou adicione ambientes
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="lg:hidden space-y-4">
                    {ambientesCalhas.map((amb) => (
                      <MobileAmbienteCard
                        key={`mobile-${amb._id}`}
                        ambiente={amb}
                        usuarioAtual={user}
                        updating={updatingId === amb._id}
                        onSelectEtiqueta={() => setSelectedAmbiente(amb)}
                        onShowHistory={() => setHistoryAmbiente(amb)}
                        onClaim={() => handleClaimAmbiente(amb)}
                        onFinish={() => handleFinishAmbiente(amb)}
                        onRelease={() => handleReleaseAmbiente(amb)}
                      />
                    ))}
                    {ambientesCalhas.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                        Nenhum ambiente disponível nesta obra.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ambientesCalhas.length === 0 && (
                      <div className="sm:col-span-2 lg:col-span-3 bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-dashed border-slate-300">
                            <Tag className="w-8 h-8 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-600">
                              Nenhuma etiqueta disponível
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Selecione uma obra com ambientes cadastrados
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {ambientesCalhas
                      .map((amb) => {
                        const tipoMontagem = amb.variaveis?.tipoMontagem || "simples";
                        const totalPecas = getTotalPecas(tipoMontagem);
                        return Array.from({ length: totalPecas }, (_, index) => ({
                          amb,
                          index,
                          totalPecas,
                        }));
                      })
                      .flat()
                      .map(({ amb, index, totalPecas }) => (
                        <LabelCard
                          key={`${amb._id}-${index}`}
                          ambiente={amb}
                          obra={obraSelecionada}
                          pecaIndex={index}
                          totalPecas={totalPecas}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {selectedAmbiente && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-lg font-bold text-slate-900">Etiqueta de Produção</h3>
                <button
                  onClick={() => setSelectedAmbiente(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <div className="p-6">
                <LabelCard
                  ambiente={selectedAmbiente}
                  obra={obraSelecionada}
                  enlarged
                />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition active:scale-[0.98]"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </button>
                  <button
                    onClick={() => setSelectedAmbiente(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {historyAmbiente && (
          <AmbienteHistoryModal
            ambiente={historyAmbiente}
            onClose={() => setHistoryAmbiente(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 p-4 shadow-sm ${accent}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
  );
}

function QuickStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Ambiente["status"] }) {
  const safeStatus = (status ?? "medicao_pendente") as AmbienteStatus;
  const config =
    STATUS_BADGE_CONFIG[safeStatus] ??
    ({ label: "Status indefinido", bg: "bg-slate-200", text: "text-slate-700" } as const);
  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

type LabelCardProps = {
  ambiente: Ambiente;
  obra?: Obra;
  enlarged?: boolean;
  pecaIndex?: number;
  totalPecas?: number;
};

function TableRow({
  ambiente,
  usuarioAtual,
  onSelectEtiqueta,
  onShowHistory,
  onClaim,
  onFinish,
  onRelease,
  updating,
}: {
  ambiente: Ambiente;
  usuarioAtual: CurrentUser | null;
  onSelectEtiqueta: () => void;
  onShowHistory: () => void;
  onClaim: () => void;
  onFinish: () => void;
  onRelease: () => void;
  updating: boolean;
}) {
  const tipoMontagem = ambiente.variaveis?.tipoMontagem || "simples";
  const largura = ambiente.medidas?.largura ?? 0;
  const desconto = ambiente.variaveis?.regras?.calhaDesconto ?? 0;
  const pecas = calcularPecas(tipoMontagem, largura, desconto);
  const status = ambiente.status ?? "medicao_pendente";
  const responsavelId = ambiente.producaoCalhaResponsavel;
  const isResponsavelAtual = Boolean(
    responsavelId && usuarioAtual && responsavelId === usuarioAtual._id
  );
  const responsavelLabel = responsavelId
    ? isResponsavelAtual
      ? "Você"
      : "Em produção"
    : "Disponível";
  const podeAssumir = status === "em_producao" && !responsavelId;
  const podeFinalizar = status === "producao_calha" && isResponsavelAtual;
  const podeDevolver = status === "producao_calha" && isResponsavelAtual;

  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition">
      <td className="px-4 py-3.5 font-bold text-slate-900">{ambiente.codigo}</td>
      <td className="px-4 py-3.5">
        <p className="text-sm font-semibold text-slate-900">{ambiente.quarto || "-"}</p>
        <p className="text-xs text-slate-500">
          {ambiente.medidas?.largura ? `${ambiente.medidas.largura} cm` : "-"}
        </p>
      </td>
      <td className="px-4 py-3.5 text-slate-600">
        <p className="text-sm font-semibold text-slate-900">{tipoMontagem.replaceAll("_", " ")}</p>
        <p className="text-xs text-slate-500">
          {ambiente.variaveis?.calha ?? "Calha não definida"}
        </p>
      </td>
      <td className="px-4 py-3.5 text-slate-600">
        {pecas.length === 0 && (
          <p className="text-xs text-slate-400">Sem cálculo disponível</p>
        )}
        <div className="space-y-1">
          {pecas.map((peca) => (
            <div
              key={peca.nome}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-2 py-1 bg-white"
            >
              <span className="text-xs font-medium text-slate-500">
                {peca.nome}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {peca.largura} cm
              </span>
            </div>
          ))}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
            responsavelId ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {responsavelLabel}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
          <button
            onClick={onShowHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <History className="w-3.5 h-3.5" />
            Histórico
          </button>
          <button
            onClick={onSelectEtiqueta}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <Tag className="w-3.5 h-3.5" />
            Etiqueta
          </button>
          {podeAssumir && (
            <button
              disabled={updating}
              onClick={onClaim}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {updating ? "Atualizando..." : "Pegar produção"}
            </button>
          )}
          {podeFinalizar && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onFinish}
                disabled={updating}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-60"
              >
                {updating ? "Atualizando..." : "Concluir"}
              </button>
              {podeDevolver && (
                <button
                  onClick={onRelease}
                  disabled={updating}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 disabled:opacity-60"
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

function MobileAmbienteCard({
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
  const tipoMontagem = ambiente.variaveis?.tipoMontagem || "simples";
  const status = (ambiente.status ?? "medicao_pendente") as AmbienteStatus;
  const responsavelId = ambiente.producaoCalhaResponsavel;
  const isResponsavelAtual = Boolean(
    responsavelId && usuarioAtual && responsavelId === usuarioAtual._id
  );
  const podeAssumir = status === "em_producao" && !responsavelId;
  const podeFinalizar = status === "producao_calha" && isResponsavelAtual;
  const podeDevolver = status === "producao_calha" && isResponsavelAtual;
  const pecas = calcularPecas(
    tipoMontagem,
    ambiente.medidas?.largura ?? 0,
    ambiente.variaveis?.regras?.calhaDesconto ?? 0
  );

  return (
    <div className="rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-400">Código</p>
          <p className="text-lg font-bold text-slate-900">{ambiente.codigo}</p>
          <p className="text-xs text-slate-500">{ambiente.quarto || "-"}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p className="uppercase text-slate-400 text-[0.65rem]">Montagem</p>
          <p className="text-sm font-semibold text-slate-900">
            {tipoMontagem.replaceAll("_", " ")}
          </p>
          <p className="text-xs text-slate-500">{ambiente.variaveis?.calha ?? "Sem calha"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p className="uppercase text-slate-400 text-[0.65rem]">Responsável</p>
          <p className="text-sm font-semibold text-slate-900">
            {responsavelId ? (isResponsavelAtual ? "Você" : "Em produção") : "Disponível"}
          </p>
        </div>
      </div>

      {pecas.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase">Peças calculadas</p>
          <div className="space-y-1">
            {pecas.map((peca) => (
              <div
                key={peca.nome}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-xs"
              >
                <span className="font-medium text-slate-500">{peca.nome}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {peca.largura} cm
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
        {podeAssumir && (
          <button
            onClick={onClaim}
            disabled={updating}
            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {updating ? "Atualizando..." : "Pegar produção"}
          </button>
        )}
        {podeFinalizar && (
          <button
            onClick={onFinish}
            disabled={updating}
            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {updating ? "Atualizando..." : "Concluir"}
          </button>
        )}
        {podeDevolver && (
          <button
            onClick={onRelease}
            disabled={updating}
            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
          >
            Liberar
          </button>
        )}
      </div>
    </div>
  );
}

function LabelCard({ ambiente, obra, enlarged = false, pecaIndex = 0, totalPecas = 1 }: LabelCardProps) {
  const tipoMontagem = ambiente.variaveis?.tipoMontagem || "simples";
  const largura = ambiente.medidas?.largura || 0;
  const desconto = ambiente.variaveis?.regras?.calhaDesconto || 0;

  // Calcular todas as peças
  const pecas = calcularPecas(tipoMontagem, largura, desconto);
  const pecaAtual = pecas[pecaIndex] || { nome: "Peça", largura: 0, descricao: "" };

  const larguraFinal = pecaAtual.largura.toFixed(1);

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl overflow-hidden print:break-inside-avoid ${
        enlarged ? "shadow-2xl" : "shadow hover:shadow-lg transition"
      }`}
    >
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            Etiqueta de produção
          </p>
          <h3 className="text-lg font-bold text-slate-900">{ambiente.codigo}</h3>
          {totalPecas > 1 && (
            <p className="text-xs text-slate-500">
              Peça {pecaIndex + 1}/{totalPecas} • {pecaAtual.nome}
            </p>
          )}
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{obra?.nome}</p>
          {obra?.cliente && <p>Cliente: {obra.cliente}</p>}
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-slate-100">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Ambiente</p>
          <p className="text-base font-bold text-slate-900">{ambiente.quarto || "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Calha</p>
          <p className="text-sm font-semibold text-slate-900">
            {ambiente.variaveis?.calha ?? "Sem definição"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{tipoMontagem.replaceAll("_", " ")}</p>
        </div>
      </div>

      <div className="px-4 py-4 bg-slate-50 border-b border-slate-100 space-y-3">
        {pecaAtual.descricao && (
          <p className="text-xs text-slate-500 font-semibold">{pecaAtual.descricao}</p>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Original" value={ambiente.medidas?.largura?.toString() ?? "-"} suffix="cm" />
          <Metric
            label="Desconto"
            value={ambiente.variaveis?.regras?.calhaDesconto?.toString() ?? "-"}
            suffix="cm"
          />
          <Metric label="Cortar" value={larguraFinal} suffix="cm" highlight />
        </div>
      </div>

      <div className="px-4 py-3 space-y-2 text-xs">
        {ambiente.medidas?.altura && (
          <InfoRow label="Altura" value={`${ambiente.medidas.altura} cm`} />
        )}
        {ambiente.medidas?.recuo !== undefined && (
          <InfoRow label="Recuo" value={`${ambiente.medidas.recuo} cm`} />
        )}
        {ambiente.medidas?.instalacao && (
          <InfoRow label="Instalação" value={ambiente.medidas.instalacao} />
        )}
        {ambiente.variaveis?.tecidoPrincipal && (
          <InfoRow label="Tecido Principal" value={ambiente.variaveis.tecidoPrincipal} />
        )}
        {ambiente.variaveis?.tecidoSecundario && (
          <InfoRow label="Tecido Secundário" value={ambiente.variaveis.tecidoSecundario} />
        )}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <StatusBadge status={ambiente.status ?? "medicao_pendente"} />
        {ambiente.medidoPor && (
          <p className="text-xs text-slate-500">
            Por: <span className="font-semibold text-slate-700">{ambiente.medidoPor}</span>
          </p>
        )}
      </div>

      {ambiente.observacoes && (
        <div className="px-4 py-3 bg-white border-t border-slate-100">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-1">
            Observações
          </p>
          <p className="text-xs text-slate-700 font-medium whitespace-pre-line">
            {ambiente.observacoes}
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
  highlight = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        highlight ? "bg-white border-slate-300" : "bg-white border-slate-200"
      }`}
    >
      <p className="text-[0.65rem] uppercase tracking-wide text-slate-500 font-semibold">
        {label}
      </p>
      <p className="text-xl font-bold text-slate-900">
        {value}
        {suffix && <span className="text-xs ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span className="font-semibold">{label}:</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
