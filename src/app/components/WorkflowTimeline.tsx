"use client";

import { CheckCircle2, Clock, Circle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AmbienteStatus =
  | "medicao_pendente"
  | "aguardando_validacao"
  | "em_producao"
  | "producao_calha"
  | "producao_cortina"
  | "estoque_deposito"
  | "em_transito"
  | "aguardando_instalacao"
  | "instalado";

type WorkflowTimestamp = {
  validadoEm?: Date | string;
  producaoCalhaInicio?: Date | string;
  producaoCalhaFim?: Date | string;
  producaoCortinaInicio?: Date | string;
  producaoCortinaFim?: Date | string;
  depositoEntrada?: Date | string;
  depositoSaida?: Date | string;
  expedicaoSaida?: Date | string;
  instalacaoInicio?: Date | string;
  instalacaoFim?: Date | string;
};

type TimelineEvent = {
  status: string;
  label: string;
  timestamp?: Date | string;
  userNome?: string;
  completed: boolean;
  current: boolean;
};

type WorkflowTimelineProps = {
  workflow?: WorkflowTimestamp;
  currentStatus?: AmbienteStatus;
  logs?: Array<{
    status: string;
    createdAt: Date | string;
    userNome?: string;
  }>;
  compact?: boolean;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; workflowKey?: keyof WorkflowTimestamp }
> = {
  medicao_pendente: { label: "Medição Pendente" },
  aguardando_validacao: { label: "Aguardando Validação", workflowKey: "validadoEm" },
  em_producao: { label: "Em Produção" },
  producao_calha: {
    label: "Produção Calha",
    workflowKey: "producaoCalhaInicio",
  },
  producao_cortina: {
    label: "Produção Cortina",
    workflowKey: "producaoCortinaInicio",
  },
  estoque_deposito: { label: "Depósito", workflowKey: "depositoEntrada" },
  em_transito: { label: "Expedição", workflowKey: "expedicaoSaida" },
  aguardando_instalacao: {
    label: "Aguardando Instalação",
    workflowKey: "instalacaoInicio",
  },
  instalado: { label: "Instalado", workflowKey: "instalacaoFim" },
};

function formatDate(date: Date | string | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "";
  }
}

function getTimelineEvents(
  logs: WorkflowTimelineProps["logs"],
  workflow: WorkflowTimestamp | undefined,
  currentStatus: AmbienteStatus | undefined
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const current = currentStatus ?? "medicao_pendente";

  // Build events from logs
  if (logs && logs.length > 0) {
    logs.forEach((log) => {
      const config = STATUS_CONFIG[log.status];
      if (config) {
        events.push({
          status: log.status,
          label: config.label,
          timestamp: log.createdAt,
          userNome: log.userNome,
          completed: true,
          current: log.status === current,
        });
      }
    });
  }

  // Add workflow timestamps for detailed view
  if (workflow) {
    Object.entries(STATUS_CONFIG).forEach(([status, config]) => {
      if (config.workflowKey && workflow[config.workflowKey]) {
        // Check if we don't already have this from logs
        const existingEvent = events.find((e) => e.status === status);
        if (!existingEvent) {
          events.push({
            status,
            label: config.label,
            timestamp: workflow[config.workflowKey],
            completed: true,
            current: status === current,
          });
        }
      }
    });
  }

  // Sort by timestamp (most recent first for display)
  events.sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    const dateA = typeof a.timestamp === "string" ? new Date(a.timestamp) : a.timestamp;
    const dateB = typeof b.timestamp === "string" ? new Date(b.timestamp) : b.timestamp;
    return dateB.getTime() - dateA.getTime();
  });

  return events;
}

export function WorkflowTimeline({
  workflow,
  currentStatus,
  logs,
  compact = false,
}: WorkflowTimelineProps) {
  const events = getTimelineEvents(logs, workflow, currentStatus);

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        Nenhum histórico de workflow disponível
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {events.slice(0, 3).map((event, idx) => (
          <div
            key={`${event.status}-${idx}`}
            className="flex items-center gap-2 text-xs"
          >
            {event.current ? (
              <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            )}
            <span
              className={`flex-1 truncate ${
                event.current ? "font-medium text-slate-900" : "text-slate-600"
              }`}
            >
              {event.label}
            </span>
            {event.timestamp && (
              <span className="text-slate-400 text-[0.65rem]">
                {formatDate(event.timestamp)}
              </span>
            )}
          </div>
        ))}
        {events.length > 3 && (
          <p className="text-[0.65rem] text-slate-400 text-center pt-1">
            +{events.length - 3} eventos anteriores
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Histórico do Workflow
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />

        {/* Events */}
        <div className="space-y-4">
          {events.map((event, idx) => {
            const Icon = event.current ? Clock : event.completed ? CheckCircle2 : Circle;
            const iconColor = event.current
              ? "text-amber-500 bg-amber-50"
              : event.completed
              ? "text-emerald-500 bg-emerald-50"
              : "text-slate-300 bg-slate-50";

            return (
              <div key={`${event.status}-${idx}`} className="relative pl-10">
                {/* Icon */}
                <div
                  className={`absolute left-0 w-8 h-8 rounded-full ${iconColor} flex items-center justify-center z-10`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div
                  className={`rounded-xl border p-3 ${
                    event.current
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-sm font-semibold ${
                          event.current ? "text-amber-900" : "text-slate-900"
                        }`}
                      >
                        {event.label}
                      </h4>
                      {event.timestamp && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(event.timestamp)}
                        </p>
                      )}
                      {event.userNome && (
                        <p className="text-xs text-slate-400 mt-1">
                          Por <span className="font-medium">{event.userNome}</span>
                        </p>
                      )}
                    </div>
                    {event.current && (
                      <span className="flex-shrink-0 text-[0.65rem] uppercase tracking-wide font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Atual
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflow details */}
      {workflow && Object.keys(workflow).length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Detalhes do Workflow
          </h4>
          <div className="grid gap-2 text-xs">
            {workflow.producaoCalhaInicio && (
              <div className="flex justify-between">
                <span className="text-slate-600">Início Produção Calha:</span>
                <span className="font-medium text-slate-900">
                  {formatDate(workflow.producaoCalhaInicio)}
                </span>
              </div>
            )}
            {workflow.producaoCalhaFim && (
              <div className="flex justify-between">
                <span className="text-slate-600">Fim Produção Calha:</span>
                <span className="font-medium text-slate-900">
                  {formatDate(workflow.producaoCalhaFim)}
                </span>
              </div>
            )}
            {workflow.producaoCortinaInicio && (
              <div className="flex justify-between">
                <span className="text-slate-600">Início Produção Cortina:</span>
                <span className="font-medium text-slate-900">
                  {formatDate(workflow.producaoCortinaInicio)}
                </span>
              </div>
            )}
            {workflow.producaoCortinaFim && (
              <div className="flex justify-between">
                <span className="text-slate-600">Fim Produção Cortina:</span>
                <span className="font-medium text-slate-900">
                  {formatDate(workflow.producaoCortinaFim)}
                </span>
              </div>
            )}
            {workflow.depositoEntrada && (
              <div className="flex justify-between">
                <span className="text-slate-600">Entrada Depósito:</span>
                <span className="font-medium text-slate-900">
                  {formatDate(workflow.depositoEntrada)}
                </span>
              </div>
            )}
            {workflow.depositoSaida && (
              <div className="flex justify-between">
                <span className="text-slate-600">Saída Depósito:</span>
                <span className="font-medium text-slate-900">
                  {formatDate(workflow.depositoSaida)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
