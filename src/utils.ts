/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VIPTier, WithdrawalConfig } from './types';

/**
 * Calculates default reward based on price and a conversion rate (default 36.7 coins/USD)
 */
export function calculateReward(price: number, conversionRate: number): number {
  return Math.round(price * conversionRate);
}

/**
 * Checks if a specific Date is a withdrawal day according to the config
 */
export function isWithdrawalDay(date: Date, config: WithdrawalConfig): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const dayOfMonth = date.getDate();

  if (config.type === 'dates') {
    return config.monthlyDates.includes(dayOfMonth);
  }

  if (config.type === 'weekly') {
    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    return config.weeklyDays.includes(dayOfWeek);
  }

  if (config.type === 'interval') {
    // Safely anchor start date to noon to avoid local timezone offset drift
    const startStr = config.intervalStartDate.includes('T') 
      ? config.intervalStartDate.split('T')[0] 
      : config.intervalStartDate;
    const start = new Date(startStr + 'T12:00:00');
    
    const target = new Date(date);
    target.setHours(12, 0, 0, 0);

    const diffTime = target.getTime() - start.getTime();
    if (diffTime < 0) return false; // Before start date

    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays % config.intervalDays === 0;
  }

  return false;
}

/**
 * Finds the next withdrawal date starting from a specific date
 */
export function getNextWithdrawalDate(startDate: Date, config: WithdrawalConfig): Date {
  const current = new Date(startDate);
  // Max check 365 days to avoid infinite loops
  for (let i = 0; i < 365; i++) {
    if (isWithdrawalDay(current, config)) {
      return current;
    }
    current.setDate(current.getDate() + 1);
  }
  return startDate; // Fallback
}

/**
 * Formats a Date in YYYY-MM-DD format based on local timezone
 */
export function formatLocalDateString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

/**
 * Default VIP tiers based on user screenshots and standard conventions
 */
export const DEFAULT_VIP_TIERS: VIPTier[] = [
  {
    id: 'plata',
    name: 'VIP Plata',
    price: 10,
    reward: 367,
    rewardType: 'Monedas',
    desc: 'Acceso completo a misiones de 367 monedas.',
    dailyTasks: 5,
    isActive: true
  },
  {
    id: 'oro',
    name: 'VIP Oro',
    price: 20,
    reward: 734,
    rewardType: 'Monedas',
    desc: 'Acceso completo a misiones de 734 monedas.',
    dailyTasks: 7,
    isActive: true
  },
  {
    id: 'rubi',
    name: 'VIP Rubí',
    price: 40,
    reward: 1468,
    rewardType: 'Monedas',
    desc: 'Acceso completo a misiones de 1468 monedas.',
    dailyTasks: 10,
    isActive: true
  },
  {
    id: 'diamante',
    name: 'VIP Diamante',
    price: 120,
    reward: 4404,
    rewardType: 'Monedas',
    desc: 'Acceso completo a misiones de 4404 monedas.',
    dailyTasks: 15,
    isActive: true
  },
  {
    id: 'platino',
    name: 'VIP Platino',
    price: 420,
    reward: 15414,
    rewardType: 'Monedas',
    desc: 'Acceso completo a misiones de 15414 monedas.',
    dailyTasks: 17,
    isActive: true
  },
  {
    id: 'corona',
    name: 'VIP Corona Imperial',
    price: 1000,
    reward: 36700,
    rewardType: 'Monedas',
    desc: 'Acceso prioritario supremo, 20 videos VIP y recompensas máximas de 36700 monedas.',
    dailyTasks: 20,
    isActive: true
  }
];

export const DEFAULT_WITHDRAWAL_CONFIG: WithdrawalConfig = {
  type: 'dates',
  monthlyDates: [10, 20, 30], // Default every 10 days of the month
  intervalDays: 10,
  intervalStartDate: '2026-05-01',
  weeklyDays: [1, 4], // Mon & Thu
  feePercentage: 5 // Commission fee percentage (e.g. 5%)
};

/**
 * Generators for export files
 */
