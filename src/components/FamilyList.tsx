import React, { useState } from 'react';
import { Family, FamilyStatus, Role, User, AppRole, Member } from '../types';
import { Button } from './Button';
import {
  Search, Users, MapPin, Download, Printer, FileSpreadsheet, LayoutGrid, List,
  Edit, Trash2, Eye, CheckCircle, Phone, Mail, X, ChevronDown, FileText, Baby, ChevronRight
} from 'lucide-react';
import { MembershipCard } from './MembershipCard';

interface FamilyListProps {
  families: Family[];
  currentUser: User;
  onSelect: (family: Family) => void;
  onEdit: (family: Family) => void;
  onDelete: (id: number) => void;     // <-- number
}

export const FamilyList: React.FC<FamilyListProps> = ({
  families,
  currentUser,
  onSelect,
  onEdit,
  onDelete
}) => {

  // ==============================
  // ESTADOS
  // ==============================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | FamilyStatus>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'number'>('name');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  const [printConfig, setPrintConfig] = useState({
    mode: 'CURRENT' as 'CURRENT' | 'RANGE',
    rangeStart: '',
    rangeEnd: ''
  });

  const [familiesToPrint, setFamiliesToPrint] = useState<Family[]>([]);
  const isAdmin = currentUser.role === AppRole.ADMIN || currentUser.role === AppRole.SUPERADMIN;

  // ==============================
  // HELPERS
  // ==============================
  const sortMembers = (members: Member[]) => {
    const rolePriority: Record<string, number> = {
      [Role.FATHER]: 1,
      [Role.MOTHER]: 1,
      [Role.TUTOR]: 1,
      [Role.CHILD]: 2
    };
    return [...members].sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99));
  };

  // ==============================
  // FILTROS Y ORDEN
  // ==============================
  const filteredFamilies = families.filter(f => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      f.familyName.toLowerCase().includes(term) ||
      f.membershipNumber.toLowerCase().includes(term) ||
      f.email.toLowerCase().includes(term) ||
      f.phone.includes(term);

    const matchesStatus = filterStatus === 'ALL' || f.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const sortedFamilies = [...filteredFamilies].sort((a, b) => {
    if (sortBy === 'name') return a.familyName.localeCompare(b.familyName);
    return parseInt(a.membershipNumber || '0', 10) - parseInt(b.membershipNumber || '0', 10);
  });

  // ==============================
  // EXPORTACIÓN A CSV
  // ==============================
  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  };

  const handleExportExcelFamilies = () => {
    const headers = ['Nº Socio', 'Familia', 'Estado', 'Dirección', 'Teléfono', 'Email', 'Miembros', 'Hijos'];
    const rows = sortedFamilies.map(f => [
      f.membershipNumber,
      `"${f.familyName}"`,
      f.status,
      `"${f.address}"`,
      f.phone,
      f.email,
      f.members.length,
      f.members.filter(m => m.role === Role.CHILD).length
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csv, `ampa_familias_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportExcelMembers = () => {
    const headers = ['Nº Socio', 'Familia', 'Nombre', 'Apellidos', 'Rol', 'Sexo', 'Fecha Nacimiento', 'Contacto'];
    const rows: string[][] = [];

    sortedFamilies.forEach(f => {
      const members = sortMembers(f.members);
      members.forEach(m => {
        rows.push([
          f.membershipNumber,
          `"${f.familyName}"`,
          `"${m.firstName}"`,
          `"${m.lastName}"`,
          m.role,
          m.gender || '-',
          m.birthDate,
          `"${f.phone} | ${f.email}"`,
        ]);
      });
    });

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csv, `ampa_miembros_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportExcelChildren = () => {
    const headers = ['Nº Socio', 'Familia', 'Nombre', 'Apellidos', 'Edad', 'Fecha Nacimiento', 'Sexo'];
    const rows: string[][] = [];
    const year = new Date().getFullYear();

    sortedFamilies.forEach(f => {
      const children = f.members.filter(m => m.role === Role.CHILD);
      children.sort((a, b) => (a.birthDate || '').localeCompare(b.birthDate || ''));

      children.forEach(m => {
        const age = m.birthDate ? year - new Date(m.birthDate).getFullYear() : 0;
        rows.push([
          f.membershipNumber,
          `"${f.familyName}"`,
          `"${m.firstName}"`,
          `"${m.lastName}"`,
          age.toString(),
          m.birthDate || '',
          m.gender || '-'
        ]);
      });
    });

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csv, `ampa_hijos_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  // ==============================
  // DELETE
  // ==============================
  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm("¿Seguro que quieres eliminar esta familia?")) {
      onDelete(id);
    }
  };

  // ==============================
  // UI PRINCIPAL
  // ==============================
  return (
    <div className="space-y-8 text-slate-800">
      {/* CABECERA: buscador, filtros, exportar, vista */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-4 md:px-6 md:py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Izquierda: buscador + filtros */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por familia, nº socio, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white
                           text-sm text-slate-800 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-600">Total:</span>
                <span className="font-mono text-slate-900">{filteredFamilies.length}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-slate-500">
                <Users size={14} />
                <span className="text-[11px] uppercase tracking-wide font-semibold">
                  Familias registradas
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Filtro estado */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
                Estado:
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1 rounded-md font-medium ${
                    filterStatus === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus(FamilyStatus.ACTIVE)}
                  className={`px-3 py-1 rounded-md font-medium ${
                    filterStatus === FamilyStatus.ACTIVE
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setFilterStatus(FamilyStatus.INACTIVE)}
                  className={`px-3 py-1 rounded-md font-medium ${
                    filterStatus === FamilyStatus.INACTIVE
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Baja
                </button>
              </div>
            </div>

            {/* Orden */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
                Ordenar por:
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-3 py-1 rounded-md font-medium ${
                    sortBy === 'name'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600'
                  }`}
                >
                  Nombre
                </button>
                <button
                  onClick={() => setSortBy('number')}
                  className={`px-3 py-1 rounded-md font-medium ${
                    sortBy === 'number'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600'
                  }`}
                >
                  Nº socio
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Derecha: vista + exportar */}
        <div className="flex flex-col items-stretch gap-3 w-full md:w-auto md:items-end">
          {/* Selector vista */}
          <div className="inline-flex self-end rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <List size={14} />
              Tabla
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <LayoutGrid size={14} />
              Tarjetas
            </button>
          </div>

          {/* Exportar */}
          <div className="relative self-end">
            <Button
              type="button"
              variant="secondary"
              className="inline-flex items-center gap-2 text-xs"
              onClick={() => setShowExportMenu(v => !v)}
              icon={<FileSpreadsheet size={16} />}
            >
              Exportar
            </Button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-20 text-xs text-slate-700">
                <button
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                  onClick={handleExportExcelFamilies}
                >
                  <FileText size={14} className="text-slate-500" />
                  <span>Listado de familias</span>
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                  onClick={handleExportExcelMembers}
                >
                  <Users size={14} className="text-slate-500" />
                  <span>Listado de miembros</span>
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                  onClick={handleExportExcelChildren}
                >
                  <Baby size={14} className="text-slate-500" />
                  <span>Solo hijos/as</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* vista en GRID */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedFamilies.map(family => (
            <div
              key={family.id}
              className="relative group flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition cursor-pointer text-slate-800"
              onClick={() => onSelect(family)}
            >
              <div
                className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl ${
                  family.status === FamilyStatus.ACTIVE ? 'bg-green-600' : 'bg-slate-400'
                }`}
              />
              
              <div className="p-6 pl-7 flex flex-col gap-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">Socio</span>
                    <span className="font-mono ml-1 text-slate-900 text-sm">
                      #{family.membershipNumber}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      family.status === FamilyStatus.ACTIVE
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {family.status}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-900">
                  {family.familyName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" /> {family.address}
                </p>

                <div className="mt-3 flex justify-between items-end pt-3 border-t border-slate-100 gap-3">
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <div className="flex items-center gap-1">
                      <Mail size={12} className="text-slate-400" />
                      <span className="truncate">{family.email}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Phone size={12} className="text-slate-400" />
                      <span>{family.phone}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(family); }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Editar familia"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={(e) => handleDelete(e, family.id!)}
                        className="text-red-600 hover:text-red-700"
                        title="Eliminar familia"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sortedFamilies.length === 0 && (
            <div className="col-span-full text-center text-slate-500 text-sm bg-white border border-dashed border-slate-300 rounded-xl py-10">
              No se han encontrado familias con los filtros actuales.
            </div>
          )}
        </div>
      )}

      {/* vista en TABLA */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-slate-800">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Nº Socio
                </th>
                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Familia
                </th>
                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Contacto
                </th>
                <th className="px-6 py-3 text-right text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedFamilies.map((family, index) => (
                <tr
                  key={family.id}
                  className={`cursor-pointer group ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-slate-100`}
                  onClick={() => onSelect(family)}
                >
                  <td className="px-6 py-2 font-mono text-sm text-slate-900">
                    #{family.membershipNumber}
                  </td>

                  <td className="px-6 py-2">
                    <div className="font-semibold text-slate-900">
                      {family.familyName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Users size={11} className="text-slate-400" />
                      {family.members.length} miembros
                    </div>
                  </td>

                  <td className="px-6 py-2">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                      family.status === FamilyStatus.ACTIVE
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {family.status}
                    </span>
                  </td>

                  <td className="px-6 py-2 text-xs text-slate-700">
                    <div className="flex items-center gap-1">
                      <Mail size={10} className="text-slate-400" />
                      <span className="truncate">{family.email}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone size={10} className="text-slate-400" />
                      <span>{family.phone}</span>
                    </div>
                  </td>

                  <td className="px-6 py-2 text-right">
                    {isAdmin && (
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(family); }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Editar familia"
                        >
                          <Edit size={14} />
                        </button>

                          <button
                            onClick={(e) => handleDelete(e, family.id!)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar familia"
                          >
                            <Trash2 size={14} />
                          </button>
                      </div>
                    )}
                  </td>

                </tr>
              ))}

              {sortedFamilies.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-500 text-sm"
                  >
                    No se han encontrado familias con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
