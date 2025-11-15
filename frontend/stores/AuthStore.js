import { makeAutoObservable } from 'mobx';

class AuthStore {
  user = null;
  token = null;
  isAuthenticated = false;
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  setUser(user, token) {
    this.user = user;
    this.token = token;
    this.isAuthenticated = true;
  }

  logout() {
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
  }

  setLoading(loading) {
    this.isLoading = loading;
  }
}

export default new AuthStore();