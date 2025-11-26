import React, { useState, useEffect } from 'react';
import { User, AppRole } from '../types';
import { getUsers, saveUser, deleteUser } from '../services/storageService';
import { Button } from './Button';
import { Trash2, UserPlus, Shield, User as UserIcon, Save, Key } from 'lucide-react';

interface SettingsPanelProps {
  currentUser: User;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  
  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>(AppRole.USER);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) return;

    // Check if exists
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

    saveUser(newUser);
    loadUsers();
    
    // Reset form
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewRole(AppRole.USER);
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    if (usernameToDelete === currentUser.username) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${usernameToDelete}?`)) {
      deleteUser(usernameToDelete);
      loadUsers();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
         <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight font-[Montserrat]">Configuración</h2>
         <p className="text-slate-500 mt-2">Gestión de usuarios y permisos de acceso a la aplicación.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* List of Users */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Shield size={20} className="text-slate-400"/>
               Usuarios del Sistema
             </h3>
          </div>
          <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">
            {users.map((u) => (
              <div key={u.username} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${u.role === AppRole.ADMIN ? 'bg-slate-800' : 'bg-blue-500'}`}>
                    {u.username.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <div className="flex items-center gap-2 text-xs">
                       <span className="font-mono text-slate-500">@{u.username}</span>
                       <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === AppRole.ADMIN ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600'}`}>
                         {u.role === AppRole.ADMIN ? 'Admin' : 'Lector'}
                       </span>
                    </div>
                  </div>
                </div>
                {u.username !== currentUser.username && (
                  <button 
                    onClick={() => handleDeleteUser(u.username)}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar usuario"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New User Form */}
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
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium"
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Usuario</label>
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium"
                  placeholder="usuario"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contraseña</label>
                <div className="relative">
                   <Key className="absolute left-3 top-2.5 text-slate-400" size={14} />
                   <input 
                    type="text" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium"
                    placeholder="password"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Rol de Acceso</label>
              <div className="flex gap-4 p-1">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={newRole === AppRole.USER} onChange={() => setNewRole(AppRole.USER)} className="text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-slate-700">Usuario Lector</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={newRole === AppRole.ADMIN} onChange={() => setNewRole(AppRole.ADMIN)} className="text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-slate-700">Administrador</span>
                 </label>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full mt-4" icon={<Save size={16}/>}>
              Guardar Usuario
            </Button>

          </form>
        </div>

      </div>
    </div>
  );
};