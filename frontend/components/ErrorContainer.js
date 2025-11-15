import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import ErrorStore from '../stores/ErrorStore';
import ErrorNotification from './ErrorNotification';

const ErrorContainer = observer(() => {
  if (!ErrorStore.hasErrors) {
    return null;
  }

  return (
    <View style={styles.container}>
      {ErrorStore.errors.map((error, index) => (
        <ErrorNotification
          key={error.id}
          error={error}
          index={index}
          onDismiss={() => ErrorStore.removeError(error.id)}
        />
      ))}
      
      {ErrorStore.errorCount > 3 && (
        <TouchableOpacity 
          style={styles.dismissAllButton}
          onPress={() => ErrorStore.dismissAll()}
        >
          <Text style={styles.dismissAllText}>Dismiss All ({ErrorStore.errorCount})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
    zIndex: 999,
  },
  dismissAllButton: {
    position: 'absolute',
    bottom: 280,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1001,
  },
  dismissAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ErrorContainer;