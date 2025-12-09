"use client";

import React, { useState, useEffect } from "react";
import { Family, ViewState, User, AppRole } from "./types";
import { getFamilies, saveFamily, deleteFamily } from "./services/storageService";
import { logout, getSessionUser, setSessionUser } from "./services/authService";

import { FamilyList } from "./components/FamilyList";
import { FamilyForm } from "./components/FamilyForm";
import { FamilyDetails } from "./components/FamilyDetails";
import { Dashboard } from "./components/Dashboard";
import { LoginScreen } from "./components/LoginScreen";
import { SettingsPanel } from "./components/SettingsPanel";

import {
  LayoutDashboard,
  Users,
  PlusCircle,
  LogOut,
  Menu,
  Settings,
  Loader2,
} from "lucide-react";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [view, setView] = useState<ViewState>("dashboard");
  const [selectedFamily, setSelectedFamily] = useState<Family | undefined>(
    undefined
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔐 Cargar sesión al inicio
  useEffect(() => {
    const session = getSessionUser();
    if (session) {
      setCurrentUser(session);
      loadFamilies();
    }
  }, []);

  // 📂 Cargar familias del backend
  const loadFamilies = async () => {
    setLoading(true);
    try {
      const data = await getFamilies();
      setFamilies(data);
    } catch (err) {
      console.error("Error cargando familias:", err);
    }
    setLoading(false);
  };

  // ✔ Login correcto
  const handleLoginSuccess = (user: User) => {
    setSessionUser(user);
    setCurrentUser(user);
    loadFamilies();
    setView("dashboard");
  };

  // 🚪 Logout
  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setView("dashboard");
  };

  // 💾 Guardar familia
  const handleSave = async (savedFamily: Family) => {
    // OJO: aquí ya NO llamamos a saveFamily otra vez
    setLoading(true);
    try {
      await loadFamilies();        // recarga de la API
      setView('list');             // vuelve al listado
      setSelectedFamily(undefined);
    } finally {
      setLoading(false);
    }
  };


  // 🗑 Borrar familia
  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await deleteFamily(id);
      await loadFamilies();
      if (selectedFamily && Number(selectedFamily.id) === id) {
        setSelectedFamily(undefined);
        setView("list");
      }
    } catch (err) {
      alert("Error al eliminar.");
    }
    setLoading(false);
  };

  // ➕ Crear nueva familia
  const handleCreateNew = () => {
    setSelectedFamily(undefined);
    setView("form");
    setIsMobileMenuOpen(false);
  };

  // 🔐 Si no hay usuario → Login
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin =
    currentUser.role === AppRole.ADMIN ||
    currentUser.role === AppRole.SUPERADMIN;

  // 🎨 Navegación
  const NavItem = ({
    target,
    icon: Icon,
    label,
    onClick,
  }: {
    target?: ViewState;
    icon: any;
    label: string;
    onClick?: () => void;
  }) => {
    const isActive = view === target;
    return (
      <div
        onClick={() => {
          if (onClick) onClick();
          else if (target) setView(target);
          setIsMobileMenuOpen(false);
        }}
        className={`group flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer mb-1.5 ${
          isActive ? "bg-red-50 text-red-700 font-semibold" : "text-slate-600"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} />
          <span>{label}</span>
        </div>
      </div>
    );
  };

  // 🖥 INTERFAZ
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200">
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 w-10 h-10 rounded text-white flex items-center justify-center font-bold">
              AG
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                AMPA Agustinos
              </p>
              <p className="text-xs text-slate-500">Panel de gestión</p>
            </div>
          </div>
        </div>

        <nav className="p-6 space-y-1">
          <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Menú principal
          </p>
          <NavItem target="dashboard" icon={LayoutDashboard} label="Panel" />
          <NavItem target="list" icon={Users} label="Familias" />

          {isAdmin && (
            <>
              <div className="mt-4 mb-1 border-t border-slate-100" />
              <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Gestión
              </p>
              <NavItem
                target="form"
                icon={PlusCircle}
                label="Nueva Alta"
                onClick={handleCreateNew}
              />
              <NavItem target="config" icon={Settings} label="Configuración" />
            </>
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-100">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={handleLogout}
          >
            <div className="bg-slate-800 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {currentUser.role}
              </p>
            </div>
            <LogOut className="text-slate-400 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 p-8 ml-72">
        {loading && (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-red-600" />
          </div>
        )}

        {view === "dashboard" && <Dashboard families={families} />}

        {view === "list" && (
          <FamilyList
            families={families}
            currentUser={currentUser}
            onSelect={(f) => {
              setSelectedFamily(f);
              setView("details");
            }}
            onEdit={(f) => {
              setSelectedFamily(f);
              setView("form");
            }}
            onDelete={(id) => handleDelete(Number(id))}
          />
        )}

        {view === "form" && isAdmin && (
          <FamilyForm
            initialData={selectedFamily}
            onSave={handleSave}
            onCancel={() => setView("list")}
          />
        )}

        {view === "details" && selectedFamily && (
          <FamilyDetails
            family={selectedFamily}
            currentUser={currentUser}
            onBack={() => setView("list")}
            onEdit={() => setView("form")}
            onUpdate={(f) => handleSave(f)}
            onDelete={(id) => handleDelete(Number(id))}
          />
        )}

        {view === "config" && isAdmin && (
          <SettingsPanel currentUser={currentUser} />
        )}
      </main>
    </div>
  );
};

export default App;
