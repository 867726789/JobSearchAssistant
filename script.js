// script.js - 秋招求职助手主逻辑文件（含批量删除功能）

// 状态文本映射
const statusTextMap = {
  'applied': '已投递',
  'interview1': '一面',
  'interview2': '二面',
  'interview3': '三面',
  'interview4': '四面',
  'hr': 'HR面',
  'rejected': '已挂'
};

// 状态颜色映射
const statusColorMap = {
  'applied': 'bg-status-applied',
  'interview1': 'bg-status-interview1',
  'interview2': 'bg-status-interview2',
  'interview3': 'bg-status-interview3',
  'interview4': 'bg-status-interview4',
  'hr': 'bg-status-hr',
  'rejected': 'bg-status-rejected'
};

// 初始化数据 - 从本地存储读取或使用空数组
let companies = JSON.parse(localStorage.getItem('autumnRecruitmentCompanies')) || [];
let currentFilter = 'all';
let sortOrder = 'asc'; // 'asc' 或 'desc'
let isBatchMode = false;
let selectedCompanies = new Set();

// DOM 元素
const companyListEl = document.getElementById('companyList');
const addCompanyBtn = document.getElementById('addCompanyBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const importExcelBtn = document.getElementById('importExcelBtn');
const companyModal = document.getElementById('companyModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const companyForm = document.getElementById('companyForm');
const modalTitle = document.getElementById('modalTitle');
const statusFilters = document.querySelectorAll('.status-filter');
const sortByDateAsc = document.getElementById('sortByDateAsc');
const sortByDateDesc = document.getElementById('sortByDateDesc');
const totalCountEl = document.getElementById('totalCount');
const clearAllBtn = document.getElementById('clearAllBtn');
const batchDeleteBtn = document.getElementById('batchDeleteBtn');
const exitBatchModeBtn = document.getElementById('exitBatchModeBtn');
const enterBatchModeBtn = document.getElementById('enterBatchModeBtn');

// 初始化图表
let statusChart;

// 初始化应用
function initApp() {
  // 尝试从Excel导入数据，如果没有Excel则使用localStorage
  importFromExcelOnLoad();
  renderCompanyList();
  updateTotalCount();
  initStatusChart();
  setupEventListeners();
}

// 设置事件监听器
function setupEventListeners() {
  // 添加公司按钮
  addCompanyBtn.addEventListener('click', () => {
    openModal();
  });

  // 导出Excel按钮
  exportExcelBtn.addEventListener('click', exportToExcel);

  // 导入Excel按钮
  importExcelBtn.addEventListener('click', () => {
    document.getElementById('excelFileInput').click();
  });

  // 监听文件选择
  document.getElementById('excelFileInput').addEventListener('change', handleExcelFileSelect);

  // 关闭模态框
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // 点击模态框外部关闭
  companyModal.addEventListener('click', (e) => {
    if (e.target === companyModal) {
      closeModal();
    }
  });

  // 提交表单
  companyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveCompany();
  });

  // 状态筛选
  statusFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      // 更新活跃状态
      statusFilters.forEach(b => b.classList.remove('ring-2', 'ring-primary/50'));
      btn.classList.add('ring-2', 'ring-primary/50');

      currentFilter = btn.dataset.status;
      renderCompanyList();
    });
  });

  // 排序
  sortByDateAsc.addEventListener('click', () => {
    sortOrder = 'asc';
    renderCompanyList();
    sortByDateAsc.classList.add('ring-2', 'ring-primary/50');
    sortByDateDesc.classList.remove('ring-2', 'ring-primary/50');
  });

  sortByDateDesc.addEventListener('click', () => {
    sortOrder = 'desc';
    renderCompanyList();
    sortByDateDesc.classList.add('ring-2', 'ring-primary/50');
    sortByDateAsc.classList.remove('ring-2', 'ring-primary/50');
  });

  // 清空所有记录
  clearAllBtn.addEventListener('click', () => {
    if (companies.length > 0) {
      Swal.fire({
        title: '确认清空记录',
        text: "确定要清空所有记录吗？此操作不可恢复！",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then((result) => {
        if (result.isConfirmed) {
          // 用户点击"确定"后执行清空操作
          companies = [];
          saveToLocalStorage();
          renderCompanyList();
          updateTotalCount();
          updateStatusChart();
        }
      });
    }
  });

  // 批量删除相关事件
  enterBatchModeBtn.addEventListener('click', () => {
    enterBatchMode();
  });

  exitBatchModeBtn.addEventListener('click', () => {
    exitBatchMode();
  });

  batchDeleteBtn.addEventListener('click', () => {
    performBatchDelete();
  });

  // 键盘ESC退出批量模式
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isBatchMode) {
      exitBatchMode();
    }
  });
}

