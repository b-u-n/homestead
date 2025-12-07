import { makeAutoObservable, reaction } from 'mobx';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * FormStore - Manages form state with automatic persistence
 * Saves and rehydrates form data across app sessions
 *
 * Form keys can be:
 * - Static: 'bankDrop', 'avatarGeneration'
 * - Scoped by flow: 'weepingWillow:newPost', 'wishingWell:newPost'
 * - Scoped by post ID: 'response:${postId}'
 */
class FormStore {
  // Form data keyed by form name
  // Static forms with known defaults
  forms = {
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

  // Dynamic forms (responses, new posts) stored separately
  // Key format: 'response:${postId}' or '${flowName}:newPost'
  dynamicForms = {};

  constructor() {
    makeAutoObservable(this);

    // Rehydrate from storage on init
    this.rehydrate();

    // Setup auto-save reactions for each form
    this.setupAutoSave();
  }

  /**
   * Check if a form key is dynamic (response or newPost)
   */
  isDynamicForm(formName) {
    return formName.startsWith('response:') || formName.endsWith(':newPost');
  }

  /**
   * Set field value for a specific form
   */
  setField(formName, fieldName, value) {
    if (this.isDynamicForm(formName)) {
      // Dynamic form - create if doesn't exist
      if (!this.dynamicForms[formName]) {
        this.dynamicForms[formName] = {};
      }
      this.dynamicForms[formName][fieldName] = value;
      this.persistDynamic();
    } else if (this.forms[formName]) {
      this.forms[formName][fieldName] = value;
    }
  }

  /**
   * Get field value for a specific form
   */
  getField(formName, fieldName) {
    if (this.isDynamicForm(formName)) {
      return this.dynamicForms[formName]?.[fieldName];
    }
    return this.forms[formName]?.[fieldName];
  }

  /**
   * Reset a specific form to defaults
   */
  resetForm(formName) {
    if (this.isDynamicForm(formName)) {
      // Delete the dynamic form entry entirely
      delete this.dynamicForms[formName];
      this.persistDynamic();
      return;
    }

    const defaults = {
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
   * Persist static form data to storage
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

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, data);
      } else if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(key, data);
      }
    } catch (error) {
      console.error(`Error persisting form ${formName}:`, error);
    }
  }

  /**
   * Persist all dynamic forms to storage
   */
  async persistDynamic() {
    try {
      const data = JSON.stringify(this.dynamicForms);
      const key = '@homestead:dynamicForms';

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, data);
      } else if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(key, data);
      }
    } catch (error) {
      console.error('Error persisting dynamic forms:', error);
    }
  }

  /**
   * Rehydrate all forms from storage
   */
  async rehydrate() {
    // Rehydrate static forms
    const formNames = Object.keys(this.forms);

    for (const formName of formNames) {
      try {
        const key = `@homestead:form:${formName}`;
        let data;

        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          data = localStorage.getItem(key);
        } else if (Platform.OS !== 'web') {
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

    // Rehydrate dynamic forms
    try {
      const key = '@homestead:dynamicForms';
      let data;

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        data = localStorage.getItem(key);
      } else if (Platform.OS !== 'web') {
        data = await AsyncStorage.getItem(key);
      }

      if (data) {
        this.dynamicForms = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error rehydrating dynamic forms:', error);
    }
  }

  /**
   * Setup auto-save reactions for each form
   * Automatically persists when form data changes
   */
  setupAutoSave() {
    // Static forms
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

    // Dynamic forms - watch the whole object
    reaction(
      () => JSON.stringify(this.dynamicForms),
      () => {
        this.persistDynamic();
      },
      { delay: 500 } // Debounce by 500ms
    );
  }
}

export default new FormStore();
