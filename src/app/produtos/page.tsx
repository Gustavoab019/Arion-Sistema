"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  PackagePlus,
  Archive,
  Layers,
  Trash2,
  Tag,
  Sparkles,
  Settings2,
} from "lucide-react";
import { AppLayout } from "../components/AppLayout";
import type { Product } from "@/src/types/product";
import { PRODUCT_CATEGORY_LABELS, type ProductCategory } from "@/src/types/product";
import { parseJsonOrThrow } from "@/src/lib/http";
import type { TipoMontagem } from "@/src/lib/calhas-config";
import { TIPOS_MONTAGEM } from "@/src/lib/calhas-config";
import type { MountingOptionDto } from "@/src/types/mounting";

const CATEGORY_OPTIONS: { value: ProductCategory; helper: string }[] = [
  {
    value: "calha",
    helper: "Modelos de calhas e perfis técnicos",
  },
  {
    value: "cortinado",
    helper: "Tecidos, voiles e blackouts",
  },
  {
    value: "acessorio",
    helper: "Acessórios, automações e acabamentos",
  },
];

export default function ProdutosPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<ProductCategory>("calha");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mountings, setMountings] = useState<MountingOptionDto[]>([]);
  const [loadingMountings, setLoadingMountings] = useState(true);
  const [mountingsError, setMountingsError] = useState<string | null>(null);
  const [montagemNome, setMontagemNome] = useState("");
  const [montagemDescricao, setMontagemDescricao] = useState("");
  const [montagemBase, setMontagemBase] = useState<TipoMontagem>("simples");
  const [savingMontagem, setSavingMontagem] = useState(false);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/produtos", { credentials: "include" });
      const data = await parseJsonOrThrow<Product[]>(res);
      setItems(data);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }, []);

  const notifyCatalogUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("catalogo-produtos:updated"));
    }
  };
  const notifyMountingUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("catalogo-montagens:updated"));
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const fetchMontagens = useCallback(async () => {
    setLoadingMountings(true);
    setMountingsError(null);
    try {
      const res = await fetch("/api/montagens", { credentials: "include" });
      const data = await parseJsonOrThrow<MountingOptionDto[]>(res);
      setMountings(data);
    } catch (err) {
      console.error("Erro ao carregar tipos de montagem:", err);
      setMountingsError(
        err instanceof Error ? err.message : "Erro ao carregar tipos de montagem."
      );
    } finally {
      setLoadingMountings(false);
    }
  }, []);

  useEffect(() => {
    fetchMontagens();
  }, [fetchMontagens]);

  const grouped = useMemo(() => {
    return CATEGORY_OPTIONS.map((category) => ({
      ...category,
      label: PRODUCT_CATEGORY_LABELS[category.value],
      itens: items.filter((item) => item.categoria === category.value),
    }));
  }, [items]);

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) return;
    setSaving(true);
    const body = {
      nome: trimmed,
      categoria,
      descricao: descricao.trim() || undefined,
    };
    fetch("/api/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    })
      .then((res) => parseJsonOrThrow<Product>(res))
      .then((novo) => {
        setItems((prev) => [novo, ...prev]);
        setNome("");
        setDescricao("");
        notifyCatalogUpdate();
      })
      .catch((err) => {
        console.error("Erro ao criar produto:", err);
        alert(err instanceof Error ? err.message : "Erro ao salvar produto.");
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Deseja remover este produto do catálogo?")) return;
    fetch(`/api/produtos/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(text || "Erro ao remover produto.");
          });
        }
      })
      .then(() => {
        setItems((prev) => prev.filter((item) => item._id !== id));
        notifyCatalogUpdate();
      })
      .catch((err) => {
        console.error("Erro ao remover produto:", err);
        alert(err instanceof Error ? err.message : "Erro ao remover produto.");
      });
  };

  const handleAddMontagem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = montagemNome.trim();
    const tipoBaseTrimmed = montagemBase.trim().toLowerCase();
    if (!trimmed || !tipoBaseTrimmed) return;
    const valido = TIPOS_MONTAGEM.some((tipo) => tipo.id === tipoBaseTrimmed);
    if (!valido) {
      alert(
        "Tipo base inválido. Use um dos identificadores suportados (ex: simples, dupla_paralela...)."
      );
      return;
    }
    setSavingMontagem(true);
    fetch("/api/montagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nome: trimmed,
        descricao: montagemDescricao.trim() || undefined,
        tipoBase: tipoBaseTrimmed as TipoMontagem,
      }),
    })
      .then((res) => parseJsonOrThrow<MountingOptionDto>(res))
      .then((novo) => {
        setMountings((prev) => [novo, ...prev]);
        setMontagemNome("");
        setMontagemDescricao("");
        setMontagemBase("");
        notifyMountingUpdate();
      })
      .catch((err) => {
        console.error("Erro ao criar tipo de montagem:", err);
        alert(err instanceof Error ? err.message : "Erro ao salvar tipo de montagem.");
      })
      .finally(() => setSavingMontagem(false));
  };

  const handleDeleteMontagem = (id: string) => {
    if (!window.confirm("Deseja remover este tipo de montagem?")) return;
    fetch(`/api/montagens/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(text || "Erro ao remover tipo de montagem.");
          });
        }
      })
      .then(() => {
        setMountings((prev) => prev.filter((item) => item._id !== id));
        notifyMountingUpdate();
      })
      .catch((err) => {
        console.error("Erro ao remover tipo de montagem:", err);
        alert(err instanceof Error ? err.message : "Erro ao remover tipo de montagem.");
      });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <header className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-widest">
              Catálogo interno
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Produtos e acabamentos
            </h1>
            <p className="text-sm text-slate-500">
              Centralize modelos de calhas, cortinados e acessórios para usar nas medições.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Layers className="w-5 h-5 text-slate-500" />
            {loading ? "Carregando catálogo..." : `${items.length} produtos cadastrados`}
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500 tracking-widest">
                Tipos de montagem
              </p>
              <h2 className="text-lg font-bold text-slate-900">Catálogo de montagem</h2>
              <p className="text-sm text-slate-500">
                Personalize as opções de montagem exibidas na tela de medições.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Settings2 className="w-5 h-5 text-slate-500" />
              {loadingMountings
                ? "Sincronizando..."
                : `${mountings.length} tipo${mountings.length === 1 ? "" : "s"} cadastrado${mountings.length === 1 ? "" : "s"}`}
            </div>
          </div>

          {mountingsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
              {mountingsError}
            </div>
          )}

          <form onSubmit={handleAddMontagem} className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Nome interno
              </label>
              <input
                value={montagemNome}
                onChange={(e) => setMontagemNome(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition"
                placeholder="Ex: Calha Simples Hotel"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Tipo base (interno)
              </label>
              <input
                value={montagemBase}
                onChange={(e) => setMontagemBase(e.target.value)}
                list="tipo-base-sugestoes"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition"
                placeholder="Ex: simples, dupla_paralela..."
                required
              />
              <datalist id="tipo-base-sugestoes">
                {TIPOS_MONTAGEM.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </datalist>
              <p className="text-[0.65rem] text-slate-400 mt-1">
                Use um dos identificadores suportados:{" "}
                {TIPOS_MONTAGEM.map((t) => t.id).join(", ")}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Descrição
              </label>
              <textarea
                value={montagemDescricao}
                onChange={(e) => setMontagemDescricao(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition resize-none"
                placeholder="Observações internas para a equipe"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={savingMontagem}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60 disabled:pointer-events-none"
              >
                <Sparkles className="w-4 h-4" />
                Adicionar tipo
              </button>
            </div>
          </form>

          <div className="grid gap-3 md:grid-cols-2">
            {mountings.length === 0 && !loadingMountings ? (
              <div className="col-span-2 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-2xl py-6">
                Nenhum tipo de montagem cadastrado ainda.
              </div>
            ) : (
              mountings.map((option) => {
                const base = TIPOS_MONTAGEM.find((t) => t.id === option.tipoBase);
                return (
                  <div
                    key={option._id}
                    className="border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {option.nome}
                        </p>
                        <p className="text-xs text-slate-500">
                          Base: {base?.nome ?? option.tipoBase}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMontagem(option._id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Remover tipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {option.descricao && (
                      <p className="text-xs text-slate-500">{option.descricao}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <PackagePlus className="w-4 h-4 text-slate-500" />
              Adicionar produto
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">
                  Nome comercial
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition"
                  placeholder="Ex: Calha Simples Forest"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as ProductCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {PRODUCT_CATEGORY_LABELS[option.value]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Descrição / Observação
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition resize-none"
                placeholder="Detalhes técnicos, cor, fornecedor..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60 disabled:pointer-events-none"
              >
                <Sparkles className="w-4 h-4" />
                Salvar produto
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          {grouped.map((group) => (
            <div
              key={group.value}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {group.label}
                  </p>
                  <p className="text-xs text-slate-500">{group.helper}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  {group.itens.length} itens
                </span>
              </div>
              {group.itens.length === 0 ? (
                <div className="px-5 py-6 flex flex-col items-center justify-center text-center gap-2 text-slate-500">
                  <Archive className="w-5 h-5" />
                  <p className="text-sm">Nenhum produto cadastrado nesta categoria.</p>
                </div>
              ) : (
                <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                  {group.itens.map((item) => (
                    <div
                      key={item._id}
                      className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.nome}
                          </p>
                          {item.descricao && (
                            <p className="text-xs text-slate-500 mt-1">{item.descricao}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <Tag className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </AppLayout>
  );
}
