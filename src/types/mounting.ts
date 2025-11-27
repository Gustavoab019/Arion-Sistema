import type { TipoMontagem } from "@/src/lib/calhas-config";

export type MountingOptionDto = {
  _id: string;
  nome: string;
  descricao?: string;
  tipoBase: TipoMontagem;
  createdAt?: string;
  updatedAt?: string;
};
