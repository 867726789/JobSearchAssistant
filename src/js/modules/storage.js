export class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'autumnRecruitmentCompanies';
  }

  async loadCompanies() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load companies:', error);
      return [];
    }
  }

  async saveCompanies(companies) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(companies));
      return true;
    } catch (error) {
      console.error('Failed to save companies:', error);
      return false;
    }
  }

  async clearCompanies() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear companies:', error);
      return false;
    }
  }
}