"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import { ObraStatus, UsuarioAtivo } from "../types";

type ObraFormValues = {
  nome: string;
  cliente: string;
  endereco: string;
  andarInicial: string;
  andarFinal: string;
  status: ObraStatus;
  observacoes: string;
};

type ObraFormModalProps = {
  open: boolean;
  title: string;
  formData: ObraFormValues;
  onChange: (field: keyof ObraFormValues, value: string) => void;
  statusOptions: { label: string; value: ObraStatus }[];
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  saved: boolean;
  primaryLabel: string;
  usuarios?: UsuarioAtivo[];
  responsavelIds?: string[];
  onToggleResponsavel?: (id: string) => void;
};

export function ObraFormModal({
  open,
  title,
  formData,
  onChange,
  statusOptions,
  onClose,
  onSubmit,
  saving,
  saved,
  primaryLabel,
  usuarios = [],
  responsavelIds = [],
  onToggleResponsavel,
}: ObraFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Nome da Obra *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => onChange("nome", e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
              placeholder="Ex: Edifício Solar"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Cliente</label>
            <input
              type="text"
              value={formData.cliente}
              onChange={(e) => onChange("cliente", e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Endereço</label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => onChange("endereco", e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
              placeholder="Rua, número, bairro"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Andar Inicial
              </label>
              <input
                type="number"
                min="1"
                value={formData.andarInicial}
                onChange={(e) => onChange("andarInicial", e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Andar Final
              </label>
              <input
                type="number"
                min="1"
                value={formData.andarFinal}
                onChange={(e) => onChange("andarFinal", e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => onChange("status", e.target.value as ObraStatus)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Observações
            </label>
            <textarea
              rows={3}
              value={formData.observacoes}
              onChange={(e) => onChange("observacoes", e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-200 outline-none resize-none"
              placeholder="Informações adicionais sobre a obra"
            />
          </div>

          {onToggleResponsavel && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Equipe Inicial (opcional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {usuarios.map((usuario) => {
                  const isSelected = responsavelIds.includes(usuario._id);
                  return (
                    <label
                      key={usuario._id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{usuario.nome}</p>
                        <p className="text-xs text-slate-500 capitalize">{usuario.role}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleResponsavel(usuario._id)}
                        className="w-4 h-4 accent-slate-900"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={saving || !formData.nome.trim()}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition ${
              saving || !formData.nome.trim()
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Sucesso!
              </>
            ) : (
              primaryLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
