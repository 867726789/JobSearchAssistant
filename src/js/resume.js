// 简历管理页面JavaScript功能

// 全局变量
let resumes = [];
let currentResume = null;
let editingResumeId = null;

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

    // 创建简历按钮
    const createBtn = document.querySelector('button[onclick="createNewResume()"]');
    if (createBtn) {
        createBtn.addEventListener('click', createNewResume);
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
                    summary: '3年前端开发经验，精通React、Vue等框架',
                    workExperience: '腾讯科技有限公司 - 前端开发工程师 (2021-至今)\n- 负责公司核心产品的前端开发\n- 使用React、Vue等框架进行开发\n- 优化前端性能，提升用户体验',
                    education: '北京大学 - 计算机科学与技术 本科 (2017-2021)',
                    skills: 'JavaScript, TypeScript, React, Vue, Node.js, Webpack, Git'
                }
            },
            {
                id: 2,
                name: '产品经理',
                template: 'classic',
                lastModified: new Date('2024-01-10'),
                content: {
                    name: '李四',
                    phone: '139****9999',
                    email: 'lisi@example.com',
                    summary: '5年产品经验，主导多个千万级用户产品',
                    workExperience: '阿里巴巴集团 - 高级产品经理 (2019-至今)\n- 负责淘宝首页产品规划与设计\n- 主导用户增长项目，提升DAU 30%\n- 协调技术、设计、运营等多部门合作',
                    education: '清华大学 - 工商管理 硕士 (2017-2019)\n浙江大学 - 计算机科学 本科 (2013-2017)',
                    skills: '产品规划, 用户研究, 数据分析, 项目管理, Axure, Sketch'
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
        <div class="resume-item" onclick="openResumeEditor(${resume.id})" style="cursor: pointer;">
            <div class="resume-info">
                <h4>${resume.name}</h4>
                <p>模板：${getTemplateName(resume.template)} • 最后修改：${formatDate(resume.lastModified)}</p>
            </div>
            <div class="resume-actions" onclick="event.stopPropagation()">
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

// 打开简历编辑器（点击简历项）
function openResumeEditor(resumeId) {
    const resume = resumes.find(r => r.id === resumeId);
    if (resume) {
        editingResumeId = resumeId;
        showEditModal(resume);
    }
}

// 创建新简历
function createNewResume() {
    editingResumeId = null;
    showEditModal({
        name: '',
        template: 'modern',
        content: {
            name: '',
            phone: '',
            email: '',
            summary: '',
            workExperience: '',
            education: '',
            skills: ''
        }
    });
}

// 编辑简历
function editResume(resumeId) {
    event.stopPropagation();
    const resume = resumes.find(r => r.id === resumeId);
    if (resume) {
        editingResumeId = resumeId;
        showEditModal(resume);
    }
}

// 显示编辑模态框
function showEditModal(resume) {
    const modal = document.getElementById('resume-edit-modal');
    const form = document.getElementById('resume-edit-form');
    const title = document.getElementById('modal-title');
    
    // 设置标题
    title.textContent = editingResumeId ? '编辑简历' : '创建新简历';
    
    // 填充表单数据
    document.getElementById('resume-name').value = resume.name || '';
    document.getElementById('resume-template').value = resume.template || 'modern';
    document.getElementById('person-name').value = resume.content.name || '';
    document.getElementById('person-phone').value = resume.content.phone || '';
    document.getElementById('person-email').value = resume.content.email || '';
    document.getElementById('person-summary').value = resume.content.summary || '';
    document.getElementById('work-experience').value = resume.content.workExperience || '';
    document.getElementById('education').value = resume.content.education || '';
    document.getElementById('skills').value = resume.content.skills || '';
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
}

// 关闭编辑模态框
function closeEditModal() {
    const modal = document.getElementById('resume-edit-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    editingResumeId = null;
}

// 保存简历
function saveResume() {
    const form = document.getElementById('resume-edit-form');
    
    // 获取表单数据
    const resumeData = {
        name: document.getElementById('resume-name').value,
        template: document.getElementById('resume-template').value,
        content: {
            name: document.getElementById('person-name').value,
            phone: document.getElementById('person-phone').value,
            email: document.getElementById('person-email').value,
            summary: document.getElementById('person-summary').value,
            workExperience: document.getElementById('work-experience').value,
            education: document.getElementById('education').value,
            skills: document.getElementById('skills').value
        },
        lastModified: new Date()
    };
    
    // 验证必填字段
    if (!resumeData.name || !resumeData.content.name) {
        alert('请填写简历名称和姓名');
        return;
    }
    
    if (editingResumeId) {
        // 更新现有简历
        const index = resumes.findIndex(r => r.id === editingResumeId);
        if (index !== -1) {
            resumes[index] = { ...resumes[index], ...resumeData };
        }
    } else {
        // 创建新简历
        const newId = Math.max(...resumes.map(r => r.id), 0) + 1;
        resumes.push({
            id: newId,
            ...resumeData
        });
    }
    
    // 保存并刷新
    saveResumes();
    renderResumeList();
    updateStats();
    closeEditModal();
}

// 预览简历
function previewResume(resumeId) {
    event.stopPropagation();
    const resume = resumes.find(r => r.id === resumeId);
    if (resume) {
        // 这里可以实现预览功能，例如打开新窗口或模态框
        alert(`预览简历：${resume.name}\n模板：${getTemplateName(resume.template)}`);
    }
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
        resume.content.name.toLowerCase().includes(searchTerm)
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
        <div class="resume-item" onclick="openResumeEditor(${resume.id})" style="cursor: pointer;">
            <div class="resume-info">
                <h4>${resume.name}</h4>
                <p>模板：${getTemplateName(resume.template)} • 最后修改：${formatDate(resume.lastModified)}</p>
            </div>
            <div class="resume-actions" onclick="event.stopPropagation()">
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
    
    // 如果正在编辑，更新模板
    if (editingResumeId || document.getElementById('resume-edit-modal').style.display === 'flex') {
        document.getElementById('resume-template').value = template;
    }
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('resume-edit-modal');
    if (event.target === modal) {
        closeEditModal();
    }
}

// 暴露全局函数
window.createNewResume = createNewResume;
window.openResumeEditor = openResumeEditor;
window.editResume = editResume;
window.previewResume = previewResume;
window.duplicateResume = duplicateResume;
window.deleteResume = deleteResume;
window.selectTemplate = selectTemplate;
window.closeEditModal = closeEditModal;
window.saveResume = saveResume;