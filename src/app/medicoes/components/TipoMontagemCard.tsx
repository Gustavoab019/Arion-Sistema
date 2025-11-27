import { getConfigMontagem } from "@/src/lib/calhas-config";
import type { MountingOptionUI } from "../types";

type TipoMontagemCardProps = {
  option: MountingOptionUI;
  isSelected: boolean;
  onSelect: () => void;
};

export function TipoMontagemCard({ option, isSelected, onSelect }: TipoMontagemCardProps) {
  const config = getConfigMontagem(option.tipoBase);
  const detalhes = (config?.pecas ?? []).slice(0, 3);
  const initials = option.nome
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <label
      className={`relative block rounded-2xl border-2 p-4 transition-all ${
        isSelected
          ? "border-slate-900 bg-slate-900 text-white shadow-lg"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <input type="radio" checked={isSelected} onChange={onSelect} className="sr-only" />
      {isSelected && (
        <span className="absolute top-2 right-3 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
          Selecionado
        </span>
      )}

      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold ${
            isSelected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {initials}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <p
              className={`text-sm font-semibold ${
                isSelected ? "text-white" : "text-slate-900"
              }`}
            >
              {option.nome}
            </p>
            <span
              className={`px-2 py-0.5 rounded-full text-[0.6rem] uppercase tracking-wide font-semibold ${
                isSelected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {option.tipoBase}
            </span>
          </div>
          <p
            className={`text-xs ${
              isSelected ? "text-white/80" : "text-slate-500"
            }`}
          >
            {option.descricao ?? config?.descricao ?? "Sem descrição cadastrada"}
          </p>
        </div>
      </div>

      {config?.pecas?.length ? (
        <ul className="mt-3 grid gap-1 text-xs">
          {detalhes.map((peca) => (
            <li
              key={peca.nome}
              className={`flex items-center justify-between rounded-xl border px-3 py-1 ${
                isSelected ? "border-white/20 text-white" : "border-slate-200 text-slate-600"
              }`}
            >
              <span className="font-semibold">{peca.nome}</span>
              {peca.descricao && (
                <span className="text-[0.65rem] opacity-70">{peca.descricao}</span>
              )}
            </li>
          ))}
          {config.pecas.length > detalhes.length && (
            <li
              className={`rounded-xl border px-3 py-1 text-[0.65rem] font-semibold ${
                isSelected ? "border-white/20 text-white" : "border-slate-200 text-slate-600"
              }`}
            >
              +{config.pecas.length - detalhes.length} peças adicionais
            </li>
          )}
        </ul>
      ) : (
        <p
          className={`mt-3 text-xs ${
            isSelected ? "text-white/70" : "text-slate-500"
          }`}
        >
          Nenhum detalhe técnico cadastrado para este tipo base.
        </p>
      )}
    </label>
  );
}
