import React, { useState, useRef } from 'react';
import { Family, FamilyStatus, Role, User, AppRole, Member } from '../types';
import { Button } from './Button';
import { Search, Users, MapPin, Download, Printer, FileSpreadsheet, LayoutGrid, List, Edit, Trash2, Eye, CheckCircle, Phone, Mail, User as UserIcon, X, ChevronDown, Filter, FileText, UserPlus, ChevronRight, Baby } from 'lucide-react';
import { MembershipCard } from './MembershipCard';

interface FamilyListProps {
  families: Family[];
  currentUser: User;
  onSelect: (family: Family) => void;
  onEdit: (family: Family) => void;
  onDelete: (id: string) => void;
}

export const FamilyList: React.FC<FamilyListProps> = ({ families, currentUser, onSelect, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | FamilyStatus>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'number'>('name');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  const isAdmin = currentUser.role === AppRole.ADMIN || currentUser.role === AppRole.SUPERADMIN;

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    mode: 'CURRENT' as 'CURRENT' | 'RANGE',
    rangeStart: '',
    rangeEnd: ''
  });
  const [familiesToPrint, setFamiliesToPrint] = useState<Family[]>([]);

  const sortMembers = (members: Member[]) => {
    const rolePriority: Record<string, number> = {
      [Role.FATHER]: 1,
      [Role.MOTHER]: 1,
      [Role.TUTOR]: 1,
      [Role.CHILD]: 2
    };
    return [...members].sort((a, b) => {
      const pA = rolePriority[a.role] || 99;
      const pB = rolePriority[b.role] || 99;
      return pA - pB;
    });
  };

  const filteredFamilies = families.filter(f => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = f.familyName.toLowerCase().includes(term) || 
                          f.membershipNumber.includes(term) ||
                          f.email.toLowerCase().includes(term) ||
                          f.phone.includes(term);
    const matchesStatus = filterStatus === 'ALL' || f.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedFamilies = [...filteredFamilies].sort((a, b) => {
    if (sortBy === 'name') {
      return a.familyName.localeCompare(b.familyName);
    } else {
      return parseInt(a.membershipNumber || '0') - parseInt(b.membershipNumber || '0');
    }
  });

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csvContent, `ampa_familias_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportExcelMembers = () => {
    const headers = ['Nº Socio', 'Familia', 'Nombre', 'Apellidos', 'Rol', 'Sexo', 'Fecha Nacimiento', 'Contacto'];
    const rows: string[][] = [];

    sortedFamilies.forEach(f => {
      const sortedMems = sortMembers(f.members);
      sortedMems.forEach(m => {
        rows.push([
          f.membershipNumber,
          `"${f.familyName}"`,
          `"${m.firstName}"`,
          `"${m.lastName}"`,
          m.role,
          m.gender || '-',
          m.birthDate,
          `"${f.phone} | ${f.email}"`
        ]);
      });
    });

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csvContent, `ampa_miembros_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportExcelChildren = () => {
    const headers = ['Nº Socio', 'Familia', 'Nombre', 'Apellidos', 'Edad', 'Fecha Nacimiento', 'Sexo'];
    const rows: string[][] = [];
    const currentYear = new Date().getFullYear();

    sortedFamilies.forEach(f => {
      const children = f.members.filter(m => m.role === Role.CHILD);
      children.sort((a, b) => (a.birthDate || '').localeCompare(b.birthDate || ''));
      
      children.forEach(m => {
        const age = m.birthDate ? currentYear - new Date(m.birthDate).getFullYear() : 0;
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

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csvContent, `ampa_hijos_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const getPDFHeader = (title: string, orientation: 'portrait' | 'landscape') => `
    <html>
      <head>
        <title>${title} - AMPA Agustinos</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 ${orientation}; margin: 10mm; }
          body { font-family: 'Montserrat', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tr { break-inside: avoid; }
        </style>
      </head>
      <body class="bg-white p-8">
        <div class="flex justify-between items-end mb-8 border-b-2 border-red-600 pb-4">
          <div class="flex items-center gap-4">
             <div class="bg-red-600 text-white w-12 h-12 flex items-center justify-center rounded-lg font-black text-xl shadow-sm">AG</div>
             <div>
               <h1 class="text-2xl font-black text-slate-800 uppercase tracking-tight">${title}</h1>
               <p class="text-sm text-red-600 font-bold uppercase tracking-widest">AMPA Agustinos Granada</p>
             </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400 font-bold uppercase mb-1">Fecha de Emisión</p>
            <p class="text-slate-800 font-bold">${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
  `;

  const getPDFFooter = () => `
        <div class="mt-8 pt-4 border-t border-slate-200 text-center">
           <p class="text-xs text-slate-400">Documento generado por la Plataforma de Gestión AMPA Agustinos.</p>
        </div>
        <script>setTimeout(() => { window.print(); }, 500);</script>
      </body>
    </html>
  `;

  const handleExportPDFFamilies = (orientation: 'portrait' | 'landscape') => {
    const printWindow = window.open('', '', 'width=1100,height=800');
    if (!printWindow) return;

    const rowsHtml = sortedFamilies.map((f, index) => `
      <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
        <td class="px-3 py-3 font-mono font-bold text-slate-600 border-b border-slate-200 text-xs">#${f.membershipNumber}</td>
        <td class="px-3 py-3 font-bold text-slate-800 border-b border-slate-200 text-sm">${f.familyName}</td>
        <td class="px-3 py-3 border-b border-slate-200">
          <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${f.status === FamilyStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${f.status}</span>
        </td>
        <td class="px-3 py-3 text-xs text-slate-600 border-b border-slate-200">${f.address}</td>
        <td class="px-3 py-3 text-xs font-mono text-slate-600 border-b border-slate-200 whitespace-nowrap">${f.phone}</td>
        <td class="px-3 py-3 text-xs text-slate-600 border-b border-slate-200 break-all">${f.email}</td>
        <td class="px-3 py-3 text-center text-xs font-bold text-slate-600 border-b border-slate-200">${f.members.filter(m => m.role === Role.CHILD).length}</td>
      </tr>
    `).join('');

    printWindow.document.write(
      getPDFHeader('Listado de Familias', orientation) + 
      `<table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-800 text-white">
              <th class="px-3 py-3 text-[10px] font-bold uppercase tracking-wider rounded-tl-lg">Socio</th>
              <th class="px-3 py-3 text-[10px] font-bold uppercase tracking-wider">Familia</th>
              <th class="px-3 py-3 text-[10px] font-bold uppercase tracking-wider">Estado</th>
              <th class="px-3 py-3 text-[10px] font-bold uppercase tracking-wider">Dirección</th>
              <th class="px-3 py-3 text-[10px] font-bold uppercase tracking-wider">Teléfono</th>
              <th class="px-3 py-3 text-[10px] font-bold uppercase tracking-wider">Email</th>
              <th class="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-center rounded-tr-lg">Hijos</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
       </table>` + 
      getPDFFooter()
    );
    printWindow.document.close();
    setShowExportMenu(false);
  };

  const handleExportPDFChildren = () => {
    const printWindow = window.open('', '', 'width=1100,height=800');
    if (!printWindow) return;
    
    let rowsHtml = '';
    const currentYear = new Date().getFullYear();

    sortedFamilies.forEach((f, index) => {
      const children = f.members.filter(m => m.role === Role.CHILD);
      children.sort((a, b) => (a.birthDate || '').localeCompare(b.birthDate || ''));

      children.forEach((child) => {
         const age = child.birthDate ? currentYear - new Date(child.birthDate).getFullYear() : 0;
         
         rowsHtml += `
          <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
            <td class="px-4 py-3 font-mono font-bold text-slate-600 border-b border-slate-200 text-xs">#${f.membershipNumber}</td>
            <td class="px-4 py-3 font-bold text-slate-800 border-b border-slate-200 text-sm">${f.familyName}</td>
            <td class="px-4 py-3 text-slate-700 font-bold border-b border-slate-200 text-sm">${child.firstName} ${child.lastName}</td>
            <td class="px-4 py-3 text-center border-b border-slate-200 text-sm font-bold text-orange-600 bg-orange-50">${age} años</td>
            <td class="px-4 py-3 text-slate-600 border-b border-slate-200 text-xs">${child.birthDate}</td>
            <td class="px-4 py-3 text-center border-b border-slate-200 text-xs">${child.gender || '-'}</td>
          </tr>
         `;
      });
    });

    printWindow.document.write(
      getPDFHeader('Listado de Alumnos (Hijos)', 'portrait') + 
      `<table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-orange-600 text-white">
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-tl-lg">Socio</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Familia</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Nombre del Alumno</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">Edad</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Fecha Nac.</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center rounded-tr-lg">Sexo</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
       </table>` + 
      getPDFFooter()
    );
    printWindow.document.close();
    setShowExportMenu(false);
  };

  const handleExportPDFMembers = () => {
    const printWindow = window.open('', '', 'width=1100,height=800');
    if (!printWindow) return;

    let rowsHtml = '';
    const getRoleStyles = (role: Role | string) => {
        switch (role) {
            case Role.FATHER: return 'bg-blue-50/70 text-blue-900';
            case Role.MOTHER: return 'bg-pink-50/70 text-pink-900';
            case Role.TUTOR: return 'bg-amber-50/70 text-amber-900';
            case Role.CHILD: return 'bg-orange-50/40 text-orange-900';
            default: return 'bg-slate-50 text-slate-700';
        }
    };

    sortedFamilies.forEach((family) => {
        const members = sortMembers(family.members);
        if (members.length === 0) return;
        
        members.forEach((m, mIndex) => {
            const age = m.birthDate ? new Date().getFullYear() - new Date(m.birthDate).getFullYear() : '?';
            const isFirst = mIndex === 0;
            const roleStyles = getRoleStyles(m.role);
            
            rowsHtml += `<tr class="bg-white">`;
            if (isFirst) {
                rowsHtml += `
                    <td rowspan="${members.length}" class="px-4 py-2 font-mono font-bold text-slate-600 border-b border-slate-200 text-xs align-top pt-3 border-r border-slate-100">#${family.membershipNumber}</td>
                    <td rowspan="${members.length}" class="px-4 py-2 text-base font-black text-slate-800 uppercase border-b border-slate-200 align-top pt-3 border-r border-slate-100">${family.familyName}</td>
                `;
            }
            rowsHtml += `
                <td class="px-4 py-2 text-sm border-b border-slate-200 ${roleStyles} font-medium">${m.lastName}, ${m.firstName}</td>
                <td class="px-4 py-2 border-b border-slate-200 ${roleStyles}"><span class="text-[10px] font-bold uppercase tracking-wide">${m.role}</span></td>
                <td class="px-4 py-2 text-[10px] text-slate-600 border-b border-slate-200 ${roleStyles}">${m.birthDate ? new Date(m.birthDate).toLocaleDateString() : '-'} ${m.role === Role.CHILD ? `(<b>${age} años</b>)` : ''}</td>
            `;
            if (isFirst) {
                 rowsHtml += `
                    <td rowspan="${members.length}" class="px-4 py-2 border-b border-slate-200 align-top pt-3 border-l border-slate-100 bg-white">
                       <div class="flex flex-col gap-1">
                          <div class="font-mono text-xs font-bold text-slate-700">📞 ${family.phone}</div>
                          <div class="text-[10px] text-blue-600 underline break-all font-medium">${family.email}</div>
                       </div>
                    </td>
                 `;
            }
            rowsHtml += `</tr>`;
        });
    });

    printWindow.document.write(
      getPDFHeader('Listado Detallado de Miembros', 'landscape') + 
      `<table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-800 text-white">
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-tl-lg">Socio</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Familia</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Apellidos, Nombre</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Rol</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Datos</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-tr-lg">Contacto</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
       </table>` + 
      getPDFFooter()
    );
    printWindow.document.close();
    setShowExportMenu(false);
  };

  const handleOpenPrintConfig = () => {
    let min = '1';
    let max = '100';
    if (families.length > 0) {
      const nums = families.map(f => parseInt(f.membershipNumber)).filter(n => !isNaN(n));
      if (nums.length > 0) {
        min = Math.min(...nums).toString();
        max = Math.max(...nums).toString();
      }
    }
    setPrintConfig({ mode: 'CURRENT', rangeStart: min, rangeEnd: max });
    setShowPrintModal(true);
  };

  const handleGeneratePreview = () => {
    let selected: Family[] = [];
    if (printConfig.mode === 'CURRENT') {
      selected = [...sortedFamilies];
    } else {
      const start = parseInt(printConfig.rangeStart);
      const end = parseInt(printConfig.rangeEnd);
      if (isNaN(start) || isNaN(end)) {
        alert("Rango inválido.");
        return;
      }
      selected = families.filter(f => {
        const num = parseInt(f.membershipNumber);
        return !isNaN(num) && num >= start && num <= end;
      });
      selected.sort((a, b) => parseInt(a.membershipNumber) - parseInt(b.membershipNumber));
    }
    if (selected.length === 0) {
      alert("No hay familias para imprimir.");
      return;
    }
    setFamiliesToPrint(selected);
    setShowPrintModal(false);
    setIsPrintPreviewOpen(true);
  };

  if (isPrintPreviewOpen) {
    return (
      <div className="fixed inset-0 bg-slate-100 z-50 overflow-auto flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50 print:hidden">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 font-[Montserrat]"><Printer size={24} className="text-red-400"/> Vista Previa</h2>
            <p className="text-slate-400 text-sm">Listos para imprimir <b>{familiesToPrint.length}</b> carnets.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsPrintPreviewOpen(false)}>Volver</Button>
            <Button variant="primary" onClick={() => window.print()} icon={<Printer size={20}/>}>IMPRIMIR</Button>
          </div>
        </div>
        <div className="flex-1 p-8 print:p-0 flex justify-center bg-slate-200/50 print:bg-white">
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none p-[10mm] print:p-0 print:w-full">
            <div className="grid grid-cols-2 gap-4 print:block">
               {familiesToPrint.map((family) => (
                 <div key={family.id} className="break-inside-avoid page-break-inside-avoid mb-6 print:mb-4 print:inline-block print:w-[48%] print:align-top print:mx-[1%]">
                    <div className="border border-slate-200 rounded-xl overflow-hidden print:border-none">
                      <MembershipCard family={family} />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
        <style>{`@media print { @page { size: A4; margin: 10mm; } body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; } ::-webkit-scrollbar { display: none; } }`}</style>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-30 flex flex-col xl:flex-row gap-4 justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
        <div className="relative w-full xl:w-[450px] group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por apellido, email, teléfono..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl leading-5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-inner"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-red-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow text-red-600' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
          </div>
          
          <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1"></div>

          <div className="flex items-center gap-2">
             <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>Todos</button>
             <button onClick={() => setFilterStatus(FamilyStatus.ACTIVE)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === FamilyStatus.ACTIVE ? 'bg-green-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:text-green-600'}`}>Activos</button>
             <button onClick={() => setFilterStatus(FamilyStatus.INACTIVE)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === FamilyStatus.INACTIVE ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:text-red-600'}`}>Bajas</button>
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1"></div>

          <Button variant="outline" onClick={handleOpenPrintConfig} icon={<Printer size={18}/>} className="hidden sm:flex">Carnets</Button>

          <div className="relative">
             <Button variant="ghost" onClick={() => setShowExportMenu(!showExportMenu)} className={`w-auto px-4 gap-2 h-10 rounded-xl border transition-all ${showExportMenu ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                <Download size={18}/> 
                <span className="hidden sm:inline">Exportar</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}/>
             </Button>
             
             {showExportMenu && (
               <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
                 <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 text-green-700 rounded-lg"><FileSpreadsheet size={14}/></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Excel (CSV)</span>
                 </div>
                 <div className="p-2 space-y-1">
                    <button onClick={handleExportExcelFamilies} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex justify-between"><span>Familias</span><ChevronRight size={14} className="text-slate-300"/></button>
                    <button onClick={handleExportExcelMembers} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex justify-between"><span>Miembros Detallado</span><ChevronRight size={14} className="text-slate-300"/></button>
                    <button onClick={handleExportExcelChildren} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex justify-between items-center group">
                        <span className="flex items-center gap-2"><Baby size={14} className="text-orange-400"/> Sólo Hijos</span>
                        <ChevronRight size={14} className="text-slate-300"/>
                    </button>
                 </div>

                 <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 border-t flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 text-red-700 rounded-lg"><FileText size={14}/></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PDF</span>
                 </div>
                 <div className="p-2 space-y-1 pb-3">
                     <button onClick={() => handleExportPDFFamilies('landscape')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex justify-between"><span>Familias (Horizontal)</span><ChevronRight size={14} className="text-slate-300"/></button>
                     <button onClick={() => handleExportPDFFamilies('portrait')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex justify-between"><span>Familias (Vertical)</span><ChevronRight size={14} className="text-slate-300"/></button>
                     <button onClick={handleExportPDFMembers} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex justify-between"><span>Miembros Detallado</span><ChevronRight size={14} className="text-slate-300"/></button>
                     <button onClick={handleExportPDFChildren} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex justify-between items-center group">
                        <span className="flex items-center gap-2"><Baby size={14} className="text-orange-400"/> Sólo Hijos</span>
                        <ChevronRight size={14} className="text-slate-300"/>
                    </button>
                 </div>
               </div>
             )}
             {showExportMenu && <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>}
          </div>
        </div>
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-slate-800">Impresión de Carnets</h3>
                 <button onClick={() => setShowPrintModal(false)}><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                 <div onClick={() => setPrintConfig({...printConfig, mode: 'CURRENT'})} className={`cursor-pointer border-2 rounded-xl p-5 ${printConfig.mode === 'CURRENT' ? 'border-red-500 bg-red-50/50' : 'border-slate-100'}`}>
                    <div className="font-bold text-slate-800 text-lg flex gap-2"><CheckCircle size={20} className={printConfig.mode === 'CURRENT' ? 'text-red-600' : 'text-slate-200'}/> Selección Actual</div>
                    <p className="text-sm text-slate-500 ml-7">Imprime las {sortedFamilies.length} familias visibles en pantalla.</p>
                 </div>
                 <div onClick={() => setPrintConfig({...printConfig, mode: 'RANGE'})} className={`cursor-pointer border-2 rounded-xl p-5 ${printConfig.mode === 'RANGE' ? 'border-red-500 bg-red-50/50' : 'border-slate-100'}`}>
                    <div className="font-bold text-slate-800 text-lg flex gap-2"><CheckCircle size={20} className={printConfig.mode === 'RANGE' ? 'text-red-600' : 'text-slate-200'}/> Rango Numérico</div>
                    <p className="text-sm text-slate-500 ml-7 mb-4">Imprimir intervalo de socios.</p>
                    {printConfig.mode === 'RANGE' && (
                      <div className="ml-7 flex gap-4">
                         <input type="number" className="w-full border rounded p-2" value={printConfig.rangeStart} onChange={e => setPrintConfig({...printConfig, rangeStart: e.target.value})} placeholder="Inicio" onClick={e => e.stopPropagation()}/>
                         <input type="number" className="w-full border rounded p-2" value={printConfig.rangeEnd} onChange={e => setPrintConfig({...printConfig, rangeEnd: e.target.value})} placeholder="Fin" onClick={e => e.stopPropagation()}/>
                      </div>
                    )}
                 </div>
              </div>
              <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setShowPrintModal(false)}>Cancelar</Button>
                 <Button variant="primary" onClick={handleGeneratePreview}>Generar Vista Previa</Button>
              </div>
           </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedFamilies.map((family) => (
            <div key={family.id} className="group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden relative cursor-pointer" onClick={() => onSelect(family)}>
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${family.status === FamilyStatus.ACTIVE ? 'bg-gradient-to-b from-green-500 to-green-600' : 'bg-slate-300'}`}></div>
              <div className="p-6 flex flex-col flex-1 pl-8">
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60 shadow-sm">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Socio</span>
                     <span className="font-mono font-bold text-slate-700">#{family.membershipNumber}</span>
                   </div>
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${family.status === FamilyStatus.ACTIVE ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{family.status}</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200 group-hover:scale-105 transition-transform duration-300">
                      <span className="font-bold text-xl">{family.familyName.charAt(0)}</span>
                   </div>
                   <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 leading-tight group-hover:text-red-600 transition-colors truncate font-[Montserrat]">{family.familyName}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 font-medium"><MapPin size={12} /><span className="truncate">{family.address}</span></div>
                   </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1"><Mail size={12}/> {family.email}</div>
                        <div className="flex items-center gap-1"><Phone size={12}/> {family.phone}</div>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(family); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded"><Edit size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); if(window.confirm('¿Borrar?')) onDelete(family.id); }} className="p-2 hover:bg-red-50 text-red-600 rounded"><Trash2 size={16}/></button>
                        </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Nº Socio</th>
                  <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Familia</th>
                  <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Estado</th>
                  <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Contacto</th>
                  <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedFamilies.map((family) => (
                   <tr key={family.id} className="hover:bg-red-50/30 transition-colors cursor-pointer group" onClick={() => onSelect(family)}>
                     <td className="px-6 py-2"><span className="font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">#{family.membershipNumber}</span></td>
                     <td className="px-6 py-2">
                        <div className="font-bold text-slate-800 text-sm">{family.familyName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10}/> {family.address}</div>
                     </td>
                     <td className="px-6 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${family.status === FamilyStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{family.status}</span></td>
                     <td className="px-6 py-2">
                        <div className="flex flex-col text-xs text-slate-600">
                           <span><Phone size={10} className="inline mr-1"/>{family.phone}</span>
                           <span><Mail size={10} className="inline mr-1"/>{family.email}</span>
                        </div>
                     </td>
                     <td className="px-6 py-2 text-right">
                        {isAdmin && (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(family); }} className="p-1 text-blue-600"><Edit size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(family.id); }} className="p-1 text-red-600"><Trash2 size={14}/></button>
                          </div>
                        )}
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};