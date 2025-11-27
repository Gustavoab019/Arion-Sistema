"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  MapPin,
  Package,
  ScissorsLineDashed,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "../components/AppLayout";
import { useCurrentUser } from "../providers/UserProvider";
import type { Ambiente, AmbienteStatus } from "@/src/app/medicoes/types";
import type { Obra, Responsavel } from "@/src/app/obras/types";
import type { Product } from "@/src/types/product";
import { ACTIVE_OBRA_KEY } from "@/src/lib/constants";
import { parseJsonOrThrow } from "@/src/lib/http";
import { KanbanBoard } from "./components/KanbanBoard";

const STATUS_FLOW: AmbienteStatus[] = [
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

const DASHBOARD_STATUS_BADGES: Record<
  AmbienteStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  medicao_pendente: {
    label: "Medição pendente",
    bg: "bg-amber-100 border-amber-200",
    text: "text-amber-800",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  aguardando_validacao: {
    label: "Validar variáveis",
    bg: "bg-sky-100 border-sky-200",
    text: "text-sky-800",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  em_producao: {
    label: "Em produção",
    bg: "bg-emerald-100 border-emerald-200",
    text: "text-emerald-800",
    icon: <Loader2 className="w-3.5 h-3.5" />,
  },
  producao_calha: {
    label: "Produção calha",
    bg: "bg-emerald-100 border-emerald-200",
    text: "text-emerald-800",
    icon: <ScissorsLineDashed className="w-3.5 h-3.5" />,
  },
  producao_cortina: {
    label: "Produção cortina",
    bg: "bg-teal-100 border-teal-200",
    text: "text-teal-800",
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  estoque_deposito: {
    label: "Depósito",
    bg: "bg-amber-100 border-amber-200",
    text: "text-amber-800",
    icon: <ClipboardList className="w-3.5 h-3.5" />,
  },
  em_transito: {
    label: "Expedição",
    bg: "bg-purple-100 border-purple-200",
    text: "text-purple-800",
    icon: <ArrowRight className="w-3.5 h-3.5" />,
  },
  aguardando_instalacao: {
    label: "Fila instalação",
    bg: "bg-indigo-100 border-indigo-200",
    text: "text-indigo-800",
    icon: <ArrowRight className="w-3.5 h-3.5" />,
  },
  instalado: {
    label: "Instalado",
    bg: "bg-slate-100 border-slate-300",
    text: "text-slate-800",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

const createSummaryBase = () =>
  STATUS_FLOW.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<AmbienteStatus, number>);

export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeObraId, setActiveObraId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ACTIVE_OBRA_KEY);
    if (stored) setActiveObraId(stored);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ambRes, obrasRes, prodRes] = await Promise.all([
          fetch("/api/ambientes", { credentials: "include" }),
          fetch("/api/obras", { credentials: "include" }),
          fetch("/api/produtos", { credentials: "include" }),
        ]);
        const [ambData, obrasData, prodData] = await Promise.all([
          parseJsonOrThrow<Ambiente[]>(ambRes),
          parseJsonOrThrow<Obra[]>(obrasRes),
          parseJsonOrThrow<Product[]>(prodRes),
        ]);
        if (!active) return;
        setAmbientes(ambData);
        setObras(obrasData);
        setProdutos(prodData);
        if (!activeObraId && obrasData.length > 0) {
          setActiveObraId(obrasData[0]._id);
        }
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
  }, [activeObraId]);

  useEffect(() => {
    if (activeObraId && typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_OBRA_KEY, activeObraId);
    }
  }, [activeObraId]);

  const filteredAmbientes = useMemo(() => {
    if (!activeObraId) return ambientes;
    return ambientes.filter((amb) => amb.obraId === activeObraId);
  }, [ambientes, activeObraId]);

  const stats = useMemo(() => {
    return filteredAmbientes.reduce((acc, amb) => {
      const status = (amb.status ?? "medicao_pendente") as AmbienteStatus;
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, createSummaryBase());
  }, [filteredAmbientes]);

  const total = STATUS_FLOW.reduce((sum, status) => sum + stats[status], 0);
  const completion = total ? Math.round((stats.instalado / total) * 100) : 0;
  const recentAmbientes = filteredAmbientes
    .slice()
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);
  const producaoEmAndamento = filteredAmbientes
    .filter((amb) => (amb.status ?? "medicao_pendente") === "em_producao")
    .slice(0, 5);
  const aguardandoValidacao = stats.aguardando_validacao;
  const aguardandoInstalacao = stats.aguardando_instalacao;
  const totalCatalogo = produtos.length;
  const catalogSummary = useMemo(
    () =>
      produtos.reduce(
        (acc, prod) => {
          acc[prod.categoria] = (acc[prod.categoria] ?? 0) + 1;
          return acc;
        },
        { calha: 0, cortinado: 0, acessorio: 0 } as Record<string, number>
      ),
    [produtos]
  );
  const activeObra = obras.find((obra) => obra._id === activeObraId) ?? obras[0] ?? null;
  const activeObras = obras.filter((obra) => obra.status === "ativo").slice(0, 4);
  const colaboradores = activeObra?.responsaveis ?? [];
  const totalAmbientesObra = activeObra
    ? ambientes.filter((amb) => amb.obraId === activeObra._id).length
    : total;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {userLoading ? "Carregando..." : `Olá, ${user?.nome?.split(" ")[0] ?? "usuário"}!`}
              </h1>
              <p className="text-slate-600 mt-1">Resumo das medições, produção e catálogo</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/medicoes"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-lg shadow-slate-900/10 hover:bg-slate-800"
              >
                <ClipboardList className="w-4 h-4" />
                Nova medição
              </Link>
              <Link
                href="/calhas"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ScissorsLineDashed className="w-4 h-4" />
                Produção
              </Link>
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Package className="w-4 h-4" />
                Produtos
              </Link>
            </div>
          </div>
          {activeObra && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-700">Obra ativa: {activeObra.nome}</span>
            </div>
          )}
          {loading && (
            <p className="text-xs text-slate-500">Sincronizando dados em tempo real...</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Erro ao carregar dados</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            label="Ambientes ativos"
            value={total}
            subtitle={`${stats.em_producao} em produção`}
            icon={ClipboardList}
            accent="bg-slate-900 text-white"
          />
          <MetricCard
            label="Aguardando validação"
            value={aguardandoValidacao}
            subtitle="Prontos para conferência"
            icon={AlertCircle}
          />
          <MetricCard
            label="Fila de instalação"
            value={aguardandoInstalacao}
            subtitle="Ambientes aprovados"
            icon={ArrowRight}
          />
          <MetricCard
            label="Produtos no catálogo"
            value={totalCatalogo}
            subtitle={`${catalogSummary.calha ?? 0} modelos de calha`}
            icon={Package}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Obra selecionada</p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {activeObra ? activeObra.nome : "Todas as obras"}
                  </h2>
                </div>
                <select
                  value={activeObraId ?? ""}
                  onChange={(e) => setActiveObraId(e.target.value || null)}
                  className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="">Todas as obras</option>
                  {obras.map((obra) => (
                    <option key={obra._id} value={obra._id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                  <span>Progresso</span>
                  <span>
                    {stats.instalado} de {total} instalados
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${completion}%` }} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {STATUS_FLOW.slice(0, 4).map((status) => (
                  <StatusPill key={status} status={status} value={stats[status]} />
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Produção em andamento
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">Calhas em produção</h2>
                </div>
                <Link
                  href="/calhas"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Ver produção <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <ProductionTable ambientes={producaoEmAndamento} />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Atividades recentes
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">Últimas atualizações</h2>
                </div>
                <Link
                  href="/medicoes"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Ver tudo <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <RecentList ambientes={recentAmbientes} />
            </div>

            {/* Kanban Board - Full Width */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Visão consolidada
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">Quadro Kanban</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Em andamento</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    <span>Finalizado</span>
                  </div>
                </div>
              </div>
              <KanbanBoard
                ambientes={filteredAmbientes}
                loading={loading}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Catálogo de produtos
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">Inventário interno</h2>
                </div>
                <Sparkles className="w-4 h-4 text-slate-500" />
              </div>
              <CatalogSummary total={totalCatalogo} summary={catalogSummary} />
              <Link
                href="/produtos"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Gerenciar catálogo
              </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Obras em destaque
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">Projetos ativos</h2>
                </div>
                <Link
                  href="/obras"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Ver todas <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {activeObras.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-slate-600">Nenhuma obra ativa</p>
                    <p className="text-xs text-slate-400 mt-1">Cadastre uma nova obra para começar.</p>
                  </div>
                )}
                {activeObras.map((obra) => (
                  <div
                    key={obra._id}
                    className="rounded-xl border border-slate-100 px-4 py-3 bg-slate-50 hover:bg-white transition shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{obra.nome}</p>
                        <p className="text-xs text-slate-500">
                          Cliente: {obra.cliente ?? "Não informado"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>Status: <span className="capitalize">{obra.status ?? "indefinido"}</span></p>
                        <p>
                          Ambientes:{" "}
                          {ambientes.filter((amb) => amb.obraId === obra._id).length}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Equipe envolvida
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Colaboradores da obra
                  </h2>
                </div>
                <Sparkles className="w-4 h-4 text-slate-500" />
              </div>
              <CollaboratorsList colaboradores={colaboradores} totalAmbientes={totalAmbientesObra} />
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  subtitle?: string;
  accent?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${
        accent ?? "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-wide font-semibold ${accent ? "text-white/80" : "text-slate-500"}`}>
            {label}
          </p>
          <p className={`text-3xl font-bold mt-1 ${accent ? "text-white" : "text-slate-900"}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${accent ? "text-white/70" : "text-slate-500"}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            accent ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status, value }: { status: AmbienteStatus; value: number }) {
  const config = DASHBOARD_STATUS_BADGES[status];
  return (
    <div className="rounded-2xl border border-slate-100 px-4 py-3 bg-slate-50 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{config.label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>{config.icon}</div>
    </div>
  );
}

function ProductionTable({ ambientes }: { ambientes: Ambiente[] }) {
  if (ambientes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        Nenhuma calha em produção no momento.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="text-left py-2">Código</th>
            <th className="text-left py-2">Ambiente</th>
            <th className="text-left py-2">Responsável</th>
            <th className="text-left py-2">Atualizado</th>
          </tr>
        </thead>
        <tbody>
          {ambientes.map((amb) => (
            <tr key={amb._id} className="border-t border-slate-100">
              <td className="py-2 font-semibold text-slate-900">{amb.codigo}</td>
              <td className="py-2 text-slate-600">{amb.quarto ?? "Ambiente"}</td>
              <td className="py-2 text-slate-600">
                {amb.producaoCalhaResponsavel ? "Equipe de calhas" : "Aguardando"}
              </td>
              <td className="py-2 text-slate-500 text-xs">{formatDate(amb.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentList({ ambientes }: { ambientes: Ambiente[] }) {
  if (ambientes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        Nenhuma atividade recente registrada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ambientes.map((amb) => (
        <div
          key={amb._id}
          className="rounded-xl border border-slate-100 px-4 py-3 bg-slate-50 hover:bg-white transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{amb.codigo}</p>
              <p className="text-xs text-slate-500">{amb.quarto ?? "Ambiente sem nome"}</p>
            </div>
            <StatusBadge status={amb.status} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Atualizado {formatDate(amb.updatedAt)} por {amb.medidoPor ?? "Usuário"}
          </p>
        </div>
      ))}
    </div>
  );
}

function CatalogSummary({
  total,
  summary,
}: {
  total: number;
  summary: Record<string, number>;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-100 px-4 py-3 bg-slate-50 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Total de produtos</p>
          <p className="text-2xl font-bold text-slate-900">{total}</p>
        </div>
        <Package className="w-5 h-5 text-slate-500" />
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-slate-600">
        <div className="rounded-xl border border-slate-100 px-3 py-2 bg-white text-center">
          <p>Calhas</p>
          <p className="text-lg text-slate-900">{summary.calha ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 px-3 py-2 bg-white text-center">
          <p>Cortinados</p>
          <p className="text-lg text-slate-900">{summary.cortinado ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 px-3 py-2 bg-white text-center">
          <p>Acessórios</p>
          <p className="text-lg text-slate-900">{summary.acessorio ?? 0}</p>
        </div>
      </div>
    </div>
  );
}

function CollaboratorsList({
  colaboradores,
  totalAmbientes,
}: {
  colaboradores: Responsavel[];
  totalAmbientes: number;
}) {
  if (!colaboradores || colaboradores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        Nenhum colaborador vinculado a esta obra.
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    gerente: "Gerente",
    instalador: "Instalador",
    producao: "Produção",
  };

  return (
    <div className="space-y-3">
      {colaboradores.map((colab) => (
        <div
          key={colab.userId}
          className="rounded-xl border border-slate-100 px-4 py-3 bg-slate-50 flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">{colab.nome}</p>
            <p className="text-xs text-slate-500">{roleLabel[colab.role] ?? colab.role}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Ambientes: {totalAmbientes}</p>
            <p>Responsável pela obra</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Ambiente["status"] }) {
  const safeStatus = (status ?? "medicao_pendente") as AmbienteStatus;
  const config =
    DASHBOARD_STATUS_BADGES[safeStatus] ?? DASHBOARD_STATUS_BADGES.medicao_pendente;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${config.bg} ${config.text}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `Há ${minutes} min`;
  if (hours < 24) return `Há ${hours}h`;
  if (days < 7) return `Há ${days}d`;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
