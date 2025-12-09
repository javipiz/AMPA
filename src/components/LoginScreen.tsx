// src/components/LoginScreen.tsx
import React, { useState } from "react";
import { login } from "../services/storageService";
import { User } from "../types";
import { Button } from "./Button";
import { LogIn, Eye, EyeOff } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Debes introducir usuario y contraseña.");
      return;
    }

    try {
      setLoading(true);
      const user = await login(username, password);
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setErrorMsg("Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen 
        flex items-center justify-center 
        px-4
        bg-gradient-to-br from-slate-200 via-slate-100 to-white
      "
    >
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-slate-200">

        {/* LOGO */}
        <div className="text-center mb-6">
          <div className="bg-red-600 text-white w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-2xl font-extrabold shadow-md">
            AG
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">Acceso a la Plataforma</h1>
          <p className="text-slate-500 text-sm mt-1">Introduce tus credenciales</p>
        </div>

        {/* ERROR */}
        {errorMsg && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* USUARIO */}
          <div>
            <label className="text-sm font-medium text-slate-600">Usuario</label>
            <input
              type="text"
              className="
                w-full mt-1 p-3 border border-slate-300 rounded-xl 
                focus:ring-2 focus:ring-red-500/30 focus:border-red-500 
                bg-slate-50 outline-none transition-all
                text-slate-900 placeholder:text-slate-400
              "
              placeholder="Introduce tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* CONTRASEÑA */}
          <div className="relative">
            <label className="text-sm font-medium text-slate-600">Contraseña</label>

            <input
              type={showPassword ? "text" : "password"}
              className="
                w-full mt-1 p-3 pr-12 border border-slate-300 rounded-xl 
                focus:ring-2 focus:ring-red-500/30 focus:border-red-500 
                bg-slate-50 outline-none transition-all
                text-slate-900 placeholder:text-slate-400
              "
              placeholder="Introduce tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            {/* BOTÓN DE VER/Ocultar */}
            <button
              type="button"
              className="absolute right-3 bottom-3 text-slate-500 hover:text-slate-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* BOTÓN LOGIN */}
          <Button
            type="submit"
            variant="primary"
            className="w-full flex justify-center"
            disabled={loading}
            icon={<LogIn size={18} />}
          >
            {loading ? "Accediendo..." : "Entrar"}
          </Button>

        </form>
      </div>
    </div>
  );
};
