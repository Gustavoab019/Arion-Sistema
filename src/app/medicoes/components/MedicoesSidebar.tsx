"use client";

import { Search, X, Trash2, Edit2, MoreVertical } from "lucide-react";
import { Ambiente } from "../types";
import { Bed, Bath, ChefHat, Sofa, Trees } from "lucide-react";
import { useState } from "react";

const PREFIXOS = [
  { value: "QT", label: "Quarto", icon: Bed },
  { value: "SA", label: "Sala", icon: Sofa },
  { value: "COZ", label: "Cozinha", icon: ChefHat },
  { value: "VAR", label: "Varanda", icon: Trees },
  { value: "BAN", label: "Banheiro", icon: Bath },
];

type MedicoesSidebarProps = {
  loading: boolean;
  quarto: string;
  searchTerm: string;
  onChangeSearch: (v: string) => void;
  ambientes: Ambiente[];
  selectedId: string | null;
  onSelect: (amb: Ambiente) => void;
  onDelete: (id: string) => void;
  onChangeStatus: (id: string, status: Ambiente["status"]) => void;
};

export function MedicoesSidebar({
  loading,
  quarto,
  searchTerm,
  onChangeSearch,
  ambientes,
  selectedId,
  onSelect,
  onDelete,
  onChangeStatus,
}: MedicoesSidebarProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const ambientesFiltrados = ambientes.filter((amb) =>
    amb.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusConfig = {
    pendente: { bg: "bg-amber-500", text: "text-amber-700", label: "Pendente" },
    revisar: { bg: "bg-red-500", text: "text-red-700", label: "Revisar" },
    completo: { bg: "bg-emerald-500", text: "text-emerald-700", label: "Completo" },
  };

  return (
    <aside className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header fixo */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Quarto {quarto}
              </h2>
              <p className="text-xs text-slate-500">
                {ambientes.length} ambiente{ambientes.length !== 1 ? "s" : ""}
              </p>
            </div>
            {loading && (
              <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            )}
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Buscar código..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder-slate-400 transition"
            />
            {searchTerm && (
              <button
                onClick={() => onChangeSearch("")}
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Lista scrollável */}
        <div className="p-4 space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto">
          {ambientesFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">
                {searchTerm
                  ? "Nenhum ambiente encontrado"
                  : "Nenhum ambiente cadastrado"}
              </p>
            </div>
          ) : (
            ambientesFiltrados.map((amb) => {
              const p = PREFIXOS.find((x) => x.value === amb.prefixo);
              const Icon = p?.icon || Bed;
              const isSelected = selectedId === amb._id;
              const status = statusConfig[amb.status || "pendente"];
              const isMenuOpen = menuOpenId === amb._id;

              return (
                <div
                  key={amb._id}
                  className={`group relative rounded-xl border transition-all ${
                    isSelected
                      ? "border-slate-900 bg-slate-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {/* Header do card */}
                  <button
                    type="button"
                    onClick={() => onSelect(amb)}
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Ícone */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                          isSelected
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">
                              {amb.codigo}
                            </h3>
                            <p className="text-xs text-slate-500 capitalize">
                              {amb.medidas?.instalacao || "Sem instalação"}
                            </p>
                          </div>

                          {/* Status badge */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className={`w-1.5 h-1.5 rounded-full ${status.bg}`} />
                            <span className={`text-xs font-medium ${status.text}`}>
                              {status.label}
                            </span>
                          </div>
                        </div>

                        {/* Medidas destacadas */}
                        {(amb.medidas?.largura || amb.medidas?.altura) && (
                          <div className="flex items-center gap-3 mt-2 p-2 bg-slate-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-[0.65rem] text-slate-500 uppercase tracking-wide">
                                Largura
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {amb.medidas?.largura ?? "-"} cm
                              </p>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div className="flex-1">
                              <p className="text-[0.65rem] text-slate-500 uppercase tracking-wide">
                                Altura
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {amb.medidas?.altura ?? "-"} cm
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Medido por */}
                        {amb.medidoPor && (
                          <p className="text-xs text-slate-400 mt-2">
                            Medido por <span className="font-medium">{amb.medidoPor}</span>
                          </p>
                        )}

                        {/* Observações */}
                        {amb.observacoes && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic">
                            &ldquo;{amb.observacoes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Actions footer */}
                  <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Status buttons */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeStatus(amb._id, "pendente");
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                          amb.status === "pendente"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                        title="Marcar como pendente"
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeStatus(amb._id, "revisar");
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                          amb.status === "revisar"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                        title="Marcar para revisar"
                      >
                        R
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeStatus(amb._id, "completo");
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                          amb.status === "completo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                        title="Marcar como completo"
                      >
                        ✓
                      </button>
                    </div>

                    {/* Menu actions */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : amb._id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div className="absolute right-0 bottom-full mb-1 z-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(amb);
                                setMenuOpenId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(amb._id);
                                setMenuOpenId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
