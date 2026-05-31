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
    const start = new Date(config.intervalStartDate);
    // Reset times to compare actual day differences
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - start.getTime();
    if (diffTime < 0) return false; // Before start date

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
    desc: 'Acceso completo a misiones de 367 recompensas.',
    dailyTasks: 10,
    isActive: true
  },
  {
    id: 'oro',
    name: 'VIP Oro',
    price: 20,
    reward: 734,
    rewardType: 'Monedas',
    desc: 'Acceso TOTAL de misiones de 734 monedas.',
    dailyTasks: 15,
    isActive: true
  },
  {
    id: 'rubi',
    name: 'VIP Rubí',
    price: 40,
    reward: 1468,
    rewardType: 'Monedas',
    desc: 'Acceso completo a misiones exclusivas de 1468.',
    dailyTasks: 18,
    isActive: true
  },
  {
    id: 'diamante',
    name: 'VIP Diamante',
    price: 120,
    reward: 4404,
    rewardType: 'Monedas',
    desc: '20 videos Premium y una recompensa extra de 4404.',
    dailyTasks: 20,
    isActive: true
  },
  {
    id: 'platino',
    name: 'VIP Platino',
    price: 420,
    reward: 15414,
    rewardType: 'Monedas',
    desc: 'Membresía empresarial VIP completa de 15414.',
    dailyTasks: 25,
    isActive: true
  }
];

export const DEFAULT_WITHDRAWAL_CONFIG: WithdrawalConfig = {
  type: 'dates',
  monthlyDates: [10, 20, 30], // Default every 10 days of the month
  intervalDays: 10,
  intervalStartDate: '2026-05-01',
  weeklyDays: [1, 4] // Mon & Thu
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

// Ejemplo de uso:
// const validation = checkWithdrawalPermission();
// if (!validation.allowed) {
//   return renderErrorMessage(validation.message);
// }
`;
}
