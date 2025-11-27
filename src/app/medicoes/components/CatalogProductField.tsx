import type { Product } from "@/src/types/product";

type CatalogProductFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  catalog: Product[];
  onSelectProduct?: (produto: Product) => void;
  catalogLoading: boolean;
  catalogLoadError: string | null;
  emptyMessage: string;
  descontoLabel?: string;
  descontoValue?: string;
  onChangeDesconto?: (value: string) => void;
  fieldId: string; // ID único para o campo
};

export function CatalogProductField({
  label,
  value,
  onChange,
  placeholder,
  catalog,
  onSelectProduct,
  catalogLoading,
  catalogLoadError,
  emptyMessage,
  descontoLabel,
  descontoValue,
  onChangeDesconto,
  fieldId,
}: CatalogProductFieldProps) {
  const datalistId = `${fieldId}-datalist`;
  const selectId = `${fieldId}-select`;

  const renderCatalogChips = () => {
    if (!catalog.length) return null;
    const sugeridos = catalog.slice(0, 6);
    return (
      <div className="pt-2">
        <p className="text-[0.6rem] uppercase tracking-widest font-semibold text-slate-400 mb-1">
          Sugestões do catálogo
        </p>
        <div className="flex flex-wrap gap-2">
          {sugeridos.map((produto) => (
            <button
              key={produto._id}
              type="button"
              onClick={() => {
                if (onSelectProduct) {
                  onSelectProduct(produto);
                } else {
                  onChange(produto.nome);
                }
              }}
              title={produto.descricao}
              className="px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition"
            >
              {produto.nome}
            </button>
          ))}
        </div>
        {catalog.length > sugeridos.length && (
          <p className="text-[0.6rem] text-slate-400 mt-1">
            +{catalog.length - sugeridos.length} itens cadastrados
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Campo de entrada principal */}
      <div>
        <label className="text-xs font-medium text-slate-700 mb-2 block">
          {label}
        </label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          list={datalistId}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition"
          placeholder={placeholder}
        />
        {catalog.length > 0 && (
          <datalist id={datalistId}>
            {catalog.map((produto) => (
              <option
                key={produto._id}
                value={produto.nome}
                label={produto.descricao ?? produto.nome}
              />
            ))}
          </datalist>
        )}
      </div>

      {/* Status e seleção do catálogo */}
      <div className="space-y-2">
        {catalogLoading && (
          <p className="text-xs text-slate-500">Carregando catálogo...</p>
        )}
        {catalogLoadError && (
          <p className="text-xs text-red-600">
            Erro ao carregar catálogo: {catalogLoadError}
          </p>
        )}
        {!catalogLoading && !catalogLoadError && catalog.length === 0 && (
          <p className="text-xs text-slate-500">{emptyMessage}</p>
        )}
        {catalog.length > 0 && (
          <div className="flex flex-col gap-2">
            <select
              id={selectId}
              value=""
              onChange={(e) => {
                const produto = catalog.find((item) => item._id === e.target.value);
                if (!produto) return;
                if (onSelectProduct) {
                  onSelectProduct(produto);
                } else {
                  onChange(produto.nome);
                }
                // Reset select após seleção
                e.target.value = "";
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            >
              <option value="">Selecionar do catálogo...</option>
              {catalog.map((produto) => (
                <option key={produto._id} value={produto._id}>
                  {produto.nome}
                </option>
              ))}
            </select>
            {renderCatalogChips()}
          </div>
        )}
      </div>

      {/* Campo de desconto (opcional) */}
      {descontoLabel && onChangeDesconto && (
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">
            {descontoLabel}
          </label>
          <input
            type="number"
            step="0.1"
            value={descontoValue}
            onChange={(e) => onChangeDesconto(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 transition"
            placeholder="0.0"
          />
        </div>
      )}
    </div>
  );
}
