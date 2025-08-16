export class BatchManager {
  constructor() {
    this.isBatchMode = false;
    this.selectedCompanies = new Set();
  }

  enterBatchMode() {
    this.isBatchMode = true;
    this.selectedCompanies.clear();
    
    document.getElementById('enterBatchModeBtn').classList.add('hidden');
    document.getElementById('exitBatchModeBtn').classList.remove('hidden');
    document.getElementById('batchDeleteBtn').classList.remove('hidden');
    
    window.app.render();
    this.updateBatchDeleteButton();
  }

  exitBatchMode() {
    this.isBatchMode = false;
    this.selectedCompanies.clear();
    
    document.getElementById('enterBatchModeBtn').classList.remove('hidden');
    document.getElementById('exitBatchModeBtn').classList.add('hidden');
    document.getElementById('batchDeleteBtn').classList.add('hidden');
    
    window.app.render();
  }

  toggleCompanySelection(companyId) {
    if (this.selectedCompanies.has(companyId)) {
      this.selectedCompanies.delete(companyId);
    } else {
      this.selectedCompanies.add(companyId);
    }
    this.updateBatchDeleteButton();
    window.app.render();
  }

  updateBatchDeleteButton() {
    const count = this.selectedCompanies.size;
    const btn = document.getElementById('batchDeleteBtn');
    
    if (count > 0) {
      btn.textContent = `删除选中 (${count})`;
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      btn.textContent = '批量删除';
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  async performBatchDelete() {
    const count = this.selectedCompanies.size;
    if (count === 0) return;

    const confirmed = await Swal.fire({
      title: '确认批量删除',
      text: `确定要删除选中的 ${count} 条记录吗？此操作不可恢复！`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    });

    if (confirmed.isConfirmed) {
      window.app.companies = window.app.companies.filter(c => !this.selectedCompanies.has(c.id));
      await window.app.storage.saveCompanies(window.app.companies);
      
      this.exitBatchMode();
      window.app.render();
      
      Swal.fire({
        title: '删除成功',
        text: `已删除 ${count} 条记录`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  }

  getSelectedCount() {
    return this.selectedCompanies.size;
  }

  getSelectedIds() {
    return Array.from(this.selectedCompanies);
  }
}