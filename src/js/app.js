import { StorageManager } from './modules/storage.js';
import { UIManager } from './modules/ui.js';
import { CompanyManager } from './modules/company.js';
import { ChartManager } from './modules/chart.js';
import { ExcelManager } from './modules/excel.js';
import { BatchManager } from './modules/batch.js';
import { STATUS_TEXT_MAP, STATUS_COLOR_MAP } from './utils/constants.js';
import { formatDateTime, formatTimeOnly } from './utils/helpers.js';

class JobSearchApp {
  constructor() {
    this.storage = new StorageManager();
    this.ui = new UIManager();
    this.companyManager = new CompanyManager();
    this.chart = new ChartManager();
    this.excel = new ExcelManager();
    this.batch = new BatchManager();
    
    this.companies = [];
    this.statusChart = null;
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.render();
  }

  async loadData() {
    this.companies = await this.storage.loadCompanies();
  }

  setupEventListeners() {
    // 添加公司
    document.getElementById('addCompanyBtn').addEventListener('click', () => {
      this.ui.openModal();
    });

    // 表单提交
    document.getElementById('companyForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // 状态筛选
    document.querySelectorAll('.status-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.status-filter').forEach(b => b.classList.remove('ring-2', 'ring-primary/50'));
        e.target.classList.add('ring-2', 'ring-primary/50');
        this.filterCompanies(e.target.dataset.status);
      });
    });

    // 排序
    document.getElementById('sortByDateAsc').addEventListener('click', () => this.sortCompanies('asc'));
    document.getElementById('sortByDateDesc').addEventListener('click', () => this.sortCompanies('desc'));

    // 批量删除
    document.getElementById('enterBatchModeBtn').addEventListener('click', () => this.batch.enterBatchMode());
    document.getElementById('exitBatchModeBtn').addEventListener('click', () => this.batch.exitBatchMode());
    document.getElementById('batchDeleteBtn').addEventListener('click', () => this.batch.performBatchDelete());

    // 清空所有
    document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllCompanies());

    // Excel导入导出
    document.getElementById('importExcelBtn').addEventListener('click', () => {
      document.getElementById('excelFileInput').click();
    });
    document.getElementById('exportExcelBtn').addEventListener('click', () => this.excel.exportToExcel(this.companies));
    document.getElementById('excelFileInput').addEventListener('change', (e) => this.excel.handleImport(e, this.companies));

    // 模态框控制
    document.getElementById('closeModalBtn').addEventListener('click', () => this.ui.closeModal());
    document.getElementById('cancelBtn').addEventListener('click', () => this.ui.closeModal());
    document.getElementById('companyModal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('companyModal')) {
        this.ui.closeModal();
      }
    });
  }

  async handleFormSubmit() {
    const companyData = this.ui.getFormData();
    if (companyData.id) {
      await this.companyManager.updateCompany(companyData);
    } else {
      await this.companyManager.addCompany(companyData);
    }
    
    await this.storage.saveCompanies(this.companies);
    this.render();
    this.ui.closeModal();
  }

  filterCompanies(status) {
    const filtered = this.companyManager.filterCompanies(this.companies, status);
    this.ui.renderCompanyList(filtered);
  }

  sortCompanies(order) {
    const sorted = this.companyManager.sortCompanies(this.companies, order);
    this.ui.renderCompanyList(sorted);
  }

  async clearAllCompanies() {
    const confirmed = await this.ui.showConfirmDialog('确认清空', '确定要清空所有记录吗？此操作不可恢复！');
    if (confirmed) {
      this.companies = [];
      await this.storage.saveCompanies(this.companies);
      this.render();
    }
  }

  render() {
    this.ui.updateTotalCount(this.companies.length);
    this.ui.renderCompanyList(this.companies);
    this.chart.updateStatusChart(this.companies);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new JobSearchApp();
  app.init();
});

// 全局函数供HTML调用
window.setQuickDuration = (minutes) => {
  const startTime = document.getElementById('interviewStartTime').value;
  if (!startTime) {
    Swal.fire({
      title: '提示',
      text: '请先选择开始时间',
      icon: 'info',
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + minutes * 60000);
  
  const year = end.getFullYear();
  const month = String(end.getMonth() + 1).padStart(2, '0');
  const day = String(end.getDate()).padStart(2, '0');
  const hours = String(end.getHours()).padStart(2, '0');
  const minutesStr = String(end.getMinutes()).padStart(2, '0');
  
  document.getElementById('interviewEndTime').value = `${year}-${month}-${day}T${hours}:${minutesStr}`;
};

window.addSummaryLink = (name = '', url = '') => {
  const container = document.getElementById('summaryLinksContainer');
  const linkDiv = document.createElement('div');
  linkDiv.className = 'flex gap-2 items-center p-2 bg-gray-50 rounded-lg';
  linkDiv.innerHTML = `
    <input type="text" placeholder="链接名称" value="${name}" class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary">
    <input type="url" placeholder="https://" value="${url}" class="flex-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary">
    <button type="button" onclick="this.parentElement.remove()" class="px-2 py-1 text-red-600 hover:bg-red-100 rounded-md transition-all">
      <i class="fa fa-times"></i>
    </button>
  `;
  container.appendChild(linkDiv);
};