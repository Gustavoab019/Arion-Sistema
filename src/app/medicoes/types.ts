import { LucideIcon } from "lucide-react";
import type { Obra as ObraBase } from "@/src/app/obras/types";

export type Obra = ObraBase;

export type AmbienteStatus = "pendente" | "revisar" | "completo";

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
};

export type PrefixoItem = {
  value: string;
  label: string;
  icon: LucideIcon;
};
