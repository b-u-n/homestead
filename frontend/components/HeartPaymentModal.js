import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal as RNModal } from 'react-native';
import { observer } from 'mobx-react-lite';
import profileStore from '../stores/ProfileStore';
import Heart from './Heart';

/**
 * HeartPaymentModal
 * Modal for selecting heart payment amount and source (active/bank)
 */
const HeartPaymentModal = observer(({ visible, onClose, onComplete, paymentInfo }) => {
  const [amount, setAmount] = useState(1);
  const [source, setSource] = useState('active'); // 'active' or 'bank'

  const activeHearts = profileStore.hearts || 0;
  const bankHearts = profileStore.heartBank || 0;

  const availableHearts = source === 'active' ? activeHearts : bankHearts;
  const maxAmount = Math.min(9, availableHearts);

  const handleConfirm = () => {
    if (amount < 1 || amount > maxAmount) {
      alert(`Please select an amount between 1 and ${maxAmount}`);
      return;
    }

    onComplete({ amount, source });
  };

  if (!visible) return null;

  return (
    <RNModal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Send Hearts</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Payment Info */}
          {paymentInfo && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                To: <Text style={styles.infoBold}>{paymentInfo.recipient}</Text>
              </Text>
              {paymentInfo.purpose && (
                <Text style={styles.infoText}>{paymentInfo.purpose}</Text>
              )}
            </View>
          )}

          {/* Source Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>SOURCE</Text>
            <View style={styles.sourceButtons}>
              <Pressable
                style={[styles.sourceButton, source === 'active' && styles.sourceButtonActive]}
                onPress={() => setSource('active')}
              >
                <Text style={[styles.sourceButtonText, source === 'active' && styles.sourceButtonTextActive]}>
                  Active Hearts
                </Text>
                <View style={styles.sourceBalanceRow}>
                  <Heart size={14} />
                  <Text style={styles.sourceBalance}>{activeHearts}/9</Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.sourceButton, source === 'bank' && styles.sourceButtonActive]}
                onPress={() => setSource('bank')}
              >
                <Text style={[styles.sourceButtonText, source === 'bank' && styles.sourceButtonTextActive]}>
                  Bank
                </Text>
                <Text style={styles.sourceBalance}>💰 {bankHearts}</Text>
              </Pressable>
            </View>
          </View>

          {/* Amount Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>AMOUNT</Text>
            <View style={styles.heartSelector}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((heartNum) => {
                const isSelected = heartNum <= amount;
                const isAvailable = heartNum <= availableHearts;

                let heartStyle = {};
                if (!isAvailable) {
                  heartStyle = { opacity: 0.2 };
                } else if (isSelected) {
                  heartStyle = { opacity: 1 };
                } else {
                  heartStyle = { opacity: 0.4 };
                }

                return (
                  <Pressable
                    key={heartNum}
                    onPress={() => {
                      if (heartNum <= availableHearts) {
                        setAmount(heartNum);
                      }
                    }}
                    disabled={heartNum > availableHearts}
                    style={[styles.heartIcon, heartStyle]}
                  >
                    <Heart size={28} />
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.amountTextRow}>
              <Text style={styles.amountText}>Sending {amount}</Text>
              <Heart size={14} />
              <Text style={styles.amountText}>from {source === 'active' ? 'Active Hearts' : 'Bank'}</Text>
            </View>
          </View>

          {/* Confirm Button */}
          <Pressable
            style={[styles.confirmButton, (amount < 1 || amount > maxAmount) && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={amount < 1 || amount > maxAmount}
          >
            <View style={styles.confirmButtonContent}>
              <Text style={styles.confirmButtonText}>SEND {amount}</Text>
              <Heart size={16} />
            </View>
          </Pressable>

          {/* Cancel Button */}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </Pressable>
        </View>
      </View>
    </RNModal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 240, 245, 0.98)',
    borderRadius: 12,
    padding: 20,
    gap: 20,
    borderWidth: 3,
    borderColor: '#7044C7',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'ChubbyTrail',
    color: '#403F3E',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#5C5A58',
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
  section: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  sourceButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  sourceButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    gap: 5,
  },
  sourceButtonActive: {
    borderColor: '#7044C7',
    backgroundColor: 'rgba(112, 68, 199, 0.1)',
  },
  sourceButtonText: {
    fontSize: 12,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
  },
  sourceButtonTextActive: {
    color: '#7044C7',
    fontWeight: '700',
  },
  sourceBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceBalance: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
  },
  heartSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(112, 68, 199, 0.2)',
    backgroundColor: 'rgba(112, 68, 199, 0.05)',
    justifyContent: 'center',
  },
  heartIcon: {
    padding: 4,
  },
  amountTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 13,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#403F3E',
    textAlign: 'center',
  },
  confirmButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E63946',
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#E63946',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
  },
});

export default HeartPaymentModal;
