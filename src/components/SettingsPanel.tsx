import React, { useState, useEffect } from 'react';
import { User, AppRole, Family, FamilyStatus, Member, Role } from '../types';
import { 
  getUsers, 
  saveUser, 
  deleteUser, 
  getFamilies
} from '../services/storageService';

import { Button } from './Button';
import { 
  Trash2, UserPlus, Shield, Database, Download, Upload, Loader2, 
  Eye, EyeOff 
} from 'lucide-react';

// ------------------------------------------------------
// PROPS
// ------------------------------------------------------
interface SettingsPanelProps {
  currentUser: User;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentUser }) => {

  // ------------------------------------------------------
  // ESTADOS: Usuarios
  // ------------------------------------------------------
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>(AppRole.USER);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // 🔐 Contraseñas en texto plano guardadas LOCALMENTE (no vienen del servidor)
  const [localPasswords, setLocalPasswords] = useState<Record<string, string>>({});

  // ------------------------------------------------------
  // ESTADOS: Import CSV Preview
  // ------------------------------------------------------
  const [csvPreview, setCsvPreview] = useState<Family[] | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const isSuperAdmin = currentUser.role === AppRole.SUPERADMIN;

  // ------------------------------------------------------
  // Helpers para contraseñas locales
  // ------------------------------------------------------
  const loadLocalPasswords = () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("ampa_user_passwords");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        setLocalPasswords(parsed);
      }
    } catch {
      // ignorar errores de parseo
    }
  };

  const saveLocalPasswords = (next: Record<string, string>) => {
    setLocalPasswords(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ampa_user_passwords", JSON.stringify(next));
    }
  };

  // ------------------------------------------------------
  // Cargar usuarios al iniciar
  // ------------------------------------------------------
  useEffect(() => { 
    loadUsers(); 
    loadLocalPasswords();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // Crear Usuario
  // ------------------------------------------------------
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername || !newPassword || !newName) {
      alert("Rellena todos los campos.");
      return;
    }

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

    // Guardar contraseña en texto plano SOLO en el navegador para poder mostrarla luego
    saveLocalPasswords({
      ...localPasswords,
      [newUsername]: newPassword,
    });

    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewRole(AppRole.USER);
  };

  // ------------------------------------------------------
  // Eliminar Usuario (por ID) + limpiar contraseña local
  // ------------------------------------------------------
  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.username === currentUser.username) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }

    if (!userToDelete.id) {
      alert("Error: este usuario no tiene ID válido.");
      return;
    }

    if (window.confirm(`¿Eliminar al usuario ${userToDelete.username}?`)) {
      await deleteUser(userToDelete.id);
      await loadUsers();

      // Borrar también su contraseña guardada localmente
      const updated = { ...localPasswords };
      delete updated[userToDelete.username];
      saveLocalPasswords(updated);
    }
  };

  const togglePasswordVisibility = (username: string) => {
    setVisiblePasswords(prev => ({ ...prev, [username]: !prev[username] }));
  };

  // ------------------------------------------------------
  // Exportar CSV
  // ------------------------------------------------------
  const handleExportCSV = async () => {
    setLoading(true);
    
    const families = await getFamilies();

    const headers = [
      'IdFamilia', 'NumeroSocio', 'NombreFamilia', 'Direccion', 'TelefonoFamilia',
      'EmailFamilia', 'Estado', 'FechaAlta',
      'IdMiembro', 'NombreMiembro', 'ApellidosMiembro', 'Rol', 'FechaNacimiento',
      'Genero', 'EmailMiembro', 'TelefonoMiembro'
    ];

    const rows: string[] = [headers.join(';')];

    families.forEach(f => {
      f.members.forEach(m => {
        const row = [
          String(f.id),
          f.membershipNumber,
          `"${f.familyName}"`,
          `"${f.address}"`,
          f.phone,
          f.email,
          f.status,
          f.joinDate,
          String(m.id),
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

    const blob = new Blob(["\ufeff" + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Backup_AMPA_${new Date().toISOString().split('T')[0]}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setLoading(false);
  };

  // ------------------------------------------------------
  // Importar CSV CON PREVIEW
  // ------------------------------------------------------
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim() !== "");

        const clean = (s: string) => s.replace(/^"|"$/g, '').trim();
        const familiesMap = new Map<number, Family>();

        const dataLines = lines.slice(1); // quitar cabecera

        dataLines.forEach(line => {
          const cols = line.split(';').map(c => clean(c));
          if (cols.length < 8) return;

          const famId = Number(cols[0]) || Math.floor(Math.random() * 9000000) + 1000000;

          if (!familiesMap.has(famId)) {
            familiesMap.set(famId, {
              id: famId,
              membershipNumber: cols[1],
              familyName: cols[2],
              address: cols[3],
              phone: cols[4],
              email: cols[5],
              status: cols[6] as FamilyStatus,
              joinDate: cols[7],
              createdAt: new Date().toISOString(),
              createdBy: `Import CSV (${currentUser.username})`,
              members: []
            });
          }

          const fam = familiesMap.get(famId)!;

          // Miembro
          if (cols[8]) {
            const memId = Number(cols[8]) || Math.floor(Math.random() * 9000000) + 1000000;

            fam.members.push({
              id: memId,
              firstName: cols[9],
              lastName: cols[10],
              role: cols[11] as Role,
              birthDate: cols[12],
              gender: cols[13] || undefined,
              email: cols[14] || undefined,
              phone: cols[15] || undefined,
            });
          }
        });

        setCsvPreview(Array.from(familiesMap.values()));
        setShowPreviewModal(true);

      } catch (error) {
        alert("Error al procesar el CSV.");
        console.error(error);
      } finally {
        event.target.value = '';
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ==============================
         MODAL PREVIEW CSV
      ============================== */}
      {showPreviewModal && csvPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl p-6">

            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Vista previa de importación CSV
            </h3>

            <p className="text-slate-600 mb-3">
              Se han detectado <b>{csvPreview.length}</b> familias.
            </p>

            <div className="max-h-64 overflow-auto border rounded-lg bg-slate-50 p-3">
              {csvPreview.slice(0, 5).map(f => (
                <div key={f.id} className="mb-3 pb-3 border-b border-slate-200">
                  <p className="font-bold">{f.familyName} — #{f.membershipNumber}</p>
                  <p className="text-sm text-slate-500">{f.members.length} miembros</p>
                </div>
              ))}

              {csvPreview.length > 5 && (
                <p className="text-xs text-slate-500 italic">
                  ... y {csvPreview.length - 5} familias más
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => { setShowPreviewModal(false); setCsvPreview(null); }}
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                onClick={async () => {
                  await fetch("/api/import/csv", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(csvPreview),
                  });

                  alert("Importación completada con éxito.");
                  window.location.reload();
                }}
              >
                Importar Datos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================
          TÍTULO
      ============================== */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800">Configuración</h2>
        <p className="text-slate-500 mt-2">Gestión de usuarios y base de datos.</p>
      </div>

      {/* ==============================
          EXPORTAR / IMPORTAR
      ============================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Database size={20} /> Gestión de Base de Datos
          </h3>
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">

            {/* EXPORTAR */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                  <Download size={20} />
                </div>
                <h4 className="font-bold text-slate-700">Exportar Datos</h4>
              </div>

              <Button 
                variant="outline" 
                onClick={handleExportCSV} 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Generando...' : 'Descargar Copia de Seguridad'}
              </Button>
            </div>

            <div className="w-px bg-slate-100 self-stretch hidden md:block"></div>

            {/* IMPORTAR */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Upload size={20} />
                </div>
                <h4 className="font-bold text-slate-700">Importar Datos</h4>
              </div>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  disabled={importing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  disabled={importing}
                >
                  {importing ? 'Procesando...' : 'Seleccionar Archivo CSV'}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =======================================================
          GESTIÓN DE USUARIOS
      ======================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Shield size={20} /> Usuarios del Sistema
          </h3>
        </div>

        {/* LISTADO */}
        <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">

          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          ) : (

            users.map((u) => {
              const plainPassword = localPasswords[u.username];

              return (
                <div 
                  key={u.id} 
                  className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 group hover:bg-slate-50 transition-colors"
                >
                  {/* INFO IZQUIERDA */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm
                      ${u.role === AppRole.SUPERADMIN ? 'bg-purple-700' :
                        u.role === AppRole.ADMIN ? 'bg-slate-800' : 'bg-blue-500'}
                    `}>
                      {u.username.substring(0,2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{u.name}</p>

                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        <span className="font-mono text-slate-500">@{u.username}</span>

                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === AppRole.SUPERADMIN
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === AppRole.ADMIN
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DERECHA: PASSWORD + BORRAR */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-3 justify-start md:justify-end">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 min-w-[6rem] text-center">
                          {visiblePasswords[u.username]
                            ? (plainPassword ?? '••••••')
                            : '••••••'}
                        </div>

                        <button 
                          onClick={() => togglePasswordVisibility(u.username)} 
                          className="text-slate-400 hover:text-slate-600"
                          type="button"
                        >
                          {visiblePasswords[u.username] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {u.username !== currentUser.username && (
                        <button 
                          onClick={() => handleDeleteUser(u)} 
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })

          )}

        </div>
      </div>

      {/* =======================================================
          CREAR NUEVO USUARIO
      ======================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus size={20} /> Crear Nuevo Acceso
          </h3>
        </div>

        <form onSubmit={handleAddUser} className="p-6 space-y-4">

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Nombre Completo
            </label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 text-sm font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Contraseña
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Rol de Acceso
            </label>

            <div className="flex gap-4 p-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={newRole === AppRole.USER}
                  onChange={() => setNewRole(AppRole.USER)}
                />
                <span className="text-sm font-medium text-slate-700">
                  Usuario
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={newRole === AppRole.ADMIN}
                  onChange={() => setNewRole(AppRole.ADMIN)}
                />
                <span className="text-sm font-medium text-slate-700">
                  Admin
                </span>
              </label>
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-4"
          >
            Guardar Usuario
          </Button>
        </form>
      </div>

    </div>
  );
};
