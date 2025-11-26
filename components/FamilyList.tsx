import React, { useState, useRef } from 'react';
import { Family, FamilyStatus, Role, User, AppRole } from '../types';
import { Button } from './Button';
import { Search, Users, MapPin, Download, Printer, FileSpreadsheet, LayoutGrid, List, Edit, Trash2, Eye, CheckCircle, Phone, Mail, User as UserIcon, X, ChevronDown, Filter, FileText, UserPlus } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const isAdmin = currentUser.role === AppRole.ADMIN;

  // --- Estados para Impresión Masiva ---
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    mode: 'CURRENT' as 'CURRENT' | 'RANGE',
    rangeStart: '',
    rangeEnd: ''
  });
  const [familiesToPrint, setFamiliesToPrint] = useState<Family[]>([]);

  // Filtros principales
  const filteredFamilies = families.filter(f => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = f.familyName.toLowerCase().includes(term) || 
                          f.membershipNumber.includes(term) ||
                          f.email.toLowerCase().includes(term) ||
                          f.phone.includes(term);
    const matchesStatus = filterStatus === 'ALL' || f.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Ordenación
  const sortedFamilies = [...filteredFamilies].sort((a, b) => {
    if (sortBy === 'name') {
      return a.familyName.localeCompare(b.familyName);
    } else {
      return parseInt(a.membershipNumber || '0') - parseInt(b.membershipNumber || '0');
    }
  });

  // --- Lógica de Exportación CSV ---
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
    downloadCSV(csvContent, `ampa_agustinos_familias_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportExcelMembers = () => {
    const headers = ['Nº Socio', 'Familia', 'Nombre', 'Apellidos', 'Rol', 'Sexo', 'Fecha Nacimiento', 'Teléfono Familia', 'Email Familia'];
    const rows: string[][] = [];

    sortedFamilies.forEach(f => {
      f.members.forEach(m => {
        rows.push([
          f.membershipNumber,
          `"${f.familyName}"`,
          `"${m.firstName}"`,
          `"${m.lastName}"`,
          m.role,
          m.gender || '-',
          m.birthDate,
          f.phone,
          f.email
        ]);
      });
    });

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csvContent, `ampa_agustinos_miembros_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  // --- Lógica de Exportación PDF ---
  
  const getPDFHeader = (title: string) => `
    <html>
      <head>
        <title>${title} - AMPA Agustinos</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 landscape; margin: 10mm; }
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
        <div class="mb-6 flex gap-6 text-sm">
           <div class="bg-slate-50 px-4 py-2 rounded border border-slate-200">
             <span class="text-slate-400 font-bold uppercase text-xs mr-2">Filtro Búsqueda:</span>
             <span class="font-bold text-slate-800">"${searchTerm || 'Todos'}"</span>
           </div>
           <div class="bg-slate-50 px-4 py-2 rounded border border-slate-200">
             <span class="text-slate-400 font-bold uppercase text-xs mr-2">Estado:</span>
             <span class="font-bold text-slate-800">${filterStatus === 'ALL' ? 'Todos' : filterStatus}</span>
           </div>
        </div>
  `;

  const getPDFFooter = () => `
        <div class="mt-8 pt-4 border-t border-slate-200 text-center">
           <p class="text-xs text-slate-400">Documento generado por la Plataforma de Gestión AMPA Agustinos.</p>
        </div>
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
    </html>
  `;

  const handleExportPDFFamilies = () => {
    const printWindow = window.open('', '', 'width=1100,height=800');
    if (!printWindow) return;

    const rowsHtml = sortedFamilies.map((f, index) => `
      <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
        <td class="px-4 py-3 font-mono font-bold text-slate-600 border-b border-slate-200">#${f.membershipNumber}</td>
        <td class="px-4 py-3 font-bold text-slate-800 border-b border-slate-200">${f.familyName}</td>
        <td class="px-4 py-3 border-b border-slate-200">
          <span class="px-2 py-1 rounded text-xs font-bold uppercase ${f.status === FamilyStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${f.status}</span>
        </td>
        <td class="px-4 py-3 text-sm text-slate-600 border-b border-slate-200">${f.address}</td>
        <td class="px-4 py-3 text-sm font-mono text-slate-600 border-b border-slate-200 whitespace-nowrap">${f.phone}</td>
        <td class="px-4 py-3 text-sm text-slate-600 border-b border-slate-200">${f.email}</td>
        <td class="px-4 py-3 text-center text-sm font-bold text-slate-600 border-b border-slate-200">${f.members.filter(m => m.role === Role.CHILD).length}</td>
      </tr>
    `).join('');

    printWindow.document.write(
      getPDFHeader('Listado de Familias') + 
      `<table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-800 text-white">
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-tl-lg">Socio</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Familia</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Estado</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Dirección</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Teléfono</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Email</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center rounded-tr-lg">Hijos</th>
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
    
    sortedFamilies.forEach((family, fIndex) => {
        const members = family.members;
        if (members.length === 0) return;
        
        const bgClass = fIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50';
        
        members.forEach((m, mIndex) => {
            const age = m.birthDate ? new Date().getFullYear() - new Date(m.birthDate).getFullYear() : '?';
            const isFirst = mIndex === 0;
            
            rowsHtml += `<tr class="${bgClass}">`;
            
            if (isFirst) {
                // Family columns with rowspan
                // TEXT SIZE UPDATE: Family is text-sm, Uppercase
                rowsHtml += `
                    <td rowspan="${members.length}" class="px-4 py-2 font-mono font-bold text-slate-600 border-b border-slate-200 text-xs align-top pt-3 border-r border-slate-100">#${family.membershipNumber}</td>
                    <td rowspan="${members.length}" class="px-4 py-2 text-sm font-bold text-slate-800 uppercase border-b border-slate-200 align-top pt-3 border-r border-slate-100">${family.familyName}</td>
                `;
            }
            
            // Member columns
            // TEXT SIZE UPDATE: Member is text-xs (Smaller than family)
            rowsHtml += `
                <td class="px-4 py-2 text-xs text-slate-700 border-b border-slate-200">
                    <div class="font-semibold">${m.lastName}, ${m.firstName}</div>
                </td>
                <td class="px-4 py-2 border-b border-slate-200">
                   <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${m.role === Role.CHILD ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}">${m.role}</span>
                </td>
                 <td class="px-4 py-2 text-[10px] text-slate-500 border-b border-slate-200">
                   ${m.birthDate ? new Date(m.birthDate).toLocaleDateString() : '-'} ${m.role === Role.CHILD ? `(<b>${age} años</b>)` : ''}
                </td>
            `;

            if (isFirst) {
                 rowsHtml += `
                    <td rowspan="${members.length}" class="px-4 py-2 text-xs font-mono text-slate-600 border-b border-slate-200 whitespace-nowrap align-top pt-3 border-l border-slate-100">${family.phone}</td>
                 `;
            }
            
            rowsHtml += `</tr>`;
        });
    });

    printWindow.document.write(
      getPDFHeader('Listado de Miembros') + 
      `<table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-800 text-white">
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-tl-lg">Socio</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Familia</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Apellidos, Nombre</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Rol</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider">Nacimiento/Edad</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-tr-lg">Teléfono</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
       </table>` + 
      getPDFFooter()
    );
    printWindow.document.close();
    setShowExportMenu(false);
  };


  // --- LÓGICA DE IMPRESIÓN MASIVA (CARNETS) ---
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
        alert("Por favor, introduce números válidos para el rango.");
        return;
      }
      selected = families.filter(f => {
        const num = parseInt(f.membershipNumber);
        return !isNaN(num) && num >= start && num <= end;
      });
      selected.sort((a, b) => parseInt(a.membershipNumber) - parseInt(b.membershipNumber));
    }

    if (selected.length === 0) {
      alert("No se han encontrado familias con los criterios seleccionados.");
      return;
    }

    setFamiliesToPrint(selected);
    setShowPrintModal(false);
    setIsPrintPreviewOpen(true);
  };

  // --- VISTA PREVIA DE IMPRESIÓN (OVERLAY) ---
  if (isPrintPreviewOpen) {
    return (
      <div className="fixed inset-0 bg-slate-100 z-50 overflow-auto flex flex-col">
        {/* Barra Superior */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50 print:hidden">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 font-[Montserrat]">
              <Printer size={24} className="text-red-400"/> 
              Vista Previa
            </h2>
            <p className="text-slate-400 text-sm">
              Listos para imprimir <b>{familiesToPrint.length}</b> carnets.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsPrintPreviewOpen(false)}>
              Volver
            </Button>
            <Button 
              variant="primary" 
              onClick={() => window.print()} 
              icon={<Printer size={20}/>}
            >
              IMPRIMIR
            </Button>
          </div>
        </div>

        {/* Lienzo */}
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
            <style>{`
              @media print {
                @page { size: A4; margin: 10mm; }
                body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                ::-webkit-scrollbar { display: none; }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DE LISTADO NORMAL ---
  return (
    <div className="space-y-8">
      
      {/* Barra de Herramientas Flotante */}
      <div className="sticky top-0 z-30 flex flex-col xl:flex-row gap-4 justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
        
        {/* Buscador Estilizado */}
        <div className="relative w-full xl:w-[450px] group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por apellido, email, teléfono o nº socio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl leading-5 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 shadow-inner"
          />
        </div>
        
        {/* Controles y Filtros */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          
          {/* Toggle Vista */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={18} />
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Filtros Pill */}
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setFilterStatus('ALL')} 
               className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
             >
               Todos
             </button>
             <button 
               onClick={() => setFilterStatus(FamilyStatus.ACTIVE)} 
               className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === FamilyStatus.ACTIVE ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-green-200 hover:text-green-600'}`}
             >
               Activos
             </button>
             <button 
               onClick={() => setFilterStatus(FamilyStatus.INACTIVE)} 
               className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === FamilyStatus.INACTIVE ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-red-200 hover:text-red-600'}`}
             >
               Bajas
             </button>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Acción Principal - Carnets */}
          <Button 
            variant="outline" 
            onClick={handleOpenPrintConfig} 
            icon={<Printer size={18}/>}
            className="hidden sm:flex"
          >
            Carnets
          </Button>

          {/* Exportar */}
          <div className="relative">
             <Button variant="ghost" onClick={() => setShowExportMenu(!showExportMenu)} className={`w-auto px-4 gap-2 h-10 rounded-xl border transition-colors ${showExportMenu ? 'bg-slate-100 border-slate-300' : 'border-slate-200'}`}>
                <Download size={18}/> <span className="hidden sm:inline">Exportar</span>
             </Button>
             
             {showExportMenu && (
               <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                 
                 {/* Excel Section */}
                 <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-[10px] uppercase font-bold text-green-600 pl-2 flex items-center gap-1">
                      <FileSpreadsheet size={10} /> Formato Excel (.csv)
                    </p>
                 </div>
                 <button onClick={handleExportExcelFamilies} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    Por Familias
                 </button>
                 <button onClick={handleExportExcelMembers} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    Por Miembros
                 </button>

                 {/* PDF Section */}
                 <div className="p-2 border-b border-slate-50 bg-slate-50/50 border-t">
                    <p className="text-[10px] uppercase font-bold text-red-600 pl-2 flex items-center gap-1">
                      <FileText size={10} /> Formato PDF
                    </p>
                 </div>
                 <button onClick={handleExportPDFFamilies} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    Por Familias
                 </button>
                 <button onClick={handleExportPDFMembers} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    Por Miembros
                 </button>

               </div>
             )}
             {showExportMenu && <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>}
          </div>
        </div>
      </div>

      {/* --- MODAL DE CONFIGURACIÓN --- */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
              <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center">
                 <div>
                   <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     Impresión de Carnets
                   </h3>
                   <p className="text-sm text-slate-500 mt-1">Selecciona el grupo de socios a imprimir</p>
                 </div>
                 <button onClick={() => setShowPrintModal(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                   <X size={20}/>
                 </button>
              </div>

              <div className="p-6 space-y-4">
                 <div 
                   onClick={() => setPrintConfig({...printConfig, mode: 'CURRENT'})}
                   className={`cursor-pointer border-2 rounded-xl p-5 transition-all relative ${printConfig.mode === 'CURRENT' ? 'border-red-500 bg-red-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                 >
                    <div className="flex items-center gap-3 mb-1">
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${printConfig.mode === 'CURRENT' ? 'border-red-500 bg-red-500 text-white' : 'border-slate-300'}`}>
                          {printConfig.mode === 'CURRENT' && <CheckCircle size={14} fill="currentColor" className="text-white"/>}
                       </div>
                       <span className="font-bold text-slate-800 text-lg">Selección Actual</span>
                       <span className="ml-auto bg-white border border-slate-200 px-2 py-0.5 rounded text-xs font-bold text-slate-600">{sortedFamilies.length} Familias</span>
                    </div>
                    <p className="text-sm text-slate-500 ml-8 leading-relaxed">
                       Imprime las familias visibles actualmente en el listado, respetando los filtros de búsqueda y estado.
                    </p>
                 </div>

                 <div 
                   onClick={() => setPrintConfig({...printConfig, mode: 'RANGE'})}
                   className={`cursor-pointer border-2 rounded-xl p-5 transition-all ${printConfig.mode === 'RANGE' ? 'border-red-500 bg-red-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                 >
                    <div className="flex items-center gap-3 mb-1">
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${printConfig.mode === 'RANGE' ? 'border-red-500 bg-red-500 text-white' : 'border-slate-300'}`}>
                          {printConfig.mode === 'RANGE' && <CheckCircle size={14} fill="currentColor" className="text-white"/>}
                       </div>
                       <span className="font-bold text-slate-800 text-lg">Rango Numérico</span>
                    </div>
                    <p className="text-sm text-slate-500 ml-8 mb-4">
                       Imprime un intervalo específico de números de socio, ignorando filtros.
                    </p>
                    
                    {printConfig.mode === 'RANGE' && (
                      <div className="ml-8 flex items-center gap-4 animate-in slide-in-from-top-2 fade-in">
                         <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Desde Socio Nº</label>
                            <input 
                              type="number" 
                              className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 border bg-white shadow-sm font-mono font-medium"
                              value={printConfig.rangeStart}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setPrintConfig({...printConfig, rangeStart: e.target.value})}
                            />
                         </div>
                         <div className="pt-6 text-slate-300 font-bold">
                           <Users size={20}/>
                         </div>
                         <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Hasta Socio Nº</label>
                            <input 
                              type="number" 
                              className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 border bg-white shadow-sm font-mono font-medium"
                              value={printConfig.rangeEnd}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setPrintConfig({...printConfig, rangeEnd: e.target.value})}
                            />
                         </div>
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setShowPrintModal(false)}>Cancelar</Button>
                 <Button 
                   variant="primary" 
                   onClick={handleGeneratePreview}
                   className="px-6"
                 >
                   Generar Vista Previa
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* --- GRID VIEW --- */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedFamilies.map((family) => (
            <div key={family.id} className="group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden relative cursor-pointer" onClick={() => onSelect(family)}>
              
              {/* Status Stripe */}
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${family.status === FamilyStatus.ACTIVE ? 'bg-gradient-to-b from-green-500 to-green-600' : 'bg-slate-300'}`}></div>
              
              <div className="p-6 flex flex-col flex-1 pl-8">
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60 shadow-sm">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Socio</span>
                     <span className="font-mono font-bold text-slate-700">#{family.membershipNumber}</span>
                   </div>
                   {family.status === FamilyStatus.ACTIVE ? (
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-50 text-green-700 border border-green-100/50 shadow-sm">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Activo
                     </span>
                   ) : (
                     <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
                       Baja
                     </span>
                   )}
                </div>

                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200 group-hover:scale-105 transition-transform duration-300">
                      <span className="font-bold text-xl">{family.familyName.charAt(0)}</span>
                   </div>
                   <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 leading-tight group-hover:text-red-600 transition-colors truncate font-[Montserrat]">
                        {family.familyName}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 font-medium">
                         <MapPin size={12} />
                         <span className="truncate">{family.address}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-auto space-y-4">
                   {/* Info Pills */}
                   <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-600 border border-slate-100">
                        <UserIcon size={12} className="text-slate-400"/>
                        {family.members.length} Integrantes
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-600 border border-slate-100">
                        <Users size={12} className="text-slate-400"/>
                        {family.members.filter(m => m.role === Role.CHILD).length} Hijos
                      </div>
                   </div>

                   {/* Quick Contact - Visible Data */}
                   <div className="pt-4 border-t border-slate-50 flex items-end justify-between gap-2 relative">
                      <div className="flex flex-col gap-2 min-w-0">
                        {family.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-600 transition-colors group/link" title={family.email}>
                            <div className="p-1 rounded-full bg-slate-100 text-slate-400 group-hover/link:bg-red-50 group-hover/link:text-red-600 transition-colors shrink-0">
                               <Mail size={12} />
                            </div>
                            <span className="truncate font-medium">{family.email}</span>
                          </div>
                        )}
                        {family.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-600 transition-colors group/link" title={family.phone}>
                             <div className="p-1 rounded-full bg-slate-100 text-slate-400 group-hover/link:bg-red-50 group-hover/link:text-red-600 transition-colors shrink-0">
                               <Phone size={12} />
                            </div>
                            <span className="truncate font-medium font-mono">{family.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* MOVED: View/Edit Buttons Area to prevent overlap with top status */}
                      <div className="flex gap-1 shrink-0">
                          {isAdmin && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); onEdit(family); }} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                <Edit size={16} />
                              </button>
                              <button onClick={(e) => { 
                                e.stopPropagation(); 
                                if(window.confirm(`¿Eliminar familia "${family.familyName}"?`)) onDelete(family.id);
                              }} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          <button className="text-slate-300 group-hover:text-red-600 p-2 rounded-lg transition-colors">
                             <Eye size={18}/>
                          </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- TABLE VIEW --- */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Nº Socio</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Familia</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Estado</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Contacto</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedFamilies.map((family) => (
                   <tr key={family.id} className="hover:bg-red-50/30 transition-colors group cursor-pointer" onClick={() => onSelect(family)}>
                     <td className="px-6 py-4">
                        <span className="font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">#{family.membershipNumber}</span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-base">{family.familyName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10}/> {family.address}</div>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${family.status === FamilyStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                           {family.status}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-600 font-medium flex items-center gap-1"><Phone size={12} className="text-slate-400"/> {family.phone}</span>
                          <span className="text-slate-500 text-xs flex items-center gap-1"><Mail size={12} className="text-slate-400"/> {family.email}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        {/* ONLY SHOW ACTIONS IF ADMIN */}
                        {isAdmin && (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(family); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(family.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 size={16} />
                            </button>
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