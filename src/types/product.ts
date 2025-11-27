export type ProductCategory = "calha" | "cortinado" | "acessorio";

export type Product = {
  _id: string;
  nome: string;
  categoria: ProductCategory;
  descricao?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  calha: "Calhas",
  cortinado: "Cortinados",
  acessorio: "Acessórios",
};