// 打开模态框
function openModal(company = null) {
  // 重置表单
  companyForm.reset();
  document.getElementById('companyId').value = '';

  if (company) {
    // 编辑模式
    modalTitle.textContent = `编辑 ${company.name} 记录`;
    document.getElementById('companyId').value = company.id;
    document.getElementById('companyName').value = company.name;
    document.getElementById('status').value = company.status;
    document.getElementById('interviewTime').value = company.interviewTime || '';
    document.getElementById('interviewLink').value = company.interviewLink || '';
    document.getElementById('summary').value = company.summary || '';
    document.getElementById('summaryLink').value = company.summaryLink || '';
  } else {
    // 添加模式
    modalTitle.textContent = '添加公司记录';
  }

  companyModal.classList.remove('hidden');
  // 添加动画效果
  setTimeout(() => {
    companyModal.querySelector('.modal-transition').classList.add('scale-100');
    companyModal.querySelector('.modal-transition').classList.remove('scale-95');
  }, 10);
}

// 关闭模态框
function closeModal() {
  companyModal.querySelector('.modal-transition').classList.add('scale-95');
  companyModal.querySelector('.modal-transition').classList.remove('scale-100');
  setTimeout(() => {
    companyModal.classList.add('hidden');
  }, 200);
}

// 保存公司信息
function saveCompany() {
  const companyId = document.getElementById('companyId').value;
  const companyName = document.getElementById('companyName').value;
  const status = document.getElementById('status').value;
  const interviewTime = document.getElementById('interviewTime').value;
  const interviewLink = document.getElementById('interviewLink').value;
  const summary = document.getElementById('summary').value;
  const summaryLink = document.getElementById('summaryLink').value;

  if (!companyName || !status) {
    alert('请填写必填项');
    return;
  }

  const companyData = {
    name: companyName,
    status: status,
    interviewTime: interviewTime,
    interviewLink: interviewLink,
    summary: summary,
    summaryLink: summaryLink,
    createdAt: new Date().toISOString()
  };

  if (companyId) {
    // 编辑现有公司
    const index = companies.findIndex(c => c.id === companyId);
    if (index !== -1) {
      companyData.id = companyId;
      companyData.createdAt = companies[index].createdAt;
      companies[index] = companyData;
    }
  } else {
    // 添加新公司
    companyData.id = Date.now().toString();
    companies.push(companyData);
  }

  saveToLocalStorage();
  renderCompanyList();
  updateTotalCount();
  updateStatusChart();
  closeModal();
}

