"use client";

import { useState } from "react";
import { Clock, MapPin, User, MoreVertical } from "lucide-react";
import type { Ambiente, AmbienteStatus } from "@/src/app/medicoes/types";

type KanbanColumn = {
  status: AmbienteStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    status: "medicao_pendente",
    label: "Medição",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    status: "aguardando_validacao",
    label: "Validação",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  {
    status: "producao_calha",
    label: "Calha",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    status: "producao_cortina",
    label: "Cortina",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    status: "estoque_deposito",
    label: "Depósito",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
  {
    status: "em_transito",
    label: "Expedição",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    status: "aguardando_instalacao",
    label: "Instalação",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  {
    status: "instalado",
    label: "Concluído",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
];

type KanbanBoardProps = {
  ambientes: Ambiente[];
  onSelectAmbiente?: (ambiente: Ambiente) => void;
  loading?: boolean;
};

export function KanbanBoard({
  ambientes,
  onSelectAmbiente,
  loading = false,
}: KanbanBoardProps) {
  const [expandedColumn, setExpandedColumn] = useState<AmbienteStatus | null>(null);

  // Group ambientes by status
  const groupedAmbientes = KANBAN_COLUMNS.reduce((acc, column) => {
    acc[column.status] = ambientes.filter(
      (amb) => (amb.status ?? "medicao_pendente") === column.status
    );
    return acc;
  }, {} as Record<AmbienteStatus, Ambiente[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-sm">Carregando quadro kanban...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-flex gap-4 min-w-full">
        {KANBAN_COLUMNS.map((column) => {
          const items = groupedAmbientes[column.status] || [];
          const isExpanded = expandedColumn === column.status;
          const displayLimit = isExpanded ? items.length : 5;

          return (
            <div
              key={column.status}
              className="flex-shrink-0 w-72 flex flex-col"
            >
              {/* Column Header */}
              <div
                className={`${column.bgColor} ${column.borderColor} border-2 rounded-t-xl p-3 flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-sm ${column.color}`}>
                    {column.label}
                  </h3>
                  <span
                    className={`${column.bgColor} ${column.color} text-xs font-bold px-2 py-0.5 rounded-full border ${column.borderColor}`}
                  >
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div
                className={`${column.bgColor} ${column.borderColor} border-2 border-t-0 rounded-b-xl p-2 flex-1 space-y-2 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto`}
              >
                {items.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-xs">
                    Nenhum ambiente
                  </div>
                ) : (
                  <>
                    {items.slice(0, displayLimit).map((ambiente) => (
                      <div
                        key={ambiente._id}
                        onClick={() => onSelectAmbiente?.(ambiente)}
                        className="w-full bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-all cursor-pointer group"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-slate-900 truncate flex-1">
                            {ambiente.codigo}
                          </h4>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              // Menu actions could be added here
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                          >
                            <MoreVertical className="w-3 h-3 text-slate-400" />
                          </div>
                        </div>

                        {/* Obra info */}
                        {ambiente.obraId && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {typeof ambiente.obraId === "string"
                                ? ambiente.obraId
                                : "Obra"}
                            </span>
                          </div>
                        )}

                        {/* Measurements */}
                        {(ambiente.medidas?.largura || ambiente.medidas?.altura) && (
                          <div className="flex gap-2 text-xs bg-slate-50 rounded p-2 mb-2">
                            {ambiente.medidas?.largura && (
                              <div className="flex-1">
                                <span className="text-slate-500">L:</span>
                                <span className="font-medium text-slate-900 ml-1">
                                  {ambiente.medidas.largura}cm
                                </span>
                              </div>
                            )}
                            {ambiente.medidas?.altura && (
                              <div className="flex-1">
                                <span className="text-slate-500">A:</span>
                                <span className="font-medium text-slate-900 ml-1">
                                  {ambiente.medidas.altura}cm
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Responsible person */}
                        {ambiente.medidoPor && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{ambiente.medidoPor}</span>
                          </div>
                        )}

                        {/* Timestamp */}
                        {ambiente.updatedAt && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>
                              {new Date(ambiente.updatedAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Show more button */}
                    {items.length > 5 && (
                      <button
                        onClick={() =>
                          setExpandedColumn(isExpanded ? null : column.status)
                        }
                        className={`w-full py-2 text-xs font-medium ${column.color} hover:bg-white/50 rounded-lg transition`}
                      >
                        {isExpanded
                          ? "Mostrar menos"
                          : `Ver mais ${items.length - 5}`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
