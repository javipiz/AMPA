// components/FamilyForm.tsx
import React, { useState } from "react";
import { Family, Member, Role, FamilyStatus } from "../types";
import { saveFamily } from "../services/storageService";

interface Props {
  initialData?: Family;
  onSave: (family: Family) => void;
  onCancel: () => void;
}

export const FamilyForm: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  const [family, setFamily] = useState<Family>(
    initialData || {
      id: undefined as any,
      membershipNumber: "", // se rellenará en la API
      familyName: "",
      address: "",
      phone: "",
      email: "",
      joinDate: new Date().toISOString().substring(0, 10),
      status: FamilyStatus.ACTIVE,
      members: [],
    }
  );

  const [newMember, setNewMember] = useState<Omit<Member, "id">>({
    firstName: "",
    lastName: "",
    birthDate: "",
    role: Role.CHILD,
    gender: "",
    notes: "",
    email: "",
    phone: "",
  });

  const updateField = (field: keyof Family, value: any) => {
    setFamily((prev) => ({ ...prev, [field]: value }));
  };

  const updateMemberField = (field: keyof Member, value: any) => {
    setNewMember((prev) => ({ ...prev, [field]: value }));
  };

  const addMemberToLocalList = () => {
    if (!newMember.firstName.trim() || !newMember.lastName.trim()) {
      alert("Nombre y apellidos del miembro son obligatorios.");
      return;
    }

    const tempMember: Member = {
      ...newMember,
      id: 0,
    };

    setFamily((prev) => ({
      ...prev,
      members: [...prev.members, tempMember],
    }));

    setNewMember({
      firstName: "",
      lastName: "",
      birthDate: "",
      role: Role.CHILD,
      gender: "",
      notes: "",
      email: "",
      phone: "",
    });
  };

  const removeLocalMember = (index: number) => {
    setFamily((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      const savedFamily = await saveFamily(family);
      onSave(savedFamily);
    } catch (error) {
      console.error("Error al guardar familia:", error);
      alert("Error al guardar. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md text-slate-800">
      <h2 className="text-2xl font-bold mb-6">
        {initialData ? "Editar Familia" : "Nueva Familia"}
      </h2>

      {/* DATOS DE LA FAMILIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* ❌ Campo “Número de Socio” eliminado a propósito */}

        <div>
          <label className="text-sm font-medium text-slate-700">
            Nombre de la Familia
          </label>
          <input
            type="text"
            value={family.familyName}
            onChange={(e) => updateField("familyName", e.target.value)}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Dirección</label>
          <input
            type="text"
            value={family.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Teléfono</label>
          <input
            type="text"
            value={family.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={family.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Fecha de Alta
          </label>
          <input
            type="date"
            value={family.joinDate}
            onChange={(e) => updateField("joinDate", e.target.value)}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Estado</label>
          <select
            value={family.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
          >
            <option value={FamilyStatus.ACTIVE}>Activo</option>
            <option value={FamilyStatus.INACTIVE}>Baja</option>
          </select>
        </div>
      </div>

      {/* MIEMBROS */}
      <h3 className="text-lg font-bold mb-2 text-slate-800">Miembros</h3>

      <div className="border border-slate-200 p-4 rounded mb-4 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            placeholder="Nombre"
            className="p-2 border border-slate-300 rounded bg-white text-slate-900"
            value={newMember.firstName}
            onChange={(e) => updateMemberField("firstName", e.target.value)}
          />

          <input
            type="text"
            placeholder="Apellidos"
            className="p-2 border border-slate-300 rounded bg-white text-slate-900"
            value={newMember.lastName}
            onChange={(e) => updateMemberField("lastName", e.target.value)}
          />

          <select
            className="p-2 border border-slate-300 rounded bg-white text-slate-900"
            value={newMember.role}
            onChange={(e) => updateMemberField("role", e.target.value as Role)}
          >
            <option value={Role.FATHER}>Padre</option>
            <option value={Role.MOTHER}>Madre</option>
            <option value={Role.CHILD}>Hijo/a</option>
            <option value={Role.TUTOR}>Tutor</option>
          </select>

          <input
            type="date"
            className="p-2 border border-slate-300 rounded bg-white text-slate-900"
            value={newMember.birthDate}
            onChange={(e) => updateMemberField("birthDate", e.target.value)}
          />
        </div>

        <button
          onClick={addMemberToLocalList}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Añadir miembro
        </button>
      </div>

      <ul className="mb-6">
        {family.members.map((m, index) => (
          <li
            key={index}
            className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2 text-slate-800"
          >
            <span>
              {m.firstName} {m.lastName} — {m.role}
            </span>
            <button
              className="text-red-600"
              onClick={() => removeLocalMember(index)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onCancel} className="px-4 py-2 border rounded">
          Cancelar
        </button>

        <button
          onClick={handleSubmit}
          className="px-5 py-2 bg-blue-600 text-white rounded"
        >
          Guardar Familia
        </button>
      </div>
    </div>
  );
};
