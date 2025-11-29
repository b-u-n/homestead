import { makeAutoObservable, reaction } from 'mobx';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * FormStore - Manages form state with automatic persistence
 * Saves and rehydrates form data across app sessions
 */
class FormStore {
  // Form data keyed by form name
  forms = {
    createPost: {
      content: '',
      hearts: 1,
    },
    respondToPost: {
      content: '',
    },
    bankDrop: {
      amount: '1',
    },
    avatarGeneration: {
      selectedColor: '#B3E6FF',
      selectedColorName: 'sky',
      selectedAvatar: null,
      avatarOptions: [],
    },
  };

  constructor() {
    makeAutoObservable(this);

    // Rehydrate from storage on init
    this.rehydrate();

    // Setup auto-save reactions for each form
    this.setupAutoSave();
  }

  /**
   * Set field value for a specific form
   */
  setField(formName, fieldName, value) {
    if (this.forms[formName]) {
      this.forms[formName][fieldName] = value;
    }
  }

  /**
   * Get field value for a specific form
   */
  getField(formName, fieldName) {
    return this.forms[formName]?.[fieldName];
  }

  /**
   * Reset a specific form to defaults
   */
  resetForm(formName) {
    const defaults = {
      createPost: { content: '', hearts: 1 },
      respondToPost: { content: '' },
      bankDrop: { amount: '1' },
      avatarGeneration: {
        selectedColor: '#B3E6FF',
        selectedColorName: 'sky',
        selectedAvatar: null,
        avatarOptions: [],
      },
    };

    if (defaults[formName]) {
      this.forms[formName] = { ...defaults[formName] };
      this.persist(formName);
    }
  }

  /**
   * Persist form data to storage
   */
  async persist(formName) {
    try {
      let dataToSave = this.forms[formName];

      // Don't persist avatarOptions - they contain temporary OpenAI URLs that expire
      if (formName === 'avatarGeneration') {
        const { avatarOptions, selectedAvatar, ...rest } = dataToSave;
        dataToSave = rest;
      }

      const data = JSON.stringify(dataToSave);
      const key = `@homestead:form:${formName}`;

      if (Platform.OS === 'web') {
        localStorage.setItem(key, data);
      } else {
        await AsyncStorage.setItem(key, data);
      }
    } catch (error) {
      console.error(`Error persisting form ${formName}:`, error);
    }
  }

  /**
   * Rehydrate all forms from storage
   */
  async rehydrate() {
    const formNames = Object.keys(this.forms);

    for (const formName of formNames) {
      try {
        const key = `@homestead:form:${formName}`;
        let data;

        if (Platform.OS === 'web') {
          data = localStorage.getItem(key);
        } else {
          data = await AsyncStorage.getItem(key);
        }

        if (data) {
          const parsed = JSON.parse(data);

          // Never restore avatarOptions or selectedAvatar - URLs expire
          if (formName === 'avatarGeneration') {
            delete parsed.avatarOptions;
            delete parsed.selectedAvatar;
          }

          this.forms[formName] = { ...this.forms[formName], ...parsed };
        }
      } catch (error) {
        console.error(`Error rehydrating form ${formName}:`, error);
      }
    }
  }

  /**
   * Setup auto-save reactions for each form
   * Automatically persists when form data changes
   */
  setupAutoSave() {
    const formNames = Object.keys(this.forms);

    formNames.forEach((formName) => {
      reaction(
        () => JSON.stringify(this.forms[formName]),
        () => {
          this.persist(formName);
        },
        { delay: 500 } // Debounce by 500ms
      );
    });
  }
}

export default new FormStore();
