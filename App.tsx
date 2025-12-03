import React, { useState, useEffect } from 'react';
import { Family, ViewState, User, AppRole } from './types';
import { getFamilies, saveFamily, deleteFamily } from './services/storageService';
import { logout, getSessionUser } from './services/authService';
import { FamilyList } from './components/FamilyList';
import { FamilyForm } from './components/FamilyForm';
import { FamilyDetails } from './components/FamilyDetails';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { SettingsPanel } from './components/SettingsPanel';
import { LayoutDashboard, Users, PlusCircle, LogOut, Menu, Settings, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedFamily, setSelectedFamily] = useState<Family | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
      loadFamilies();
    }
  }, []);

  const loadFamilies = async () => {
    setLoading(true);
    try {
      const data = await getFamilies();
      setFamilies(data);
    } catch (error) {
      console.error("Error cargando familias:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadFamilies();
    setView('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setView('dashboard');
  };

  const handleSave = async (familyData: Family) => {
    setLoading(true);
    let familyToSave = { ...familyData };
    
    // Auditoría
    const existingIndex = families.findIndex(f => f.id === familyData.id);
    if (existingIndex === -1) {
      familyToSave.createdAt = new Date().toISOString();
      familyToSave.createdBy = currentUser?.username || 'unknown';
    } else {
      const original = families[existingIndex];
      familyToSave.createdAt = original.createdAt || familyToSave.createdAt;
      familyToSave.createdBy = original.createdBy || familyToSave.createdBy;
    }

    try {
      await saveFamily(familyToSave);
      await loadFamilies();
      setView('list');
      setSelectedFamily(undefined);
    } catch (error) {
      alert("Error al guardar en el servidor. Inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteFamily(id);
      await loadFamilies();
      if (selectedFamily?.id === id) {
        setView('list');
        setSelectedFamily(undefined);
      }
    } catch (error) {
      alert("Error al eliminar. Verifique conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedFamily(undefined);
    setView('form');
    setIsMobileMenuOpen(false);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Allow both ADMIN and SUPERADMIN to access admin features
  const isAdmin = currentUser.role === AppRole.ADMIN || currentUser.role === AppRole.SUPERADMIN;

  const NavItem = ({ target, icon: Icon, label, onClick, disabled }: { target?: ViewState, icon: any, label: string, onClick?: () => void, disabled?: boolean }) => {
    if (disabled) return null;
    const isActive = view === target;
    return (
      <div 
        onClick={() => { 
          if(onClick) onClick();
          else if(target) { setView(target); setIsMobileMenuOpen(false); }
        }} 
        className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer mb-1.5 border border-transparent
          ${isActive 
            ? 'bg-red-50 text-red-700 font-bold shadow-sm border-red-100' 
            : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm hover:border-slate-200'
          }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={`transition-colors ${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
          <span className="tracking-wide text-sm">{label}</span>
        </div>
        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] print:bg-white font-sans text-slate-800">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#fdfdfd] border-r border-slate-200/80 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static print:hidden shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]`}>
        <div className="h-28 flex flex-col justify-center px-8 border-b border-slate-100 bg-white">
             <div className="flex items-center gap-3 w-full">
               <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain max-w-[180px]" onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentElement!.innerHTML = `<div class="bg-red-600 h-10 w-10 rounded text-white flex items-center justify-center font-bold">AG</div>`;
               }}/>
             </div>
        </div>

        <nav className="p-6 space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Menú Principal</p>
          <NavItem target="dashboard" icon={LayoutDashboard} label="Panel de Control" />
          <NavItem target="list" icon={Users} label="Directorio Familiar" />
          <div className="my-6 border-t border-slate-100 mx-4"></div>
          {isAdmin && (
            <>
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Gestión</p>
              <NavItem onClick={handleCreateNew} target="form" icon={PlusCircle} label="Nueva Alta" />
              <NavItem target="config" icon={Settings} label="Configuración" />
            </>
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm cursor-pointer group" onClick={handleLogout}>
             <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm ${currentUser.role === AppRole.SUPERADMIN ? 'bg-purple-700' : isAdmin ? 'bg-slate-800' : 'bg-blue-600'}`}>
                {currentUser.username.substring(0, 2).toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{
                  currentUser.role === AppRole.SUPERADMIN ? 'SuperAdmin' : 
                  currentUser.role === AppRole.ADMIN ? 'Administrador' : 'Usuario'
                }</p>
             </div>
             <LogOut size={16} className="text-slate-400 group-hover:text-red-600 transition-colors" />
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible relative">
        <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-40 print:hidden">
           <div className="flex items-center gap-2">
             <div className="bg-red-600 w-8 h-8 rounded text-white flex items-center justify-center font-bold text-xs">AG</div>
             <h1 className="font-bold text-slate-800 text-sm">AMPA Agustinos</h1>
           </div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600"><Menu /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 print:p-0">
          
          {loading && view !== 'dashboard' && (
             <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden z-50">
                <div className="h-full bg-red-600 animate-[loading_1s_ease-in-out_infinite] w-1/3"></div>
             </div>
          )}

          {view === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto">
              <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800 font-[Montserrat]">Panel de Control</h2>
                  <p className="text-slate-500 mt-2 text-lg">Bienvenido, {currentUser.name}.</p>
                </div>
              </div>
              {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-red-600" size={40}/></div> : <Dashboard families={families} />}
            </div>
          )}

          {view === 'list' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto">
               <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
                 <div>
                   <h2 className="text-3xl font-extrabold text-slate-800 font-[Montserrat]">Directorio Familiar</h2>
                 </div>
                 {isAdmin && (
                   <button onClick={handleCreateNew} className="hidden md:flex bg-slate-900 text-white px-5 py-2.5 rounded-xl items-center gap-2 hover:bg-slate-800 transition-all shadow-lg font-semibold text-sm">
                      <PlusCircle size={18} /> Nueva Familia
                   </button>
                 )}
               </div>
               {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-red-600" size={40}/></div> : 
                 <FamilyList 
                   families={families} 
                   currentUser={currentUser}
                   onSelect={(f) => { setSelectedFamily(f); setView('details'); }}
                   onEdit={(f) => { setSelectedFamily(f); setView('form'); }}
                   onDelete={handleDelete}
                 />
               }
             </div>
          )}

          {view === 'form' && isAdmin && (
            <div className="animate-in fade-in zoom-in-95 print:hidden max-w-4xl mx-auto pt-4">
               <FamilyForm 
                 key={selectedFamily ? selectedFamily.id : 'new'}
                 initialData={selectedFamily} 
                 onSave={handleSave} 
                 onCancel={() => setView('list')} 
               />
            </div>
          )}

          {view === 'details' && selectedFamily && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <FamilyDetails 
                family={selectedFamily} 
                currentUser={currentUser}
                onBack={() => setView('list')}
                onEdit={() => setView('form')}
                onUpdate={(updated) => { handleSave(updated); setSelectedFamily(updated); }}
                onDelete={handleDelete}
              />
            </div>
          )}

          {view === 'config' && isAdmin && (
            <SettingsPanel currentUser={currentUser} />
          )}
        </div>
      </main>
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      <style>{`@keyframes loading { 0% { margin-left: -30%; } 100% { margin-left: 100%; } }`}</style>
    </div>
  );
};

export default App;