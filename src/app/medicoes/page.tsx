"use client";

import { useEffect, useMemo, useState } from "react";
import { MedicoesHeader } from "./components/MedicoesHeader";
import { MedicoesForm } from "./components/MedicoesForm";
import { MedicoesSidebar } from "./components/MedicoesSidebar";
import { Ambiente, Obra } from "./types";

const ACTIVE_OBRA_KEY = "sistema-cortinados:obra-ativa";
const FORM_DEFAULTS = {
  prefixo: "QT",
  sequencia: 1,
  largura: "",
  altura: "",
  recuo: "",
  instalacao: "teto",
  observacoes: "",
  calha: "Forest preta",
  calhaDesconto: "-1.5",
  tecidoPrincipal: "Voile branco",
  tecidoPrincipalDesc: "0",
  tecidoSecundario: "Blackout cinza",
  tecidoSecundarioDesc: "-2",
};

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Erro ao processar a solicitação.";
    try {
      const error = await res.json();
      message = error?.message || error?.error || message;
    } catch {
      const text = await res.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export default function MedicoesPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [andar, setAndar] = useState("1");
  const [quarto, setQuarto] = useState("101");

  // form states
  const [prefixo, setPrefixo] = useState(FORM_DEFAULTS.prefixo);
  const [sequencia, setSequencia] = useState(FORM_DEFAULTS.sequencia);
  const [largura, setLargura] = useState(FORM_DEFAULTS.largura);
  const [altura, setAltura] = useState(FORM_DEFAULTS.altura);
  const [recuo, setRecuo] = useState(FORM_DEFAULTS.recuo);
  const [instalacao, setInstalacao] = useState(FORM_DEFAULTS.instalacao);
  const [observacoes, setObservacoes] = useState(FORM_DEFAULTS.observacoes);

  const [calha, setCalha] = useState(FORM_DEFAULTS.calha);
  const [calhaDesconto, setCalhaDesconto] = useState(FORM_DEFAULTS.calhaDesconto);
  const [tecidoPrincipal, setTecidoPrincipal] = useState(
    FORM_DEFAULTS.tecidoPrincipal
  );
  const [tecidoPrincipalDesc, setTecidoPrincipalDesc] = useState(
    FORM_DEFAULTS.tecidoPrincipalDesc
  );
  const [tecidoSecundario, setTecidoSecundario] = useState(
    FORM_DEFAULTS.tecidoSecundario
  );
  const [tecidoSecundarioDesc, setTecidoSecundarioDesc] = useState(
    FORM_DEFAULTS.tecidoSecundarioDesc
  );

  // list
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const codigoPreview = `${prefixo}${quarto}-${sequencia}`;
  const stats = useMemo(() => {
    return ambientes.reduce(
      (acc, amb) => {
        if (amb.status === "completo") acc.done += 1;
        else if (amb.status === "revisar") acc.review += 1;
        else acc.pending += 1;
        return acc;
      },
      { pending: 0, review: 0, done: 0 }
    );
  }, [ambientes]);

  // carregar obras
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const res = await fetch("/api/obras", { credentials: "include" });
        const data = await parseJsonOrThrow<Obra[]>(res);
        setObras(data);

        if (typeof window !== "undefined") {
          const last = window.localStorage.getItem(ACTIVE_OBRA_KEY);
          if (last && data.some((o) => o._id === last)) {
            setObraId(last);
            return;
          }
        }

        if (data.length > 0) {
          setObraId(data[0]._id);
        }
      } catch (err) {
        console.error("Erro ao carregar obras:", err);
      }
    };
    fetchObras();
  }, []);

  // salvar obra ativa
  useEffect(() => {
    if (obraId && typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_OBRA_KEY, obraId);
    }
  }, [obraId]);

  // carregar ambientes
  useEffect(() => {
    if (!obraId) return;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/ambientes?obraId=${obraId}&quarto=${quarto}`,
          { signal: controller.signal, credentials: "include" }
        );
        const data = await parseJsonOrThrow<Ambiente[]>(res);
        setAmbientes(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("Erro ao carregar ambientes:", err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, [quarto, obraId]);

  function fillFormFromAmbiente(amb: Ambiente) {
    setSelectedId(amb._id);
    setPrefixo(amb.prefixo);
    setQuarto(amb.quarto);
    setSequencia(amb.sequencia ?? FORM_DEFAULTS.sequencia);
    setLargura(
      amb.medidas?.largura !== undefined ? String(amb.medidas.largura) : FORM_DEFAULTS.largura
    );
    setAltura(
      amb.medidas?.altura !== undefined ? String(amb.medidas.altura) : FORM_DEFAULTS.altura
    );
    setRecuo(
      amb.medidas?.recuo !== undefined ? String(amb.medidas.recuo) : FORM_DEFAULTS.recuo
    );
    setInstalacao(amb.medidas?.instalacao || FORM_DEFAULTS.instalacao);
    setObservacoes(amb.observacoes || FORM_DEFAULTS.observacoes);

    setCalha(amb.variaveis?.calha || FORM_DEFAULTS.calha);
    setTecidoPrincipal(
      amb.variaveis?.tecidoPrincipal || FORM_DEFAULTS.tecidoPrincipal
    );
    setTecidoSecundario(
      amb.variaveis?.tecidoSecundario || FORM_DEFAULTS.tecidoSecundario
    );

    setCalhaDesconto(
      amb.variaveis?.regras?.calhaDesconto !== undefined
        ? String(amb.variaveis.regras.calhaDesconto)
        : FORM_DEFAULTS.calhaDesconto
    );
    setTecidoPrincipalDesc(
      amb.variaveis?.regras?.voileAlturaDesconto !== undefined
        ? String(amb.variaveis.regras.voileAlturaDesconto)
        : FORM_DEFAULTS.tecidoPrincipalDesc
    );
    setTecidoSecundarioDesc(
      amb.variaveis?.regras?.blackoutAlturaDesconto !== undefined
        ? String(amb.variaveis.regras.blackoutAlturaDesconto)
        : FORM_DEFAULTS.tecidoSecundarioDesc
    );
  }

  function resetForm() {
    setSelectedId(null);
    setPrefixo(FORM_DEFAULTS.prefixo);
    setSequencia(FORM_DEFAULTS.sequencia);
    setLargura(FORM_DEFAULTS.largura);
    setAltura(FORM_DEFAULTS.altura);
    setRecuo(FORM_DEFAULTS.recuo);
    setInstalacao(FORM_DEFAULTS.instalacao);
    setObservacoes(FORM_DEFAULTS.observacoes);
    setCalha(FORM_DEFAULTS.calha);
    setCalhaDesconto(FORM_DEFAULTS.calhaDesconto);
    setTecidoPrincipal(FORM_DEFAULTS.tecidoPrincipal);
    setTecidoPrincipalDesc(FORM_DEFAULTS.tecidoPrincipalDesc);
    setTecidoSecundario(FORM_DEFAULTS.tecidoSecundario);
    setTecidoSecundarioDesc(FORM_DEFAULTS.tecidoSecundarioDesc);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!obraId) {
      alert("Selecione uma obra primeiro.");
      return;
    }

    setSaving(true);

    const body = {
      obraId,
      andar: Number(andar),
      quarto,
      prefixo,
      sequencia: Number(sequencia),
      medidas: {
        largura: largura ? Number(largura) : undefined,
        altura: altura ? Number(altura) : undefined,
        recuo: recuo ? Number(recuo) : undefined,
        instalacao,
      },
      variaveis: {
        calha,
        tecidoPrincipal,
        tecidoSecundario,
        regras: {
          calhaDesconto: calhaDesconto ? Number(calhaDesconto) : undefined,
          voileAlturaDesconto: tecidoPrincipalDesc
            ? Number(tecidoPrincipalDesc)
            : undefined,
          blackoutAlturaDesconto: tecidoSecundarioDesc
            ? Number(tecidoSecundarioDesc)
            : undefined,
        },
      },
      observacoes,
      status: "pendente" as const,
    };

    try {
      if (selectedId) {
        const res = await fetch(`/api/ambientes/${selectedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const atualizado = await parseJsonOrThrow<Ambiente>(res);
        setAmbientes((prev) =>
          prev.map((a) => (a._id === atualizado._id ? atualizado : a))
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        const res = await fetch("/api/ambientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const novo = await parseJsonOrThrow<Ambiente>(res);
        setAmbientes((prev) => [novo, ...prev]);

        setSequencia((prev) => prev + 1);
        setLargura("");
        setAltura("");
        setRecuo("");
        setObservacoes("");

        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    } catch (err) {
      console.error("Erro ao salvar ambiente:", err);
      alert(err instanceof Error ? err.message : "Erro ao salvar ambiente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeStatus(id: string, status: Ambiente["status"]) {
    try {
      const res = await fetch(`/api/ambientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const atualizado = await parseJsonOrThrow<Ambiente>(res);
      setAmbientes((prev) =>
        prev.map((a) => (a._id === atualizado._id ? atualizado : a))
      );
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert(err instanceof Error ? err.message : "Erro ao atualizar status.");
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm("Deseja realmente excluir esse ambiente?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/ambientes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erro ao excluir ambiente.");
      }
      setAmbientes((prev) => prev.filter((a) => a._id !== id));
      if (selectedId === id) {
        resetForm();
      }
    } catch (err) {
      console.error("Erro ao excluir ambiente:", err);
      alert(err instanceof Error ? err.message : "Erro ao excluir ambiente.");
    }
  }

  function handleProximoQuarto() {
    setQuarto(String(Number(quarto) + 1));
    setSequencia(1);
    setSelectedId(null);
  }

  function handleQuartoAnterior() {
    setQuarto(String(Number(quarto) - 1));
    setSequencia(1);
    setSelectedId(null);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <MedicoesHeader
        obras={obras}
        obraId={obraId}
        onChangeObra={(id) => {
          setObraId(id);
          setSelectedId(null);
        }}
        andar={andar}
        onChangeAndar={setAndar}
        quarto={quarto}
        onChangeQuarto={(q) => {
          setQuarto(q);
          setSelectedId(null);
        }}
        onPrevQuarto={handleQuartoAnterior}
        onNextQuarto={handleProximoQuarto}
        codigoPreview={codigoPreview}
        stats={stats}
        totalAmbientes={ambientes.length}
        loadingAmbientes={loading}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1fr,360px]">
        <MedicoesForm
          selectedId={selectedId}
          prefixo={prefixo}
          onChangePrefixo={setPrefixo}
          sequencia={sequencia}
          onChangeSequencia={setSequencia}
          largura={largura}
          onChangeLargura={setLargura}
          altura={altura}
          onChangeAltura={setAltura}
          recuo={recuo}
          onChangeRecuo={setRecuo}
          instalacao={instalacao}
          onChangeInstalacao={setInstalacao}
          calha={calha}
          onChangeCalha={setCalha}
          calhaDesconto={calhaDesconto}
          onChangeCalhaDesconto={setCalhaDesconto}
          tecidoPrincipal={tecidoPrincipal}
          onChangeTecidoPrincipal={setTecidoPrincipal}
          tecidoPrincipalDesc={tecidoPrincipalDesc}
          onChangeTecidoPrincipalDesc={setTecidoPrincipalDesc}
          tecidoSecundario={tecidoSecundario}
          onChangeTecidoSecundario={setTecidoSecundario}
          tecidoSecundarioDesc={tecidoSecundarioDesc}
          onChangeTecidoSecundarioDesc={setTecidoSecundarioDesc}
          observacoes={observacoes}
          onChangeObservacoes={setObservacoes}
          onSubmit={handleSubmit}
          onResetEdit={resetForm}
          saving={saving}
          saved={saved}
        />

        <MedicoesSidebar
          loading={loading}
          quarto={quarto}
          searchTerm={searchTerm}
          onChangeSearch={setSearchTerm}
          ambientes={ambientes}
          selectedId={selectedId}
          onSelect={fillFormFromAmbiente}
          onDelete={handleDelete}
          onChangeStatus={handleChangeStatus}
        />
      </main>
    </div>
  );
}
