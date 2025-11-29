const Account = require('../models/Account');

/**
 * Hearts Management Flow
 * Handles heart deposits, withdrawals, and balance checks
 */
module.exports = {
  name: 'hearts',

  handlers: {
    /**
     * Deposit hearts from active to bank
     */
    'hearts:deposit': {
      validate: (data) => {
        const { sessionId, amount } = data;

        if (!sessionId) {
          return { valid: false, error: 'Missing sessionId' };
        }

        if (typeof amount !== 'number' || amount < 1) {
          return { valid: false, error: 'Amount must be at least 1' };
        }

        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, amount } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });

        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Check if user has enough hearts
        if (account.hearts < amount) {
          return {
            success: false,
            error: `Not enough hearts. You have ${account.hearts}, trying to deposit ${amount}`
          };
        }

        // Move hearts from active to bank
        account.hearts -= amount;
        account.heartBank += amount;
        await account.save();

        return {
          success: true,
          message: `Deposited ${amount} hearts to bank`,
          data: {
            hearts: account.hearts,
            heartBank: account.heartBank
          }
        };
      }
    },

    /**
     * Withdraw hearts from bank to active
     * Limit: 9 hearts per day
     */
    'hearts:withdraw': {
      validate: (data) => {
        const { sessionId, amount } = data;

        if (!sessionId) {
          return { valid: false, error: 'Missing sessionId' };
        }

        if (typeof amount !== 'number' || amount < 1 || amount > 9) {
          return { valid: false, error: 'Amount must be between 1 and 9' };
        }

        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId, amount } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });

        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Check if user has exceeded daily withdrawal limit
        const now = new Date();
        const lastWithdrawal = account.lastBankWithdrawal;

        // Reset daily limit if it's a new day
        if (!lastWithdrawal || !isSameDay(lastWithdrawal, now)) {
          account.dailyWithdrawalsRemaining = 1;
          account.lastBankWithdrawal = now;
        }

        // Check if withdrawals remaining
        if (account.dailyWithdrawalsRemaining <= 0) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          return {
            success: false,
            error: 'Daily withdrawal limit reached. Try again tomorrow.',
            data: {
              nextWithdrawal: tomorrow
            }
          };
        }

        // Check if user has enough hearts in bank
        if (account.heartBank < amount) {
          return {
            success: false,
            error: `Not enough hearts in bank. Bank has ${account.heartBank}, trying to withdraw ${amount}`
          };
        }

        // Check if withdrawal would exceed max active hearts
        if (account.hearts + amount > 9) {
          const maxWithdraw = 9 - account.hearts;
          return {
            success: false,
            error: `Can only withdraw ${maxWithdraw} hearts (active hearts are capped at 9)`
          };
        }

        // Move hearts from bank to active
        account.heartBank -= amount;
        account.hearts += amount;
        account.dailyWithdrawalsRemaining -= 1;
        await account.save();

        return {
          success: true,
          message: `Withdrew ${amount} hearts from bank`,
          data: {
            hearts: account.hearts,
            heartBank: account.heartBank,
            dailyWithdrawalsRemaining: account.dailyWithdrawalsRemaining
          }
        };
      }
    },

    /**
     * Get current heart balance
     */
    'hearts:getBalance': {
      validate: (data) => {
        const { sessionId } = data;

        if (!sessionId) {
          return { valid: false, error: 'Missing sessionId' };
        }

        return { valid: true };
      },

      handler: async (data, context) => {
        const { sessionId } = data;

        const account = await Account.findOne({ 'activeSessions.sessionId': sessionId });

        if (!account) {
          return { success: false, error: 'Account not found' };
        }

        // Reset daily limit if it's a new day
        const now = new Date();
        const lastWithdrawal = account.lastBankWithdrawal;

        let dailyWithdrawalsRemaining = account.dailyWithdrawalsRemaining;
        if (!lastWithdrawal || !isSameDay(lastWithdrawal, now)) {
          dailyWithdrawalsRemaining = 1;
        }

        return {
          success: true,
          data: {
            hearts: account.hearts,
            heartBank: account.heartBank,
            dailyWithdrawalsRemaining
          }
        };
      }
    }
  }
};

/**
 * Helper function to check if two dates are on the same day
 */
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}
