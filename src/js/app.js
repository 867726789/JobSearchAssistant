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
    
    // 暴露全局函数
    this.exposeGlobalFunctions();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.render();
    
    // 将应用实例暴露到全局
    window.app = this;
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

  exposeGlobalFunctions() {
    // 暴露删除模式相关函数
    window.toggleCompanySelection = (companyId) => {
      this.batch.toggleCompanySelection(companyId);
    };

    // 暴露公司操作函数
    window.editCompany = (companyId) => {
      const company = this.companies.find(c => c.id === companyId);
      if (company) {
        this.ui.openModal(company);
      }
    };

    window.deleteCompany = async (companyId) => {
      const confirmed = await this.ui.showConfirmDialog('确认删除', '确定要删除这条记录吗？此操作不可恢复！');
      if (confirmed) {
        this.companies = this.companyManager.deleteCompany(this.companies, companyId);
        await this.storage.saveCompanies(this.companies);
        this.render();
        
        Swal.fire({
          title: '删除成功',
          text: '已删除该记录',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    };
  }

  async handleFormSubmit() {
    try {
      const companyData = this.ui.getFormData();
      
      // 验证必填字段
      if (!companyData.name.trim()) {
        Swal.fire({
          title: '错误',
          text: '请输入公司名称',
          icon: 'error',
          timer: 2000,
          showConfirmButton: false
        });
        return;
      }

      if (companyData.id) {
        // 编辑现有公司
        this.companies = this.companyManager.updateCompany(this.companies, companyData);
      } else {
        // 添加新公司
        this.companies = this.companyManager.addCompany(this.companies, companyData);
      }
      
      await this.storage.saveCompanies(this.companies);
      this.render();
      this.ui.closeModal();
      
      Swal.fire({
        title: '保存成功',
        text: companyData.id ? '已更新公司记录' : '已添加新公司',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('保存失败:', error);
      Swal.fire({
        title: '保存失败',
        text: '请检查输入数据是否正确',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  filterCompanies(status) {
    const filtered = this.companyManager.filterCompanies(this.companies, status);
    this.ui.renderCompanyList(filtered, this.batch.isBatchMode, this.batch.selectedCompanies);
  }

  sortCompanies(order) {
    const sorted = this.companyManager.sortCompanies(this.companies, order);
    this.ui.renderCompanyList(sorted, this.batch.isBatchMode, this.batch.selectedCompanies);
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
    this.ui.renderCompanyList(this.companies, this.batch.isBatchMode, this.batch.selectedCompanies);
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