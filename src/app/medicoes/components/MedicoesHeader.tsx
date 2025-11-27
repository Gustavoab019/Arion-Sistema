"use client";

import { ChevronLeft, ChevronRight, Loader2, Ruler } from "lucide-react";
import type { Obra, AmbienteStatus } from "../types";

type StatusSummary = Record<AmbienteStatus, number>;

type MedicoesHeaderProps = {
  obras: Obra[];
  obraId: string;
  obraSelecionada?: Obra | null;
  onChangeObra: (id: string) => void;
  andar: string;
  onChangeAndar: (andar: string) => void;
  quarto: string;
  onChangeQuarto: (q: string) => void;
  onPrevQuarto: () => void;
  onNextQuarto: () => void;
  codigoPreview: string;
  stats: StatusSummary;
  totalAmbientes: number;
  loadingAmbientes: boolean;
};

const STATUS_TAGS: Array<{ key: AmbienteStatus; label: string }> = [
  { key: "medicao_pendente", label: "Medir" },
  { key: "aguardando_validacao", label: "Validar" },
  { key: "em_producao", label: "Produção" },
  { key: "producao_calha", label: "Calha" },
  { key: "producao_cortina", label: "Cortina" },
  { key: "estoque_deposito", label: "Depósito" },
  { key: "em_transito", label: "Expedição" },
  { key: "aguardando_instalacao", label: "Instalar" },
  { key: "instalado", label: "Finalizado" },
];

export function MedicoesHeader({
  obras,
  obraId,
  obraSelecionada,
  onChangeObra,
  andar,
  onChangeAndar,
  quarto,
  onChangeQuarto,
  onPrevQuarto,
  onNextQuarto,
  codigoPreview,
  stats,
  totalAmbientes,
  loadingAmbientes,
}: MedicoesHeaderProps) {
  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Medições em andamento
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={obraId}
                  onChange={(e) => onChangeObra(e.target.value)}
                  className="text-base font-semibold text-slate-900 bg-transparent outline-none border-b border-slate-200 pb-0.5"
                >
                  {obras.map((obra) => (
                    <option key={obra._id} value={obra._id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">
                  {totalAmbientes} ambiente{totalAmbientes === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          {STATUS_TAGS.map((status) => (
            <span
              key={status.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700"
            >
              {stats[status.key] ?? 0}
              <span className="text-[0.7rem] uppercase tracking-wide text-slate-500">
                {status.label}
              </span>
            </span>
          ))}
          {loadingAmbientes && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-500 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Atualizando
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Quarto / unidade</span>
            <span className="text-slate-400">Navegação rápida</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevQuarto}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              value={quarto}
              onChange={(e) => onChangeQuarto(e.target.value)}
              className="flex-1 text-center text-lg font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
            />
            <button
              onClick={onNextQuarto}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Andar / torre
          </p>
          <select
            value={andar}
            onChange={(e) => onChangeAndar(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-base font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}º andar
              </option>
            ))}
          </select>
          {obraSelecionada?.andarInicial !== undefined &&
            obraSelecionada?.andarFinal !== undefined && (
              <p className="text-xs text-slate-500">
                Obra: {obraSelecionada.andarInicial}º a {obraSelecionada.andarFinal}º
              </p>
            )}
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-900 text-white p-4 flex flex-col gap-3 shadow-lg">
          <p className="text-[0.7rem] uppercase text-white/70 font-semibold">
            Código sugerido
          </p>
          <p className="text-2xl font-mono font-bold tracking-wide">{codigoPreview}</p>
          <p className="text-[0.7rem] text-white/70">
            Use este código para registrar o ambiente e manter o histórico alinhado.
          </p>
          {obraSelecionada?.observacoes && (
            <p className="text-xs text-white/60 italic border-t border-white/10 pt-2">
              {obraSelecionada.observacoes}
            </p>
          )}
        </div>
      </div>
    </div>
  </section>
  );
}
