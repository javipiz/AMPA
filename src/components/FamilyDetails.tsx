import React from 'react';
import { Family, Member, Role, User, AppRole, FamilyStatus } from '../types';
import { Button } from './Button';
import { ArrowLeft, Mail, Phone, MapPin, Smartphone, Trash2, Edit, Calendar, UserCheck, XCircle, Info } from 'lucide-react';
import { deleteFamily } from '../services/storageService';
import { MembershipCard } from './MembershipCard';

interface FamilyDetailsProps {
  family: Family;
  currentUser: User;
  onBack: () => void;
  onEdit: () => void;
  onUpdate: (updatedFamily: Family) => void;
  onDelete?: (id: number) => void; // <-- ACTUALIZADO
}

// Modern Styled Avatars
const ModernMaleIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="20" fill="#F1F5F9"/>
    <path d="M20 23C24.4 23 28 19.4 28 15C28 10.6 24.4 7 20 7C15.6 7 12 10.6 12 15C12 19.4 15.6 23 20 23Z" fill="#334155"/>
    <path d="M10.5 34C10.5 28.5 14.5 24.5 20 24.5C25.5 24.5 29.5 28.5 29.5 34V36H10.5V34Z" fill="#334155"/>
  </svg>
);

const ModernFemaleIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="20" fill="#F1F5F9"/>
    <path d="M20 23C24.4 23 28 19.4 28 15C28 10.6 24.4 7 20 7C15.6 7 12 10.6 12 15C12 19.4 15.6 23 20 23Z" fill="#475569"/>
    <path d="M28 15C28 20 26 25 20 25C14 25 12 20 12 15" stroke="#475569" strokeWidth="2"/>
    <path d="M10.5 34C10.5 28.5 14.5 25.5 20 25.5C25.5 25.5 29.5 28.5 29.5 34V36H10.5V34Z" fill="#475569"/>
  </svg>
);

const DefaultUserIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="20" fill="#F1F5F9"/>
    <circle cx="20" cy="15" r="6" fill="#94A3B8"/>
    <path d="M10 34C10 29 14 26 20 26C26 26 30 29 30 34V36H10V34Z" fill="#94A3B8"/>
  </svg>
);

