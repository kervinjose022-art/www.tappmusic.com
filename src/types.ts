/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VIPUnitType {
  value: 'Monedas' | 'USD';
}

export interface VIPTier {
  id: string;
  name: string;
  price: number; // in USD
  reward: number; // total reward amount
  rewardType: 'Monedas' | 'USD';
  desc: string;
  dailyTasks: number; // e.g. 20 videos
  rewardPerTask?: number; // reward divided by dailyTasks or specified
  isActive: boolean;
}

export interface WithdrawalConfig {
  type: 'dates' | 'interval' | 'weekly';
  // If 'dates': days of the month when allowed, e.g. [10, 20, 30]
  monthlyDates: number[];
  // If 'interval': interval of days, e.g. every 10 days
  intervalDays: number;
  intervalStartDate: string; // YYYY-MM-DD
  // If 'weekly': indices of active days, e.g. [1] for Monday, etc.
  weeklyDays: number[]; 
  feePercentage?: number; // Optional, defaults to 5% if not present
}

export interface AppState {
  viptiers: VIPTier[];
  withdrawalConfig: WithdrawalConfig;
  conversionRate: number; // coins per 1 USD (defaults to 36.7)
}
