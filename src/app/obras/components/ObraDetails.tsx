"use client";

import {
  ArrowRightCircle,
  Calendar,
  ClipboardList,
  Edit2,
  Filter,
  Layers,
  Loader2,
  MapPin,
  Trash2,
  Users,
} from "lucide-react";
import { AmbienteResumo, Obra, ObraStatus, UsuarioAtivo } from "../types";

type ObraDetailsProps = {
  obra: Obra | null;
  statusOptions: { label: string; value: ObraStatus }[];
  getStatusColor: (status?: ObraStatus) => "emerald" | "amber" | "slate";
  onEdit: (obra: Obra) => void;
  onDelete: (id: string) => void;
  usuarios: UsuarioAtivo[];
  usuariosLoading: boolean;
  usuariosError?: string | null;
  responsavelIds: string[];
  onToggleResponsavel?: (id: string) => void;
  onSalvarEquipe?: () => void;
  salvandoEquipe?: boolean;
  equipeAlterada?: boolean;
  ambienteStats: { pending: number; review: number; done: number };
  ambientesRecentes: AmbienteResumo[];
  ambientesLoading: boolean;
  onIrParaMedicoes: (id: string) => void;
  canManage: boolean;
};

export function ObraDetails({
  obra,
  statusOptions,
  getStatusColor,
  onEdit,
  onDelete,
  usuarios,
  usuariosLoading,
  usuariosError,
  responsavelIds,
  onToggleResponsavel,
  onSalvarEquipe,
  salvandoEquipe,
  equipeAlterada,
  ambienteStats,
  ambientesRecentes,
  ambientesLoading,
  onIrParaMedicoes,
  canManage,
}: ObraDetailsProps) {
  if (!obra) {
    return (
      <section className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
        <div className="flex flex-col items-center justify-center min-h-[50vh] lg:h-full text-slate-400 p-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white border-2 border-slate-200 flex items-center justify-center mb-4 shadow-xl">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
          </div>
          <p className="text-lg font-bold text-slate-700">Selecione uma obra</p>
          <p className="text-sm text-slate-500 mt-1">Escolha um projeto ao lado para ver os detalhes</p>
        </div>
      </section>
    );
  }

  const statusLabel = statusOptions.find((s) => s.value === obra.status)?.label || "Ativo";
  const responsaveisObra = obra.responsaveis ?? [];
  const podeEditarEquipe = canManage && Boolean(onToggleResponsavel) && Boolean(onSalvarEquipe);

  return (
    <section className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">{obra.nome}</h2>
              {obra.cliente && <p className="text-sm text-slate-600">{obra.cliente}</p>}
            </div>

            {canManage && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => onEdit(obra)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => onDelete(obra._id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {obra.endereco && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Endereço</p>
                  <p className="text-sm text-slate-900">{obra.endereco}</p>
                </div>
              </div>
            )}

            {obra.andarInicial !== undefined && (
              <div className="flex items-start gap-2">
                <Layers className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Andares</p>
                  <p className="text-sm text-slate-900">
                    {obra.andarInicial === obra.andarFinal
                      ? `${obra.andarInicial}º andar`
                      : `${obra.andarInicial}º ao ${obra.andarFinal}º andar`}
                  </p>
                </div>
              </div>
            )}

            {obra.createdAt && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Criada em</p>
                  <p className="text-sm text-slate-900">
                    {new Date(obra.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Filter className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Status</p>
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                    getStatusColor(obra.status) === "emerald"
                      ? "bg-emerald-100 text-emerald-700"
                      : getStatusColor(obra.status) === "amber"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {obra.observacoes && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Observações</p>
              <p className="text-sm text-slate-700">{obra.observacoes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Equipe Designada</h3>
            </div>
          </div>

          {podeEditarEquipe ? (
            <div className="space-y-3">
              {usuariosLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : usuariosError ? (
                <p className="text-sm text-red-600">{usuariosError}</p>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  Nenhum usuário ativo encontrado
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {usuarios.map((usuario) => {
                    const isSelected = responsavelIds.includes(usuario._id);
                    return (
                      <label
                        key={usuario._id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
                          isSelected
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{usuario.nome}</p>
                          <p className="text-xs text-slate-500 capitalize">{usuario.role}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleResponsavel?.(usuario._id)}
                          className="w-4 h-4 accent-slate-900"
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              <button
                onClick={onSalvarEquipe}
                disabled={!equipeAlterada || salvandoEquipe}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  !equipeAlterada
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {salvandoEquipe ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Salvar Equipe
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {responsaveisObra.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum responsável definido. Procure o gerente para ser adicionado.
                </p>
              ) : (
                responsaveisObra.map((resp) => (
                  <span
                    key={resp.userId.toString()}
                    className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"
                  >
                    {resp.nome}
                  </span>
                ))
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-slate-700" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Resumo das Medições</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center p-3 sm:p-4 rounded-lg border border-slate-200">
                <p className="text-[0.65rem] sm:text-xs text-slate-500 mb-1 uppercase">Pendentes</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{ambienteStats.pending}</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg border border-amber-200 bg-amber-50">
                <p className="text-[0.65rem] sm:text-xs text-amber-700 mb-1 uppercase">Revisar</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-700">{ambienteStats.review}</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg border border-emerald-200 bg-emerald-50">
                <p className="text-[0.65rem] sm:text-xs text-emerald-700 mb-1 uppercase">Completas</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-700">{ambienteStats.done}</p>
              </div>
            </div>

            {ambientesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : ambientesRecentes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Nenhuma medição registrada
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y">
                {ambientesRecentes.map((ambiente) => (
                  <div
                    key={ambiente._id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{ambiente.codigo}</p>
                      <p className="text-xs text-slate-500">{ambiente.quarto}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                        ambiente.status === "completo"
                          ? "bg-emerald-100 text-emerald-700"
                          : ambiente.status === "revisar"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {ambiente.status || "pendente"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onIrParaMedicoes(obra._id)}
            disabled={responsavelIds.length === 0}
            className={`w-full py-3 mt-6 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition ${
              responsavelIds.length === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <ArrowRightCircle className="w-5 h-5" />
            Ir para Medições
          </button>
          {responsavelIds.length === 0 && (
            <p className="text-xs text-center text-slate-500">
              Defina pelo menos um responsável antes de continuar
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
