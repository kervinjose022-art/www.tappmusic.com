/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WithdrawalConfig } from '../types';
import { isWithdrawalDay, getNextWithdrawalDate, formatLocalDateString } from '../utils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  HelpCircle, 
  Info, 
  CheckCircle, 
  XCircle, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Percent
} from 'lucide-react';

interface WithdrawalCalendarProps {
  config: WithdrawalConfig;
  onUpdate: (updated: WithdrawalConfig) => void;
}

export function WithdrawalCalendar({ config, onUpdate }: WithdrawalCalendarProps) {
  // Current month rendering state (defaults to current system date)
  const [currentRenderDate, setCurrentRenderDate] = useState<Date>(new Date());
  const [testDateString, setTestDateString] = useState<string>(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  
  // Real or mock today date
  const today = new Date();

  // Trigger month navigation
  const prevMonth = () => {
    const next = new Date(currentRenderDate);
    next.setMonth(next.getMonth() - 1);
    setCurrentRenderDate(next);
  };

  const nextMonth = () => {
    const next = new Date(currentRenderDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentRenderDate(next);
  };

  // Quick preset helpers
  const applyPreset10Days = () => {
    onUpdate({
      ...config,
      type: 'dates',
      monthlyDates: [10, 20, 30]
    });
  };

  const applyPresetInterval = (days: number) => {
    onUpdate({
      ...config,
      type: 'interval',
      intervalDays: days,
      intervalStartDate: '2026-05-01'
    });
  };

  const toggleMonthlyDate = (day: number) => {
    if (config.type !== 'dates') return;
    const currentDates = [...config.monthlyDates];
    const index = currentDates.indexOf(day);
    if (index > -1) {
      currentDates.splice(index, 1);
    } else {
      currentDates.push(day);
    }
    // Sort array
    currentDates.sort((a, b) => a - b);
    onUpdate({ ...config, monthlyDates: currentDates });
  };

  const toggleWeeklyDay = (dayIndex: number) => {
    if (config.type !== 'weekly') return;
    const currentDays = [...config.weeklyDays];
    const index = currentDays.indexOf(dayIndex);
    if (index > -1) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(dayIndex);
    }
    currentDays.sort((a, b) => a - b);
    onUpdate({ ...config, weeklyDays: currentDays });
  };

  // Math calculations for current visible calendar month
  const targetYear = currentRenderDate.getFullYear();
  const targetMonth = currentRenderDate.getMonth();

  // First day of targetMonth
  const firstDayIndex = new Date(targetYear, targetMonth, 1).getDay(); // 0 is Sun
  // Number of days in targetMonth
  const totalDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  // Calendar render helper
  const calendarCells: (number | null)[] = [];
  // Standard offset padding
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= totalDaysInMonth; i++) {
    calendarCells.push(i);
  }

  // Check state of today
  const withdrawalAllowedToday = isWithdrawalDay(today, config);
  const nextWithdrawalDate = getNextWithdrawalDate(today, config);
  
  // Calculate remaining days countdown to next withdrawal
  const diffTime = nextWithdrawalDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Simulating check date outcome
  const parsedTestDate = new Date(testDateString + 'T00:00:00');
  const allowedOnTestDate = isWithdrawalDay(parsedTestDate, config);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekdayShortNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl" id="withdrawal-panel">
      {/* Top Section */}
      <div className="p-5 border-b border-white/5 bg-slate-900/60">
        <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-emerald-400" />
          Días de Retiro (tappmusica Rules)
        </h3>
        <p className="text-slate-400 text-xs mt-0.5">
          Configura y simula exactamente qué días de la semana o fechas del mes tus usuarios podrán retirar ganancias.
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Banner State Widget */}
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
          withdrawalAllowedToday 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-500/5' 
            : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
        }`}>
          <div className="mt-0.5">
            {withdrawalAllowedToday ? (
              <div className="h-6 w-6 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            ) : (
              <div className="h-6 w-6 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Estado de la compuerta de retiros (Hoy: {formatLocalDateString(today)})
            </h4>
            {withdrawalAllowedToday ? (
              <p className="text-sm font-semibold text-white">
                🟢 ¡Retiros Habilitados Hoy! Los usuarios de tappmusica pueden enviar retiros libremente.
              </p>
            ) : (
              <div>
                <p className="text-sm font-semibold text-white">
                  🔒 Retiros deshabilitados hoy automáticamente.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Próxima fecha de retiro: <strong className="text-sky-300 font-mono">{formatLocalDateString(nextWithdrawalDate)}</strong> ({diffDays === 0 ? 'hoy más tarde' : `en ${diffDays} días`}).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Type Selector */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/5" id="withdrawal-type-select">
          <button
            type="button"
            id="type-dates"
            onClick={() => onUpdate({ ...config, type: 'dates' })}
            className={`text-xs py-2 rounded-lg font-mono font-medium transition-all ${
              config.type === 'dates' 
                ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fechas Específicas
          </button>
          <button
            type="button"
            id="type-interval"
            onClick={() => onUpdate({ ...config, type: 'interval' })}
            className={`text-xs py-2 rounded-lg font-mono font-medium transition-all ${
              config.type === 'interval' 
                ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Intervalo Móvil
          </button>
          <button
            type="button"
            id="type-weekly"
            onClick={() => onUpdate({ ...config, type: 'weekly' })}
            className={`text-xs py-2 rounded-lg font-mono font-medium transition-all ${
              config.type === 'weekly' 
                ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Días de Semana
          </button>
        </div>

        {/* Interactive parameter settings according to type */}
        <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5 space-y-4">
          {config.type === 'dates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">Días mensuales configurados:</span>
                <button
                  type="button"
                  id="btn-prest-10-days"
                  onClick={applyPreset10Days}
                  className="text-[10px] font-mono bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 px-2 py-1 rounded"
                >
                  ⚡ Preservar cada 10 días (10, 20, 30)
                </button>
              </div>

              {/* Day selection grid */}
              <div className="grid grid-cols-7 gap-1.5" id="monthly-dates-grid">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const isSelected = config.monthlyDates.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      id={`day-toggle-${day}`}
                      onClick={() => toggleMonthlyDate(day)}
                      className={`h-8 rounded-lg font-mono text-xs flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-emerald-500 text-slate-950 font-bold scale-105 shadow-md shadow-emerald-500/20' 
                          : 'bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 leading-normal flex items-start gap-1">
                <Info className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                Los usuarios solo podrán retirar los días del mes seleccionados en verde (actualmente: {config.monthlyDates.join(', ') || 'ninguno'}).
              </p>
            </div>
          )}

          {config.type === 'interval' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5" id="interval-days-container">
                  <label className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                    Cada cuántos días (Frecuencia)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="10"
                    value={config.intervalDays}
                    onChange={(e) => onUpdate({ ...config, intervalDays: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg py-1 px-3 text-sm text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5" id="interval-start-container">
                  <label className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                    Fecha Pivote de Inicio
                  </label>
                  <input
                    type="date"
                    value={config.intervalStartDate}
                    onChange={(e) => onUpdate({ ...config, intervalStartDate: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg py-0.5 px-3 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Fast Presets */}
              <div className="flex gap-2">
                <button
                  type="button"
                  id="btn-preset-interval-10"
                  onClick={() => applyPresetInterval(10)}
                  className="text-[10px] font-mono bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 px-2 py-1 rounded"
                >
                  Cada 10 días desde el 1 de mayo
                </button>
                <button
                  type="button"
                  id="btn-preset-interval-15"
                  onClick={() => applyPresetInterval(15)}
                  className="text-[10px] font-mono bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded"
                >
                  Cada 15 días (quincenal)
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal flex items-start gap-1">
                <Info className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                Los retiros se habilitan cada {config.intervalDays} días recurrentes a partir del día {config.intervalStartDate}.
              </p>
            </div>
          )}

          {config.type === 'weekly' && (
            <div className="space-y-4">
              <span className="text-xs font-mono text-slate-300">Días semanales de retiro:</span>
              
              <div className="grid grid-cols-7 gap-1.5" id="weekly-days-grid">
                {weekdayShortNames.map((name, i) => {
                  const isSelected = config.weeklyDays.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      id={`weekly-toggle-${i}`}
                      onClick={() => toggleWeeklyDay(i)}
                      className={`h-10 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-emerald-500 text-slate-950 font-bold scale-105 shadow-md shadow-emerald-500/20' 
                          : 'bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{name}</span>
                      <span className="text-[8px] opacity-60 font-mono mt-0.5">{i}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 leading-normal flex items-start gap-1">
                <Info className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                Los usuarios podrán retirar únicamente en los días de la semana marcados en verde. (0 = Domingo, 1 = Lunes, etc.)
              </p>
            </div>
          )}
        </div>

        {/* Unified Commission Section */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-emerald-500/20 space-y-3 shadow-md shadow-emerald-950/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
              <Percent className="h-3.5 w-3.5 text-emerald-400" />
              COMISIÓN PARA RETIROS (FEE)
            </div>
            <div className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
              {config.feePercentage !== undefined ? config.feePercentage : 5}% Retenido
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 leading-normal">
              Ajusta el porcentaje de comisión que cobrará el sistema de tappmusica por cada retiro aprobado de tus usuarios.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={config.feePercentage !== undefined ? config.feePercentage : 5}
                onChange={(e) => onUpdate({ ...config, feePercentage: Number(e.target.value) })}
                className="flex-1 accent-emerald-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.feePercentage !== undefined ? config.feePercentage : 5}
                  onChange={(e) => onUpdate({ ...config, feePercentage: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  className="w-16 bg-slate-950 border border-white/10 rounded-lg py-1 px-2 text-xs text-center text-white font-mono"
                />
                <span className="text-slate-400 text-xs font-mono">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulator for Users */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/20 space-y-3 relative overflow-hidden" id="user-preview-widget-card">
          <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 font-mono text-[8px] font-bold px-2 py-0.5 rounded-bl border-l border-b border-emerald-500/20 uppercase tracking-wider">
            PREVISTA DEL USUARIO (tappmusica)
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/15 p-1.5 rounded-lg border border-emerald-500/20">
              <Clock className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block leading-none">Cuenta Regresiva Activa</span>
              <span className="text-xs font-semibold text-white">¿Cuántos días le faltan a tus usuarios para retirar?</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 text-center space-y-2">
            <div className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono tracking-wide ${
              withdrawalAllowedToday 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
            }`}>
              {withdrawalAllowedToday ? '¡RETIROS HABILITADOS HOY!' : 'SISTEMA CON CANDADO TEMPORAL'}
            </div>
            
            <div className="text-2xl font-bold text-white tracking-tight">
              {withdrawalAllowedToday ? (
                <span className="text-emerald-400">00 <span className="text-xs text-slate-400 font-mono font-normal">DÍAS</span></span>
              ) : (
                <span className="text-amber-400">{diffDays} <span className="text-xs text-slate-400 font-mono font-normal">{diffDays === 1 ? 'DÍA RESTANTE' : 'DÍAS RESTANTES'}</span></span>
              )}
            </div>

            <p className="text-[11px] text-slate-300 max-w-sm mx-auto leading-relaxed">
              {withdrawalAllowedToday ? (
                '¡Felicidades! La compuerta de retiros se encuentra habilitada hoy. Los usuarios pueden solicitar sus comisiones directamente.'
              ) : (
                <>
                  No es un día de retiro permitido hoy. Podrán retirar el <strong className="text-white">{nextWithdrawalDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</strong> ({diffDays} {diffDays === 1 ? 'día' : 'días'} más).
                </>
              )}
            </p>
          </div>
          
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pt-0.5 border-b border-white/5 pb-1.5 mb-1.5">
            <span>Regla de Calendario:</span>
            <span className="text-emerald-400 font-bold">{
              config.type === 'dates' ? `Fijado el ${config.monthlyDates.join(', ')} de cada mes` :
              config.type === 'weekly' ? 'Filtro Semanal de Días' :
              `Frecuencia de ${config.intervalDays} días`
            }</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Comisión de Retiro (Fee):</span>
            <span className="text-amber-400 font-bold">-{config.feePercentage !== undefined ? config.feePercentage : 5}% del monto solicitado</span>
          </div>
        </div>

        {/* Visual Monthly Calendar Component */}
        <div className="space-y-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
              Vista Calendario ({monthNames[targetMonth]} {targetYear})
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                id="btn-calendar-prev"
                onClick={prevMonth}
                className="p-1 rounded bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                id="btn-calendar-next"
                onClick={nextMonth}
                className="p-1 rounded bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div id="visual-calendar-grid" className="bg-slate-950/80 p-4 rounded-xl border border-white/5">
            {/* Short names row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {weekdayShortNames.map((n, i) => (
                <div key={i} className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  {n}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((dayNum, i) => {
                if (dayNum === null) {
                  return <div key={`empty-${i}`} className="h-8 opacity-0" />;
                }

                const cellDate = new Date(targetYear, targetMonth, dayNum);
                const isW = isWithdrawalDay(cellDate, config);
                const isT = formatLocalDateString(cellDate) === formatLocalDateString(today);

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`h-8 rounded flex flex-col items-center justify-center transition-all relative ${
                      isW 
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold' 
                        : 'bg-slate-900/40 text-slate-400 font-mono text-[11px]'
                    } ${isT ? 'ring-2 ring-sky-400 text-sky-300 font-bold' : ''}`}
                    title={isW ? 'Día de REtiro habilitado' : 'Bloqueado'}
                  >
                    <span>{dayNum}</span>
                    {isT && (
                      <span className="absolute bottom-0 text-[6px] font-sans text-sky-400 font-bold uppercase tracking-widest scale-75">
                        Hoy
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/15 border border-emerald-500/30 inline-block" />
              Días de Retiro Permitidos
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm ring-2 ring-sky-400 inline-block" />
              Día Actual
            </div>
          </div>
        </div>

        {/* Dynamic withdrawal validator tool (Kervin's personal playground) */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-3" id="test-sandbox">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
              🔮 Probador de Cumplimiento (Verificar Fecha)
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={testDateString}
              onChange={(e) => setTestDateString(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg py-1.5 px-3 text-xs font-mono text-white flex-1 focus:outline-none focus:border-emerald-500/50"
            />
            {allowedOnTestDate ? (
              <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 font-semibold">
                <CheckCircle className="h-3.5 w-3.5" />
                RETIRO ABIERTO
              </div>
            ) : (
              <div className="bg-red-500/15 border border-red-500/20 text-red-400 text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 font-semibold">
                <XCircle className="h-3.5 w-3.5" />
                BLOQUEADO
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
