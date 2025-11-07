"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Ruler,
  X,
} from "lucide-react";
import { useState } from "react";
import { Obra } from "../types";
import { useCurrentUser } from "@/src/app/providers/UserProvider";

type MedicoesHeaderProps = {
  obras: Obra[];
  obraId: string;
  onChangeObra: (id: string) => void;
  andar: string;
  onChangeAndar: (andar: string) => void;
  quarto: string;
  onChangeQuarto: (q: string) => void;
  onPrevQuarto: () => void;
  onNextQuarto: () => void;
  codigoPreview: string;
  stats: {
    pending: number;
    review: number;
    done: number;
  };
  totalAmbientes: number;
  loadingAmbientes: boolean;
};

export function MedicoesHeader({
  obras,
  obraId,
  onChangeObra,
  andar,
  onChangeAndar,
  quarto,
  onChangeQuarto,
  onPrevQuarto,
  onNextQuarto,
  codigoPreview,
  stats,
  totalAmbientes,
}: MedicoesHeaderProps) {
  const { user, logout } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const summary = [
    { label: "Pendentes", value: stats.pending, color: "bg-amber-500" },
    { label: "Revisar", value: stats.review, color: "bg-red-500" },
    { label: "OK", value: stats.done, color: "bg-emerald-500" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          {/* Mobile */}
          <div className="flex items-center justify-between py-3 lg:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-50 transition"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-slate-700" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700" />
              )}
            </button>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <button onClick={onPrevQuarto} className="p-2 hover:bg-slate-50 transition">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div className="px-3 py-1.5 border-x border-slate-200 text-center min-w-[80px]">
                <input
                  value={quarto}
                  onChange={(e) => onChangeQuarto(e.target.value)}
                  className="w-full text-center text-sm font-semibold text-slate-800 bg-transparent outline-none"
                />
              </div>
              <button onClick={onNextQuarto} className="p-2 hover:bg-slate-50 transition">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <button
              onClick={logout}
              className="p-2 -mr-2 rounded-lg hover:bg-slate-50 text-slate-600 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block">
            {/* Linha única otimizada */}
            <div className="flex items-center justify-between py-3">
              {/* Esquerda: Branding + Obra + Navegação */}
              <div className="flex items-center gap-4">
                {/* Logo + Título */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                    <Ruler className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-slate-900 leading-none">Medições</h1>
                    <p className="text-xs text-slate-500 mt-0.5">{totalAmbientes} ambientes</p>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                {/* Obra */}
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <select
                    value={obraId}
                    onChange={(e) => onChangeObra(e.target.value)}
                    className="bg-white text-sm font-medium text-slate-900 outline-none cursor-pointer hover:text-slate-700 transition border-b border-slate-200 pb-0.5"
                  >
                    {obras.map((obra) => (
                      <option key={obra._id} value={obra._id}>
                        {obra.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                {/* Navegação */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onPrevQuarto}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>

                  <input
                    value={quarto}
                    onChange={(e) => onChangeQuarto(e.target.value)}
                    className="w-14 text-center text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-slate-200 transition"
                  />

                  <button
                    onClick={onNextQuarto}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>

                  <select
                    value={andar}
                    onChange={(e) => onChangeAndar(e.target.value)}
                    className="bg-slate-50 text-slate-900 rounded-lg px-2.5 py-1.5 text-sm outline-none hover:bg-slate-100 transition"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}º
                      </option>
                    ))}
                  </select>

                  <div className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg font-mono text-xs font-medium">
                    {codigoPreview}
                  </div>
                </div>
              </div>

              {/* Direita: Stats + User */}
              <div className="flex items-center gap-4">
                {/* Stats compactos com bolinhas */}
                <div className="flex items-center gap-3">
                  {summary.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-sm font-semibold text-slate-700">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="h-8 w-px bg-slate-200" />

                {/* User */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{user?.nome}</span>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Card */}
          <div className="lg:hidden fixed top-[57px] right-4 left-4 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 space-y-3 max-h-[calc(100vh-80px)] overflow-y-auto">
              {/* User info compacto */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Ruler className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.nome}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Obra */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Obra
                </label>
                <select
                  value={obraId}
                  onChange={(e) => {
                    onChangeObra(e.target.value);
                    setMenuOpen(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {obras.map((obra) => (
                    <option key={obra._id} value={obra._id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Andar */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Andar
                </label>
                <select
                  value={andar}
                  onChange={(e) => onChangeAndar(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}º andar
                    </option>
                  ))}
                </select>
              </div>

              {/* Código preview compacto */}
              <div className="bg-slate-900 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Código</p>
                <p className="font-mono text-sm font-semibold text-white">{codigoPreview}</p>
              </div>

              {/* Stats em grid compacto */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {summary.map((item) => (
                    <div
                      key={item.label}
                      className="bg-slate-50 rounded-lg px-2.5 py-2 text-center border border-slate-200"
                    >
                      <div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-1`} />
                      <p className="text-lg font-bold text-slate-900">{item.value}</p>
                      <p className="text-[0.65rem] text-slate-500 uppercase tracking-wide">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-400 text-center pt-1">
                {totalAmbientes} ambientes
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}