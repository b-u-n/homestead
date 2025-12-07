import { makeAutoObservable } from 'mobx';

const DEFAULT_DURATION = 5400; // 5.4 seconds

class ErrorStore {
  errors = [];

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Add an error to the store
   * @param {string} message - Error message to display
   * @param {object} options - Optional settings
   * @param {boolean} options.blocking - Requires user dismissal (default: false)
   * @param {number} options.duration - Auto-dismiss time in ms (0 = never, default: 5400)
   */
  addError(message, options = {}) {
    const {
      blocking = false,
      duration = blocking ? 0 : DEFAULT_DURATION
    } = options;

    const error = {
      id: Date.now() + Math.random(),
      message,
      blocking,
      duration,
      timestamp: Date.now()
    };

    this.errors.push(error);

    // Auto-dismiss after duration (only for non-blocking with duration > 0)
    if (!blocking && duration > 0) {
      setTimeout(() => {
        this.removeError(error.id);
      }, duration);
    }

    return error.id;
  }

  removeError(id) {
    this.errors = this.errors.filter(error => error.id !== id);
  }

  dismissAll() {
    this.errors = [];
  }

  dismissAllNonBlocking() {
    this.errors = this.errors.filter(error => error.blocking);
  }

  get hasErrors() {
    return this.errors.length > 0;
  }

  get hasBlockingError() {
    return this.errors.some(error => error.blocking);
  }

  get errorCount() {
    return this.errors.length;
  }

  get blockingErrors() {
    return this.errors.filter(error => error.blocking);
  }

  get nonBlockingErrors() {
    return this.errors.filter(error => !error.blocking);
  }

  get nonBlockingCount() {
    return this.nonBlockingErrors.length;
  }
}

export default new ErrorStore();
