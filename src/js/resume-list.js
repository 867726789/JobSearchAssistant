// 简历列表页面JavaScript功能

// 全局变量
let resumes = [];
let currentResume = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadResumes();
    renderResumeList();
    updateStats();
});

// 初始化页面
function initializePage() {
    initializeSidebar();
    bindEvents();
}

// 侧边栏功能
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    let sidebarTimeout;

    sidebar.addEventListener('mouseenter', () => {
        clearTimeout(sidebarTimeout);
        sidebar.classList.remove('sidebar-collapsed');
        sidebar.classList.add('sidebar-expanded');
        mainContent.classList.add('sidebar-open');
    });

    sidebar.addEventListener('mouseleave', () => {
        sidebarTimeout = setTimeout(() => {
            sidebar.classList.remove('sidebar-expanded');
            sidebar.classList.add('sidebar-collapsed');
            mainContent.classList.remove('sidebar-open');
        }, 300);
    });
}

// 绑定事件
function bindEvents() {
    // 移动端菜单
    const menuToggle = document.querySelector('.sidebar-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileSidebar);
    }

    // 搜索功能
    const searchInput = document.getElementById('search-resumes');
    if (searchInput) {
        searchInput.addEventListener('input', filterResumes);
    }

    // 菜单项点击
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', handleMenuClick);
    });

    // 响应式处理
    window.addEventListener('resize', handleResize);
    handleResize();
}

// 移动端菜单切换
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
}

// 菜单点击处理
function handleMenuClick(e) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }
}

// 响应式处理
function handleResize() {
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }
}

// 加载简历数据
function loadResumes() {
    const saved = localStorage.getItem('resumes');
    if (saved) {
        resumes = JSON.parse(saved);
    } else {
        // 示例数据
        resumes = [
            {
                id: 1,
                name: '前端开发工程师',
                template: 'modern',
                lastModified: new Date('2024-01-15'),
                content: {
                    name: '张三',
                    phone: '138****8888',
                    email: 'zhangsan@example.com',
                    experience: '3年',
                    summary: '3年前端开发经验，精通React、Vue等框架，具备良好的代码规范和团队协作能力。',
                    workExperience: [
                        {
                            company: '腾讯科技有限公司',
                            position: '前端开发工程师',
                            startTime: '2021-03',
                            endTime: '至今',
                            description: '负责公司核心产品的前端开发，使用React、Vue等框架进行开发，优化前端性能，提升用户体验。'
                        }
                    ],
                    education: [
                        {
                            school: '北京大学',
                            major: '计算机科学与技术',
                            degree: '本科',
                            time: '2017-2021'
                        }
                    ],
                    projects: [
                        {
                            name: '电商平台前端重构',
                            time: '2023.03-2023.06',
                            role: '前端负责人',
                            description: '负责电商平台的前端重构工作，使用React + TypeScript技术栈，提升了页面加载速度30%。'
                        }
                    ],
                    skills: 'JavaScript, TypeScript, React, Vue, Node.js, Webpack, Git, HTML5, CSS3'
                }
            }
        ];
        saveResumes();
    }
}

// 保存简历数据
function saveResumes() {
    localStorage.setItem('resumes', JSON.stringify(resumes));
}

