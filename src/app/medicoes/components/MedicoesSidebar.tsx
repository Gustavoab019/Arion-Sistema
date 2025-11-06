"use client";

import { Search, X, Trash2 } from "lucide-react";
import { Ambiente } from "../types";
import { Bed, Bath, ChefHat, Sofa, Trees } from "lucide-react";

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
  const ambientesFiltrados = ambientes.filter((amb) =>
    amb.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit max-h-[calc(100vh-160px)] flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Ambientes do quarto {quarto}
            </h2>
            <p className="text-xs text-slate-400">
              {ambientes.length} cadastrado{ambientes.length !== 1 ? "s" : ""}
            </p>
          </div>
          {loading && (
            <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
          )}
        </div>

        {/* busca */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchTerm}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Buscar código..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => onChangeSearch("")}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-3 overflow-y-auto scrollbar-thin pr-1 flex-1">
          {ambientesFiltrados.length === 0 ? (
            <p className="text-xs text-slate-400">
              {searchTerm
                ? "Nenhum ambiente com esse código."
                : "Nenhum ambiente salvo ainda."}
            </p>
          ) : (
            ambientesFiltrados.map((amb) => {
              const p = PREFIXOS.find((x) => x.value === amb.prefixo);
              const isSelected = selectedId === amb._id;
              return (
                <div
                  key={amb._id}
                  className={`rounded-xl border px-3 py-2.5 ${
                    isSelected
                      ? "border-slate-900 bg-slate-900/5"
                      : "border-slate-200 bg-white/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => onSelect(amb)}
                      className="flex items-center gap-2 text-left"
                    >
                      <span
                        className={`w-7 h-7 rounded-lg ${
                          isSelected ? "bg-slate-900" : "bg-slate-200"
                        }  flex items-center justify-center text-[0.6rem] font-semibold ${
                          isSelected ? "text-white" : "text-slate-700"
                        }`}
                      >
                        {p?.value || amb.prefixo}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 leading-tight">
                          {amb.codigo}
                        </p>
                        <p className="text-[0.6rem] text-slate-400 leading-tight">
                          {amb.medidas?.instalacao || "sem instalação"}
                        </p>
                        {amb.medidoPor && (
                          <p className="text-[0.6rem] text-slate-400 leading-tight">
                            Medido por {amb.medidoPor}
                          </p>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(amb._id)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[0.6rem] text-slate-400">
                      {amb.medidas?.largura ?? "-"} x {amb.medidas?.altura ?? "-"}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onChangeStatus(amb._id, "pendente")}
                        className={`px-2 py-0.5 rounded-full text-[0.55rem] ${
                          amb.status === "pendente"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        pendente
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeStatus(amb._id, "revisar")}
                        className={`px-2 py-0.5 rounded-full text-[0.55rem] ${
                          amb.status === "revisar"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        revisar
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeStatus(amb._id, "completo")}
                        className={`px-2 py-0.5 rounded-full text-[0.55rem] ${
                          amb.status === "completo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        ok
                      </button>
                    </div>
                  </div>

                  {amb.observacoes && (
                    <p className="text-[0.6rem] text-slate-500 line-clamp-2">
                      {amb.observacoes}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