export function generateReactArrayCode(tiers: VIPTier[], conversionRate: number): string {
  const activeTiers = tiers.filter(t => t.isActive);
  return `// Copia y pega esta matriz de membresías en tu código de front-end React
export const VIP_TIERS = ${JSON.stringify(
    activeTiers.map(t => ({
      id: t.id,
      name: t.name,
      price: t.price,
      reward: t.reward,
      rewardType: t.rewardType.toLowerCase(),
      desc: t.desc,
      dailyTasks: t.dailyTasks,
      rewardPerTask: Number(((t.reward) / (t.dailyTasks || 1)).toFixed(2))
    })),
    null,
    2
  )};

export const MONEDAS_CONVERSION_RATE = ${conversionRate}; // monedas por 1 USD
`;
}

export function generateJSONConfig(tiers: VIPTier[], withdrawalConfig: WithdrawalConfig, conversionRate: number): string {
  const activeTiers = tiers.filter(t => t.isActive);
  const data = {
    configs: {
      conversionRate,
      withdrawalType: withdrawalConfig.type,
      withdrawalFeePercent: withdrawalConfig.feePercentage ?? 5,
      withdrawalSettings: withdrawalConfig.type === 'dates' 
        ? { monthlyDates: withdrawalConfig.monthlyDates } 
        : withdrawalConfig.type === 'weekly' 
        ? { weeklyDays: withdrawalConfig.weeklyDays } 
        : { intervalDays: withdrawalConfig.intervalDays, intervalStartDate: withdrawalConfig.intervalStartDate },
      lastUpdate: new Date().toISOString()
    },
    tiers: activeTiers.map(t => ({
      id: t.id,
      name: t.name,
      price: t.price,
      reward: t.reward,
      rewardType: t.rewardType.toLowerCase(),
      desc: t.desc,
      dailyTasks: t.dailyTasks
    }))
  };
  return JSON.stringify(data, null, 2);
}

export function generateHTMLCode(tiers: VIPTier[]): string {
  const activeTiers = tiers.filter(t => t.isActive);
  let html = `<div style="font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; color: #f3f4f6; background-color: #0f172a;">
  <h2 style="font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: #fff;">Planes de Membresía VIP dispuestas por tappmusic</h2>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
`;

  activeTiers.forEach(t => {
    html += `    <!-- Tarjeta ${t.name} -->
    <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0; color: #fff;">${t.name}</h3>
          <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 9999px;">ID: ${t.id.toUpperCase()}</span>
        </div>
        <p style="color: #94a3b8; font-size: 0.875rem; margin-top: 0; margin-bottom: 20px;">${t.desc}</p>
        <div style="border-top: 1px solid rgba(148, 163, 184, 0.1); padding-top: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 0.875rem;">Precio:</span>
            <span style="font-weight: 700; color: #fff;">$${t.price} USD</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 0.875rem;">Misiones:</span>
            <span style="font-weight: 700; color: #10b981;">${t.reward.toLocaleString()} ${t.rewardType}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-size: 0.875rem;">Videos Diarios:</span>
            <span style="font-weight: 600; color: #38bdf8;">${t.dailyTasks} Videos</span>
          </div>
        </div>
      </div>
      <button style="width: 100%; border: none; background: #10b981; color: #fff; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
        Adquirir Membresía ($${t.price} USD)
      </button>
    </div>
`;
  });

  html += `  </div>
</div>`;
  return html;
}

