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

// DOM 元素
let companyListEl, addCompanyBtn, exportExcelBtn, importExcelBtn;
let companyModal, closeModalBtn, cancelBtn, companyForm, modalTitle;
let statusFilters, sortByDateAsc, sortByDateDesc, totalCountEl, clearAllBtn;

// 初始化图表
let statusChart;

// 初始化应用
function initApp() {
  // 获取DOM元素
  companyListEl = document.getElementById('companyList');
  addCompanyBtn = document.getElementById('addCompanyBtn');
  exportExcelBtn = document.getElementById('exportExcelBtn');
  importExcelBtn = document.getElementById('importExcelBtn');
  companyModal = document.getElementById('companyModal');
  closeModalBtn = document.getElementById('closeModalBtn');
  cancelBtn = document.getElementById('cancelBtn');
  companyForm = document.getElementById('companyForm');
  modalTitle = document.getElementById('modalTitle');
  statusFilters = document.querySelectorAll('.status-filter');
  sortByDateAsc = document.getElementById('sortByDateAsc');
  sortByDateDesc = document.getElementById('sortByDateDesc');
  totalCountEl = document.getElementById('totalCount');
  clearAllBtn = document.getElementById('clearAllBtn');

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
    if (companies.length > 0 && confirm('确定要清空所有记录吗？此操作不可恢复！')) {
      companies = [];
      saveToLocalStorage();
      renderCompanyList();
      updateTotalCount();
      updateStatusChart();
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
  reader.onload = function(e) {
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
          interviewTime: item['面试时间'] ? new Date(item['面试时间']).toISOString() : '',
          interviewLink: item['面试网址'] || '',
          summary: item['总结'] || '',
          summaryLink: item['总结链接'] || '',
          createdAt: item['创建时间'] ? new Date(item['创建时间']).toISOString() : new Date().toISOString()
        };
      });

      // 确认是否替换现有数据
      if (confirm(`发现${importedCompanies.length}条记录，是否替换现有数据？`)) {
        companies = importedCompanies;
        saveToLocalStorage();
        renderCompanyList();
        updateTotalCount();
        updateStatusChart();
        alert('导入成功');
      }
    } catch (error) {
      alert('导入失败: ' + error.message);
    }
  };
  reader.readAsArrayBuffer(file);

  // 重置文件输入，以便可以重复选择同一个文件
  e.target.value = '';
}

// 在页面加载时尝试导入Excel数据
function importFromExcelOnLoad() {
  // 注意：由于浏览器安全限制，无法自动读取本地文件
  // 这里我们只是检查localStorage，如果为空，提示用户导入
  if (companies.length === 0) {
    // 不自动弹出提示，避免打扰用户
    console.log('没有找到本地数据，用户可以通过导入Excel按钮导入数据');
  }
}

// 关闭模态框
function closeModal() {
  const modalContent = companyModal.querySelector('.modal-transition');
  modalContent.classList.remove('scale-100');
  modalContent.classList.add('scale-95');

  setTimeout(() => {
    companyModal.classList.add('hidden');
  }, 200);
}

// 保存公司信息
function saveCompany() {
  const id = document.getElementById('companyId').value;
  const name = document.getElementById('companyName').value;
  const status = document.getElementById('status').value;
  const interviewTime = document.getElementById('interviewTime').value;
  const interviewLink = document.getElementById('interviewLink').value;
  const summary = document.getElementById('summary').value;
  const summaryLink = document.getElementById('summaryLink').value;

  const companyData = {
    name,
    status,
    interviewTime,
    interviewLink,
    summary,
    summaryLink
  };

  if (id) {
    // 更新现有公司
    const index = companies.findIndex(company => company.id === id);
    if (index !== -1) {
      companies[index] = { ...companies[index], ...companyData };
    }
  } else {
    // 添加新公司
    companies.push({
      id: Date.now().toString(),
      ...companyData,
      createdAt: new Date().toISOString()
    });
  }

  saveToLocalStorage();
  renderCompanyList();
  updateTotalCount();
  updateStatusChart();
  closeModal();
}

// 删除公司
function deleteCompany(id) {
  if (confirm('确定要删除这条记录吗？')) {
    companies = companies.filter(company => company.id !== id);
    saveToLocalStorage();
    renderCompanyList();
    updateTotalCount();
    updateStatusChart();
  }
}

