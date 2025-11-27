
import React, { useState } from 'react';
import { Family, Member, Role, User, AppRole } from '../types';
import { Button } from './Button';
import { ArrowLeft, Mail, Phone, MapPin, Smartphone, Trash2, Edit, Calendar, UserCheck, XCircle, Info } from 'lucide-react';
import { saveFamily, deleteFamily } from '../services/storageService';
import { MembershipCard } from './MembershipCard';

interface FamilyDetailsProps {
  family: Family;
  currentUser: User;
  onBack: () => void;
  onEdit: () => void;
  onUpdate: (updatedFamily: Family) => void;
  onDelete?: (id: string) => void;
}

// Modern Styled Avatars
const ModernMaleIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="20" fill="#F1F5F9"/>
    <path d="M20 23C24.4183 23 28 19.4183 28 15C28 10.5817 24.4183 7 20 7C15.5817 7 12 10.5817 12 15C12 19.4183 15.5817 23 20 23Z" fill="#334155"/>
    <path d="M10.5 34C10.5 28.5 14.5 24.5 20 24.5C25.5 24.5 29.5 28.5 29.5 34V36H10.5V34Z" fill="#334155"/>
  </svg>
);

const ModernFemaleIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="20" fill="#F1F5F9"/>
    <path d="M20 23C24.4183 23 28 19.4183 28 15C28 10.5817 24.4183 7 20 7C15.5817 7 12 10.5817 12 15C12 19.4183 15.5817 23 20 23Z" fill="#475569"/>
    {/* Long hair detail */}
    <path d="M28 15C28 20 26 25 20 25C14 25 12 20 12 15" stroke="#475569" strokeWidth="2"/>
    <path d="M10.5 34C10.5 28.5 14.5 25.5 20 25.5C25.5 25.5 29.5 28.5 29.5 34V36H10.5V34Z" fill="#475569"/>
  </svg>
);

const DefaultUserIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="20" fill="#F1F5F9"/>
    <circle cx="20" cy="15" r="6" fill="#94A3B8"/>
    <path d="M10 34C10 29 14 26 20 26C26 26 30 29 30 34V36H10V34Z" fill="#94A3B8"/>
  </svg>
);