// 渲染公司列表
function renderCompanyList() {
  let filteredCompanies = companies;

  // 应用筛选
  if (currentFilter !== 'all') {
    filteredCompanies = companies.filter(company => company.status === currentFilter);
  }

  // 应用排序
  filteredCompanies = [...filteredCompanies].sort((a, b) => {
    if (!a.interviewTime && !b.interviewTime) return 0;
    if (!a.interviewTime) return 1;
    if (!b.interviewTime) return -1;

    const dateA = new Date(a.interviewTime);
    const dateB = new Date(b.interviewTime);

    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // 清空列表
  companyListEl.innerHTML = '';

  if (filteredCompanies.length === 0) {
    companyListEl.innerHTML = `
      <div class="col-span-full flex justify-center items-center py-16 text-gray-500">
        <div class="text-center">
          <i class="fa fa-file-text-o text-5xl mb-4 opacity-30"></i>
          <p>${isBatchMode ? '没有可选择的公司' : '还没有添加任何公司记录'}</p>
          <p class="mt-2">${isBatchMode ? '退出删除模式后可继续添加' : '点击"添加公司"按钮开始记录你的秋招历程'}</p>
        </div>
      </div>
    `;
    return;
  }

  // 渲染公司卡片
  filteredCompanies.forEach(company => {
    const card = createCompanyCard(company);
    companyListEl.appendChild(card);
  });
}

// 创建公司卡片
function createCompanyCard(company) {
  const card = document.createElement('div');
  const isSelected = selectedCompanies.has(company.id);
  
  let cardClasses = 'bg-white rounded-xl shadow-lg p-5 card-shadow flex flex-col h-full min-h-[200px] transition-all duration-200';
  if (isBatchMode) {
    cardClasses += ' cursor-pointer hover:shadow-xl';
    if (isSelected) {
      cardClasses += ' ring-2 ring-red-500 ring-offset-2';
    }
  } else {
    cardClasses += ' card-hover';
  }
  
  card.className = cardClasses;
  
  if (isBatchMode) {
    card.addEventListener('click', () => toggleCompanySelection(company.id));
  }
  
  let checkboxHtml = '';
  if (isBatchMode) {
    checkboxHtml = `
      <div class="flex items-start mb-3">
        <input type="checkbox" 
               id="select-${company.id}"
               class="w-5 h-5 text-red-600 rounded mt-1 mr-3 flex-shrink-0"
               ${isSelected ? 'checked' : ''}
               onchange="toggleCompanySelection('${company.id}')"
               onclick="event.stopPropagation()">
        <div class="flex-1">
    `;
  }
  
  let checkboxClose = isBatchMode ? '</div></div>' : '';
  
  card.innerHTML = `
    ${checkboxHtml}
    <div class="flex-1 flex flex-col">
      <div class="flex justify-between items-start mb-3 gap-3">
        <h3 class="text-lg font-semibold text-gray-800 break-words flex-1 min-w-0" title="${company.name}">
          ${company.name}
        </h3>
        <span class="px-2 py-1 rounded-full text-xs font-medium text-white ${statusColorMap[company.status]} flex-shrink-0">
          ${statusTextMap[company.status]}
        </span>
      </div>
      
      ${company.interviewTime ? `
        <div class="mb-2">
          <p class="text-sm text-gray-600 flex items-center">
            <i class="fa fa-calendar mr-2 text-gray-400"></i>
            <span>${formatDateTime(company.interviewTime)}</span>
          </p>
        </div>
      ` : ''}
      
      ${company.interviewLink ? `
        <div class="mb-2">
          <a href="${company.interviewLink}" target="_blank" class="text-sm text-primary hover:underline flex items-center">
            <i class="fa fa-link mr-2 text-gray-400"></i>
            <span class="truncate">面试链接</span>
          </a>
        </div>
      ` : ''}
      
      ${company.summary ? `
        <div class="mb-2">
          <p class="text-sm text-gray-600 line-clamp-2" title="${company.summary}">
            ${company.summary}
          </p>
        </div>
      ` : ''}
      
      ${company.summaryLink ? `
        <div class="mb-3">
          <a href="${company.summaryLink}" target="_blank" class="text-sm text-primary hover:underline flex items-center">
            <i class="fa fa-file-text-o mr-2 text-gray-400"></i>
            <span class="truncate">总结链接</span>
          </a>
        </div>
      ` : ''}
    </div>
    
    ${!isBatchMode ? `
      <div class="mt-auto pt-3 border-t border-gray-100 flex gap-2 justify-end">
        <button onclick="editCompany('${company.id}')" 
                class="bg-primary text-white py-1.5 px-3 rounded-md hover:bg-primary/90 transition-all text-xs font-medium">
          <i class="fa fa-edit mr-1"></i> 编辑
        </button>
        <button onclick="deleteCompany('${company.id}')" 
                class="bg-red-500 text-white py-1.5 px-3 rounded-md hover:bg-red-600 transition-all text-xs font-medium">
          <i class="fa fa-trash mr-1"></i> 删除
        </button>
      </div>
    ` : ''}
    ${checkboxClose}
  `;
  
  return card;
}

// 批量删除相关函数
function enterBatchMode() {
  isBatchMode = true;
  selectedCompanies.clear();
  
  // 显示/隐藏按钮
  enterBatchModeBtn.classList.add('hidden');
  exitBatchModeBtn.classList.remove('hidden');
  batchDeleteBtn.classList.remove('hidden');
  
  // 更新UI
  renderCompanyList();
  updateBatchDeleteButton();
}

function exitBatchMode() {
  isBatchMode = false;
  selectedCompanies.clear();
  
  // 显示/隐藏按钮
  enterBatchModeBtn.classList.remove('hidden');
  exitBatchModeBtn.classList.add('hidden');
  batchDeleteBtn.classList.add('hidden');
  
  // 更新UI
  renderCompanyList();
}

function toggleCompanySelection(companyId) {
  if (selectedCompanies.has(companyId)) {
    selectedCompanies.delete(companyId);
  } else {
    selectedCompanies.add(companyId);
  }
  updateBatchDeleteButton();
}

function updateBatchDeleteButton() {
  const count = selectedCompanies.size;
  if (count > 0) {
    batchDeleteBtn.textContent = `删除选中 (${count})`;
    batchDeleteBtn.disabled = false;
    batchDeleteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    batchDeleteBtn.textContent = '批量删除';
    batchDeleteBtn.disabled = true;
    batchDeleteBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

function performBatchDelete() {
  const count = selectedCompanies.size;
  if (count === 0) return;
  
  Swal.fire({
    title: '确认批量删除',
    text: `确定要删除选中的 ${count} 条记录吗？此操作不可恢复！`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  }).then((result) => {
    if (result.isConfirmed) {
      // 执行删除操作
      companies = companies.filter(c => !selectedCompanies.has(c.id));
      saveToLocalStorage();
      
      // 退出批量模式
      exitBatchMode();
      
      // 更新UI
      renderCompanyList();
      updateTotalCount();
      updateStatusChart();
      
      // 显示成功提示
      Swal.fire({
        title: '删除成功',
        text: `已删除 ${count} 条记录`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}

// 编辑公司
function editCompany(id) {
  const company = companies.find(c => c.id === id);
  if (company) {
    openModal(company);
  }
}

// 删除公司
function deleteCompany(id) {
  Swal.fire({
    title: '确认删除记录',
    text: "确定要删除这条记录吗？",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then((result) => {
    if (result.isConfirmed) {
      // 用户点击"确定"后执行清空操作
      companies = companies.filter(c => c.id !== id);
      saveToLocalStorage();
      renderCompanyList();
      updateTotalCount();
      updateStatusChart();
    }
  });
}

// 保存到本地存储
function saveToLocalStorage() {
  localStorage.setItem('autumnRecruitmentCompanies', JSON.stringify(companies));
}

// 更新总数
function updateTotalCount() {
  totalCountEl.textContent = companies.length;
}

// 初始化状态图表
function initStatusChart() {
  const ctx = document.getElementById('statusChart').getContext('2d');

  // 计算各状态数量
  const statusCounts = {
    applied: 0,
    interview1: 0,
    interview2: 0,
    interview3: 0,
    interview4: 0,
    hr: 0,
    rejected: 0
  };

  companies.forEach(company => {
    if (statusCounts.hasOwnProperty(company.status)) {
      statusCounts[company.status]++;
    }
  });

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusTextMap).map(key => statusTextMap[key]),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: Object.keys(statusColorMap).map(key => {
          const colorMap = {
            'bg-status-applied': '#60A5FA',
            'bg-status-interview1': '#34D399',
            'bg-status-interview2': '#10B981',
            'bg-status-interview3': '#059669',
            'bg-status-interview4': '#047857',
            'bg-status-hr': '#F59E0B',
            'bg-status-rejected': '#EF4444'
          };
          return colorMap[statusColorMap[key]];
        }),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// 更新状态图表
function updateStatusChart() {
  if (statusChart) {
    // 计算各状态数量
    const statusCounts = {
      applied: 0,
      interview1: 0,
      interview2: 0,
      interview3: 0,
      interview4: 0,
      hr: 0,
      rejected: 0
    };

    companies.forEach(company => {
      if (statusCounts.hasOwnProperty(company.status)) {
        statusCounts[company.status]++;
      }
    });

    statusChart.data.datasets[0].data = Object.values(statusCounts);
    statusChart.update();
  }
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 导出数据到Excel
function exportToExcel() {
  if (companies.length === 0) {
    alert('没有数据可导出');
    return;
  }

  // 准备导出数据
  const exportData = companies.map(company => ({
    '公司名称': company.name,
    '投递状态': statusTextMap[company.status],
    '面试时间': company.interviewTime ? formatDateTime(company.interviewTime) : '',
    '面试网址': company.interviewLink || '',
    '总结': company.summary || '',
    '总结链接': company.summaryLink || '',
    '创建时间': formatDateTime(company.createdAt)
  }));

  // 创建工作簿和工作表
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '秋招记录');

  // 导出Excel文件
  XLSX.writeFile(wb, '秋招求职记录.xlsx');
}

// 处理Excel文件选择
function handleExcelFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 转换导入的数据
      const importedCompanies = jsonData.map(item => {
        // 查找状态对应的键
        let statusKey = 'applied';
        Object.entries(statusTextMap).forEach(([key, value]) => {
          if (value === item['投递状态']) {
            statusKey = key;
          }
        });

        return {
          id: Date.now().toString() + Math.floor(Math.random() * 1000),
          name: item['公司名称'] || '',
          status: statusKey,
          interviewTime: item['面试时间'] || '',
          interviewLink: item['面试网址'] || '',
          summary: item['总结'] || '',
          summaryLink: item['总结链接'] || '',
          createdAt: new Date().toISOString()
        };
      });

      if (importedCompanies.length > 0) {
        companies = importedCompanies;
        saveToLocalStorage();
        renderCompanyList();
        updateTotalCount();
        updateStatusChart();
        alert(`成功导入 ${importedCompanies.length} 条记录`);
      }
    } catch (error) {
      alert('导入失败，请检查文件格式');
      console.error(error);
    }
  };
  reader.readAsArrayBuffer(file);

  // 清空文件输入
  e.target.value = '';
}

// 尝试从Excel导入数据（页面加载时）
function importFromExcelOnLoad() {
  // 如果有本地存储数据，优先使用
  if (companies.length > 0) {
    return;
  }

  // 这里可以添加从服务器加载数据的逻辑
  // 目前主要使用localStorage
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);