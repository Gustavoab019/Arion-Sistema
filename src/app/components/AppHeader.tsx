"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  Bell,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/src/app/providers/UserProvider";
import type { AppNotification } from "@/src/types/notification";

type AppHeaderProps = {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
};

export function AppHeader({ onMenuClick, showMenuButton = true }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const res = await fetch("/api/notifications", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Falha ao carregar notificações.");
      }
      const data = (await res.json()) as AppNotification[];
      setNotifications(data);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      setNotificationsError(
        error instanceof Error ? error.message : "Erro ao carregar notificações."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markNotificationsAsRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) =>
        prev.map((notification) =>
          ids.includes(notification._id)
            ? { ...notification, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error);
    }
  }, []);

  const markSingleNotification = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/notifications/${id}`, {
          method: "PATCH",
          credentials: "include",
        });
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === id
              ? { ...notification, readAt: new Date().toISOString() }
              : notification
          )
        );
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
      }
    },
    []
  );

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} d`;
  };

  const handleNotificationAction = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await markSingleNotification(notification._id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setNotificationsOpen(false);
    }
  };

  // Não mostrar header em login/register
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Esquerda: Menu mobile + Logo */}
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 relative">
              <Image
                src="/Logo.png"
                alt="Arion Logo"
                fill
                className="object-contain"
                sizes="36px"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-[0.6rem] text-slate-400 uppercase tracking-[0.15em] font-medium">
                Sistema Arion
              </p>
              <h1 className="text-sm font-semibold text-slate-900 leading-tight -mt-0.5">
                Operações & Medições
              </h1>
            </div>
          </Link>
        </div>

        {/* Direita: Notificações + Perfil */}
        <div className="flex items-center gap-2">
          {/* Notificações */}
          <div className="relative" data-dropdown>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotificationsOpen(!notificationsOpen);
                setUserMenuOpen(false);
              }}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[0.6rem] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Notificações */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900">Notificações</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
              {notificationsLoading && (
                <div className="px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando notificações...
                </div>
              )}
              {notificationsError && (
                <div className="px-4 py-3 text-xs text-red-600">
                  {notificationsError}
                </div>
              )}
              {!notificationsLoading && notifications.length === 0 && (
                <div className="px-4 py-5 text-sm text-slate-500 text-center">
                  Nenhuma notificação ainda.
                </div>
              )}
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationAction(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 transition ${
                    notification.readAt
                      ? "bg-white hover:bg-slate-50"
                      : "bg-blue-50/50 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.readAt && (
                      <span className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                    <div className={notification.readAt ? "ml-4" : ""}>
                      <p className="text-sm font-semibold text-slate-900">
                        {notification.titulo}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {notification.mensagem}
                      </p>
                      <p className="text-[0.6rem] text-slate-400 mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
              {unreadCount > 0 ? (
                <button
                  className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 py-1"
                  onClick={() =>
                    markNotificationsAsRead(
                      notifications.filter((n) => !n.readAt).map((n) => n._id)
                    )
                  }
                >
                  Marcar todas como lidas
                </button>
              ) : (
                <button
                  className="w-full text-xs font-medium text-slate-500 py-1 cursor-default"
                  disabled
                >
                  Nenhuma pendente
                </button>
              )}
            </div>
          </div>
        )}
          </div>

          {/* Perfil do Usuário */}
          <div className="relative" data-dropdown>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 leading-tight">{user?.nome}</p>
                <p className="text-[0.6rem] uppercase tracking-wide text-slate-500">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Usuário */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900">{user?.nome}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <Settings className="w-4 h-4 text-slate-400" />
                    Configurações
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    Ajuda
                  </button>
                </div>
                <div className="border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
