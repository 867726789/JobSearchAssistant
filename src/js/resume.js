// 简历管理页面JavaScript功能

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
                    summary: '3年前端开发经验，精通React、Vue等框架'
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
                    summary: '5年产品经验，主导多个千万级用户产品'
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
        <div class="resume-item">
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
    
    if (totalEl) totalEl.textContent = resumes.length;
    
    const recentCount = resumes.filter(r => {
        const daysDiff = (new Date() - new Date(r.lastModified)) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
    }).length;
    
    if (recentEl) recentEl.textContent = recentCount;
}

// 创建新简历
function createNewResume() {
    const name = prompt('请输入简历名称：');
    if (name) {
        const newResume = {
            id: Date.now(),
            name: name,
            template: 'modern',
            lastModified: new Date(),
            content: {
                name: '',
                phone: '',
                email: '',
                summary: ''
            }
        };
        
        resumes.unshift(newResume);
        saveResumes();
        renderResumeList();
        updateStats();
    }
}

// 选择模板
function selectTemplate(template) {
    const name = prompt('请输入简历名称：');
    if (name) {
        const newResume = {
            id: Date.now(),
            name: name,
            template: template,
            lastModified: new Date(),
            content: {
                name: '',
                phone: '',
                email: '',
                summary: ''
            }
        };
        
        resumes.unshift(newResume);
        saveResumes();
        renderResumeList();
        updateStats();
    }
}

// 编辑简历
function editResume(id) {
    const resume = resumes.find(r => r.id === id);
    if (resume) {
        const newName = prompt('请输入新的简历名称：', resume.name);
        if (newName) {
            resume.name = newName;
            resume.lastModified = new Date();
            saveResumes();
            renderResumeList();
            updateStats();
        }
    }
}

// 预览简历
function previewResume(id) {
    const resume = resumes.find(r => r.id === id);
    if (resume) {
        alert(`简历预览：\n\n名称：${resume.name}\n模板：${getTemplateName(resume.template)}\n姓名：${resume.content.name || '未填写'}\n电话：${resume.content.phone || '未填写'}\n邮箱：${resume.content.email || '未填写'}\n简介：${resume.content.summary || '未填写'}`);
    }
}

// 复制简历
function duplicateResume(id) {
    const resume = resumes.find(r => r.id === id);
    if (resume) {
        const newResume = {
            ...resume,
            id: Date.now(),
            name: `${resume.name} - 副本`,
            lastModified: new Date()
        };
        resumes.unshift(newResume);
        saveResumes();
        renderResumeList();
        updateStats();
    }
}

// 删除简历
function deleteResume(id) {
    if (confirm('确定要删除这个简历吗？此操作不可恢复。')) {
        resumes = resumes.filter(r => r.id !== id);
        saveResumes();
        renderResumeList();
        updateStats();
    }
}

// 搜索功能
function filterResumes(e) {
    const query = e.target.value.toLowerCase();
    const filtered = resumes.filter(r => 
        r.name.toLowerCase().includes(query) || 
        getTemplateName(r.template).toLowerCase().includes(query)
    );
    
    const listContainer = document.getElementById('resume-list');
    if (listContainer) {
        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-8 text-gray-500">没有找到匹配的简历</div>';
        } else {
            listContainer.innerHTML = filtered.map(resume => `
                <div class="resume-item">
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
    }
}

// 全局函数
window.createNewResume = createNewResume;
window.selectTemplate = selectTemplate;
window.editResume = editResume;
window.previewResume = previewResume;
window.duplicateResume = duplicateResume;
window.deleteResume = deleteResume;