export function generateWithdrawalBlockingCode(config: WithdrawalConfig): string {
  let condition = '';
  if (config.type === 'dates') {
    condition = `const allowedDates = [${config.monthlyDates.join(', ')}];\n  const isAllowed = allowedDates.includes(today.getDate());`;
  } else if (config.type === 'weekly') {
    condition = `const allowedDays = [${config.weeklyDays.join(', ')}]; // 0=Domingo, 1=Lunes, etc.\n  const isAllowed = allowedDays.includes(today.getDay());`;
  } else if (config.type === 'interval') {
    condition = `const startD = new Date("${config.intervalStartDate}");\n  startD.setHours(0,0,0,0);\n  const currentD = new Date(today);\n  currentD.setHours(0,0,0,0);\n\n  const diff = currentD.getTime() - startD.getTime();\n  const isAllowed = diff >= 0 && Math.floor(diff / (1000 * 60 * 60 * 24)) % ${config.intervalDays} === 0;`;
  }

  return `/**
 * Código de validación para backend o frontend para limitar retiros
 * Colócalo en la compuerta de retiros de tappmusica
 */
function checkWithdrawalPermission() {
  const today = new Date();
  
  // Condición de validación para retiros
  ${condition}
  
  if (!isAllowed) {
    return {
      allowed: false,
      message: "Atención: Los retiros solo están habilitados en los días designados por el sistema de tappmusica."
    };
  }
  
  return {
    allowed: true,
    message: "¡Correcto! Ventana de retiros abierta hoy."
  };
}

/**
 * Calculador de comisión de retiro de ${config.feePercentage ?? 5}% establecida en tappmusic
 */
function getWithdrawalNetPayout(requestedAmount) {
  const feePercent = ${config.feePercentage ?? 5}; // Establecido por el administrador
  const feeAmount = requestedAmount * (feePercent / 100);
  const netAmount = requestedAmount - feeAmount;
  return {
    requestedAmount,
    feePercent,
    feeAmount: Number(feeAmount.toFixed(2)),
    netAmount: Number(netAmount.toFixed(2))
  };
}

// Ejemplo de uso:
// const validation = checkWithdrawalPermission();
// if (!validation.allowed) {
//   return renderErrorMessage(validation.message);
// }
//
// const { netAmount, feeAmount } = getWithdrawalNetPayout(requestedCoins);
// console.log("Se retiran " + requestedCoins + " netos: " + netAmount + " (Comisión: " + feeAmount + ")");
`;
}

/**
 * Generates an elegant, interactive HTML/JS widget of countdown for users to display in their UI.
 */
