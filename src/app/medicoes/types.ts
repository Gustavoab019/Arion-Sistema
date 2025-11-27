import { LucideIcon } from "lucide-react";
import type { Obra as ObraBase } from "@/src/app/obras/types";
import type { TipoMontagem } from "@/src/lib/calhas-config";

export type Obra = ObraBase;

export type AmbienteStatus =
  | "medicao_pendente"
  | "aguardando_validacao"
  | "em_producao"
  | "producao_calha"
  | "producao_cortina"
  | "estoque_deposito"
  | "em_transito"
  | "aguardando_instalacao"
  | "instalado";

export type Ambiente = {
  _id: string;
  codigo: string;
  obraId?: string;
  obra?: string;
  quarto: string;
  prefixo: string;
  sequencia: number;
  medidoPor?: string;
  medidas?: {
    largura?: number;
    altura?: number;
    recuo?: number;
    instalacao?: string;
  };
  observacoes?: string;
  variaveis?: {
    calha?: string;
    tipoMontagem?: TipoMontagem; // Tipo de montagem da calha
    tecidoPrincipal?: string;
    tecidoSecundario?: string;
    regras?: {
      calhaDesconto?: number;
      voileAlturaDesconto?: number;
      blackoutAlturaDesconto?: number;
    };
  };
  status?: AmbienteStatus;
  createdAt?: string;
  updatedAt?: string;
  validadoPor?: string;
  validadoEm?: string;
  producaoCortinaResponsavel?: string;
  producaoCalhaResponsavel?: string;
  producaoConcluidaEm?: string;
  instaladorResponsavel?: string;
  instaladoPor?: string;
  instaladoEm?: string;
  depositoPalete?: string;
  depositoLocal?: string;
  depositoRecebidoPor?: string;
  depositoRecebidoEm?: string;
  expedicaoRomaneio?: string;
  expedicaoRetiradoPor?: string;
  expedicaoRetiradoEm?: string;
  workflow?: {
    validadoEm?: string;
    producaoCalhaInicio?: string;
    producaoCalhaFim?: string;
    producaoCortinaInicio?: string;
    producaoCortinaFim?: string;
    depositoEntrada?: string;
    depositoSaida?: string;
    expedicaoSaida?: string;
    instalacaoInicio?: string;
    instalacaoFim?: string;
  };
  logs?: {
    status: AmbienteStatus;
    mensagem?: string;
    createdAt: string;
    userId?: string;
    userNome?: string;
  }[];
};

export type PrefixoItem = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export type MountingOptionUI = {
  id?: string;
  nome: string;
  descricao?: string;
  tipoBase: TipoMontagem;
};