// 渲染简历列表
function renderResumeList() {
    const listContainer = document.getElementById('resume-list');
    if (!listContainer) return;

    if (resumes.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 mb-4">还没有简历，开始创建吧！</p>
                <button onclick="createNewResume()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    创建新简历
                </button>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = resumes.map(resume => `
        <div class="resume-item" style="cursor: pointer;">
            <div class="resume-info">
                <h4>${resume.name}</h4>
                <p>模板：${getTemplateName(resume.template)} • 最后修改：${formatDate(resume.lastModified)}</p>
            </div>
            <div class="resume-actions">
                <button class="btn-icon" onclick="editResume(${resume.id})" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="previewResume(${resume.id})" title="预览">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="duplicateResume(${resume.id})" title="复制">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-icon text-red-600" onclick="deleteResume(${resume.id})" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 获取模板名称
function getTemplateName(template) {
    const names = {
        classic: '经典模板',
        modern: '现代模板',
        minimal: '简约模板',
        creative: '创意模板'
    };
    return names[template] || '未知模板';
}

// 格式化日期
function formatDate(date) {
    return new Date(date).toLocaleDateString('zh-CN');
}

// 更新统计信息
function updateStats() {
    const totalEl = document.getElementById('total-resumes');
    const recentEl = document.getElementById('recent-resumes');
    
    if (totalEl) {
        totalEl.textContent = resumes.length;
    }
    
    if (recentEl) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentCount = resumes.filter(r => new Date(r.lastModified) >= oneWeekAgo).length;
        recentEl.textContent = recentCount;
    }
}

// 创建新简历
function createNewResume() {
    window.location.href = 'resume-edit.html';
}

// 编辑简历
function editResume(resumeId) {
    event.stopPropagation();
    window.location.href = `resume-edit.html?id=${resumeId}`;
}

// 预览简历
function previewResume(resumeId) {
    event.stopPropagation();
    const resume = resumes.find(r => r.id === resumeId);
    if (resume) {
        showPreviewModal(resume);
    }
}

// 显示预览模态框
function showPreviewModal(resume) {
    const modal = document.getElementById('preview-modal');
    const content = document.getElementById('preview-content');
    
    // 根据模板渲染预览
    content.innerHTML = generatePreviewHTML(resume);
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// 关闭预览模态框
function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// 生成预览HTML
function generatePreviewHTML(resume) {
    const { content } = resume;
    
    return `
        <div class="preview-container">
            <div class="preview-header">
                <div class="preview-name">${content.name || '姓名'}</div>
                <div class="preview-contact">
                    <span>${content.phone || '电话'}</span> | 
                    <span>${content.email || '邮箱'}</span> | 
                    <span>${content.experience || '工作年限'}</span>
                </div>
                <div>${content.position || '求职意向'}</div>
            </div>

            <div class="preview-section">
                <h4>个人简介</h4>
                <div class="preview-content">${content.summary || '个人简介内容'}</div>
            </div>

            ${content.workExperience && content.workExperience.length > 0 ? `
                <div class="preview-section">
                    <h4>工作经历</h4>
                    ${content.workExperience.map(work => `
                        <div style="margin-bottom: 16px;">
                            <strong>${work.company}</strong> - ${work.position} (${work.startTime} - ${work.endTime})
                            <br>${work.description}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${content.education && content.education.length > 0 ? `
                <div class="preview-section">
                    <h4>教育背景</h4>
                    ${content.education.map(edu => `
                        <div style="margin-bottom: 16px;">
                            <strong>${edu.school}</strong> - ${edu.major} (${edu.degree})
                            <br>${edu.time}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${content.projects && content.projects.length > 0 ? `
                <div class="preview-section">
                    <h4>项目经验</h4>
                    ${content.projects.map(project => `
                        <div style="margin-bottom: 16px;">
                            <strong>${project.name}</strong> - ${project.role} (${project.time})
                            <br>${project.description}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${content.skills ? `
                <div class="preview-section">
                    <h4>专业技能</h4>
                    <div class="preview-content">${content.skills}</div>
                </div>
            ` : ''}
        </div>
    `;
}

// 复制简历
function duplicateResume(resumeId) {
    event.stopPropagation();
    const resume = resumes.find(r => r.id === resumeId);
    if (resume) {
        const newResume = {
            ...resume,
            id: Math.max(...resumes.map(r => r.id), 0) + 1,
            name: `${resume.name} - 副本`,
            lastModified: new Date()
        };
        resumes.push(newResume);
        saveResumes();
        renderResumeList();
        updateStats();
    }
}

// 删除简历
function deleteResume(resumeId) {
    event.stopPropagation();
    if (confirm('确定要删除这个简历吗？')) {
        resumes = resumes.filter(r => r.id !== resumeId);
        saveResumes();
        renderResumeList();
        updateStats();
    }
}

// 搜索简历
function filterResumes() {
    const searchTerm = document.getElementById('search-resumes').value.toLowerCase();
    const filteredResumes = resumes.filter(resume => 
        resume.name.toLowerCase().includes(searchTerm) ||
        (resume.content && resume.content.name && resume.content.name.toLowerCase().includes(searchTerm))
    );
    
    const listContainer = document.getElementById('resume-list');
    if (filteredResumes.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">没有找到匹配的简历</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = filteredResumes.map(resume => `
        <div class="resume-item" style="cursor: pointer;">
            <div class="resume-info">
                <h4>${resume.name}</h4>
                <p>模板：${getTemplateName(resume.template)} • 最后修改：${formatDate(resume.lastModified)}</p>
            </div>
            <div class="resume-actions">
                <button class="btn-icon" onclick="editResume(${resume.id})" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="previewResume(${resume.id})" title="预览">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="duplicateResume(${resume.id})" title="复制">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-icon text-red-600" onclick="deleteResume(${resume.id})" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 选择模板
function selectTemplate(template) {
    // 移除所有选中状态
    document.querySelectorAll('.template-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 添加选中状态
    document.querySelector(`.template-${template}`).classList.add('selected');
}

// 暴露全局函数
window.createNewResume = createNewResume;
window.editResume = editResume;
window.previewResume = previewResume;
window.duplicateResume = duplicateResume;
window.deleteResume = deleteResume;
window.closePreviewModal = closePreviewModal;