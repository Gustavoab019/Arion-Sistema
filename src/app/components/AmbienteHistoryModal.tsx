"use client";

import { useMemo } from "react";
import { X, History, UserCircle, Clock3, MapPin, Layers } from "lucide-react";
import { WorkflowTimeline } from "@/src/app/components/WorkflowTimeline";
import type { Ambiente, AmbienteStatus } from "@/src/app/medicoes/types";

type AmbienteHistoryModalProps = {
  ambiente: Ambiente;
  onClose: () => void;
};

const STATUS_META: Record<
  AmbienteStatus,
  { label: string; badgeBg: string; badgeText: string }
> = {
  medicao_pendente: {
    label: "Medição pendente",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
  },
  aguardando_validacao: {
    label: "Aguardando validação",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800",
  },
  em_producao: {
    label: "Em produção",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
  producao_calha: {
    label: "Produção calha",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
  },
  producao_cortina: {
    label: "Produção cortina",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
  },
  estoque_deposito: {
    label: "Depósito",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
  em_transito: {
    label: "Expedição",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
  },
  aguardando_instalacao: {
    label: "Fila de instalação",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
  },
  instalado: {
    label: "Instalado",
    badgeBg: "bg-slate-200",
    badgeText: "text-slate-900",
  },
};

const STATUS_SEQUENCE: AmbienteStatus[] = [
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

const formatDateTime = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const findLastLog = (logs: Ambiente["logs"], status: AmbienteStatus) => {
  if (!logs?.length) return null;
  for (let i = logs.length - 1; i >= 0; i -= 1) {
    if (logs[i].status === status) {
      return logs[i];
    }
  }
  return null;
};

export function AmbienteHistoryModal({ ambiente, onClose }: AmbienteHistoryModalProps) {
  const status = (ambiente.status ?? "medicao_pendente") as AmbienteStatus;
  const statusMeta = STATUS_META[status];

  const responsaveis = useMemo(() => {
    const entries: Array<{
      label: string;
      user?: string;
      date?: string;
    }> = [];

    if (ambiente.medidoPor) {
      entries.push({
        label: "Medição",
        user: ambiente.medidoPor,
        date: formatDateTime(ambiente.createdAt),
      });
    }

    const workflowAssignments: Array<{ label: string; status: AmbienteStatus }> = [
      { label: "Validação / Gerente", status: "aguardando_validacao" },
      { label: "Produção calha", status: "producao_calha" },
      { label: "Produção cortina", status: "producao_cortina" },
      { label: "Depósito", status: "estoque_deposito" },
      { label: "Expedição", status: "em_transito" },
      { label: "Instalação", status: "aguardando_instalacao" },
      { label: "Finalização", status: "instalado" },
    ];

    workflowAssignments.forEach(({ label, status: target }) => {
      const log = findLastLog(ambiente.logs, target);
      if (log) {
        entries.push({
          label,
          user: log.userNome ?? "Usuário",
          date: formatDateTime(log.createdAt),
        });
      }
    });

    return entries;
  }, [ambiente.logs, ambiente.medidoPor, ambiente.createdAt]);

  const detailRows = [
    { label: "Obra", value: ambiente.obra ?? "—", icon: History },
    { label: "Ambiente", value: ambiente.quarto ?? "—", icon: MapPin },
    {
      label: "Medidas",
      value:
        ambiente.medidas?.largura && ambiente.medidas?.altura
          ? `${ambiente.medidas.largura} x ${ambiente.medidas.altura} cm`
          : "Não informado",
      icon: Layers,
    },
    {
      label: "Atualizado em",
      value: formatDateTime(ambiente.updatedAt) ?? "Não registrado",
      icon: Clock3,
    },
  ];

  const orderedLogs = (ambiente.logs ?? []).slice().sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return bDate - aDate;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-slate-400 tracking-wide">Histórico do ambiente</p>
            <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
              {ambiente.codigo}
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${statusMeta.badgeBg} ${statusMeta.badgeText}`}
              >
                {statusMeta.label}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            {detailRows.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 bg-slate-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400 tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-slate-900">{value}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-100 p-5">
            <WorkflowTimeline workflow={ambiente.workflow} currentStatus={status} logs={ambiente.logs} />
          </section>

          <section className="rounded-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <UserCircle className="w-5 h-5 text-slate-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wide">Responsáveis registrados</h3>
            </div>
            {responsaveis.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum responsável identificado até o momento.</p>
            ) : (
              <ul className="space-y-3">
                {responsaveis.map((resp, index) => (
                  <li key={`${resp.label}-${index}`} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase text-slate-400 tracking-wide">{resp.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{resp.user ?? "Não informado"}</p>
                    </div>
                    <p className="text-xs text-slate-400">{resp.date ?? "Sem data"}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Linha do tempo detalhada
              </h3>
            </div>
            {orderedLogs.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                Nenhuma movimentação registrada para este ambiente.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {orderedLogs.map((log, index) => {
                  const label = STATUS_META[log.status as AmbienteStatus]?.label ?? log.status;
                  return (
                    <li key={`${log.status}-${index}-${log.createdAt}`} className="px-5 py-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-900">{label}</span>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(log.createdAt) ?? "Sem data"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Responsável: <span className="font-semibold">{log.userNome ?? "Usuário"}</span>
                      </p>
                      {log.mensagem && <p className="text-xs text-slate-400">{log.mensagem}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-dashed border-slate-200 p-5">
            <p className="text-xs uppercase text-slate-400 tracking-wide mb-2">
              Próximos passos do workflow
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_SEQUENCE.map((step) => {
                const meta = STATUS_META[step];
                const isDone =
                  step === status ||
                  Boolean(findLastLog(ambiente.logs, step)) ||
                  STATUS_SEQUENCE.indexOf(step) < STATUS_SEQUENCE.indexOf(status);

                return (
                  <span
                    key={step}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                      isDone
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
