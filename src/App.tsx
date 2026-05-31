/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VIPTier, WithdrawalConfig } from './types';
import { 
  DEFAULT_VIP_TIERS, 
  DEFAULT_WITHDRAWAL_CONFIG,
  calculateReward
} from './utils';
import { VIPTierCard } from './components/VIPTierCard';
import { WithdrawalCalendar } from './components/WithdrawalCalendar';
import { CodeExporter } from './components/CodeExporter';
import { 
  Plus, 
  RotateCcw, 
  Coins, 
  Percent, 
  ShieldAlert, 
  CheckCircle,
  FolderSync,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // --- CORE STATE PERSISTENCE ---
  const [conversionRate, setConversionRate] = useState<number>(36.7);
  const [viptiers, setViptiers] = useState<VIPTier[]>([]);
  const [withdrawalConfig, setWithdrawalConfig] = useState<WithdrawalConfig>(DEFAULT_WITHDRAWAL_CONFIG);
  
  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTier, setNewTier] = useState<Omit<VIPTier, 'id'> & { idInput: string }>({
    idInput: '',
    name: '',
    price: 10,
    reward: 367,
    rewardType: 'Monedas',
    desc: '',
    dailyTasks: 10,
    isActive: true
  });
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info'; text: string } | null>({
    type: 'info',
    text: 'Cargando configuraciones locales guardadas...'
  });

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const storedTiers = localStorage.getItem('tapp_vip_tiers');
      const storedRate = localStorage.getItem('tapp_conversion_rate');
      const storedWithdraw = localStorage.getItem('tapp_withdrawal_config');

      let initialTiers = DEFAULT_VIP_TIERS;
      if (storedTiers) {
        const parsed = JSON.parse(storedTiers);
        // Detect and migrate from old 'bronce' format to clean 'plata' format
        if (parsed.some((t: any) => t.id === 'bronce') || parsed.length === 0) {
          initialTiers = DEFAULT_VIP_TIERS;
          localStorage.setItem('tapp_vip_tiers', JSON.stringify(DEFAULT_VIP_TIERS));
        } else {
          initialTiers = parsed;
        }
      } else {
        localStorage.setItem('tapp_vip_tiers', JSON.stringify(DEFAULT_VIP_TIERS));
      }
      setViptiers(initialTiers);

      if (storedRate) {
        setConversionRate(Number(storedRate));
      } else {
        setConversionRate(36.7);
        localStorage.setItem('tapp_conversion_rate', '36.7');
      }

      let initialWithdraw = DEFAULT_WITHDRAWAL_CONFIG;
      if (storedWithdraw) {
        initialWithdraw = JSON.parse(storedWithdraw);
      } else {
        localStorage.setItem('tapp_withdrawal_config', JSON.stringify(DEFAULT_WITHDRAWAL_CONFIG));
      }
      setWithdrawalConfig(initialWithdraw);

      // Briefly announce state load success
      setStatusMessage({
        type: 'success',
        text: '¡Consola de tappmusic sincronizada! Rangos VIP y Retiros cada 10 días configurados con éxito.'
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e) {
      console.error('Failed to load localStorage', e);
      setViptiers(DEFAULT_VIP_TIERS);
      setConversionRate(36.7);
      setWithdrawalConfig(DEFAULT_WITHDRAWAL_CONFIG);
    }
  }, []);

  // Save states helper
  const saveState = (updatedTiers: VIPTier[], updatedRate: number, updatedWithdraw: WithdrawalConfig) => {
    try {
      localStorage.setItem('tapp_vip_tiers', JSON.stringify(updatedTiers));
      localStorage.setItem('tapp_conversion_rate', String(updatedRate));
      localStorage.setItem('tapp_withdrawal_config', JSON.stringify(updatedWithdraw));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  // Modify rate
  const handleRateChange = (newVal: number) => {
    setConversionRate(newVal);
    
    // Automatically update rewards for tiers that are linked to global rate
    const updated = viptiers.map(t => {
      // If reward roughly matches the old conversion or is linked, update it
      // For precision, let's keep it simple: we can recalculate reward if price matches
      return {
        ...t,
        reward: calculateReward(t.price, newVal)
      };
    });
    setViptiers(updated);
    saveState(updated, newVal, withdrawalConfig);
  };

  // Update single tier
  const handleUpdateTier = (updated: VIPTier) => {
    const newList = viptiers.map(t => t.id === updated.id ? updated : t);
    setViptiers(newList);
    saveState(newList, conversionRate, withdrawalConfig);
  };

  // Delete single tier
  const handleDeleteTier = (id: string) => {
    const newList = viptiers.filter(t => t.id !== id);
    setViptiers(newList);
    saveState(newList, conversionRate, withdrawalConfig);
    
    setStatusMessage({ type: 'info', text: `Se eliminó la membresía '${id}'.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Update configurations
  const handleUpdateWithdrawal = (updated: WithdrawalConfig) => {
    setWithdrawalConfig(updated);
    saveState(viptiers, conversionRate, updated);
  };

  // Reset to original defaults
  const handleResetToDefaults = () => {
    if (confirm('¿Estás seguro de restablecer todos los planes VIP y la configuración de retiros a los valores originales de tappmusic? Perderás tus cambios manuales.')) {
      setViptiers(DEFAULT_VIP_TIERS);
      setConversionRate(36.7);
      setWithdrawalConfig(DEFAULT_WITHDRAWAL_CONFIG);
      saveState(DEFAULT_VIP_TIERS, 36.7, DEFAULT_WITHDRAWAL_CONFIG);
      
      setStatusMessage({ type: 'success', text: 'Se han restablecido los valores de fábrica con éxito.' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Add new tier submission handler
  const handleAddTierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedId = newTier.idInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!formattedId) {
      alert('Por favor especifica un ID único para la membresía');
      return;
    }

    if (viptiers.some(t => t.id === formattedId)) {
      alert(`El ID de membresía "${formattedId}" ya existe. Elige uno diferente (ej. diamante-v2, rubi-premium)`);
      return;
    }

    const tierToCreate: VIPTier = {
      id: formattedId,
      name: newTier.name || `VIP ${newTier.idInput.toUpperCase()}`,
      price: newTier.price,
      reward: newTier.reward,
      rewardType: newTier.rewardType,
      desc: newTier.desc || 'Acceso de misiones',
      dailyTasks: newTier.dailyTasks,
      isActive: true
    };

    const newList = [...viptiers, tierToCreate];
    setViptiers(newList);
    saveState(newList, conversionRate, withdrawalConfig);

    // Reset Form Input State
    setNewTier({
      idInput: '',
      name: '',
      price: 10,
      reward: 367,
      rewardType: 'Monedas',
      desc: '',
      dailyTasks: 10,
      isActive: true
    });
    setShowAddForm(false);

    setStatusMessage({ type: 'success', text: `¡Rango VIP "${tierToCreate.name}" agregado exitosamente!` });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-100 flex flex-col font-sans" id="applet-viewport">
      
      {/* Visual Navigation Bar */}
      <nav className="border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3.5 flex justify-between items-center" id="nav-header">
        <div className="flex items-center gap-2.5">
          {/* Logo element resembling the concept on the screenshots */}
          <div className="h-8 w-8 bg-gradient-to-tr from-emerald-500 to-sky-400 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/10">
            T
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base leading-none tracking-tight text-white">tappmusic</span>
              <span className="text-[10px] font-mono leading-none bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                Consola Sync
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Panel de Control para Kervin Jose</p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {/* Status Alert Badge */}
          {statusMessage && (
            <div className={`hidden md:flex items-center gap-1.5 text-[11px] font-medium py-1 px-3 rounded-full border transition-all ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              <CheckCircle className="h-3 w-3 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Reset Factory values */}
          <button
            type="button"
            id="btn-global-reset"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1 py-1 px-3 text-xs bg-slate-900 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg transition-all"
            title="Sincronizar defaults de fábrica"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </nav>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Dynamic Mobile Status Banner */}
        {statusMessage && (
          <div className="flex md:hidden items-center gap-1.5 text-xs py-2 px-3 rounded-lg border bg-slate-900/80 border-slate-800 text-slate-300">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">{statusMessage.text}</span>
          </div>
        )}

        {/* Control Center Banner Grid: Configuration variables */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="global-control-dashboard">
          
          {/* Box 1: Multiplicador global de conversión */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3.5 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-400" />
                Matemáticas de Monedas
              </span>
              <h4 className="text-xl font-display font-bold text-white">
                1 USD = {conversionRate} Monedas
              </h4>
              <p className="text-slate-400 text-xs leading-normal">
                Esta es la tasa central de cobro. Los VIP vinculados multiplican su precio por este valor para fijar el premio automáticamente sin cálculos manuales.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Modificar Tasa:</span>
                <span className="font-bold text-white">{conversionRate}x</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="0.1"
                value={conversionRate}
                onChange={(e) => handleRateChange(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Box 2: Liquidity Protection Status rules */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-emerald-400" />
                Sostenibilidad del Sistema
              </span>
              <h4 className="text-xl font-display font-bold text-white">
                Frecuencia de Retiros
              </h4>
              <p className="text-slate-400 text-xs leading-normal">
                Controlar los retiros es vital. Has configurado límites para que los usuarios puedan enviar solicitudes de fondos {
                  withdrawalConfig.type === 'dates' ? `solo los días ${withdrawalConfig.monthlyDates.join(', ')} del mes.` : 
                  withdrawalConfig.type === 'weekly' ? 'solo los días de la semana seleccionados.' : 
                  `exactamente cada ${withdrawalConfig.intervalDays} días recurrentes.`
                }
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/15 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>Intervalo actual: {withdrawalConfig.type === 'dates' ? 'Cada 10 días (Mensuales)' : 'Filtro Dinámico'}</span>
            </div>
          </div>

          {/* Box 3: Quick Action Center */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <FolderSync className="h-3.5 w-3.5 text-emerald-400" />
                Membresías Totales
              </span>
              <h4 className="text-xl font-display font-bold text-white">
                {viptiers.length} Rangos VIP Habilitados
              </h4>
              <p className="text-slate-400 text-xs leading-normal">
                Activa, descarta o recula ganancias. Los cambios se exportan en tiempo real como array, JSON, o plantillas HTML en la parte de abajo.
              </p>
            </div>

            <div className="pt-2 border-t border-white/5">
              <button
                type="button"
                id="btn-trigger-add-tier"
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4 shrink-0" />
                {showAddForm ? 'Cerrar Nuevo Rango' : 'Crear Nueva Membresía VIP'}
              </button>
            </div>
          </div>
        </div>

        {/* Create membership Form (Dynamic Overlay-like dropdown) */}
        {showAddForm && (
          <form 
            onSubmit={handleAddTierSubmit}
            className="p-5 rounded-2xl border border-sky-400/35 bg-[#0b101d] space-y-4 shadow-xl ring-2 ring-sky-400/10 animate-fade-in"
            id="add-vip-form"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-sky-400" />
                Fijar Nueva Membresía para tappmusic
              </h4>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">ID Único (Ej: platino-pro)</label>
                <input
                  type="text"
                  required
                  placeholder="diamante-premium"
                  value={newTier.idInput}
                  onChange={(e) => setNewTier({ ...newTier, idInput: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Nombre de Rango</label>
                <input
                  type="text"
                  required
                  placeholder="VIP Diamante Premium"
                  value={newTier.name}
                  onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Precio ($ USD)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTier.price}
                  onChange={(e) => {
                    const priceVal = Number(e.target.value);
                    setNewTier({ 
                      ...newTier, 
                      price: priceVal,
                      reward: Math.round(priceVal * conversionRate) // Auto-calculate reward based on default rate
                    });
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium flex justify-between">
                  Monto de Recompensa
                  <span className="text-[10px] text-emerald-400/80">({newTier.rewardType})</span>
                </label>
                <input
                  type="number"
                  required
                  value={newTier.reward}
                  onChange={(e) => setNewTier({ ...newTier, reward: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Tipo de Recompensa</label>
                <select
                  value={newTier.rewardType}
                  onChange={(e) => setNewTier({ ...newTier, rewardType: e.target.value as 'Monedas' | 'USD' })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200"
                >
                  <option value="Monedas">Monedas</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Tareas/Videos Diarios</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTier.dailyTasks}
                  onChange={(e) => setNewTier({ ...newTier, dailyTasks: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Descripción Corta del Rango</label>
              <input
                type="text"
                placeholder="20 misiones diarias VIP, soporte preferencial, etc."
                value={newTier.desc}
                onChange={(e) => setNewTier({ ...newTier, desc: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="submit"
                id="btn-add-vip-submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 px-6 rounded-lg transition-all"
              >
                Agregar Membresía
              </button>
            </div>
          </form>
        )}

        {/* Master Content Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-main-grid">
          
          {/* Left panel: Withdrawal configs & Calendar (occupies 5 cols of 12) */}
          <div className="lg:col-span-5 space-y-6">
            <WithdrawalCalendar 
              config={withdrawalConfig} 
              onUpdate={handleUpdateWithdrawal} 
            />
          </div>

          {/* Right panel: Membresías VIP Editor list (occupies 7 cols of 12) */}
          <div className="lg:col-span-7 space-y-4" id="viptier-list-section">
            <div className="flex justify-between items-center pb-2">
              <h3 className="font-display font-semibold text-white text-base">
                Membresías VIP de tappmusic ({viptiers.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                Guarda automáticamente al editar
              </span>
            </div>

            {viptiers.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border border-white/5 space-y-3">
                <span className="text-4xl">🫙</span>
                <p className="text-xs text-slate-400">No hay ninguna membresía VIP configurada en este momento.</p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs py-1.5 px-3 rounded-lg"
                >
                  Agregar tu primera membresía
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {viptiers.map(tier => (
                  <VIPTierCard
                    key={tier.id}
                    tier={tier}
                    conversionRate={conversionRate}
                    onUpdate={handleUpdateTier}
                    onDelete={handleDeleteTier}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full-width code output exporter section */}
        <div className="grid grid-cols-1" id="exporter-section">
          <CodeExporter 
            tiers={viptiers} 
            withdrawalConfig={withdrawalConfig} 
            conversionRate={conversionRate} 
          />
        </div>

      </main>

      {/* Humble Footer section with no telemetry larping */}
      <footer className="border-t border-white/5 bg-[#0b0f19] py-6 px-4 text-center mt-12" id="applet-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-xs text-slate-400">tappmusic VIP & Withdrawal Consolidation Admin</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            © 2026 tappmusic • Desarrollado para Kervin Jose • Guardado Local Seguro
          </span>
        </div>
      </footer>

    </div>
  );
}
