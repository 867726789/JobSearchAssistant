// 全局变量
let companies = [];
let statusChart = null;
let isBatchMode = false;
let selectedCompanies = new Set();

// 状态映射
const statusTextMap = {
  applied: '已投递',
  interview1: '一面',
  interview2: '二面',
  interview3: '三面',
  interview4: '四面',
  hr: 'HR面',
  rejected: '已挂'
};

const statusColorMap = {
  applied: 'bg-status-applied',
  interview1: 'bg-status-interview1',
  interview2: 'bg-status-interview2',
  interview3: 'bg-status-interview3',
  interview4: 'bg-status-interview4',
  hr: 'bg-status-hr',
  rejected: 'bg-status-rejected'
};

// DOM元素
const companyListEl = document.getElementById('companyList');
const totalCountEl = document.getElementById('totalCount');
const companyModal = document.getElementById('companyModal');
const companyForm = document.getElementById('companyForm');
const modalTitle = document.getElementById('modalTitle');
const companyIdInput = document.getElementById('companyId');
const companyNameInput = document.getElementById('companyName');
const statusInput = document.getElementById('status');
const interviewStartTimeInput = document.getElementById('interviewStartTime');
const interviewEndTimeInput = document.getElementById('interviewEndTime');
const interviewLinkInput = document.getElementById('interviewLink');
const summaryInput = document.getElementById('summary');
const summaryLinkInput = document.getElementById('summaryLink');

// 批量删除相关元素
const enterBatchModeBtn = document.getElementById('enterBatchModeBtn');
const exitBatchModeBtn = document.getElementById('exitBatchModeBtn');
const batchDeleteBtn = document.getElementById('batchDeleteBtn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  renderCompanyList();
  updateTotalCount();
  initStatusChart();
  setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
  // 添加公司按钮
  document.getElementById('addCompanyBtn').addEventListener('click', () => {
    openModal();
  });

  // 关闭模态框
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);

  // 表单提交
  companyForm.addEventListener('submit', handleFormSubmit);

  // 状态筛选
  document.querySelectorAll('.status-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.status-filter').forEach(b => b.classList.remove('ring-2', 'ring-primary/50'));
      e.target.classList.add('ring-2', 'ring-primary/50');
      filterCompanies(e.target.dataset.status);
    });
  });

  // 排序
  document.getElementById('sortByDateAsc').addEventListener('click', () => sortCompanies('asc'));
  document.getElementById('sortByDateDesc').addEventListener('click', () => sortCompanies('desc'));

  // 批量删除
  enterBatchModeBtn.addEventListener('click', enterBatchMode);
  exitBatchModeBtn.addEventListener('click', exitBatchMode);
  batchDeleteBtn.addEventListener('click', performBatchDelete);

  // 清空所有
  document.getElementById('clearAllBtn').addEventListener('click', clearAllCompanies);

  // Excel导入导出
  document.getElementById('importExcelBtn').addEventListener('click', () => {
    document.getElementById('excelFileInput').click();
  });
  document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
  document.getElementById('excelFileInput').addEventListener('change', handleExcelFileSelect);

  // 点击模态框外部关闭
  companyModal.addEventListener('click', (e) => {
    if (e.target === companyModal) {
      closeModal();
    }
  });
}

// 快速设置面试时间
function setQuickDuration(minutes) {
  const startTime = interviewStartTimeInput.value;
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
  
  // 格式化结束时间为datetime-local格式
  const year = end.getFullYear();
  const month = String(end.getMonth() + 1).padStart(2, '0');
  const day = String(end.getDate()).padStart(2, '0');
  const hours = String(end.getHours()).padStart(2, '0');
  const minutesStr = String(end.getMinutes()).padStart(2, '0');
  
  interviewEndTimeInput.value = `${year}-${month}-${day}T${hours}:${minutesStr}`;
}

