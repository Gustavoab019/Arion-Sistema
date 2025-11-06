import { LucideIcon } from "lucide-react";

export type Obra = {
  _id: string;
  nome: string;
};

export type AmbienteStatus = "pendente" | "revisar" | "completo";

export type Ambiente = {
  _id: string;
  codigo: string;
  quarto: string;
  prefixo: string;
  sequencia: number;
  medidas?: {
    largura?: number;
    altura?: number;
    recuo?: number;
    instalacao?: string;
  };
  observacoes?: string;
  variaveis?: {
    calha?: string;
    tecidoPrincipal?: string;
    tecidoSecundario?: string;
    regras?: {
      calhaDesconto?: number;
      voileAlturaDesconto?: number;
      blackoutAlturaDesconto?: number;
    };
  };
  status?: AmbienteStatus;
};

export type PrefixoItem = {
  value: string;
  label: string;
  icon: LucideIcon;
};