
import React, { useState, useEffect } from 'react';
import { User, AppRole, Family, FamilyStatus, Member, Role } from '../types';
import { getUsers, saveUser, deleteUser, getFamilies, importFamilies, generateId } from '../services/storageService';
import { Button } from './Button';
import { Trash2, UserPlus, Shield, User as UserIcon, Save, Key, Database, Download, Upload, AlertTriangle, Loader2 } from 'lucide-react';

interface SettingsPanelProps {
  currentUser: User;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>(AppRole.USER);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) return;

    if (users.some(u => u.username === newUsername)) {
      alert("El nombre de usuario ya existe.");
      return;
    }

    const newUser = {
      username: newUsername,
      password: newPassword,
      name: newName,
      role: newRole
    };

    await saveUser(newUser);
    await loadUsers();
    
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewRole(AppRole.USER);
  };

  const handleDeleteUser = async (userToDelete: any) => {
    if (userToDelete.username === currentUser.username) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }

    // Lógica de permisos
    const isSuperAdmin = currentUser.role === AppRole.SUPERADMIN;
    const isAdmin = currentUser.role === AppRole.ADMIN;
    const targetIsSuperAdmin = userToDelete.role === AppRole.SUPERADMIN;
    const targetIsAdmin = userToDelete.role === AppRole.ADMIN;

    if (targetIsSuperAdmin) {
      alert("No se puede eliminar a un Super Administrador.");
      return;
    }

    // Admin no puede borrar a otro Admin
    if (isAdmin && targetIsAdmin) {
      alert("Los administradores no pueden eliminar a otros administradores. Contacta con el SuperAdmin.");
      return;
    }

    // Si es SuperAdmin puede borrar Admin y User
    // Si es Admin puede borrar User
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${userToDelete.username}?`)) {
      await deleteUser(userToDelete.username);
      await loadUsers();
    }
  };

  const canDelete = (targetUser: any) => {
    if (targetUser.username === currentUser.username) return false;
    if (targetUser.role === AppRole.SUPERADMIN) return false;
    
    if (currentUser.role === AppRole.SUPERADMIN) return true;
    if (currentUser.role === AppRole.ADMIN) return targetUser.role === AppRole.USER;
    
    return false;
  };

  const handleExportCSV = async () => {
    setLoading(true);
    const families = await getFamilies();
    
    const headers = [
      'IdFamilia', 'NumeroSocio', 'NombreFamilia', 'Direccion', 'TelefonoFamilia', 'EmailFamilia', 'Estado', 'FechaAlta',
      'IdMiembro', 'NombreMiembro', 'ApellidosMiembro', 'Rol', 'FechaNacimiento', 'Genero', 'EmailMiembro', 'TelefonoMiembro'
    ];

    const rows: string[] = [];
    rows.push(headers.join(';'));

    families.forEach(f => {
      f.members.forEach(m => {
        const row = [
          f.id,
          f.membershipNumber,
          `"${f.familyName}"`,
          `"${f.address}"`,
          f.phone,
          f.email,
          f.status,
          f.joinDate,
          m.id,
          `"${m.firstName}"`,
          `"${m.lastName}"`,
          m.role,
          m.birthDate,
          m.gender || '',
          m.email || '',
          m.phone || ''
        ];
        rows.push(row.join(';'));
      });
    });

    const csvContent = "\ufeff" + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Backup_BaseDatos_AMPA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoading(false);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("ATENCIÓN: La importación combinará los datos nuevos con los existentes. Se recomienda hacer una copia de seguridad antes. ¿Desea continuar?")) {
      event.target.value = ''; 
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');
        
        const importedFamiliesMap = new Map<string, Family>();
        const clean = (str: string) => str ? str.replace(/^"|"$/g, '').trim() : '';

        dataLines.forEach(line => {
           const cols = line.split(';');
           if (cols.length < 8) return; 

           const famId = clean(cols[0]) || generateId(); 
           
           if (!importedFamiliesMap.has(famId)) {
              importedFamiliesMap.set(famId, {
                id: famId,
                membershipNumber: clean(cols[1]),
                familyName: clean(cols[2]),
                address: clean(cols[3]),
                phone: clean(cols[4]),
                email: clean(cols[5]),
                status: clean(cols[6]) as FamilyStatus,
                joinDate: clean(cols[7]),
                createdAt: new Date().toISOString(),
                createdBy: `Importación CSV (${currentUser.username})`,
                members: []
              });
           }
           const family = importedFamiliesMap.get(famId)!;
           if (cols[8]) {
             const member: Member = {
               id: clean(cols[8]) || generateId(),
               firstName: clean(cols[9]),
               lastName: clean(cols[10]),
               role: clean(cols[11]) as Role,
               birthDate: clean(cols[12]),
               gender: clean(cols[13]),
               email: clean(cols[14]),
               phone: clean(cols[15])
             };
             family.members.push(member);
           }
        });

        // Send to Server
        const familiesList = Array.from(importedFamiliesMap.values());
        await importFamilies(familiesList);

        alert(`✅ Importación completada con éxito. Se han procesado ${familiesList.length} familias.`);
        window.location.reload();

      } catch (error) {
        console.error("Error importing CSV", error);
        alert("Error al procesar o guardar el archivo CSV.");
      } finally {
        setImporting(false);
        event.target.value = ''; 
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
         <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight font-[Montserrat]">Configuración</h2>
         <p className="text-slate-500 mt-2">Gestión de usuarios y datos de la aplicación.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Database size={20} className="text-slate-400"/>
             Gestión de Base de Datos
           </h3>
        </div>
        <div className="p-8">
           <div className="flex flex-col md:flex-row gap-8 items-start">
             
             <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-green-100 text-green-700 rounded-lg"><Download size={20}/></div>
                   <h4 className="font-bold text-slate-700">Exportar Datos</h4>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Descarga una copia completa de todas las familias y miembros en formato CSV.
                </p>
                <Button variant="outline" onClick={handleExportCSV} className="w-full justify-center" disabled={loading}>
                  {loading ? 'Generando...' : 'Descargar Copia de Seguridad'}
                </Button>
             </div>

             <div className="w-px bg-slate-100 self-stretch hidden md:block"></div>

             <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Upload size={20}/></div>
                   <h4 className="font-bold text-slate-700">Importar Datos</h4>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                   Carga datos desde un archivo CSV compatible.
                </p>
                <div className="relative">
                   <input type="file" accept=".csv" onChange={handleImportCSV} disabled={importing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                   <Button variant="secondary" className="w-full justify-center" disabled={importing}>
                     {importing ? 'Procesando...' : 'Seleccionar Archivo CSV'}
                   </Button>
                </div>
             </div>

           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Shield size={20} className="text-slate-400"/>
               Usuarios del Sistema
             </h3>
          </div>
          <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">
            {loading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div> : 
             users.map((u) => (
              <div key={u.username} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${u.role === AppRole.SUPERADMIN ? 'bg-purple-700' : u.role === AppRole.ADMIN ? 'bg-slate-800' : 'bg-blue-500'}`}>
                    {u.username.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <div className="flex items-center gap-2 text-xs">
                       <span className="font-mono text-slate-500">@{u.username}</span>
                       <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                         u.role === AppRole.SUPERADMIN ? 'bg-purple-100 text-purple-700' :
                         u.role === AppRole.ADMIN ? 'bg-slate-100 text-slate-600' : 
                         'bg-blue-50 text-blue-600'}`}>
                         {u.role === AppRole.SUPERADMIN ? 'SuperAdmin' : u.role === AppRole.ADMIN ? 'Admin' : 'Lector'}
                       </span>
                    </div>
                  </div>
                </div>
                {canDelete(u) && (
                  <button onClick={() => handleDeleteUser(u)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <UserPlus size={20} className="text-slate-400"/>
               Crear Nuevo Acceso
             </h3>
          </div>
          <form onSubmit={handleAddUser} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nombre Completo</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Usuario</label>
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contraseña</label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Rol de Acceso</label>
              <div className="flex gap-4 p-1">
                 <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={newRole === AppRole.USER} onChange={() => setNewRole(AppRole.USER)} className="text-red-600 focus:ring-red-500" /><span className="text-sm font-medium text-slate-700">Usuario Lector</span></label>
                 <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={newRole === AppRole.ADMIN} onChange={() => setNewRole(AppRole.ADMIN)} className="text-red-600 focus:ring-red-500" /><span className="text-sm font-medium text-slate-700">Administrador</span></label>
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full mt-4" icon={<Save size={16}/>}>Guardar Usuario</Button>
          </form>
        </div>
      </div>
    </div>
  );
};
