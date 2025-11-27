"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Ruler,
  ScissorsLineDashed,
  Boxes,
  Sparkles,
  CheckCircle2,
  Truck,
  PackageCheck,
  X,
  Plus,
  PanelLeftClose,
  ClipboardCheck,
} from "lucide-react";
import { useCurrentUser } from "@/src/app/providers/UserProvider";
import { useValidationCount } from "@/src/hooks/useValidationCount";

type UserRole = "gerente" | "instalador" | "producao";

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  description?: string;
  badge?: string;
  roles?: UserRole[];
};

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Visão geral",
  },
  {
    name: "Obras",
    href: "/obras",
    icon: Building2,
    description: "Gerenciar obras",
  },
  {
    name: "Medições",
    href: "/medicoes",
    icon: Ruler,
    description: "Registrar medidas",
  },
  {
    name: "Validação",
    href: "/validacao",
    icon: ClipboardCheck,
    description: "Aprovar medições",
    roles: ["gerente"],
  },
  {
    name: "Calhas",
    href: "/calhas",
    icon: ScissorsLineDashed,
    description: "Produção de calhas",
    badge: "Produção",
    roles: ["gerente", "producao"],
  },
  {
    name: "Cortinas",
    href: "/cortinas",
    icon: Sparkles,
    description: "Produção de cortinas",
    badge: "Produção",
    roles: ["gerente", "producao"],
  },
  {
    name: "Depósito",
    href: "/deposito",
    icon: PackageCheck,
    description: "Entrada e paletes",
  },
  {
    name: "Expedição",
    href: "/expedicao",
    icon: Truck,
    description: "Romaneios e retiradas",
  },
  {
    name: "Instalação",
    href: "/instalacao",
    icon: CheckCircle2,
    description: "Fila de instalação",
  },
  {
    name: "Produtos",
    href: "/produtos",
    icon: Boxes,
    description: "Catálogo",
    roles: ["gerente"],
  },
];

type AppSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onNewObra?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function AppSidebar({
  isOpen,
  onClose,
  onNewObra,
  isCollapsed = false,
  onToggleCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const role = user?.role as UserRole | undefined;
  const { count: validationCount } = useValidationCount(role);

  const isActive = (href: string) => pathname === href;
  const navItems = navigation.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  // Não mostrar em login/register
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white border-r border-slate-200
          transform transition-all duration-300 ease-in-out
          lg:sticky lg:top-16 lg:z-0 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-16" : "w-64"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header - Mobile: fechar | Desktop: colapsar */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            {/* Mobile */}
            <span className={`text-sm font-semibold text-slate-900 lg:hidden ${isCollapsed ? "hidden" : ""}`}>
              Menu
            </span>

            {/* Botão fechar mobile */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Botão colapsar desktop */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={`hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors ${isCollapsed ? "mx-auto" : "ml-auto"}`}
                title={isCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                <PanelLeftClose className={`w-5 h-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          {/* Ação rápida - Nova Obra */}
          {role === "gerente" && onNewObra && !isCollapsed && (
            <div className="p-3 border-b border-slate-100">
              <button
                onClick={() => {
                  onNewObra();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Obra</span>
              </button>
            </div>
          )}

          {/* Ação rápida colapsada */}
          {role === "gerente" && onNewObra && isCollapsed && (
            <div className="p-2 border-b border-slate-100">
              <button
                onClick={() => {
                  onNewObra();
                  onClose();
                }}
                className="w-full flex items-center justify-center p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                title="Nova Obra"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Navegação */}
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const showValidationBadge = item.href === "/validacao" && validationCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? item.name : undefined}
                    className={`
                      flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 relative
                      ${isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"}
                      ${active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `}
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                      {showValidationBadge && isCollapsed && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center">
                          {validationCount > 9 ? "9+" : validationCount}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <span className="block truncate">{item.name}</span>
                          {item.description && (
                            <p className={`text-[0.65rem] mt-0.5 truncate ${active ? "text-white/70" : "text-slate-400"}`}>
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[0.6rem] uppercase tracking-wide px-2 py-0.5 rounded-md flex-shrink-0 ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {showValidationBadge && (
                          <span className="min-w-[1.75rem] h-5 px-1.5 flex items-center justify-center bg-amber-500 text-white text-[0.65rem] font-bold rounded-full flex-shrink-0">
                            {validationCount > 99 ? "99+" : validationCount}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-3 border-t border-slate-100">
              <div className="text-[0.65rem] text-slate-400 text-center">
                Sistema Arion v1.0
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
