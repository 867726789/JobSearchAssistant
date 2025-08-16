export class CompanyManager {
  generateId() {
    return Date.now().toString() + Math.floor(Math.random() * 1000);
  }

  createCompany(data) {
    return {
      id: this.generateId(),
      name: data.name,
      status: data.status,
      interviewStartTime: data.interviewStartTime,
      interviewEndTime: data.interviewEndTime,
      interviewLink: data.interviewLink,
      summary: data.summary,
      summaryLinks: data.summaryLinks || [],
      createdAt: new Date().toISOString()
    };
  }

  updateCompany(companies, updatedCompany) {
    const index = companies.findIndex(c => c.id === updatedCompany.id);
    if (index !== -1) {
      companies[index] = {
        ...updatedCompany,
        createdAt: companies[index].createdAt
      };
    }
    return companies;
  }

  addCompany(companies, companyData) {
    const newCompany = this.createCompany(companyData);
    companies.push(newCompany);
    return companies;
  }

  deleteCompany(companies, id) {
    return companies.filter(c => c.id !== id);
  }

  filterCompanies(companies, status) {
    if (status === 'all') return companies;
    return companies.filter(c => c.status === status);
  }

  sortCompanies(companies, order) {
    const sorted = [...companies];
    
    sorted.sort((a, b) => {
      if (!a.interviewStartTime) return 1;
      if (!b.interviewStartTime) return -1;
      
      const dateA = new Date(a.interviewStartTime);
      const dateB = new Date(b.interviewStartTime);
      
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    return sorted;
  }

  getCompanyById(companies, id) {
    return companies.find(c => c.id === id);
  }
}