"use client";

import { Building2, ChevronLeft, ChevronRight, Hash, Ruler } from "lucide-react";
import { Obra } from "../types";

type MedicoesHeaderProps = {
  obras: Obra[];
  obraId: string;
  onChangeObra: (id: string) => void;
  andar: string;
  onChangeAndar: (andar: string) => void;
  quarto: string;
  onChangeQuarto: (q: string) => void;
  onPrevQuarto: () => void;
  onNextQuarto: () => void;
  codigoPreview: string;
};

export function MedicoesHeader({
  obras,
  obraId,
  onChangeObra,
  andar,
  onChangeAndar,
  quarto,
  onChangeQuarto,
  onPrevQuarto,
  onNextQuarto,
  codigoPreview,
}: MedicoesHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">Medições</h1>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={obraId}
                onChange={(e) => onChangeObra(e.target.value)}
                className="bg-transparent text-xs text-slate-700 outline-none border-b border-slate-200"
              >
                {obras.length === 0 && <option>Carregando...</option>}
                {obras.map((obra) => (
                  <option key={obra._id} value={obra._id}>
                    {obra.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={andar}
            onChange={(e) => onChangeAndar(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none"
          >
            <option value="1">1º andar</option>
            <option value="2">2º andar</option>
            <option value="3">3º andar</option>
            <option value="4">4º andar</option>
            <option value="5">5º andar</option>
          </select>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button type="button" onClick={onPrevQuarto} className="p-2 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div className="px-4 py-1.5 border-x border-slate-200 text-center">
              <p className="text-[0.6rem] uppercase tracking-wide text-slate-400">Quarto</p>
              <input
                value={quarto}
                onChange={(e) => onChangeQuarto(e.target.value)}
                className="w-16 text-center text-sm font-semibold text-slate-800 bg-transparent outline-none"
              />
            </div>
            <button type="button" onClick={onNextQuarto} className="p-2 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 text-white rounded-lg px-3 py-1.5">
            <Hash className="w-4 h-4" />
            <span className="text-xs font-mono">{codigoPreview}</span>
          </div>
        </div>
      </div>
    </header>
  );
}