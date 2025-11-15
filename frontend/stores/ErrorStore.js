import { makeAutoObservable } from 'mobx';

class ErrorStore {
  errors = [];

  constructor() {
    makeAutoObservable(this);
  }

  addError(message, duration = 5000) {
    const error = {
      id: Date.now() + Math.random(),
      message,
      timestamp: Date.now()
    };

    this.errors.push(error);

    // Auto-dismiss after duration
    setTimeout(() => {
      this.removeError(error.id);
    }, duration);

    return error.id;
  }

  removeError(id) {
    this.errors = this.errors.filter(error => error.id !== id);
  }

  dismissAll() {
    this.errors = [];
  }

  get hasErrors() {
    return this.errors.length > 0;
  }

  get errorCount() {
    return this.errors.length;
  }
}

export default new ErrorStore();