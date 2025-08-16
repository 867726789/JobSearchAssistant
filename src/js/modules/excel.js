import { STATUS_TEXT_MAP } from '../utils/constants.js';
import { formatDateTime } from '../utils/helpers.js';

export class ExcelManager {
  exportToExcel(companies) {
    if (companies.length === 0) {
      Swal.fire({
        title: '提示',
        text: '没有数据可导出',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    const exportData = companies.map(company => {
      const baseData = {
        '公司名称': company.name,
        '投递状态': STATUS_TEXT_MAP[company.status],
        '面试开始时间': company.interviewStartTime ? formatDateTime(company.interviewStartTime) : '',
        '面试结束时间': company.interviewEndTime ? formatDateTime(company.interviewEndTime) : '',
        '面试网址': company.interviewLink || '',
        '总结': company.summary || '',
        '创建时间': formatDateTime(company.createdAt)
      };
      
      if (company.summaryLinks && company.summaryLinks.length > 0) {
        company.summaryLinks.forEach((link, index) => {
          baseData[`链接${index + 1}名称`] = link.name;
          baseData[`链接${index + 1}地址`] = link.url;
        });
      } else if (company.summaryLink) {
        baseData['链接1名称'] = '总结链接';
        baseData['链接1地址'] = company.summaryLink;
      }
      
      return baseData;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '秋招记录');
    XLSX.writeFile(wb, '秋招求职记录.xlsx');
  }

  async handleImport(event, companies) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedCompanies = jsonData.map(item => {
          const company = {
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            name: item['公司名称'] || '',
            status: Object.keys(STATUS_TEXT_MAP).find(key => STATUS_TEXT_MAP[key] === item['投递状态']) || 'applied',
            interviewStartTime: item['面试开始时间'] || '',
            interviewEndTime: item['面试结束时间'] || '',
            interviewLink: item['面试网址'] || '',
            summary: item['总结'] || '',
            createdAt: new Date().toISOString()
          };

          const summaryLinks = [];
          let index = 1;
          while (item[`链接${index}名称`] && item[`链接${index}地址`]) {
            summaryLinks.push({
              name: item[`链接${index}名称`],
              url: item[`链接${index}地址`]
            });
            index++;
          }
          
          if (summaryLinks.length > 0) {
            company.summaryLinks = summaryLinks;
          } else if (item['总结链接']) {
            company.summaryLinks = [{ name: '总结链接', url: item['总结链接'] }];
          }

          return company;
        });

        if (importedCompanies.length > 0) {
          companies.push(...importedCompanies);
          window.app.storage.saveCompanies(companies);
          window.app.render();
          
          Swal.fire({
            title: '导入成功',
            text: `成功导入 ${importedCompanies.length} 条记录`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }

        event.target.value = '';
      } catch (error) {
        console.error('导入失败:', error);
        Swal.fire({
          title: '导入失败',
          text: '文件格式错误或数据损坏',
          icon: 'error',
          confirmButtonText: '确定'
        });
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }
}