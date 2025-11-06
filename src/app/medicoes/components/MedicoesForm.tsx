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
} from "lucide-react";
import { PrefixoItem } from "../types";

const PREFIXOS: PrefixoItem[] = [
  { value: "QT", label: "Quarto", icon: Bed },
  { value: "SA", label: "Sala", icon: Sofa },
  { value: "COZ", label: "Cozinha", icon: ChefHat },
  { value: "VAR", label: "Varanda", icon: Trees },
  { value: "BAN", label: "Banheiro", icon: Bath },
];

type MedicoesFormProps = {
  selectedId: string | null;
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
  calha: string;
  onChangeCalha: (v: string) => void;
  calhaDesconto: string;
  onChangeCalhaDesconto: (v: string) => void;
  tecidoPrincipal: string;
  onChangeTecidoPrincipal: (v: string) => void;
  tecidoPrincipalDesc: string;
  onChangeTecidoPrincipalDesc: (v: string) => void;
  tecidoSecundario: string;
  onChangeTecidoSecundario: (v: string) => void;
  tecidoSecundarioDesc: string;
  onChangeTecidoSecundarioDesc: (v: string) => void;
  observacoes: string;
  onChangeObservacoes: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResetEdit: () => void;
  saving: boolean;
  saved: boolean;
};

export function MedicoesForm({
  selectedId,
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
  calha,
  onChangeCalha,
  calhaDesconto,
  onChangeCalhaDesconto,
  tecidoPrincipal,
  onChangeTecidoPrincipal,
  tecidoPrincipalDesc,
  onChangeTecidoPrincipalDesc,
  tecidoSecundario,
  onChangeTecidoSecundario,
  tecidoSecundarioDesc,
  onChangeTecidoSecundarioDesc,
  observacoes,
  onChangeObservacoes,
  onSubmit,
  onResetEdit,
  saving,
  saved,
}: MedicoesFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* tipo + sequência */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-sm font-semibold text-slate-800">
            {selectedId ? "Editando ambiente" : "Tipo de ambiente"}
          </h2>
          {selectedId && (
            <button
              type="button"
              onClick={onResetEdit}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              sair da edição
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2 max-sm:grid-cols-3">
          {PREFIXOS.map((p) => {
            const Icon = p.icon;
            const active = p.value === prefixo;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onChangePrefixo(p.value)}
                className={`flex flex-col items-start gap-1 rounded-xl border px-2.5 py-2 transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold">{p.value}</span>
                <span className="text-[0.6rem] text-slate-400 leading-none">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Sequência
          </label>
          <input
            type="number"
            min={1}
            value={sequencia}
            onChange={(e) => onChangeSequencia(Number(e.target.value))}
            className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
          />
        </div>
      </section>

      {/* medidas */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Medidas do vão
            </h2>
            <p className="text-xs text-slate-400">sempre em centímetros</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {/* largura */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Largura
            </label>
            <div className="relative">
              <input
                type="number"
                value={largura}
                onChange={(e) => onChangeLargura(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
                placeholder="0"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.6rem] text-slate-400">
                cm
              </span>
            </div>
          </div>
          {/* altura */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Altura
            </label>
            <div className="relative">
              <input
                type="number"
                value={altura}
                onChange={(e) => onChangeAltura(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
                placeholder="0"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.6rem] text-slate-400">
                cm
              </span>
            </div>
          </div>
          {/* recuo */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Recuo
            </label>
            <div className="relative">
              <input
                type="number"
                value={recuo}
                onChange={(e) => onChangeRecuo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 placeholder-slate-400"
                placeholder="0"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.6rem] text-slate-400">
                cm
              </span>
            </div>
          </div>
          {/* instalação */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Instalação
            </label>
            <select
              value={instalacao}
              onChange={(e) => onChangeInstalacao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
            >
              <option value="teto">Teto</option>
              <option value="parede">Parede</option>
              <option value="embutida">Embutida</option>
            </select>
          </div>
        </div>
      </section>

      {/* variáveis */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">
          Variáveis de produção
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* calha */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Calha</label>
            <input
              value={calha}
              onChange={(e) => onChangeCalha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
            />
            <label className="text-[0.6rem] text-slate-400">
              Desconto calha (cm)
            </label>
            <input
              type="number"
              value={calhaDesconto}
              onChange={(e) => onChangeCalhaDesconto(e.target.value)}
              className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
            />
          </div>

          {/* tecido principal */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Tecido principal
            </label>
            <input
              value={tecidoPrincipal}
              onChange={(e) => onChangeTecidoPrincipal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
            />
            <label className="text-[0.6rem] text-slate-400">
              Desconto altura (cm)
            </label>
            <input
              type="number"
              value={tecidoPrincipalDesc}
              onChange={(e) => onChangeTecidoPrincipalDesc(e.target.value)}
              className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
            />
          </div>

          {/* tecido secundario */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Tecido secundário
            </label>
            <input
              value={tecidoSecundario}
              onChange={(e) => onChangeTecidoSecundario(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
            />
            <label className="text-[0.6rem] text-slate-400">
              Desconto altura (cm)
            </label>
            <input
              type="number"
              value={tecidoSecundarioDesc}
              onChange={(e) => onChangeTecidoSecundarioDesc(e.target.value)}
              className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900"
            />
          </div>
        </div>
      </section>

      {/* observações */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <label className="text-xs font-medium text-slate-600 mb-2 block">
          Observações
        </label>
        <textarea
          rows={3}
          value={observacoes}
          onChange={(e) => onChangeObservacoes(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 resize-none text-slate-900 placeholder-slate-400"
          placeholder="Ex: afastar 10cm do aro, atenção no lado direito..."
        />
      </section>

      <button
        type="submit"
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
          saved
            ? "bg-emerald-500 text-white"
            : saving
            ? "bg-slate-300 text-slate-500"
            : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
      >
        {saved ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            {selectedId ? "Ambiente atualizado" : "Ambiente salvo"}
          </>
        ) : selectedId ? (
          <>
            <Plus className="w-4 h-4 rotate-90" />
            Atualizar ambiente
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Adicionar ambiente
          </>
        )}
      </button>
    </form>
  );
}