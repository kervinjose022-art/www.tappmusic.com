/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VIPTier } from '../types';
import { 
  Sparkles, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calculator, 
  Coins, 
  DollarSign, 
  TrendingUp, 
  HelpCircle,
  Video,
  Check,
  RefreshCw
} from 'lucide-react';

interface VIPTierCardProps {
  key?: string;
  tier: VIPTier;
  conversionRate: number;
  onUpdate: (updated: VIPTier) => void;
  onDelete: (id: string) => void;
}

export function VIPTierCard({ tier, conversionRate, onUpdate, onDelete }: VIPTierCardProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'calculator'>('basics');
  
  // Local state for interactive ROI simulation
  const [useGlobalMultiplier, setUseGlobalMultiplier] = useState(true);
  const [customMultiplier, setCustomMultiplier] = useState(conversionRate);
  
  // Task calculations parameters
  const [taskCount, setTaskCount] = useState(tier.dailyTasks || 20);
  const [rewardPerVideo, setRewardPerVideo] = useState(
    Number((tier.reward / (tier.dailyTasks || 20)).toFixed(2))
  );

  // Synchronize when global conversion rate changes
  useEffect(() => {
    if (useGlobalMultiplier) {
      setCustomMultiplier(conversionRate);
    }
  }, [conversionRate, useGlobalMultiplier]);

  // Handle standard property edits
  const handlePropChange = (field: keyof VIPTier, value: any) => {
    const updated = { ...tier, [field]: value };
    
    // If updating price with automatic multiplier, recalculate reward
    if (field === 'price' && useGlobalMultiplier) {
      updated.reward = Math.round(Number(value) * conversionRate);
    }
    
    onUpdate(updated);
  };

  // Re-run standard math from inputs when we want automatic calculations
  const applyAutoCalculatedReward = () => {
    const targetMultiplier = useGlobalMultiplier ? conversionRate : customMultiplier;
    const computedReward = Math.round(tier.price * targetMultiplier);
    const updated = { 
      ...tier, 
      reward: computedReward,
      dailyTasks: taskCount
    };
    onUpdate(updated);
    // Update task-specific input to match new total average
    setRewardPerVideo(Number((computedReward / taskCount).toFixed(2)));
  };

  // Automatically recalculate if taskCount or rewardPerVideo is edited manually in calculator
  const applyTaskBasedReward = () => {
    const computedReward = Math.round(taskCount * rewardPerVideo);
    const updated = {
      ...tier,
      reward: computedReward,
      dailyTasks: taskCount
    };
    onUpdate(updated);
  };

  // Derivative metrics
  const totalReward = tier.reward;
  const rewardPerTask = Number((totalReward / (tier.dailyTasks || 1)).toFixed(2));
  
  // Let's assume Kervin's app pays 1 USD per 36.7 coins when withdrawing.
  // Then the ROI (return on investment in days) is computed as:
  // Price USD / Daily Earnings USD.
  // Standard conversion back to USD: totalReward / conversionRate
  const dailyEarningsUSD = tier.rewardType === 'Monedas' 
    ? Number((totalReward / conversionRate).toFixed(2)) 
    : totalReward;

  const roiDays = dailyEarningsUSD > 0 
    ? Number((tier.price / dailyEarningsUSD).toFixed(1)) 
    : 0;

  const monthlyEarningsUSD = Number((dailyEarningsUSD * 30).toFixed(2));

  return (
    <div className={`transition-all duration-300 rounded-2xl border ${
      tier.isActive 
        ? 'border-emerald-500/20 bg-slate-900/40 relative overflow-hidden ring-1 ring-emerald-500/10 shadow-lg shadow-emerald-500/5' 
        : 'border-slate-800 bg-slate-950/20 opacity-60'
    }`} id={`card-${tier.id}`}>
      {/* Glow Effect when Active */}
      {tier.isActive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
      )}

      {/* Header section with Toggle and title */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${tier.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-white text-base leading-tight">
                {tier.name || 'Nuevo Rango VIP'}
              </h3>
              <span className="text-[10px] font-mono tracking-wider font-semibold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full uppercase border border-sky-400/20">
                {tier.id}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Precio: ${tier.price} USD</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active status toggler */}
          <button
            type="button"
            id={`toggle-active-${tier.id}`}
            onClick={() => handlePropChange('isActive', !tier.isActive)}
            className={`p-2 rounded-lg transition-colors border ${
              tier.isActive 
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                : 'border-slate-800 bg-slate-900 text-slate-500 hover:bg-slate-800'
            }`}
            title={tier.isActive ? 'Desactivar plan' : 'Activar plan'}
          >
            {tier.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          {/* Delete Tier button */}
          <button
            type="button"
            id={`delete-tier-${tier.id}`}
            onClick={() => onDelete(tier.id)}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
            title="Eliminar rango"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 bg-slate-900/20 text-xs font-mono">
        <button
          type="button"
          id={`tab-basics-${tier.id}`}
          onClick={() => setActiveTab('basics')}
          className={`flex-1 py-2.5 text-center transition-all ${
            activeTab === 'basics' 
              ? 'text-white font-medium border-b-2 border-emerald-500 bg-slate-900/40' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
          }`}
        >
          Editor de Campos
        </button>
        <button
          type="button"
          id={`tab-calc-${tier.id}`}
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 py-2.5 text-center transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'calculator' 
              ? 'text-white font-medium border-b-2 border-sky-400 bg-slate-900/40' 
              : 'text-sky-400/80 hover:text-sky-300 hover:bg-slate-900/10'
          }`}
        >
          <Calculator className="h-3 w-3" />
          Matemáticas & ROI
        </button>
      </div>

      <div className="p-5 space-y-4">
        {activeTab === 'basics' ? (
          <div className="space-y-4">
            {/* Form Fields identical to user screenshot */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5" id={`section-name-${tier.id}`}>
                <label className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  Nombre
                </label>
                <input
                  type="text"
                  id={`field-name-${tier.id}`}
                  value={tier.name}
                  onChange={(e) => handlePropChange('name', e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5" id={`section-price-${tier.id}`}>
                <label className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  Precio ($ USD)
                </label>
                <input
                  type="number"
                  id={`field-price-${tier.id}`}
                  value={tier.price}
                  min="0"
                  onChange={(e) => handlePropChange('price', Number(e.target.value))}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5" id={`section-reward-${tier.id}`}>
                <label className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                  Monto de Misión
                  {useGlobalMultiplier && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1 py-0.5 rounded leading-none text-right">Auto</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id={`field-reward-${tier.id}`}
                    value={tier.reward}
                    onChange={(e) => {
                      setUseGlobalMultiplier(false);
                      handlePropChange('reward', Number(e.target.value));
                    }}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5" id={`section-unit-${tier.id}`}>
                <label className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  Tipo de Unidad
                </label>
                <select
                  id={`field-unit-${tier.id}`}
                  value={tier.rewardType}
                  onChange={(e) => handlePropChange('rewardType', e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="Monedas">Monedas</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5" id={`section-desc-${tier.id}`}>
              <label className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Descripción Corta
              </label>
              <textarea
                id={`field-desc-${tier.id}`}
                value={tier.desc}
                rows={2}
                onChange={(e) => handlePropChange('desc', e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none scrollbar-thin"
              />
            </div>

            {/* Quick Auto Sync Toggler */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-400" />
                Vincular Recompensa al Precio
              </span>
              <button
                type="button"
                id={`btn-sync-formula-${tier.id}`}
                onClick={() => {
                  const newSync = !useGlobalMultiplier;
                  setUseGlobalMultiplier(newSync);
                  if (newSync) {
                    const computedReward = Math.round(tier.price * conversionRate);
                    handlePropChange('reward', computedReward);
                  }
                }}
                className={`text-[10px] font-mono px-2 py-1 rounded transition-all flex items-center gap-1 border ${
                  useGlobalMultiplier 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                }`}
              >
                <RefreshCw className={`h-3 w-3 ${useGlobalMultiplier ? 'animate-spin-slow' : ''}`} />
                {useGlobalMultiplier ? 'Sincronizado' : 'Manual'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Interactive Calculator Section */}
            <p className="text-xs text-slate-400 leading-relaxed">
              Define cuántos videos hace el usuario y la recompensa por video. Calcularemos el monto total automáticamente.
            </p>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Video className="h-3 w-3 text-sky-400" />
                    Videos Diarios
                  </label>
                  <input
                    type="number"
                    value={taskCount}
                    min="1"
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      setTaskCount(val);
                    }}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-1 px-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Coins className="h-3 w-3 text-sky-400" />
                    Ganancia por video
                  </label>
                  <input
                    type="number"
                    value={rewardPerVideo}
                    step="0.1"
                    min="0"
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      setRewardPerVideo(val);
                    }}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-1 px-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  id={`btn-apply-tasks-${tier.id}`}
                  onClick={applyTaskBasedReward}
                  className="flex-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 hover:border-sky-500/50 text-sky-300 text-xs font-semibold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Calcular y Guardar (Total: {Math.round(taskCount * rewardPerVideo)})
                </button>
              </div>
            </div>

            {/* Financial Performance Summary (ROI & Earnings) */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Análisis Financiero Simulado
              </span>
              
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase mb-0.5 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    Ganancia/Día
                  </p>
                  <p className="font-mono font-bold text-white leading-tight">
                    ${dailyEarningsUSD} <span className="text-[8px] text-slate-500">USD</span>
                  </p>
                  <p className="text-[8px] font-mono text-emerald-400/80 mt-0.5">
                    ({totalReward.toLocaleString()} {tier.rewardType === 'Monedas' ? 'coins' : 'USD'})
                  </p>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase mb-0.5 flex items-center justify-center gap-1">
                    <RefreshCw className="h-3 w-3 text-cyan-400" />
                    Retorno (ROI)
                  </p>
                  <p className="font-mono font-bold text-cyan-400 leading-tight">
                    {roiDays} {roiDays === 1 ? 'Día' : 'Días'}
                  </p>
                  <p className="text-[8px] font-mono text-slate-500 mt-0.5">
                    Para recuperar ${tier.price}
                  </p>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase mb-0.5 flex items-center justify-center gap-1">
                    <DollarSign className="h-3 w-3 text-sky-400" />
                    Ganancia/Mes
                  </p>
                  <p className="font-mono font-bold text-sky-300 leading-tight">
                    ${monthlyEarningsUSD} <span className="text-[8px] text-slate-500">USD</span>
                  </p>
                  <p className="text-[8px] font-mono text-emerald-500/80 mt-0.5 font-bold">
                    +{Math.round((monthlyEarningsUSD / (tier.price || 1)) * 100)}% neto
                  </p>
                </div>
              </div>

              {/* Dynamic Warning Helper */}
              {roiDays < 10 && roiDays > 0 ? (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] p-2 rounded-lg leading-relaxed">
                  ⚠️ <strong>Retorno muy rápido!</strong> El usuario recuperará su inversión en menos de 10 días, lo cual representa alto riesgo de sangrado de liquidez para tappmusic.
                </div>
              ) : roiDays >= 25 ? (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] p-2 rounded-lg leading-relaxed">
                  ℹ️ <strong>Plan Conservador.</strong> El usuario tarda {roiDays} días en recuperar su dinero. Es un plan altamente sostenible a largo plazo para la plataforma.
                </div>
              ) : roiDays > 0 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2 rounded-lg leading-relaxed">
                  ✅ <strong>Rango Ideal.</strong> Retorno equilibrado de {roiDays} días. Atractivo para el usuario y financieramente controlable.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