export const FamilyDetails: React.FC<FamilyDetailsProps> = ({ 
  family, 
  currentUser, 
  onBack, 
  onEdit, 
  onUpdate, 
  onDelete 
}) => {

  const isAdmin = currentUser.role === AppRole.ADMIN || currentUser.role === AppRole.SUPERADMIN;

  // === FIX IDs ===
  const familyId = typeof family.id === "string" 
    ? parseInt(family.id)
    : family.id;

  const handleDelete = () => {
  if (!family.id) {
    alert("Error: La familia no tiene un ID válido.");
    return;
  }

  const familyId: number = Number(family.id);

  if (window.confirm("ATENCIÓN: ¿Está seguro de que desea eliminar permanentemente esta familia y todos sus miembros?")) {
    if (onDelete) {
      onDelete(familyId);
    } else {
      deleteFamily(familyId);
      onBack();
    }
  }
  };


  const MemberIcon = ({ gender }: { gender?: string }) => {
    if (gender === 'H') return <ModernMaleIcon size={48} />;
    if (gender === 'M') return <ModernFemaleIcon size={48} />;
    return <DefaultUserIcon size={48} />;
  };

  const formattedCreationDate = family.createdAt
    ? new Date(family.createdAt).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Desconocida";

  // Sorting logic preserved exactly
  const sortedMembers = [...family.members].sort((a, b) => {
    const isChildA = a.role === Role.CHILD;
    const isChildB = b.role === Role.CHILD;

    if (!isChildA && isChildB) return -1;
    if (isChildA && !isChildB) return 1;

    if (isChildA && isChildB) {
      if (!a.birthDate) return 1;
      if (!b.birthDate) return -1;
      return a.birthDate.localeCompare(b.birthDate);
    }
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* === HEADER CARD === */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative group">

        {/* Banner */}
        <div className="h-40 bg-slate-100 relative overflow-hidden border-b border-slate-200">

          {/* Delete button */}
          {isAdmin && (
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button 
                onClick={handleDelete}
                className="bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 p-2 rounded-full transition-all border border-slate-200 shadow-sm"
                title="Eliminar Familia"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}

          {/* Status */}
          <div className="absolute top-4 left-4 flex gap-3 z-10">
            <div className="flex items-center gap-1.5 bg-white text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-sm">
              <span className="opacity-70 uppercase tracking-widest text-[10px]">Socio</span>
              <span className="font-mono text-slate-900 text-sm">#{family.membershipNumber}</span>
            </div>

            {family.status === FamilyStatus.ACTIVE ? (
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

        {/* Family Main Info */}
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6 relative z-10">
            
            {/* Avatar */}
            <div className="w-28 h-28 bg-white rounded-full shadow-2xl p-1.5 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center border border-red-500 shadow-inner">
                <span className="text-5xl font-black text-white">
                  {family.familyName.charAt(0)}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-2 md:pt-0">
              <h1 className="text-3xl md:text-4xl font-extrabold text-red-700 leading-tight">
                {family.familyName}
              </h1>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-red-600" />
                  <span>{family.address}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-blue-600" />
                  <span className="break-all">{family.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-green-600" />
                  <span>{family.phone}</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={18}/>}>
                Volver
              </Button>
              {isAdmin && (
                <Button variant="primary" onClick={onEdit} icon={<Edit size={18}/>}>
                  Editar Datos
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center">
            <Calendar size={14} className="mr-2"/>
            Miembro desde el {new Date(family.joinDate).toLocaleDateString('es-ES')}
          </div>
        </div>
      </div>

      {/* === BODY === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Family Members */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xl font-bold text-slate-800">
              Miembros de la Familia
            </h3>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
              {family.members.length} integrantes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {sortedMembers.map((member) => {

              const memberId =
                typeof member.id === "string" ? parseInt(member.id) : member.id;

              const age =
                member.birthDate &&
                new Date().getFullYear() - new Date(member.birthDate).getFullYear();

              return (
                <div 
                  key={memberId}
                  className={`relative overflow-hidden flex flex-col p-5 rounded-2xl border hover:shadow-lg hover:-translate-y-1 transition ${member.role === Role.CHILD ? 'bg-orange-50/40 border-orange-100' : 'bg-white border-slate-200'}`}
                >

                  {/* Role label */}
                  <div className="absolute top-0 right-0 p-3">
                    <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-lg ${
                      member.role === Role.CHILD
                        ? "bg-orange-100 text-orange-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {member.role}
                    </span>
                  </div>

                  {/* Member header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0">
                      <MemberIcon gender={member.gender} />
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">
                        {member.firstName}
                      </h4>
                      <h4 className="text-slate-500 text-sm font-medium">
                        {member.lastName}
                      </h4>

                      {member.role === Role.CHILD && age && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-white bg-orange-400 px-2 py-0.5 rounded-full">
                          {age} años
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="mt-auto space-y-2.5">
                    <div className="h-px bg-slate-200"></div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar size={14}/>
                      <span>{new Date(member.birthDate).toLocaleDateString("es-ES")}</span>
                    </div>

                    {(member.email || member.phone) && (
                      <div className="text-xs text-slate-600 space-y-1.5">
                        {member.email && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail size={12}/>
                            <span title={member.email} className="truncate hover:text-red-600">
                              {member.email}
                            </span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <Smartphone size={12}/>
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Membership card + audit */}
        <div className="space-y-6">

          <div className="bg-slate-50 p-1 rounded-2xl border border-slate-200">
            <MembershipCard family={family} />
          </div>

          {(family.createdAt || family.createdBy) && (
            <div className="px-4 py-3 rounded-xl border bg-white shadow-sm flex items-start gap-3">
              <Info size={16} className="text-slate-300"/>
              <div className="text-xs text-slate-500">
                <p className="font-bold text-slate-600">Auditoría del Registro</p>
                <p>Creado el: {formattedCreationDate}</p>
                {family.createdBy && (
                  <p>
                    Usuario: <span className="font-mono">{family.createdBy}</span>
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
