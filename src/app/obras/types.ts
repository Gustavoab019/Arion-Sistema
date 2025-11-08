export type ObraStatus = "ativo" | "finalizado" | "pausado";

export type Responsavel = {
  userId: string;
  nome: string;
  role: "gerente" | "instalador" | "producao";
};

export type Obra = {
  _id: string;
  nome: string;
  cliente?: string;
  endereco?: string;
  andarInicial?: number;
  andarFinal?: number;
  status?: ObraStatus;
  observacoes?: string;
  createdAt?: string;
  responsaveis?: Responsavel[];
};

export type UsuarioAtivo = {
  _id: string;
  nome: string;
  email: string;
  role: "gerente" | "instalador" | "producao";
};

export type AmbienteResumo = {
  _id: string;
  codigo: string;
  quarto?: string;
  status?: "pendente" | "revisar" | "completo";
  medidoPor?: string;
  updatedAt?: string;
};
