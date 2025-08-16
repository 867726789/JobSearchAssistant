import { STATUS_TEXT_MAP, STATUS_COLOR_MAP } from '../utils/constants.js';
import { formatDateTime, formatTimeOnly } from '../utils/helpers.js';

export class UIManager {
  constructor() {
    this.companyListEl = document.getElementById('companyList');
    this.totalCountEl = document.getElementById('totalCount');
    this.modal = document.getElementById('companyModal');
    this.form = document.getElementById('companyForm');
  }

  renderCompanyList(companies, isBatchMode = false, selectedCompanies = new Set()) {
    if (companies.length === 0) {
      this.companyListEl.innerHTML = `
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

    this.companyListEl.innerHTML = '';
    companies.forEach(company => {
      const card = this.createCompanyCard(company, isBatchMode, selectedCompanies);
      this.companyListEl.appendChild(card);
    });
  }

  createCompanyCard(company, isBatchMode, selectedCompanies) {
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

    let checkboxHtml = '';
    if (isBatchMode) {
      checkboxHtml = `
        <div class="flex items-start mb-3">
          <input type="checkbox" 
                 id="select-${company.id}"
                 class="w-5 h-5 text-red-600 rounded mt-1 mr-3 flex-shrink-0 cursor-pointer"
                 ${isSelected ? 'checked' : ''}
                 onchange="window.toggleCompanySelection('${company.id}')"
                 onclick="event.stopPropagation()">
          <div class="flex-1">
      `;
    }
    
    let checkboxClose = isBatchMode ? '</div></div>' : '';

    // 生成卡片内容
    card.innerHTML = `
      ${checkboxHtml}
      <div class="flex-1 flex flex-col">
        <div class="flex justify-between items-start mb-3 gap-3">
          <h3 class="text-lg font-semibold text-gray-800 break-words flex-1 min-w-0" title="${company.name}">
            ${company.name}
          </h3>
          <span class="px-2 py-1 rounded-full text-xs font-medium text-white ${STATUS_COLOR_MAP[company.status]} flex-shrink-0">
            ${STATUS_TEXT_MAP[company.status]}
          </span>
        </div>
        
        ${this.generateInterviewTimeDisplay(company)}
        ${this.generateInterviewLinkDisplay(company)}
        ${this.generateSummaryDisplay(company)}
        ${this.generateSummaryLinksDisplay(company)}
      </div>
      
      ${!isBatchMode ? `
        <div class="mt-auto pt-3 border-t border-gray-100 flex gap-2 justify-end">
          <button onclick="window.editCompany('${company.id}')" 
                  class="bg-primary text-white py-1.5 px-3 rounded-md hover:bg-primary/90 transition-all text-xs font-medium">
            <i class="fa fa-edit mr-1"></i> 编辑
          </button>
          <button onclick="window.deleteCompany('${company.id}')" 
                  class="bg-red-500 text-white py-1.5 px-3 rounded-md hover:bg-red-600 transition-all text-xs font-medium">
            <i class="fa fa-trash mr-1"></i> 删除
          </button>
        </div>
      ` : ''}
      ${checkboxClose}
    `;

    if (isBatchMode) {
      card.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') return;
        const checkbox = card.querySelector(`#select-${company.id}`);
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        }
      });
    }

    return card;
  }

  generateInterviewTimeDisplay(company) {
    if (!company.interviewStartTime) return '';
    
    const startTime = formatDateTime(company.interviewStartTime);
    if (company.interviewEndTime) {
      const endTime = formatTimeOnly(company.interviewEndTime);
      return `
        <div class="mb-2">
          <p class="text-sm text-gray-600 flex items-center">
            <i class="fa fa-calendar mr-2 text-gray-400"></i>
            <span>${startTime} - ${endTime}</span>
          </p>
        </div>
      `;
    }
    
    return `
      <div class="mb-2">
        <p class="text-sm text-gray-600 flex items-center">
          <i class="fa fa-calendar mr-2 text-gray-400"></i>
          <span>${startTime}</span>
        </p>
      </div>
    `;
  }

  generateInterviewLinkDisplay(company) {
    if (!company.interviewLink) return '';
    return `
      <div class="mb-2">
        <a href="${company.interviewLink}" target="_blank" class="text-sm text-primary hover:underline flex items-center">
          <i class="fa fa-link mr-2 text-gray-400"></i>
          <span class="truncate">面试链接</span>
        </a>
      </div>
    `;
  }

  generateSummaryDisplay(company) {
    if (!company.summary) return '';
    return `
      <div class="mb-2">
        <p class="text-sm text-gray-600 line-clamp-2" title="${company.summary}">
          ${company.summary}
        </p>
      </div>
    `;
  }

  generateSummaryLinksDisplay(company) {
    if (company.summaryLinks && company.summaryLinks.length > 0) {
      return `
        <div class="mb-3">
          <p class="text-sm font-medium text-gray-700 mb-1">相关链接：</p>
          <div class="space-y-1">
            ${company.summaryLinks.map(link => `
              <a href="${link.url}" target="_blank" class="text-sm text-primary hover:underline flex items-center">
                <i class="fa fa-link mr-2 text-gray-400"></i>
                <span class="truncate">${link.name}</span>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    } else if (company.summaryLink) {
      return `
        <div class="mb-3">
          <a href="${company.summaryLink}" target="_blank" class="text-sm text-primary hover:underline flex items-center">
            <i class="fa fa-file-text-o mr-2 text-gray-400"></i>
            <span class="truncate">总结链接</span>
          </a>
        </div>
      `;
    }
    return '';
  }

  updateTotalCount(count) {
    this.totalCountEl.textContent = count;
  }

  openModal(company = null) {
    const modalTitle = document.getElementById('modalTitle');
    const companyId = document.getElementById('companyId');
    const companyName = document.getElementById('companyName');
    const status = document.getElementById('status');
    const interviewStartTime = document.getElementById('interviewStartTime');
    const interviewEndTime = document.getElementById('interviewEndTime');
    const interviewLink = document.getElementById('interviewLink');
    const summary = document.getElementById('summary');
    const summaryLinksContainer = document.getElementById('summaryLinksContainer');

    if (company) {
      modalTitle.textContent = '编辑公司记录';
      companyId.value = company.id;
      companyName.value = company.name;
      status.value = company.status;
      interviewStartTime.value = company.interviewStartTime || '';
      interviewEndTime.value = company.interviewEndTime || '';
      interviewLink.value = company.interviewLink || '';
      summary.value = company.summary || '';

      summaryLinksContainer.innerHTML = '';
      if (company.summaryLinks && Array.isArray(company.summaryLinks)) {
        company.summaryLinks.forEach(link => {
          window.addSummaryLink(link.name, link.url);
        });
      } else if (company.summaryLink) {
        window.addSummaryLink('总结链接', company.summaryLink);
      } else {
        window.addSummaryLink();
      }
    } else {
      modalTitle.textContent = '添加公司记录';
      this.form.reset();
      companyId.value = '';
      summaryLinksContainer.innerHTML = '';
      window.addSummaryLink();
    }

    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  getFormData() {
    const links = [];
    const linkElements = document.querySelectorAll('#summaryLinksContainer .flex.gap-2');
    
    linkElements.forEach(element => {
      const nameInput = element.querySelector('input[type="text"]');
      const urlInput = element.querySelector('input[type="url"]');
      
      if (nameInput.value.trim() && urlInput.value.trim()) {
        links.push({
          name: nameInput.value.trim(),
          url: urlInput.value.trim()
        });
      }
    });

    return {
      id: document.getElementById('companyId').value,
      name: document.getElementById('companyName').value.trim(),
      status: document.getElementById('status').value,
      interviewStartTime: document.getElementById('interviewStartTime').value,
      interviewEndTime: document.getElementById('interviewEndTime').value,
      interviewLink: document.getElementById('interviewLink').value.trim(),
      summary: document.getElementById('summary').value.trim(),
      summaryLinks: links
    };
  }

  async showConfirmDialog(title, text) {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });
    return result.isConfirmed;
  }
}