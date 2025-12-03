import React, { useState, useEffect } from "react";
import { Family, FamilyStatus, Member, Role } from "../types";
import {
  getNextMembershipNumber,
  generateId,
} from "../services/storageService";
import { Button } from "./Button";
import {
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  Mail,
  Phone as PhoneIcon,
  User,
  Calendar,
  Users,
  AlertCircle,
  Home,
  Loader2,
} from "lucide-react";

interface FamilyFormProps {
  initialData?: Family;
  onSave: (family: Family) => void;
  onCancel: () => void;
}

export const FamilyForm: React.FC<FamilyFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [familyName, setFamilyName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FamilyStatus>(FamilyStatus.ACTIVE);
  const [members, setMembers] = useState<Member[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ------------------------------------------------------
  //  CARGAR DATOS INICIALES
  // ------------------------------------------------------
  useEffect(() => {
    if (initialData) {
      setFamilyName(initialData.familyName);
      setAddress(initialData.address);
      setPhone(initialData.phone);
      setEmail(initialData.email);
      setStatus(initialData.status);
      setMembers(initialData.members);
    } else {
      // NUEVA FAMILIA — Crear miembros iniciales
      setMembers([
        {
          id: generateId(),
          firstName: "",
          lastName: "",
          birthDate: "",
          role: Role.FATHER,
          gender: "H",
        },
        {
          id: generateId(),
          firstName: "",
          lastName: "",
          birthDate: "",
          role: Role.CHILD,
          gender: "H",
        },
      ]);
    }
    setErrors([]);
  }, [initialData]);

  // ------------------------------------------------------
  // MANEJO DE MIEMBROS
  // ------------------------------------------------------
  const updateMember = (
    id: string,
    field: keyof Member,
    value: string
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const addParent = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: generateId(),
        firstName: "",
        lastName: "",
        birthDate: "",
        role: Role.MOTHER,
        gender: "M",
      },
    ]);
  };

  const addChild = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: generateId(),
        firstName: "",
        lastName: "",
        birthDate: "",
        role: Role.CHILD,
        gender: "H",
      },
    ]);
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // ------------------------------------------------------
  // GUARDAR FORMULARIO
  // ------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: string[] = [];
    if (!familyName.trim()) newErrors.push("El nombre de la familia es obligatorio.");
    if (!email.trim()) newErrors.push("El email es obligatorio.");

    const parents = members.filter((m) => m.role !== Role.CHILD);
    if (parents.length === 0)
      newErrors.push("Debe haber al menos un padre/madre/tutor.");

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSaving(true);

      const membershipNumber =
        initialData?.membershipNumber ||
        (await getNextMembershipNumber());

      const familyToSave: Family = {
        id: initialData?.id || generateId(),
        membershipNumber,
        familyName,
        address,
        phone,
        email,
        status,
        joinDate:
          initialData?.joinDate || new Date().toISOString().split("T")[0],
        members,
        aiSummary: initialData?.aiSummary ?? "",
      };

      onSave(familyToSave);
    } finally {
      setIsSaving(false);
    }
  };

  const GenderSelect = ({
    value,
    onChange,
  }: {
    value: string | undefined;
    onChange: (val: string) => void;
  }) => (
    <div className="flex items-center bg-slate-100/50 p-1 rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => onChange("H")}
        className={`px-3 py-1 rounded-md text-xs font-bold ${
          value === "H" ? "bg-white" : "text-slate-400"
        }`}
      >
        H
      </button>
      <button
        type="button"
        onClick={() => onChange("M")}
        className={`px-3 py-1 rounded-md text-xs font-bold ${
          value === "M" ? "bg-white" : "text-slate-400"
        }`}
      >
        M
      </button>
    </div>
  );

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800">
          {initialData ? "Modificar Familia" : "Nueva Familia"}
        </h2>
        <Button variant="ghost" onClick={onCancel} icon={<ArrowLeft />}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10">

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            <AlertCircle className="inline-block mr-2" />
            {errors.map((err, index) => (
              <div key={index}>{err}</div>
            ))}
          </div>
        )}

        {/* Información general */}
        <section>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Home /> Información General
          </h3>

          <input
            type="text"
            placeholder="Nombre de la familia"
            className="w-full p-3 border rounded"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Dirección"
            className="w-full p-3 border rounded mt-4"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <input
              type="tel"
              placeholder="Teléfono"
              className="w-full p-3 border rounded"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full p-3 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </section>

        {/* Padres / Tutores */}
        <section>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <User /> Padres / Tutores
          </h3>

          <Button variant="secondary" onClick={addParent} icon={<Plus />}>
            Añadir Padre/Madre/Tutor
          </Button>

          <div className="mt-4 space-y-4">
            {members
              .filter((m) => m.role !== Role.CHILD)
              .map((member) => (
                <div key={member.id} className="p-4 border rounded-xl">
                  <input
                    type="text"
                    placeholder="Nombre"
                    className="w-full p-3 border rounded mb-2"
                    value={member.firstName}
                    onChange={(e) =>
                      updateMember(member.id, "firstName", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Apellidos"
                    className="w-full p-3 border rounded mb-2"
                    value={member.lastName}
                    onChange={(e) =>
                      updateMember(member.id, "lastName", e.target.value)
                    }
                  />

                  <input
                    type="date"
                    className="w-full p-3 border rounded mb-2"
                    value={member.birthDate}
                    onChange={(e) =>
                      updateMember(member.id, "birthDate", e.target.value)
                    }
                  />

                  <GenderSelect
                    value={member.gender}
                    onChange={(val) => updateMember(member.id, "gender", val)}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeMember(member.id)}
                    icon={<Trash2 />}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
          </div>
        </section>

        {/* Hijos */}
        <section>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Users /> Hijos / Alumnos
          </h3>

          <Button variant="secondary" onClick={addChild} icon={<Plus />}>
            Añadir Hijo
          </Button>

          <div className="mt-4 space-y-4">
            {members
              .filter((m) => m.role === Role.CHILD)
              .map((member) => (
                <div key={member.id} className="p-4 border rounded-xl">
                  <input
                    type="text"
                    placeholder="Nombre"
                    className="w-full p-3 border rounded mb-2"
                    value={member.firstName}
                    onChange={(e) =>
                      updateMember(member.id, "firstName", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Apellidos"
                    className="w-full p-3 border rounded mb-2"
                    value={member.lastName}
                    onChange={(e) =>
                      updateMember(member.id, "lastName", e.target.value)
                    }
                  />

                  <input
                    type="date"
                    className="w-full p-3 border rounded mb-2"
                    value={member.birthDate}
                    onChange={(e) =>
                      updateMember(member.id, "birthDate", e.target.value)
                    }
                  />

                  <GenderSelect
                    value={member.gender}
                    onChange={(val) => updateMember(member.id, "gender", val)}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeMember(member.id)}
                    icon={<Trash2 />}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
          </div>
        </section>

        {/* Botones */}
        <div className="flex justify-end gap-4 border-t pt-6">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            icon={
              isSaving ? <Loader2 className="animate-spin" /> : <Save />
            }
          >
            {isSaving ? "Guardando..." : "Guardar Familia"}
          </Button>
        </div>
      </form>
    </div>
  );
};


