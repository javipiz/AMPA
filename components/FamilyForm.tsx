import React, { useState, useEffect } from 'react';
import { Family, FamilyStatus, Member, Role } from '../types';
import { generateId, getNextMembershipNumber } from '../services/storageService';
import { Button } from './Button';
import { Trash2, Plus, Save, ArrowLeft, Mail, Phone as PhoneIcon, User, Calendar, Users, AlertCircle, Home, Check } from 'lucide-react';

interface FamilyFormProps {
  initialData?: Family;
  onSave: (family: Family) => void;
  onCancel: () => void;
}

export const FamilyForm: React.FC<FamilyFormProps> = ({ initialData, onSave, onCancel }) => {
  const [familyName, setFamilyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FamilyStatus>(FamilyStatus.ACTIVE);
  const [members, setMembers] = useState<Member[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFamilyName(initialData.familyName);
      setAddress(initialData.address);
      setPhone(initialData.phone);
      setEmail(initialData.email);
      setStatus(initialData.status);
      setMembers(initialData.members);
    } else {
      setFamilyName('');
      setAddress('');
      setPhone('');
      setEmail('');
      setStatus(FamilyStatus.ACTIVE);
      setMembers([
        { id: generateId(), firstName: '', lastName: '', birthDate: '', role: Role.FATHER, gender: 'H' },
        { id: generateId(), firstName: '', lastName: '', birthDate: '', role: Role.CHILD, gender: 'H' },
      ]);
    }
    setIsDirty(false);
    setErrors([]);
  }, [initialData]);

  const handleChange = () => {
    if (!isDirty) setIsDirty(true);
  };

  const updateMember = (id: string, field: keyof Member, value: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    handleChange();
  };

  const addParent = () => {
    setMembers(prev => [
      ...prev,
      { id: generateId(), firstName: '', lastName: '', birthDate: '', role: Role.MOTHER, gender: 'M' } 
    ]);
    handleChange();
  };

  const addChild = () => {
    setMembers(prev => [
      ...prev,
      { id: generateId(), firstName: '', lastName: '', birthDate: '', role: Role.CHILD, gender: 'H' }
    ]);
    handleChange();
  };

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    handleChange();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!familyName.trim()) newErrors.push("El nombre de la familia es obligatorio.");
    if (!email.trim()) newErrors.push("El email de la familia es obligatorio.");
    
    const parents = members.filter(m => m.role !== Role.CHILD);
    if (parents.length === 0) newErrors.push("Debe haber al menos un Padre/Madre/Tutor.");

    if (newErrors.length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const confirmMsg = initialData 
      ? "¿Está seguro de que desea guardar las modificaciones?" 
      : "¿Está seguro de que desea registrar esta nueva familia?";

    if (window.confirm(confirmMsg)) {
      const familyToSave: Family = {
        id: initialData?.id || generateId(),
        membershipNumber: initialData?.membershipNumber || getNextMembershipNumber(),
        familyName,
        address,
        phone,
        email,
        status,
        joinDate: initialData?.joinDate || new Date().toISOString().split('T')[0],
        members,
        aiSummary: initialData?.aiSummary
      };
      onSave(familyToSave);
    }
  };

  const GenderSelect = ({ value, onChange, memberId }: { value: string | undefined, onChange: (val: string) => void, memberId: string }) => (
    <div className="flex items-center bg-slate-100/50 p-1 rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => onChange('H')}
        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${value === 'H' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
      >
        H
      </button>
      <button
        type="button"
        onClick={() => onChange('M')}
        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${value === 'M' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
      >
        M
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-4">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${initialData ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
             {initialData ? <EditIcon /> : <Plus size={24}/>}
           </div>
           <div>
             <h2 className="text-xl font-bold text-slate-800 font-[Montserrat]">
               {initialData ? 'Modificar Familia' : 'Nueva Alta Familiar'}
             </h2>
             <p className="text-sm text-slate-500">
               {initialData ? `Editando socio #${initialData.membershipNumber}` : 'Complete el formulario de registro'}
             </p>
           </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} icon={<ArrowLeft size={16}/>}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10" onChange={handleChange}>
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 animate-pulse shadow-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <ul className="list-disc pl-4 space-y-1 font-medium">
              {errors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* SECTION 1: DATOS PRINCIPALES */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
              <Home size={20}/>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Información General</h3>
            <div className="h-px bg-slate-100 flex-1 ml-4"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre de Familia <span className="text-red-500">*</span></label>
              <input required type="text" value={familyName} onChange={e => {setFamilyName(e.target.value); handleChange();}} 
                className="w-full rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-red-500 focus:ring-0 transition-colors p-3.5 font-medium text-lg placeholder-slate-400" 
                placeholder="Ej. Familia Pérez García" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Dirección Completa</label>
              <div className="relative">
                 <Home className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                 <input required type="text" value={address} onChange={e => {setAddress(e.target.value); handleChange();}} 
                   className="w-full rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-red-500 focus:ring-0 transition-colors p-3 pl-10 placeholder-slate-400" 
                   placeholder="Calle, Número, Piso..." />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Estado</label>
              <select value={status} onChange={e => {setStatus(e.target.value as FamilyStatus); handleChange();}}
                className={`w-full rounded-xl border-transparent p-3 font-bold focus:ring-0 cursor-pointer ${status === FamilyStatus.ACTIVE ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                <option value={FamilyStatus.ACTIVE}>🟢 Activo</option>
                <option value={FamilyStatus.INACTIVE}>⚪ Baja</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Teléfono <span className="text-red-500">*</span></label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input required type="tel" value={phone} onChange={e => {setPhone(e.target.value); handleChange();}} 
                    className="w-full rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-red-500 focus:ring-0 transition-colors p-3 pl-10 font-mono text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input required type="email" value={email} onChange={e => {setEmail(e.target.value); handleChange();}} 
                    className="w-full rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-red-500 focus:ring-0 transition-colors p-3 pl-10 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PADRES */}
        <section>
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
               <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><User size={20}/></div>
               <h3 className="text-lg font-bold text-slate-800">Padres / Tutores</h3>
             </div>
             <Button type="button" variant="secondary" size="sm" onClick={addParent} icon={<Plus size={16}/>}>
               Añadir
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {members.filter(m => m.role !== Role.CHILD).map((member, idx) => (
              <div key={member.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-slate-300 transition-all">
                <button
                   type="button"
                   onClick={() => removeMember(member.id)}
                   className="absolute top-3 right-3 text-slate-300 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                 >
                   <Trash2 size={16} />
                 </button>

                <div className="flex items-center gap-4 mb-4">
                   <div className="flex-1">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rol</label>
                     <select 
                       value={member.role} 
                       onChange={e => updateMember(member.id, 'role', e.target.value)}
                       className="w-full bg-slate-50 border-transparent rounded-lg text-sm p-2 font-medium focus:bg-white focus:ring-2 focus:ring-slate-200"
                     >
                       <option value={Role.FATHER}>Padre</option>
                       <option value={Role.MOTHER}>Madre</option>
                       <option value="Tutor">Tutor/a</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sexo</label>
                     <GenderSelect 
                       value={member.gender} 
                       onChange={(val) => updateMember(member.id, 'gender', val)} 
                       memberId={member.id}
                     />
                   </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={member.firstName} onChange={e => updateMember(member.id, 'firstName', e.target.value)}
                        className="w-full bg-slate-50 border-transparent rounded-lg text-sm p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-200 placeholder-slate-400" placeholder="Nombre" />
                    <input type="text" value={member.lastName} onChange={e => updateMember(member.id, 'lastName', e.target.value)}
                        className="w-full bg-slate-50 border-transparent rounded-lg text-sm p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-200 placeholder-slate-400" placeholder="Apellidos" />
                  </div>
                  
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input type="date" value={member.birthDate} onChange={e => updateMember(member.id, 'birthDate', e.target.value)}
                      className="w-full bg-slate-50 border-transparent rounded-lg text-sm p-2 pl-9 focus:bg-white focus:ring-2 focus:ring-slate-200 text-slate-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: HIJOS */}
        <section>
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Users size={20}/></div>
                <h3 className="text-lg font-bold text-slate-800">Hijos / Alumnos</h3>
             </div>
             <Button type="button" variant="secondary" size="sm" onClick={addChild} icon={<Plus size={16}/>}>
               Añadir
             </Button>
          </div>
          
          <div className="space-y-3">
            {members.filter(m => m.role === Role.CHILD).map((member, index) => (
              <div key={member.id} className="bg-orange-50/30 p-4 rounded-xl border border-orange-100/50 flex flex-col md:flex-row gap-4 items-center group relative hover:border-orange-200 transition-colors">
                 <button
                   type="button"
                   onClick={() => removeMember(member.id)}
                   className="absolute top-2 right-2 text-orange-300 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
                 >
                   <Trash2 size={16} />
                 </button>
                 
                 <div className="shrink-0 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">{index + 1}</span>
                    <GenderSelect 
                       value={member.gender} 
                       onChange={(val) => updateMember(member.id, 'gender', val)} 
                       memberId={member.id}
                     />
                 </div>
                 
                 <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                    <input 
                      type="text" 
                      value={member.firstName} 
                      onChange={e => updateMember(member.id, 'firstName', e.target.value)}
                      className="w-full bg-white border-transparent rounded-lg text-sm p-2 focus:ring-2 focus:ring-orange-200 placeholder-slate-400" 
                      placeholder="Nombre" 
                    />
                    <input 
                      type="text" 
                      value={member.lastName} 
                      onChange={e => updateMember(member.id, 'lastName', e.target.value)}
                      className="w-full bg-white border-transparent rounded-lg text-sm p-2 focus:ring-2 focus:ring-orange-200 placeholder-slate-400" 
                      placeholder="Apellidos" 
                    />
                    <input 
                      type="date" 
                      value={member.birthDate} 
                      onChange={e => updateMember(member.id, 'birthDate', e.target.value)}
                      className="w-full bg-white border-transparent rounded-lg text-sm p-2 focus:ring-2 focus:ring-orange-200 text-slate-600" 
                    />
                 </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
           <Button type="button" variant="ghost" onClick={onCancel}>Descartar Cambios</Button>
           <Button type="submit" variant="primary" icon={<Save size={18}/>} className="px-8 shadow-lg shadow-red-200">
             Guardar Familia
           </Button>
        </div>
      </form>
    </div>
  );
};

const EditIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);