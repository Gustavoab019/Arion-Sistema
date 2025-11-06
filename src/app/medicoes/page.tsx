"use client";

import { useEffect, useState } from "react";
import { MedicoesHeader } from "./components/MedicoesHeader";
import { MedicoesForm } from "./components/MedicoesForm";
import { MedicoesSidebar } from "./components/MedicoesSidebar";
import { Ambiente, Obra } from "./types";

const ACTIVE_OBRA_KEY = "sistema-cortinados:obra-ativa";

export default function MedicoesPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [andar, setAndar] = useState("1");
  const [quarto, setQuarto] = useState("101");

  // form states
  const [prefixo, setPrefixo] = useState("QT");
  const [sequencia, setSequencia] = useState(1);
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [recuo, setRecuo] = useState("");
  const [instalacao, setInstalacao] = useState("teto");
  const [observacoes, setObservacoes] = useState("");

  const [calha, setCalha] = useState("Forest preta");
  const [calhaDesconto, setCalhaDesconto] = useState("-1.5");
  const [tecidoPrincipal, setTecidoPrincipal] = useState("Voile branco");
  const [tecidoPrincipalDesc, setTecidoPrincipalDesc] = useState("0");
  const [tecidoSecundario, setTecidoSecundario] = useState("Blackout cinza");
  const [tecidoSecundarioDesc, setTecidoSecundarioDesc] = useState("-2");

  // list
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const codigoPreview = `${prefixo}${quarto}-${sequencia}`;

  // carregar obras
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const res = await fetch("/api/obras");
        const data: Obra[] = await res.json();
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
    const fetchData = async () => {
      if (!obraId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/ambientes?obraId=${obraId}&quarto=${quarto}`);
        const data: Ambiente[] = await res.json();
        setAmbientes(data);
      } catch (err) {
        console.error("Erro ao carregar ambientes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [quarto, obraId]);

  function fillFormFromAmbiente(amb: Ambiente) {
    setSelectedId(amb._id);
    setPrefixo(amb.prefixo);
    setQuarto(amb.quarto);
    setSequencia(amb.sequencia);
    setLargura(amb.medidas?.largura !== undefined ? String(amb.medidas.largura) : "");
    setAltura(amb.medidas?.altura !== undefined ? String(amb.medidas.altura) : "");
    setRecuo(amb.medidas?.recuo !== undefined ? String(amb.medidas.recuo) : "");
    setInstalacao(amb.medidas?.instalacao || "teto");
    setObservacoes(amb.observacoes || "");

    setCalha(amb.variaveis?.calha || "");
    setTecidoPrincipal(amb.variaveis?.tecidoPrincipal || "");
    setTecidoSecundario(amb.variaveis?.tecidoSecundario || "");

    setCalhaDesconto(
      amb.variaveis?.regras?.calhaDesconto !== undefined
        ? String(amb.variaveis.regras.calhaDesconto)
        : "-1.5"
    );
    setTecidoPrincipalDesc(
      amb.variaveis?.regras?.voileAlturaDesconto !== undefined
        ? String(amb.variaveis.regras.voileAlturaDesconto)
        : "0"
    );
    setTecidoSecundarioDesc(
      amb.variaveis?.regras?.blackoutAlturaDesconto !== undefined
        ? String(amb.variaveis.regras.blackoutAlturaDesconto)
        : "-2"
    );
  }

  function resetForm() {
    setSelectedId(null);
    setPrefixo("QT");
    setSequencia(1);
    setLargura("");
    setAltura("");
    setRecuo("");
    setInstalacao("teto");
    setObservacoes("");
    setCalha("Forest preta");
    setCalhaDesconto("-1.5");
    setTecidoPrincipal("Voile branco");
    setTecidoPrincipalDesc("0");
    setTecidoSecundario("Blackout cinza");
    setTecidoSecundarioDesc("-2");
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
          body: JSON.stringify(body),
        });
        const atualizado: Ambiente = await res.json();
        setAmbientes((prev) =>
          prev.map((a) => (a._id === atualizado._id ? atualizado : a))
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        const res = await fetch("/api/ambientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const novo: Ambiente = await res.json();
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
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeStatus(id: string, status: Ambiente["status"]) {
    try {
      const res = await fetch(`/api/ambientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const atualizado: Ambiente = await res.json();
      setAmbientes((prev) =>
        prev.map((a) => (a._id === atualizado._id ? atualizado : a))
      );
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm("Deseja realmente excluir esse ambiente?");
    if (!confirmDelete) return;

    try {
      await fetch(`/api/ambientes/${id}`, {
        method: "DELETE",
      });
      setAmbientes((prev) => prev.filter((a) => a._id !== id));
      if (selectedId === id) {
        resetForm();
      }
    } catch (err) {
      console.error("Erro ao excluir ambiente:", err);
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