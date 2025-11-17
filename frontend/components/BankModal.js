import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ImageBackground } from 'react-native';
import Modal from './Modal';
import WebSocketService from '../services/websocket';
import SessionStore from '../stores/SessionStore';
import ErrorStore from '../stores/ErrorStore';
import profileStore from '../stores/ProfileStore';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

/**
 * BankModal Component
 * Allows users to deposit hearts to bank or withdraw from bank
 */
const BankModal = ({ visible, onClose }) => {
  const [hearts, setHearts] = useState(0);
  const [heartBank, setHeartBank] = useState(0);
  const [dailyWithdrawalsRemaining, setDailyWithdrawalsRemaining] = useState(0);
  const [amount, setAmount] = useState('1');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadBalance();
    }
  }, [visible]);

  const loadBalance = async () => {
    if (!WebSocketService.socket) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await WebSocketService.emit('hearts:getBalance', {
        sessionId: SessionStore.sessionId
      });

      if (result.success) {
        setHearts(result.data.hearts);
        setHeartBank(result.data.heartBank);
        setDailyWithdrawalsRemaining(result.data.dailyWithdrawalsRemaining);
      } else {
        ErrorStore.addError(result.error || 'Failed to load balance');
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      ErrorStore.addError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const depositAmount = parseInt(amount, 10);

    if (isNaN(depositAmount) || depositAmount < 1) {
      ErrorStore.addError('Please enter a valid amount');
      return;
    }

    if (depositAmount > hearts) {
      ErrorStore.addError(`Not enough hearts. You have ${hearts}`);
      return;
    }

    if (!WebSocketService.socket) {
      ErrorStore.addError('WebSocket not connected');
      return;
    }

    try {
      setIsDepositing(true);

      const result = await WebSocketService.emit('hearts:deposit', {
        sessionId: SessionStore.sessionId,
        amount: depositAmount
      });

      if (result.success) {
        setHearts(result.data.hearts);
        setHeartBank(result.data.heartBank);
        setAmount('1');

        // Update profile store
        profileStore.setHearts(result.data.hearts);

        alert(`Deposited ${depositAmount} hearts to bank`);
      } else {
        ErrorStore.addError(result.error || 'Failed to deposit');
      }
    } catch (error) {
      console.error('Error depositing:', error);
      ErrorStore.addError('Failed to deposit');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseInt(amount, 10);

    if (isNaN(withdrawAmount) || withdrawAmount < 1 || withdrawAmount > 9) {
      ErrorStore.addError('Amount must be between 1 and 9');
      return;
    }

    if (withdrawAmount > heartBank) {
      ErrorStore.addError(`Not enough hearts in bank. Bank has ${heartBank}`);
      return;
    }

    if (dailyWithdrawalsRemaining <= 0) {
      ErrorStore.addError('Daily withdrawal limit reached. Try again tomorrow.');
      return;
    }

    if (!WebSocketService.socket) {
      ErrorStore.addError('WebSocket not connected');
      return;
    }

    try {
      setIsWithdrawing(true);

      const result = await WebSocketService.emit('hearts:withdraw', {
        sessionId: SessionStore.sessionId,
        amount: withdrawAmount
      });

      if (result.success) {
        setHearts(result.data.hearts);
        setHeartBank(result.data.heartBank);
        setDailyWithdrawalsRemaining(result.data.dailyWithdrawalsRemaining);
        setAmount('1');

        // Update profile store
        profileStore.setHearts(result.data.hearts);

        alert(`Withdrew ${withdrawAmount} hearts from bank`);
      } else {
        ErrorStore.addError(result.error || 'Failed to withdraw');
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      ErrorStore.addError('Failed to withdraw');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="HEART BANK">
      <View style={styles.container}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            {/* Balance Display */}
            <View style={styles.balanceSection}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Active Hearts</Text>
                <Text style={styles.balanceValue}>❤️ {hearts}/9</Text>
              </View>

              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Bank</Text>
                <Text style={styles.balanceValue}>💰 {heartBank}</Text>
              </View>
            </View>

            {/* Withdrawal Limit Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Daily Withdrawals Remaining: <Text style={styles.infoBold}>{dailyWithdrawalsRemaining}</Text>
              </Text>
              <Text style={styles.infoSubtext}>
                You can withdraw up to 9 hearts once per day
              </Text>
            </View>

            {/* Amount Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>AMOUNT</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    ...styles.input,
                    fontFamily: 'Comfortaa',
                    border: '2px solid rgba(92, 90, 88, 0.3)',
                    outline: 'none',
                  }}
                />
              ) : (
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <Pressable
                onPress={handleDeposit}
                disabled={isDepositing || hearts === 0}
                style={[styles.buttonPressable, isDepositing && styles.buttonDisabled]}
              >
                <ImageBackground
                  source={slotBgImage}
                  style={styles.button}
                  imageStyle={styles.buttonImage}
                >
                  <View style={styles.buttonOverlay}>
                    <Text style={styles.buttonText}>
                      {isDepositing ? 'DEPOSITING...' : 'DEPOSIT TO BANK'}
                    </Text>
                  </View>
                </ImageBackground>
              </Pressable>

              <Pressable
                onPress={handleWithdraw}
                disabled={isWithdrawing || heartBank === 0 || dailyWithdrawalsRemaining === 0}
                style={[styles.buttonPressable, isWithdrawing && styles.buttonDisabled]}
              >
                <ImageBackground
                  source={slotBgImage}
                  style={styles.button}
                  imageStyle={styles.buttonImage}
                >
                  <View style={styles.buttonOverlay}>
                    <Text style={styles.buttonText}>
                      {isWithdrawing ? 'WITHDRAWING...' : 'WITHDRAW FROM BANK'}
                    </Text>
                  </View>
                </ImageBackground>
              </Pressable>
            </View>

            {/* Help Text */}
            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                💡 <Text style={styles.helpBold}>Tip:</Text> Deposit excess hearts to keep them safe! Active hearts are capped at 9.
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
    alignItems: 'stretch',
  },
  balanceSection: {
    flexDirection: 'row',
    gap: 15,
  },
  balanceCard: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(112, 68, 199, 0.3)',
    backgroundColor: 'rgba(112, 68, 199, 0.05)',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 24,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(179, 230, 255, 0.5)',
    backgroundColor: 'rgba(179, 230, 255, 0.1)',
    gap: 5,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
  },
  infoBold: {
    fontWeight: '700',
    color: '#7044C7',
  },
  infoSubtext: {
    fontSize: 11,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    fontStyle: 'italic',
  },
  inputSection: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    textAlign: 'center',
  },
  buttonsContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 15,
  },
  buttonPressable: {
    flex: 1,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    justifyContent: 'center',
  },
  buttonImage: {
    borderRadius: 6,
  },
  buttonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(222, 134, 223, 0.25)',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textAlign: 'center',
  },
  helpSection: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(222, 134, 223, 0.1)',
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    lineHeight: 18,
  },
  helpBold: {
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default BankModal;