export function generateUserCountdownWidgetCode(config: WithdrawalConfig): string {
  let calculationLogic = '';
  
  if (config.type === 'dates') {
    calculationLogic = `
    const allowedDates = [${config.monthlyDates.join(', ')}];
    const today = new Date();
    const currentDay = today.getDate();
    
    let nextDate = null;
    const currentMonthDates = allowedDates.filter(d => d >= currentDay);
    if (currentMonthDates.length > 0) {
      nextDate = new Date(today.getFullYear(), today.getMonth(), currentMonthDates[0]);
    } else {
      const sorted = [...allowedDates].sort((a,b) => a-b);
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, sorted[0] || 1);
    }
    const isTodayAllowed = allowedDates.includes(currentDay);`;
  } else if (config.type === 'weekly') {
    calculationLogic = `
    const allowedDays = [${config.weeklyDays.join(', ')}];
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    
    const isTodayAllowed = allowedDays.includes(currentDayOfWeek);
    let nextDate = new Date(today);
    for (let i = 0; i < 8; i++) {
      const test = new Date(today);
      test.setDate(today.getDate() + i);
      if (allowedDays.includes(test.getDay())) {
        nextDate = test;
        break;
      }
    }`;
  } else {
    calculationLogic = `
    const intervalDays = ${config.intervalDays};
    const pivotDate = new Date("${config.intervalStartDate}");
    pivotDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const isTodayAllowed = today.getTime() >= pivotDate.getTime() && 
      Math.floor((today.getTime() - pivotDate.getTime()) / (1000 * 60 * 60 * 24)) % intervalDays === 0;
    
    let nextDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const test = new Date(today);
      test.setDate(today.getDate() + i);
      const diff = test.getTime() - pivotDate.getTime();
      if (diff >= 0 && Math.floor(diff / (1000 * 60 * 60 * 24)) % intervalDays === 0) {
        nextDate = test;
        break;
      }
    }`;
  }

  const prettyRule = config.type === 'dates' 
    ? `Días del mes: ${config.monthlyDates.join(', ')}`
    : config.type === 'weekly'
    ? `Días semanales: de lunes a domingo según filtro`
    : `Cada ${config.intervalDays} días recurrentes`;

  return `<!-- Widget de Cuenta Regresiva de Retiros para Usuarios de tappmusic -->
<!-- Pégalo directamente en tu maquetación HTML de tencent/vercel (tappmusic.vercel.app) -->
<div id="tappmusic-countdown-widget" style="font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; border: 1.5px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 20px; color: #f3f4f6; max-width: 420px; margin: 15px auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);">
  
  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.07); padding-bottom: 10px;">
    <div style="background: rgba(16, 185, 129, 0.1); padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
      <svg style="width: 20px; height: 20px; fill: none; stroke: #10b981; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    </div>
    <div style="flex: 1;">
      <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #fff;">Próximo Retiro de Comisiones</h4>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">Calendario Oficial de tappmusic VIP</p>
    </div>
    <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.25); color: #fbbf24; font-size: 10px; font-family: monospace; font-weight: bold; padding: 2px 7px; border-radius: 6px; text-align: center; white-space: nowrap;">
      -${config.feePercentage ?? 5}% Fee
    </div>
  </div>

  <div id="countdown-status-box" style="background: rgba(15, 23, 42, 0.6); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; transition: all 0.3s ease;">
    <div id="countdown-badge" style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px; margin-bottom: 10px; font-family: monospace;">
      Calculando...
    </div>
    
    <div id="countdown-days-text" style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px; font-variant-numeric: tabular-nums;">
      -- Días
    </div>
    
    <p id="countdown-message" style="margin: 0; font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">
      Analizando los ciclos del cronograma de retiros...
    </p>
  </div>

  <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #64748b; padding: 0 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
    <span>Configuración Actual:</span>
    <span style="font-weight: bold; color: #10b981;">${prettyRule}</span>
  </div>
  <div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #64748b; padding: 0 4px;">
    <span>Comisión de Retiro:</span>
    <span style="font-weight: bold; color: #fbbf24;">${config.feePercentage ?? 5}% por transacción</span>
  </div>
</div>

<script>
(function() {
  function updateTappmusicCountdown() {
    ${calculationLogic}
    
    const statusBox = document.getElementById("countdown-status-box");
    const badge = document.getElementById("countdown-badge");
    const daysText = document.getElementById("countdown-days-text");
    const msg = document.getElementById("countdown-message");
    
    if (!badge || !daysText || !msg || !statusBox) return;

    const testToday = new Date();
    const tZero = new Date(testToday.getFullYear(), testToday.getMonth(), testToday.getDate());
    const nZero = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
    
    const diffTime = nZero.getTime() - tZero.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isTodayAllowed) {
      statusBox.style.borderColor = "rgba(16, 185, 129, 0.4)";
      statusBox.style.background = "rgba(16, 185, 129, 0.06)";
      badge.style.background = "rgba(16, 185, 129, 0.2)";
      badge.style.color = "#34d399";
      badge.innerText = "¡RETIROS HABILITADOS HOY!";
      daysText.innerHTML = "00 <span style='font-size: 12px; opacity:0.7'>DÍAS</span>";
      daysText.style.color = "#10b981";
      msg.innerHTML = "¡Correcto! La compuerta de retiros se encuentra habilitada hoy. Puedes procesar las solicitudes directamente desde tu perfil.";
    } else {
      statusBox.style.borderColor = "rgba(245, 158, 11, 0.3)";
      statusBox.style.background = "rgba(245, 158, 11, 0.03)";
      badge.style.background = "rgba(245, 158, 11, 0.15)";
      badge.style.color = "#fbbf24";
      badge.innerText = "ACCESO RESTRINGIDO";
      
      const labelText = diffDays === 1 ? "DÍA RESTANTE" : "DÍAS RESTANTES";
      daysText.innerHTML = diffDays + " <span style='font-size: 12px; opacity:0.7'>" + labelText + "</span>";
      daysText.style.color = "#fbbf24";
      
      const dateStr = nextDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      msg.innerHTML = "No es un día de retiro permitido hoy. Podrás retirar el <strong style='color:#fff'>" + dateStr + "</strong> (" + diffDays + " " + (diffDays === 1 ? 'día' : 'días') + " más).";
    }
  }

  updateTappmusicCountdown();
  setInterval(updateTappmusicCountdown, 60000);
})();
</script>
`;
}

