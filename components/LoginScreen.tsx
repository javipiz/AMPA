import React, { useState } from 'react';
import { login, setSessionUser } from '../services/authService';
import { User } from '../types';
import { Button } from './Button';
import { Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(username, password);
      setSessionUser(user);
      onLoginSuccess(user);
    } catch (err) {
      setError('Usuario o contraseña incorrectos.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-red-700 rounded-b-[30%] shadow-2xl z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
            <div className="bg-white p-4 rounded-2xl shadow-xl mb-4">
                <div className="bg-red-600 w-16 h-16 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-inner">
                    AG
                </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md font-[Montserrat]">AMPA AGUSTINOS</h1>
            <p className="text-red-100 font-medium tracking-widest text-sm uppercase mt-1">Plataforma de Gestión</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100">
           <div className="p-8 pb-6">
              <h2 className="text-xl font-bold text-slate-800 text-center mb-6">Acceso a Usuarios</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                 {error && (
                   <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2 border border-red-100 animate-in slide-in-from-top-2">
                      <AlertCircle size={16} />
                      {error}
                   </div>
                 )}

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Usuario</label>
                    <div className="relative">
                       <UserIcon className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                       <input 
                         type="text" 
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-xl transition-all font-medium text-slate-800"
                         placeholder="Ej. admin"
                         autoFocus
                       />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Contraseña</label>
                    <div className="relative">
                       <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                       <input 
                         type="password" 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-xl transition-all font-medium text-slate-800"
                         placeholder="••••••••"
                       />
                    </div>
                 </div>

                 <Button 
                   type="submit" 
                   variant="primary" 
                   className="w-full py-4 text-base shadow-xl shadow-red-200 mt-4"
                   disabled={isLoading}
                 >
                   {isLoading ? 'Verificando...' : 'Iniciar Sesión'} 
                   {!isLoading && <ArrowRight size={18} className="ml-1 opacity-80" />}
                 </Button>
              </form>
           </div>
           <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
              <p className="text-xs text-slate-400">© {new Date().getFullYear()} Asociación de Madres y Padres Agustinos</p>
           </div>
        </div>
      </div>
    </div>
  );
};