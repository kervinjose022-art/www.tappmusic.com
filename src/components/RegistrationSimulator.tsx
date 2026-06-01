/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Key, Check, HelpCircle } from 'lucide-react';

export function RegistrationSimulator() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('tappmusic123_vip');
  const [username, setUsername] = useState('kervinjose_zulia');
  const [success, setSuccess] = useState(false);

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="bg-slate-950/70 p-5 rounded-xl border border-sky-500/20 space-y-4 relative overflow-hidden" id="registration-password-eye-simulator">
      {/* Upper absolute premium badge */}
      <div className="absolute top-0 right-0 bg-sky-500/10 text-sky-400 font-mono text-[8px] font-bold px-2.5 py-0.5 rounded-bl border-l border-b border-sky-500/20 uppercase tracking-wider">
        Simulador Interactivo
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Eye className="h-3.5 w-3.5" />
          Probador de Registro con Visor de Ojo
        </h4>
        <p className="text-[11px] text-slate-400 leading-normal">
          Así verán tus usuarios la ventana de ingreso en tu sitio. Haz clic en el <strong>Ojo</strong> para revelar u ocultar la contraseña en vivo.
        </p>
      </div>

      {/* Simulated Form */}
      <form onSubmit={handleSimulateSubmit} className="space-y-3 pt-1">
        
        {/* Username/Invited member field */}
        <div className="space-y-1 relative">
          <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Nombre de Usuario VIP</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: kervinjose02"
              className="w-full bg-slate-950 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-sky-500/40 transition-all font-mono"
            />
          </div>
        </div>

        {/* Dynamic Password Box matching the requested eye visibility toggle */}
        <div className="space-y-1 relative">
          <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Contraseña Segura</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="h-3.5 w-3.5" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crea tu contraseña..."
              className="w-full bg-slate-950 border border-white/5 rounded-lg py-2 pl-9 pr-10 text-xs text-slate-200 outline-none focus:border-sky-500/40 transition-all font-mono"
            />
            {/* Eye toggle button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-sky-400 cursor-pointer focus:outline-none transition-colors"
              title={showPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-sky-400" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Simulated registration button */}
        <button
          type="submit"
          className="w-full bg-[#0ea5e9] hover:bg-sky-400 text-slate-950 font-bold text-[11px] uppercase py-2 px-3 rounded-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          {success ? (
            <>
              <Check className="h-3.5 w-3.5 text-slate-950" />
              ¡Registro de Prueba Exitoso!
            </>
          ) : (
            <>
              <Key className="h-3.5 w-3.5 text-slate-950" />
              Crear Cuenta en Tappmusic
            </>
          )}
        </button>
      </form>

      {/* Info card feedback */}
      <div className="text-[10px] bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10 flex items-start gap-2">
        <HelpCircle className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
        <span className="text-slate-400 leading-normal">
          Para implementar esto en tu sitio real, copia el bloque de la sección <strong className="text-sky-400 font-mono">"Visor Ojo (Registro)"</strong> de abajo y pégalo en el archivo de registro.
        </span>
      </div>
    </div>
  );
}