/**
 * Genera el código HTML + CSS en línea + Javascript nativo autolimpiable
 * para el Campo de Contraseña del Registro con Visor (Ojo toggler)
 */
export function generateEyePasswordRegistrationCode(): string {
  return `<!-- ========================================== -->
<!-- CAMPO DE CONTRASEÑA SEGURO CON VISOR (OJO) PARA TAPPMUSICA -->
<!-- Copia y pega este bloque en tu página de Registro o Perfil -->
<!-- ========================================== -->
<div style="font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; border: 1.5px solid rgba(14, 165, 233, 0.25); border-radius: 16px; padding: 20px; color: #f3f4f6; max-width: 420px; margin: 15px auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);">
  
  <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
    <div style="background: rgba(14, 165, 233, 0.12); padding: 5px; border-radius: 6px; display: flex; align-items: center;">
      <svg style="width: 16px; height: 16px; fill: none; stroke: #38bdf8; stroke-width: 2;" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <span style="font-[font-sans] font-weight: bold; font-size: 13.5px; color: #e2e8f0;">Contraseña de Seguridad</span>
  </div>

  <div style="position: relative; display: flex; align-items: center; box-sizing: border-box;">
    <!-- Entrada de tipo contraseña por defecto -->
    <input 
      type="password" 
      id="tappmusic-reg-password" 
      placeholder="Ingresa una contraseña segura..." 
      style="width: 100%; bg-color: rgb(7, 10, 19); background: rgb(7, 10, 19); border: 1.5px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 48px 12px 14px; font-size: 13.5px; color: #fff; outline: none; transition: all 0.25s ease; box-sizing: border-box;" 
      onfocus="this.style.borderColor='#38bdf8'; this.style.boxShadow='0 0 0 3px rgba(56, 189, 248, 0.15)'" 
      onblur="this.style.borderColor='rgba(255, 255, 255, 0.08)'; this.style.boxShadow='none'"
    />
    
    <!-- Botón con el icono del ojo del visor -->
    <button 
      type="button" 
      id="tappmusic-reg-toggle-btn" 
      style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; color: #64748b; transition: color 0.2s ease; outline: none; -webkit-tap-highlight-color: transparent;"
      title="Mostrar/Ocultar contraseña"
    >
      <!-- Icono del Ojo ABIERTO (Visible por defecto) -->
      <svg id="tappmusic-eye-svg-open" style="width: 19px; height: 19px; display: block;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <!-- Icono del Ojo REVENTADO/TACHADO (Oculto por defecto) -->
      <svg id="tappmusic-eye-svg-closed" style="width: 19px; height: 19px; display: none;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    </button>
  </div>

  <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b; line-height: 1.45; font-family: sans-serif;">
    💡 <strong style="color: #94a3b8;">Recomendación:</strong> Haz clic en el icono del ojo para revisar que no tengas errores de ortografía antes de continuar tu registro.
  </p>
</div>

<script>
(function() {
  const passInput = document.getElementById('tappmusic-reg-password');
  const toggleBtn = document.getElementById('tappmusic-reg-toggle-btn');
  const eyeOpen = document.getElementById('tappmusic-eye-svg-open');
  const eyeClosed = document.getElementById('tappmusic-eye-svg-closed');

  if (!passInput || !toggleBtn || !eyeOpen || !eyeClosed) return;

  toggleBtn.addEventListener('click', function(e) {
    // Evitar que envíe el formulario al presionarlo accidentalmente
    e.preventDefault();
    
    if (passInput.type === 'password') {
      passInput.type = 'text';
      eyeOpen.style.display = 'none';
      eyeClosed.style.display = 'block';
      toggleBtn.style.color = '#38bdf8'; // Resalta celeste al verla
    } else {
      passInput.type = 'password';
      eyeOpen.style.display = 'block';
      eyeClosed.style.display = 'none';
      toggleBtn.style.color = '#64748b'; // Normal gris al estar oculta
    }
  });
})();
</script>
`;
}

