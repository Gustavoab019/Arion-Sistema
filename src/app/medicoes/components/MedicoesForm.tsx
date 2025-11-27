"use client";

import {
  Bed,
  Bath,
  ChefHat,
  CheckCircle2,
  Plus,
  Sofa,
  Trees,
  Ruler,
  X,
  AlertCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  PrefixoItem,
  type Ambiente,
  type AmbienteStatus,
} from "../types";

const PREFIXOS: PrefixoItem[] = [
  { value: "QT", label: "Quarto", icon: Bed },
  { value: "SA", label: "Sala", icon: Sofa },
  { value: "COZ", label: "Cozinha", icon: ChefHat },
  { value: "VAR", label: "Varanda", icon: Trees },
  { value: "BAN", label: "Banheiro", icon: Bath },
];

type MedicoesFormProps = {
  selectedId: string | null;
  selectedAmbiente?: Ambiente | null;
  prefixo: string;
  onChangePrefixo: (p: string) => void;
  sequencia: number;
  onChangeSequencia: (n: number) => void;
  largura: string;
  onChangeLargura: (v: string) => void;
  altura: string;
  onChangeAltura: (v: string) => void;
  recuo: string;
  onChangeRecuo: (v: string) => void;
  instalacao: string;
  onChangeInstalacao: (v: string) => void;
  observacoes: string;
  onChangeObservacoes: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResetEdit: () => void;
  saving: boolean;
  saved: boolean;
  onFinalizeMedicao?: () => void;
  finalizandoMedicao?: boolean;
};

export function MedicoesForm({
  selectedId,
  selectedAmbiente,
  prefixo,
  onChangePrefixo,
  sequencia,
  onChangeSequencia,
  largura,
  onChangeLargura,
  altura,
  onChangeAltura,
  recuo,
  onChangeRecuo,
  instalacao,
  onChangeInstalacao,
  observacoes,
  onChangeObservacoes,
  onSubmit,
  onResetEdit,
  saving,
  saved,
  onFinalizeMedicao,
  finalizandoMedicao,
}: MedicoesFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const STATUS_LABELS: Record<AmbienteStatus, string> = {
    medicao_pendente: "Em medição",
    aguardando_validacao: "Aguardando validação",
    em_producao: "Liberado para produção",
    producao_calha: "Produção de calha",
    producao_cortina: "Produção de cortina",
    estoque_deposito: "Depósito",
    em_transito: "Expedição",
    aguardando_instalacao: "Fila de instalação",
    instalado: "Instalado",
  };

  // Validação
  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!largura || Number(largura) <= 0) {
      errors.largura = "Largura é obrigatória";
    }
    if (!altura || Number(altura) <= 0) {
      errors.altura = "Altura é obrigatória";
    }
    return errors;
  }, [largura, altura]);

  const showLarguraError = touched.largura && validation.largura && !saved && largura !== "";
  const showAlturaError = touched.altura && validation.altura && !saved && altura !== "";
  const hasErrors = showLarguraError || showAlturaError;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Tipo + Sequência */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            {selectedId && (
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
            <h2 className="text-sm font-semibold text-slate-900">
              {selectedId ? "Editando ambiente" : "Novo ambiente"}
            </h2>
          </div>
          {selectedId && (
            <button
              type="button"
              onClick={onResetEdit}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
          )}
        </div>
        {selectedId && selectedAmbiente && (
          <div className="flex flex-wrap items-center gap-3 border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 mb-4">
            <span className="text-xs font-semibold text-slate-600">
              Status atual:{" "}
              <span className="text-slate-900">
                {STATUS_LABELS[(selectedAmbiente.status as AmbienteStatus) ?? "medicao_pendente"]}
              </span>
            </span>
            {selectedAmbiente.status === "medicao_pendente" && onFinalizeMedicao && (
              <button
                type="button"
                onClick={onFinalizeMedicao}
                disabled={finalizandoMedicao}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-60"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {finalizandoMedicao ? "Enviando..." : "Finalizar medição"}
              </button>
            )}
            {selectedAmbiente.status === "aguardando_validacao" && (
              <span className="text-xs font-semibold text-emerald-600">
                Aguardando validação do gerente
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-5 gap-2 max-sm:grid-cols-3">
          {PREFIXOS.map((p) => {
            const Icon = p.icon;
            const active = p.value === prefixo;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onChangePrefixo(p.value)}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white shadow-md scale-105"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{p.value}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="text-xs font-medium text-slate-600 mb-2 block">
            Sequência
          </label>
          <input
            type="number"
            min={1}
            value={sequencia}
            onChange={(e) => onChangeSequencia(Number(e.target.value))}
            className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition"
          />
        </div>
      </section>

      {/* Medidas */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Ruler className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Medidas do vão</h2>
            <p className="text-xs text-slate-500">Em centímetros</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Largura */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-2 block">
              Largura <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={largura}
                onChange={(e) => onChangeLargura(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, largura: true }))}
                className={`w-full bg-slate-50 border rounded-lg px-3 py-2.5 pr-10 text-sm font-medium outline-none focus:ring-2 text-slate-900 placeholder-slate-400 transition ${
                  showLarguraError
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-200 focus:ring-slate-900 focus:border-slate-900"
                }`}
                placeholder="0.0"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                cm
              </span>
            </div>
            {showLarguraError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validation.largura}
              </p>
            )}
          </div>

          {/* Altura */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-2 block">
              Altura <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={altura}
                onChange={(e) => onChangeAltura(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, altura: true }))}
                className={`w-full bg-slate-50 border rounded-lg px-3 py-2.5 pr-10 text-sm font-medium outline-none focus:ring-2 text-slate-900 placeholder-slate-400 transition ${
                  showAlturaError
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-200 focus:ring-slate-900 focus:border-slate-900"
                }`}
                placeholder="0.0"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                cm
              </span>
            </div>
            {showAlturaError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validation.altura}
              </p>
            )}
          </div>

          {/* Recuo */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-2 block">
              Recuo
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={recuo}
                onChange={(e) => onChangeRecuo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder-slate-400 transition"
                placeholder="0.0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                cm
              </span>
            </div>
          </div>

          {/* Instalação */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-2 block">
              Instalação
            </label>
            <select
              value={instalacao}
              onChange={(e) => onChangeInstalacao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition"
            >
              <option value="teto">Teto</option>
              <option value="parede">Parede</option>
              <option value="embutida">Embutida</option>
            </select>
          </div>
        </div>
      </section>

      {/* Observações */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <label className="text-xs font-medium text-slate-700 mb-2 block">
          Observações
        </label>
        <textarea
          rows={3}
          value={observacoes}
          onChange={(e) => onChangeObservacoes(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 resize-none text-slate-900 placeholder-slate-400 transition"
          placeholder="Ex: afastar 10cm do aro, atenção no lado direito..."
        />
      </section>

      {/* Validation Warning */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Campos obrigatórios</p>
            <p className="text-xs text-red-600">Preencha largura e altura para continuar.</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving}
        className={`sticky bottom-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all shadow-lg ${
          saved
            ? "bg-emerald-500 text-white"
            : saving
            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
            : hasErrors
            ? "bg-slate-400 text-white cursor-not-allowed"
            : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl"
        }`}
      >
        {saved ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            {selectedId ? "Atualizado com sucesso!" : "Salvo com sucesso!"}
          </>
        ) : saving ? (
          <>
            <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
            Salvando...
          </>
        ) : selectedId ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Atualizar ambiente
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Adicionar ambiente
          </>
        )}
      </button>
    </form>
  );
}
