import { STATUS_TEXT_MAP, STATUS_COLOR_MAP } from '../utils/constants.js';

export class ChartManager {
  constructor() {
    this.chart = null;
    this.ctx = null;
  }

  initStatusChart(companies) {
    this.ctx = document.getElementById('statusChart').getContext('2d');
    
    const statusCounts = this.calculateStatusCounts(companies);
    
    this.chart = new Chart(this.ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(STATUS_TEXT_MAP).map(key => STATUS_TEXT_MAP[key]),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: Object.keys(STATUS_COLOR_MAP).map(key => {
            const colorMap = {
              'bg-status-applied': '#60A5FA',
              'bg-status-interview1': '#34D399',
              'bg-status-interview2': '#10B981',
              'bg-status-interview3': '#059669',
              'bg-status-interview4': '#047857',
              'bg-status-hr': '#F59E0B',
              'bg-status-rejected': '#EF4444'
            };
            return colorMap[STATUS_COLOR_MAP[key]];
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

  updateStatusChart(companies) {
    if (!this.chart) {
      this.initStatusChart(companies);
      return;
    }

    const statusCounts = this.calculateStatusCounts(companies);
    this.chart.data.datasets[0].data = Object.values(statusCounts);
    this.chart.update();
  }

  calculateStatusCounts(companies) {
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

    return statusCounts;
  }
}