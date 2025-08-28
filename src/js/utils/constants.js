// 修改状态文本映射，在已投递和一面之间添加笔试
export const STATUS_TEXT_MAP = {
  applied: '已投递',
  written: '笔试',
  interview1: '一面',
  interview2: '二面',
  interview3: '三面',
  interview4: '四面',
  hr: 'HR面',
  rejected: '已挂'
};

// 修改状态颜色映射，添加笔试对应的颜色类
export const STATUS_COLOR_MAP = {
  applied: 'bg-status-applied',
  written: 'bg-status-written',
  interview1: 'bg-status-interview1',
  interview2: 'bg-status-interview2',
  interview3: 'bg-status-interview3',
  interview4: 'bg-status-interview4',
  hr: 'bg-status-hr',
  rejected: 'bg-status-rejected'
};

export const STORAGE_KEY = 'autumnRecruitmentCompanies';