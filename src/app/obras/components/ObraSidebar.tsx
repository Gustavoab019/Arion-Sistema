"use client";

import {
  AlertCircle,
  Building2,
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
  selectedObraId,
  onSelectObra,
  getStatusColor,
  statusLabels,
}: ObraSidebarProps) {
  return (
    <aside className="w-full lg:w-80 xl:w-96 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 flex-shrink-0">
      {/* Header da Sidebar */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Obras</h2>
            <p className="text-xs text-slate-500">{obras.length} {obras.length === 1 ? 'projeto' : 'projetos'}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar obra ou cliente..."
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusFiltroChange(option.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                statusFiltro === option.value
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
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
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 px-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">Nenhuma obra encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {obras.map((obra) => {
              const isSelected = selectedObraId === obra._id;
              const color = getStatusColor(obra.status);

              return (
                <div
                  key={obra._id}
                  onClick={() => onSelectObra(obra._id)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    isSelected
                      ? "bg-slate-900 border-slate-900 shadow-lg shadow-slate-900/10"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className={`font-bold text-sm mb-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {obra.nome}
                      </h3>
                      {obra.cliente && (
                        <p className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {obra.cliente}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[0.7rem] px-2.5 py-1 rounded-lg font-semibold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : color === "emerald"
                            ? "bg-emerald-100 text-emerald-700"
                            : color === "amber"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statusLabels.find((s) => s.value === obra.status)?.label || "Ativo"}
                      </span>

                      {obra.responsaveis && obra.responsaveis.length > 0 && (
                        <div className={`flex items-center gap-1.5 text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-medium">{obra.responsaveis.length}</span>
                        </div>
                      )}

                      {obra.andarInicial !== undefined &&
                        obra.andarFinal !== undefined && (
                          <div className={`flex items-center gap-1.5 text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            <Layers className="w-3.5 h-3.5" />
                            <span className="font-medium">
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
