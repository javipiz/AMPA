import React from 'react';
import { Family, FamilyStatus, Role, AppRole, User } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, UserPlus, UserMinus, Activity, TrendingUp, Baby, Clock, FilePlus, FileEdit } from 'lucide-react';
import { getSessionUser } from '../services/authService';

interface DashboardProps {
  families: Family[];
}

export const Dashboard: React.FC<DashboardProps> = ({ families }) => {
  const activeFamilies = families.filter(f => f.status === FamilyStatus.ACTIVE).length;
  const inactiveFamilies = families.filter(f => f.status === FamilyStatus.INACTIVE).length;
  const totalMembers = families.reduce((acc, f) => acc + f.members.length, 0);
  const totalChildren = families.reduce((acc, f) => acc + f.members.filter(m => m.role === Role.CHILD).length, 0);

  const currentUser = getSessionUser();
  const isSuperAdmin = currentUser?.role === AppRole.SUPERADMIN;

  // --- ACTIVITY LOG (7 Days) ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivity = families
    .filter(f => {
        const created = f.createdAt ? new Date(f.createdAt) : null;
        const updated = f.updatedAt ? new Date(f.updatedAt) : null;
        return (created && created > sevenDaysAgo) || (updated && updated > sevenDaysAgo);
    })
    .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
    })
    .slice(0, 10); 

  const statusData = [
    { name: 'Activas', value: activeFamilies, color: '#dc2626' },
    { name: 'Bajas', value: inactiveFamilies, color: '#e2e8f0' },
  ];

  const childAgeGroups = { '0-3 Inf.': 0, '4-6 Inf.': 0, '7-12 Prim.': 0, '13-16 ESO': 0, '17-18 Bach.': 0, '+18': 0 };
  const parentAgeGroups = { '20-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0 };
  const childrenCountMap = new Map<number, number>();
  const currentYear = new Date().getFullYear();
  
  families.forEach(f => {
    const childCount = f.members.filter(m => m.role === Role.CHILD).length;
    childrenCountMap.set(childCount, (childrenCountMap.get(childCount) || 0) + 1);
    f.members.forEach(m => {
       const age = m.birthDate ? currentYear - new Date(m.birthDate).getFullYear() : -1;
       if(age === -1) return;
       if (m.role === Role.CHILD) {
          if (age <= 3) childAgeGroups['0-3 Inf.']++; else if (age <= 6) childAgeGroups['4-6 Inf.']++; else if (age <= 12) childAgeGroups['7-12 Prim.']++; else if (age <= 16) childAgeGroups['13-16 ESO']++; else if (age <= 18) childAgeGroups['17-18 Bach.']++; else childAgeGroups['+18']++;
       } else if ([Role.FATHER, Role.MOTHER, Role.TUTOR].includes(m.role)) {
          if (age >= 20 && age <= 29) parentAgeGroups['20-29']++; else if (age >= 30 && age <= 39) parentAgeGroups['30-39']++; else if (age >= 40 && age <= 49) parentAgeGroups['40-49']++; else if (age >= 50 && age <= 59) parentAgeGroups['50-59']++; else if (age >= 60) parentAgeGroups['60+']++;
       }
    });
  });

  const childrenDistributionData = Array.from(childrenCountMap.entries()).map(([count, families]) => ({ count: `${count} Hijos`, families })).sort((a, b) => a.count.localeCompare(b.count));
  const childrenAgeData = Object.entries(childAgeGroups).map(([name, value]) => ({ name, value }));
  const parentAgeData = Object.entries(parentAgeGroups).map(([name, value]) => ({ name, value }));

  const StatCard = ({ title, value, icon: Icon, colorClass, gradientClass }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${colorClass.replace('text-', 'bg-')}`}></div>
      <div className="flex items-center justify-between relative z-10">
        <div><p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p><h3 className="text-4xl font-black text-slate-800 tracking-tight">{value}</h3></div>
        <div className={`p-4 rounded-xl ${gradientClass} text-white shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform`}><Icon className="w-6 h-6" strokeWidth={2.5} /></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in flex flex-col xl:flex-row gap-8 items-start">
      
      <div className="flex-1 space-y-8 w-full">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Familias" value={families.length} icon={Users} colorClass="text-blue-600" gradientClass="bg-gradient-to-br from-blue-500 to-blue-600" />
            <StatCard title="Activas" value={activeFamilies} icon={UserPlus} colorClass="text-green-600" gradientClass="bg-gradient-to-br from-green-500 to-green-600" />
            <StatCard title="Miembros" value={totalMembers} icon={Activity} colorClass="text-slate-600" gradientClass="bg-gradient-to-br from-slate-700 to-slate-800" />
            <StatCard title="Alumnos" value={totalChildren} icon={UserMinus} colorClass="text-red-600" gradientClass="bg-gradient-to-br from-red-500 to-red-600" />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
               <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-slate-800">Estado</h3><div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Activity size={18}/></div></div>
               <div className="h-72 w-full relative"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value" cornerRadius={6} stroke="none">{statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#1e293b', fontWeight: 600 }}/></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl font-black text-slate-800">{activeFamilies}</span><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activas</span></div></div>
               <div className="flex justify-center gap-8 mt-4">{statusData.map((item) => (<div key={item.name} className="flex items-center text-sm font-medium text-slate-600"><span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: item.color }}></span>{item.name} ({Math.round((item.value / families.length) * 100) || 0}%)</div>))}</div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
               <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-slate-800">Distribución Familiar</h3><div className="p-2 bg-slate-50 rounded-lg text-slate-400"><TrendingUp size={18}/></div></div>
               <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={childrenDistributionData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="count" tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} dy={10} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} /><RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Bar dataKey="families" name="Familias" fill="#f97316" radius={[6, 6, 0, 0]} barSize={40}>{childrenDistributionData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ef4444' : '#f87171'} />))}</Bar></BarChart></ResponsiveContainer></div>
               <p className="text-center text-xs text-slate-400 mt-6 font-medium">Número de hijos por unidad familiar</p>
            </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
               <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-slate-800">Edades Hijos (Etapa Escolar)</h3><div className="p-2 bg-orange-50 rounded-lg text-orange-400"><Baby size={18}/></div></div>
               <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={childrenAgeData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} interval={0} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} /><RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Bar dataKey="value" name="Alumnos" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30}>{childrenAgeData.map((e, i) => <Cell key={i} fill="#fb923c" />)}</Bar></BarChart></ResponsiveContainer></div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
               <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-slate-800">Rango Edad Padres</h3><div className="p-2 bg-blue-50 rounded-lg text-blue-400"><Users size={18}/></div></div>
               <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={parentAgeData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} /><RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Bar dataKey="value" name="Padres" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>{parentAgeData.map((e, i) => <Cell key={i} fill="#60a5fa" />)}</Bar></BarChart></ResponsiveContainer></div>
            </div>
         </div>
      </div>

      {isSuperAdmin && (
        <div className="w-full xl:w-80 shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit">
           <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Clock className="text-slate-400" size={20} />
              <h3 className="font-bold text-slate-800">Actividad Reciente</h3>
           </div>
           
           <div className="space-y-4">
              {recentActivity.length === 0 ? (
                 <p className="text-sm text-slate-400 italic">No hay actividad registrada en los últimos 7 días.</p>
              ) : (
                 recentActivity.map(f => {
                    const isNew = f.createdAt === f.updatedAt;
                    const date = f.updatedAt ? new Date(f.updatedAt) : new Date();
                    return (
                       <div key={f.id} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isNew ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                             {isNew ? <FilePlus size={14}/> : <FileEdit size={14}/>}
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-800 line-clamp-1">{f.familyName}</p>
                             <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mt-0.5">
                                {isNew ? 'Nueva Alta' : 'Modificación'}
                             </p>
                             <p className="text-[10px] text-slate-400 mt-1">{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                       </div>
                    );
                 })
              )}
           </div>
        </div>
      )}
    </div>
  );
};