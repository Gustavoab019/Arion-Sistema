"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Layers,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import { Obra, ObraStatus } from "../types";

type StatusFilterOption = { label: string; value: "todos" | ObraStatus };

type ObraSidebarProps = {
  busca: string;
  onBuscaChange: (value: string) => void;
  statusFiltro: "todos" | ObraStatus;
  onStatusFiltroChange: (value: "todos" | ObraStatus) => void;
  statusOptions: StatusFilterOption[];
  obras: Obra[];
  loading: boolean;
  errorMessage: string | null;
  obraAtivaId: string | null;
  selectedObraId: string | null;
  onSelectObra: (id: string) => void;
  getStatusColor: (status?: ObraStatus) => "emerald" | "amber" | "slate";
  statusLabels: { label: string; value: ObraStatus }[];
};

export function ObraSidebar({
  busca,
  onBuscaChange,
  statusFiltro,
  onStatusFiltroChange,
  statusOptions,
  obras,
  loading,
  errorMessage,
  obraAtivaId,
  selectedObraId,
  onSelectObra,
  getStatusColor,
  statusLabels,
}: ObraSidebarProps) {
  return (
    <aside className="w-96 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 space-y-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar obra ou cliente..."
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200 focus:border-slate-300 outline-none"
          />
        </div>

        <div className="flex gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusFiltroChange(option.value)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFiltro === option.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : errorMessage ? (
          <div className="p-4">
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{errorMessage}</p>
            </div>
          </div>
        ) : obras.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Building2 className="w-8 h-8 mb-2" />
            <p className="text-sm">Nenhuma obra encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {obras.map((obra) => {
              const isSelected = selectedObraId === obra._id;
              const isActive = obraAtivaId === obra._id;
              const color = getStatusColor(obra.status);

              return (
                <div
                  key={obra._id}
                  onClick={() => onSelectObra(obra._id)}
                  className={`p-4 cursor-pointer transition relative ${
                    isSelected
                      ? "bg-slate-50 border-l-4 border-l-slate-900"
                      : "hover:bg-slate-50 border-l-4 border-l-transparent"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[0.6rem] font-semibold">Ativa</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{obra.nome}</h3>
                      {obra.cliente && (
                        <p className="text-xs text-slate-500">{obra.cliente}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[0.65rem] px-2 py-0.5 rounded-full font-medium ${
                          color === "emerald"
                            ? "bg-emerald-100 text-emerald-700"
                            : color === "amber"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {statusLabels.find((s) => s.value === obra.status)?.label || "Ativo"}
                      </span>

                      {obra.responsaveis && obra.responsaveis.length > 0 && (
                        <div className="flex items-center gap-1 text-[0.65rem] text-slate-500">
                          <Users className="w-3 h-3" />
                          <span>{obra.responsaveis.length}</span>
                        </div>
                      )}

                      {obra.andarInicial !== undefined &&
                        obra.andarFinal !== undefined && (
                          <div className="flex items-center gap-1 text-[0.65rem] text-slate-500">
                            <Layers className="w-3 h-3" />
                            <span>
                              {obra.andarInicial === obra.andarFinal
                                ? `${obra.andarInicial}º andar`
                                : `${obra.andarInicial}º-${obra.andarFinal}º`}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