// 打开模态框
function openModal(company = null) {
  if (company) {
    modalTitle.textContent = '编辑公司记录';
    companyIdInput.value = company.id;
    companyNameInput.value = company.name;
    statusInput.value = company.status;
    interviewStartTimeInput.value = company.interviewStartTime || '';
    interviewEndTimeInput.value = company.interviewEndTime || '';
    interviewLinkInput.value = company.interviewLink || '';
    summaryInput.value = company.summary || '';
    summaryLinkInput.value = company.summaryLink || '';
  } else {
    modalTitle.textContent = '添加公司记录';
    companyForm.reset();
    companyIdInput.value = '';
  }
  companyModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// 关闭模态框
function closeModal() {
  companyModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

// 处理表单提交
function handleFormSubmit(e) {
  e.preventDefault();
  
  const companyData = {
    name: companyNameInput.value.trim(),
    status: statusInput.value,
    interviewStartTime: interviewStartTimeInput.value,
    interviewEndTime: interviewEndTimeInput.value,
    interviewLink: interviewLinkInput.value.trim(),
    summary: summaryInput.value.trim(),
    summaryLink: summaryLinkInput.value.trim(),
    createdAt: new Date().toISOString()
  };

  if (companyIdInput.value) {
    // 编辑现有公司
    const index = companies.findIndex(c => c.id === companyIdInput.value);
    if (index !== -1) {
      companyData.id = companyIdInput.value;
      companyData.createdAt = companies[index].createdAt;
      companies[index] = companyData;
    }
  } else {
    // 添加新公司
    companyData.id = Date.now().toString() + Math.floor(Math.random() * 1000);
    companies.push(companyData);
  }

  saveToLocalStorage();
  renderCompanyList();
  updateTotalCount();
  updateStatusChart();
  closeModal();
}

// 从本地存储加载数据
function loadFromLocalStorage() {
  const saved = localStorage.getItem('autumnRecruitmentCompanies');
  if (saved) {
    try {
      companies = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved data', e);
      companies = [];
    }
  }
}

// 渲染公司列表
function renderCompanyList() {
  const filteredCompanies = getFilteredCompanies();
  
  if (filteredCompanies.length === 0) {
    companyListEl.innerHTML = `
      <div class="col-span-full flex justify-center items-center py-16 text-gray-500">
        <div class="text-center">
          <i class="fa fa-file-text-o text-5xl mb-4 opacity-30"></i>
          <p>还没有添加任何公司记录</p>
          <p class="mt-2">点击"添加公司"按钮开始记录你的秋招历程</p>
        </div>
      </div>
    `;
    return;
  }

  companyListEl.innerHTML = '';
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
  
  // 处理面试时间段显示
  let interviewTimeDisplay = '';
  if (company.interviewStartTime) {
    const startTime = formatDateTime(company.interviewStartTime);
    if (company.interviewEndTime) {
      const endTime = formatDateTime(company.interviewEndTime);
      interviewTimeDisplay = `
        <div class="mb-2">
          <p class="text-sm text-gray-600 flex items-center">
            <i class="fa fa-calendar mr-2 text-gray-400"></i>
            <span>${startTime} - ${formatTimeOnly(company.interviewEndTime)}</span>
          </p>
        </div>
      `;
    } else {
      interviewTimeDisplay = `
        <div class="mb-2">
          <p class="text-sm text-gray-600 flex items-center">
            <i class="fa fa-calendar mr-2 text-gray-400"></i>
            <span>${startTime}</span>
          </p>
        </div>
      `;
    }
  }
  
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
      
      ${interviewTimeDisplay}
      
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

// 格式化时间（仅显示时间部分）
function formatTimeOnly(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 获取筛选后的公司列表
function getFilteredCompanies() {
  const activeFilter = document.querySelector('.status-filter.ring-2');
  const status = activeFilter ? activeFilter.dataset.status : 'all';
  
  let filtered = status === 'all' ? [...companies] : companies.filter(c => c.status === status);
  
  // 按面试时间排序
  const sortAscBtn = document.getElementById('sortByDateAsc');
  const sortDescBtn = document.getElementById('sortByDateDesc');
  
  if (sortAscBtn.classList.contains('ring-2')) {
    filtered.sort((a, b) => {
      if (!a.interviewStartTime) return 1;
      if (!b.interviewStartTime) return -1;
      return new Date(a.interviewStartTime) - new Date(b.interviewStartTime);
    });
  } else if (sortDescBtn.classList.contains('ring-2')) {
    filtered.sort((a, b) => {
      if (!a.interviewStartTime) return 1;
      if (!b.interviewStartTime) return -1;
      return new Date(b.interviewStartTime) - new Date(a.interviewStartTime);
    });
  }
  
  return filtered;
}

// 筛选公司
function filterCompanies(status) {
  renderCompanyList();
}

// 排序公司
function sortCompanies(order) {
  document.getElementById('sortByDateAsc').classList.remove('ring-2', 'ring-primary/50');
  document.getElementById('sortByDateDesc').classList.remove('ring-2', 'ring-primary/50');
  
  if (order === 'asc') {
    document.getElementById('sortByDateAsc').classList.add('ring-2', 'ring-primary/50');
  } else {
    document.getElementById('sortByDateDesc').classList.add('ring-2', 'ring-primary/50');
  }
  
  renderCompanyList();
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

// 批量删除相关函数
function enterBatchMode() {
  isBatchMode = true;
  selectedCompanies.clear();
  
  enterBatchModeBtn.classList.add('hidden');
  exitBatchModeBtn.classList.remove('hidden');
  batchDeleteBtn.classList.remove('hidden');
  
  renderCompanyList();
  updateBatchDeleteButton();
}

function exitBatchMode() {
  isBatchMode = false;
  selectedCompanies.clear();
  
  enterBatchModeBtn.classList.remove('hidden');
  exitBatchModeBtn.classList.add('hidden');
  batchDeleteBtn.classList.add('hidden');
  
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
      companies = companies.filter(c => !selectedCompanies.has(c.id));
      saveToLocalStorage();
      
      exitBatchMode();
      
      renderCompanyList();
      updateTotalCount();
      updateStatusChart();
      
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

// 清空所有记录
function clearAllCompanies() {
  Swal.fire({
    title: '确认清空',
    text: "确定要清空所有记录吗？此操作不可恢复！",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: '确定清空',
    cancelButtonText: '取消'
  }).then((result) => {
    if (result.isConfirmed) {
      companies = [];
      saveToLocalStorage();
      renderCompanyList();
      updateTotalCount();
      updateStatusChart();
    }
  });
}

// 导出数据到Excel
function exportToExcel() {
  if (companies.length === 0) {
    alert('没有数据可导出');
    return;
  }

  const exportData = companies.map(company => ({
    '公司名称': company.name,
    '投递状态': statusTextMap[company.status],
    '面试开始时间': company.interviewStartTime ? formatDateTime(company.interviewStartTime) : '',
    '面试结束时间': company.interviewEndTime ? formatDateTime(company.interviewEndTime) : '',
    '面试网址': company.interviewLink || '',
    '总结': company.summary || '',
    '总结链接': company.summaryLink || '',
    '创建时间': formatDateTime(company.createdAt)
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '秋招记录');
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

      const importedCompanies = jsonData.map(item => {
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
          interviewStartTime: item['面试开始时间'] || '',
          interviewEndTime: item['面试结束时间'] || '',
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
}