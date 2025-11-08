"use client";

import { Building2, Plus } from "lucide-react";

type ObrasHeaderProps = {
  total: number;
  onNewObra: () => void;
  canManage: boolean;
};

export function ObrasHeader({ total, onNewObra, canManage }: ObrasHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Gestão de Obras</h1>
              <p className="text-xs text-slate-500">
                {total} {total === 1 ? "obra" : "obras"}
              </p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={onNewObra}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Nova Obra
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