export const FamilyDetails: React.FC<FamilyDetailsProps> = ({ family, currentUser, onBack, onEdit, onUpdate, onDelete }) => {
  const isAdmin = currentUser.role === AppRole.ADMIN || currentUser.role === AppRole.SUPERADMIN;

  const handleDelete = () => {
    if (window.confirm('ATENCIÓN: ¿Está seguro de que desea eliminar permanentemente esta familia y todos sus miembros? Esta acción no se puede deshacer.')) {
      if (onDelete) {
        onDelete(family.id);
      } else {
        // Fallback
        deleteFamily(family.id);
        onBack();
      }
    }
  };

  const MemberIcon = ({ gender }: { gender?: string }) => {
     if (gender === 'H') return <ModernMaleIcon size={48} />;
     if (gender === 'M') return <ModernFemaleIcon size={48} />;
     return <DefaultUserIcon size={48} />;
  };

  // Format creation date nicely
  const formattedCreationDate = family.createdAt 
    ? new Date(family.createdAt).toLocaleString('es-ES', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    : 'Desconocida';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* 
        ==========================
        NEW DESIGN HEADER 
        ==========================
      */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative group">
        
        {/* Banner with Pattern - Changed to Slate-100 (Very Light Grey) */}
        <div className="h-40 bg-slate-100 relative overflow-hidden border-b border-slate-200">
           {/* Abstract Dot Pattern */}
           <div className="absolute inset-0 opacity-40" 
                style={{ 
                  backgroundImage: 'radial-gradient(circle at 2px 2px, #cbd5e1 1px, transparent 0)', 
                  backgroundSize: '24px 24px' 
                }}>
           </div>
           
           {/* Gradient Overlay for subtlety */}
           <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent"></div>

           {/* Top Actions - Only Admin/SuperAdmin can see Delete */}
           {isAdmin && (
             <div className="absolute top-4 right-4 flex gap-2 z-10">
               <button 
                  onClick={handleDelete}
                  className="bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 p-2 rounded-full transition-all hover:scale-105 border border-slate-200 shadow-sm"
                  title="Eliminar Familia"
               >
                 <Trash2 size={18} />
               </button>
             </div>
           )}
           
           {/* Badges - Adjusted colors for light background */}
           <div className="absolute top-4 left-4 flex gap-3 z-10">
              <div className="flex items-center gap-1.5 bg-white text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-sm">
                <span className="opacity-70 uppercase tracking-widest text-[10px]">Socio</span>
                <span className="font-mono text-slate-900 text-sm">#{family.membershipNumber}</span>
              </div>
              
              {family.status === 'Activo' ? (
                <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-green-200">
                   <UserCheck size={12} /> ACTIVO
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-slate-300">
                   <XCircle size={12} /> BAJA
                </div>
              )}
           </div>
        </div>

        {/* Main Header Content */}
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6 relative z-10">
            
            {/* Big Initial Avatar - Updated to Red BG/White Text */}
            <div className="w-28 h-28 bg-white rounded-full shadow-2xl p-1.5 flex items-center justify-center shrink-0">
               <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center border border-red-500 shadow-inner">
                  <span className="text-5xl font-black text-white" style={{fontFamily: 'Montserrat, sans-serif'}}>
                    {family.familyName.charAt(0)}
                  </span>
               </div>
            </div>

            {/* Title & Meta - Updated Title Color to text-red-700 */}
            <div className="flex-1 w-full pt-2 md:pt-0">
              <h1 className="text-3xl md:text-4xl font-extrabold text-red-700 tracking-tight leading-tight drop-shadow-sm" style={{fontFamily: 'Montserrat, sans-serif'}}>
                {family.familyName}
              </h1>
              
              {/* Contact Grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-sm text-slate-600">
                <div className="flex items-center gap-2 group/item cursor-default">
                  <div className="p-1.5 rounded-full bg-red-50 text-red-600 group-hover/item:bg-red-100 transition-colors">
                    <MapPin size={14} />
                  </div>
                  <span className="truncate font-medium">{family.address}</span>
                </div>
                
                <div className="flex items-center gap-2 group/item cursor-default">
                  <div className="p-1.5 rounded-full bg-blue-50 text-blue-600 group-hover/item:bg-blue-100 transition-colors">
                    <Mail size={14} />
                  </div>
                  <span className="truncate font-medium">{family.email}</span>
                </div>

                <div className="flex items-center gap-2 group/item cursor-default">
                  <div className="p-1.5 rounded-full bg-green-50 text-green-600 group-hover/item:bg-green-100 transition-colors">
                    <Phone size={14} />
                  </div>
                  <span className="font-medium">{family.phone}</span>
                </div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
              <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={18}/>} className="flex-1 md:flex-none">
                Volver
              </Button>
              {isAdmin && (
                <Button variant="primary" onClick={onEdit} icon={<Edit size={18}/>} className="flex-1 md:flex-none shadow-lg shadow-red-200">
                  Editar Datos
                </Button>
              )}
            </div>
          </div>
          
          {/* Footer of Header (Join Date) */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs text-slate-400 font-medium uppercase tracking-wider">
             <Calendar size={14} className="mr-2 text-slate-300"/>
             Miembro desde el {new Date(family.joinDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>


      {/* 
        ==========================
        CONTENT COLUMNS
        ==========================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Members */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xl font-bold text-slate-800" style={{fontFamily: 'Montserrat, sans-serif'}}>
              Miembros de la Familia
            </h3>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
              {family.members.length} Integrantes
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             {family.members.map((member) => (
               <div key={member.id} className={`relative overflow-hidden flex flex-col p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${member.role === Role.CHILD ? 'bg-gradient-to-br from-orange-50 to-white border-orange-100' : 'bg-white border-slate-200'}`}>
                 
                 {/* Role Badge */}
                 <div className="absolute top-0 right-0 p-3">
                   <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-lg ${member.role === Role.CHILD ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                     {member.role}
                   </span>
                 </div>

                 <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 drop-shadow-md">
                      <MemberIcon gender={member.gender} />
                    </div>
                    <div className="min-w-0 pr-8">
                      <h4 className="font-bold text-slate-800 text-lg leading-tight truncate">{member.firstName}</h4>
                      <h4 className="text-slate-500 text-sm font-medium truncate">{member.lastName}</h4>
                      
                      {member.role === Role.CHILD && (
                         <span className="inline-block mt-1 text-[10px] font-bold text-white bg-orange-400 px-2 py-0.5 rounded-full">
                           {new Date().getFullYear() - new Date(member.birthDate).getFullYear()} Años
                         </span>
                      )}
                    </div>
                 </div>

                 <div className="mt-auto space-y-2.5">
                    <div className="h-px bg-slate-200/60 w-full mb-2"></div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <Calendar size={14} className="text-slate-300"/>
                       <span>{new Date(member.birthDate).toLocaleDateString()}</span>
                    </div>

                    {(member.email || member.phone) && (
                      <div className="space-y-1.5 pt-1">
                        {member.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                            <Mail size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate hover:text-red-600 transition-colors cursor-pointer" title={member.email}>{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Smartphone size={12} className="text-slate-400 shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Membership Card Component */}
          <div className="bg-slate-50 p-1 rounded-2xl border border-slate-200">
             <MembershipCard family={family} />
          </div>

          {/* Creation Metadata (Discreet) */}
          {(family.createdAt || family.createdBy) && (
            <div className="px-4 py-3 rounded-xl border border-slate-100 bg-white shadow-sm flex items-start gap-3">
               <Info className="text-slate-300 mt-0.5 shrink-0" size={16} />
               <div className="text-xs text-slate-500">
                  <p className="font-bold text-slate-600">Auditoría del Registro</p>
                  <p>Creado el: {formattedCreationDate}</p>
                  {family.createdBy && <p>Usuario: <span className="font-mono text-slate-600">{family.createdBy}</span></p>}
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