// 渲染公司列表
function renderCompanyList() {
  // 筛选和排序
  let filteredCompanies = [...companies];

  // 筛选
  if (currentFilter !== 'all') {
    filteredCompanies = filteredCompanies.filter(company => company.status === currentFilter);
  }

  // 排序
  filteredCompanies.sort((a, b) => {
    // 没有面试时间的排在后面
    if (!a.interviewTime && !b.interviewTime) return 0;
    if (!a.interviewTime) return 1;
    if (!b.interviewTime) return -1;

    const dateA = new Date(a.interviewTime);
    const dateB = new Date(b.interviewTime);

    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // 清空列表
  companyListEl.innerHTML = '';

  // 没有数据时显示提示
  if (filteredCompanies.length === 0) {
    companyListEl.innerHTML = `
      <div class="col-span-full flex justify-center items-center py-16 text-gray-500">
        <div class="text-center">
          <i class="fa fa-search text-5xl mb-4 opacity-30"></i>
          <p>没有找到匹配的记录</p>
          ${currentFilter !== 'all' ? `<p class="mt-2">尝试选择"全部"筛选条件查看所有记录</p>` : ''}
        </div>
      </div>
    `;
    return;
  }

  // 渲染公司卡片
  filteredCompanies.forEach(company => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="p-5">
        <div class="flex justify-between items-start mb-3">
          <h3 class="text-lg font-semibold text-gray-800">${company.name}</h3>
          <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColorMap[company.status]} text-white">
            ${statusTextMap[company.status]}
          </span>
        </div>
        
        ${company.interviewTime ? `
          <div class="flex items-center text-gray-600 text-sm mb-2">
            <i class="fa fa-calendar mr-2 text-gray-400"></i>
            ${formatDateTime(company.interviewTime)}
          </div>
        ` : ''}
        
        ${company.interviewLink ? `
          <div class="flex items-center text-gray-600 text-sm mb-2">
            <i class="fa fa-link mr-2 text-gray-400"></i>
            <a href="${company.interviewLink}" target="_blank" class="text-primary hover:underline truncate max-w-[80%]">
              ${getDomainFromUrl(company.interviewLink)}
            </a>
          </div>
        ` : ''}
        
        ${company.summary ? `
          <div class="text-gray-600 text-sm mb-2 line-clamp-2">
            <i class="fa fa-sticky-note-o mr-2 text-gray-400"></i>
            ${company.summary}
          </div>
        ` : ''}
        
        ${company.summaryLink ? `
          <div class="flex items-center text-gray-600 text-sm mb-2">
            <i class="fa fa-file-text-o mr-2 text-gray-400"></i>
            <a href="${company.summaryLink}" target="_blank" class="text-primary hover:underline truncate max-w-[80%]">
              查看总结
            </a>
          </div>
        ` : ''}
        
        <div class="flex justify-end gap-2 mt-4 pt-3 border-t">
          <button class="edit-btn text-gray-500 hover:text-primary transition-all p-1" data-id="${company.id}">
            <i class="fa fa-pencil"></i> 编辑
          </button>
          <button class="delete-btn text-gray-500 hover:text-red-500 transition-all p-1" data-id="${company.id}">
            <i class="fa fa-trash-o"></i> 删除
          </button>
        </div>
      </div>
    `;

    companyListEl.appendChild(card);

    // 添加编辑和删除事件
    card.querySelector('.edit-btn').addEventListener('click', () => {
      const companyToEdit = companies.find(c => c.id === company.id);
      openModal(companyToEdit);
    });

    card.querySelector('.delete-btn').addEventListener('click', () => {
      deleteCompany(company.id);
    });
  });
}

// 保存到本地存储
function saveToLocalStorage() {
  localStorage.setItem('autumnRecruitmentCompanies', JSON.stringify(companies));
  // 提示用户导出更新后的Excel
  // 为了不频繁打扰用户，可以添加一个延迟提示或仅在特定条件下提示
}

// 更新总数
function updateTotalCount() {
  totalCountEl.textContent = companies.length;
}

// 初始化状态图表
function initStatusChart() {
  const ctx = document.getElementById('statusChart').getContext('2d');

  // 准备数据
  const statusCounts = {
    'applied': 0,
    'interview1': 0,
    'interview2': 0,
    'interview3': 0,
    'interview4': 0,
    'hr': 0,
    'rejected': 0
  };

  companies.forEach(company => {
    if (statusCounts.hasOwnProperty(company.status)) {
      statusCounts[company.status]++;
    }
  });

  // 状态颜色值
  const statusColorValues = {
    'applied': '#60A5FA',
    'interview1': '#34D399',
    'interview2': '#10B981',
    'interview3': '#059669',
    'interview4': '#047857',
    'hr': '#F59E0B',
    'rejected': '#EF4444'
  };

  // 提取颜色和标签
  const backgroundColors = Object.keys(statusCounts).map(status => statusColorValues[status]);
  const labels = Object.keys(statusCounts).map(status => statusTextMap[status]);

  // 创建图表
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '70%',
      animation: {
        animateScale: true,
        animateRotate: true
      }
    }
  });
}

// 更新状态图表
function updateStatusChart() {
  // 销毁现有图表
  if (statusChart) {
    statusChart.destroy();
  }

  // 重新初始化图表
  initStatusChart();
}

// 格式化日期时间
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '';

  const date = new Date(dateTimeString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 从URL获取域名
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);