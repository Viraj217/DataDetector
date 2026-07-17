import { queries } from '../database/queries';
import { dateUtils } from '../utils/dateUtils';
import { notificationService } from './notificationService';

export interface BudgetStatus {
  capBytes: number;
  consumedBytes: number;
  consumedPercent: number;
  cycleStart: string;
  cycleEnd: string;
  daysRemaining: number;
  projectedBytes: number;
  projectedCapDate: string | null; // e.g., "Hit on 24th Jul" or null
  burnRateVal: number; // average bytes/day
}

export const budgetService = {
  // Get current cycle dates based on billing cycle start day (1-31)
  getBillingCycleRange: (cycleStartDay: number, today: Date = new Date()): { start: Date; end: Date } => {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    
    // Set start date to the cycle start day of this month
    start.setDate(cycleStartDay);
    
    if (start > today) {
      // If the cycle day hasn't occurred yet in this month, the cycle started last month
      start.setMonth(start.getMonth() - 1);
    }
    
    // End date is one day before the cycle start day in the next month
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(cycleStartDay - 1);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  },

  getBudgetStatus: (): BudgetStatus => {
    // 1. Fetch budget config
    const capSetting = queries.getSetting('monthly_cap_bytes');
    const capBytes = capSetting ? parseInt(capSetting, 10) : 0;
    
    const cycleDaySetting = queries.getSetting('billing_cycle_start_day');
    const cycleStartDay = cycleDaySetting ? parseInt(cycleDaySetting, 10) : 1;

    // 2. Fetch current date range
    const today = new Date();
    const { start, end } = budgetService.getBillingCycleRange(cycleStartDay, today);
    const startStr = dateUtils.getLocalDateString(start);
    const endStr = dateUtils.getLocalDateString(end);

    // 3. Query DB for total bytes in this range
    const consumedBytes = queries.getMonthlyTotal(startStr, endStr);
    const consumedPercent = capBytes > 0 ? (consumedBytes / capBytes) * 100 : 0;

    // 4. Compute days elapsed vs remaining
    const oneDayMs = 24 * 60 * 60 * 1000;
    const elapsedDays = Math.max(1, Math.round((today.getTime() - start.getTime()) / oneDayMs));
    const totalDaysInCycle = Math.round((end.getTime() - start.getTime()) / oneDayMs);
    const daysRemaining = Math.max(0, totalDaysInCycle - elapsedDays);

    // 5. Burn-rate calculations
    const burnRateVal = consumedBytes / elapsedDays; // bytes per day
    const projectedBytes = consumedBytes + burnRateVal * daysRemaining;
    
    let projectedCapDate: string | null = null;
    if (capBytes > 0 && projectedBytes > capBytes) {
      // Calculate when we will hit the cap
      const remainingBytes = capBytes - consumedBytes;
      if (remainingBytes > 0 && burnRateVal > 0) {
        const daysToHit = remainingBytes / burnRateVal;
        const hitDate = new Date(today);
        hitDate.setDate(today.getDate() + Math.ceil(daysToHit));
        projectedCapDate = hitDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      } else {
        projectedCapDate = 'Already exceeded';
      }
    }

    return {
      capBytes,
      consumedBytes,
      consumedPercent,
      cycleStart: startStr,
      cycleEnd: endStr,
      daysRemaining,
      projectedBytes,
      projectedCapDate,
      burnRateVal,
    };
  },

  // Check alerts and trigger notifications if thresholds are crossed
  checkAlertThresholds: (): void => {
    const status = budgetService.getBudgetStatus();
    if (status.capBytes === 0) return;

    const cycleKey = `${status.cycleStart}_${status.cycleEnd}`;
    
    // Fetch last alerted cycle + threshold status from settings
    const lastAlertedCycle = queries.getSetting('last_alerted_cycle');
    const isNewCycle = lastAlertedCycle !== cycleKey;

    let alert80Sent = false;
    let alert100Sent = false;

    if (!isNewCycle) {
      alert80Sent = queries.getSetting('alert_80_sent') === 'true';
      alert100Sent = queries.getSetting('alert_100_sent') === 'true';
    } else {
      // Reset flags for the new billing cycle
      queries.setSetting('last_alerted_cycle', cycleKey);
      queries.setSetting('alert_80_sent', 'false');
      queries.setSetting('alert_100_sent', 'false');
    }

    const gbCap = (status.capBytes / (1024 * 1024 * 1024)).toFixed(1);

    // Check 100% threshold
    if (status.consumedPercent >= 100 && !alert100Sent) {
      queries.setSetting('alert_100_sent', 'true');
      notificationService.showNotification(
        '⚠️ Data Limit Exceeded',
        `You have consumed 100% of your ${gbCap} GB monthly budget!`
      );
    }
    // Check 80% threshold
    else if (status.consumedPercent >= 80 && !alert80Sent) {
      queries.setSetting('alert_80_sent', 'true');
      notificationService.showNotification(
        '⚠️ High Data Warning',
        `You have used 80% of your ${gbCap} GB monthly data budget.`
      );
    }
  },
};
