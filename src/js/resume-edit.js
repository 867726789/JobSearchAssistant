// 简历编辑页面JavaScript功能

let resumes = [];
let currentResumeId = null;
let currentResume = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadResumes();
    getResumeIdFromUrl();
    initializeForm();
    bindEvents();
    updatePreview();
});

// 从URL获取简历ID
function getResumeIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    currentResumeId = urlParams.get('id');
    
    if (currentResumeId) {
        currentResumeId = parseInt(currentResumeId);
        currentResume = resumes.find(r => r.id === currentResumeId);
        if (currentResume) {
            loadResumeData(currentResume);
            document.getElementById('deleteBtn').style.display = 'inline-block';
        }
    } else {
        // 创建新简历
        currentResume = {
            name: '',
            template: 'modern',
            content: {
                name: '',
                phone: '',
                email: '',
                experience: '',
                position: '',
                summary: '',
                workExperience: [],
                education: [],
                projects: [],
                skills: ''
            }
        };
    }
}

// 加载简历数据
function loadResumes() {
    const saved = localStorage.getItem('resumes');
    if (saved) {
        resumes = JSON.parse(saved);
    }
}

// 保存简历数据
function saveResumes() {
    localStorage.setItem('resumes', JSON.stringify(resumes));
}

// 初始化表单
function initializeForm() {
    // 模板选择
    document.querySelectorAll('.template-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.template-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            currentResume.template = this.dataset.template;
        });
    });

    // 默认选中模板
    if (currentResume && currentResume.template) {
        document.querySelector(`[data-template="${currentResume.template}"]`).classList.add('selected');
    }
}

// 绑定事件
function bindEvents() {
    // 实时预览
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // 工作经历
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('work-company') || 
            e.target.classList.contains('work-position') || 
            e.target.classList.contains('work-start') || 
            e.target.classList.contains('work-end') || 
            e.target.classList.contains('work-description')) {
            updatePreview();
        }
    });

    // 教育背景
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('education-school') || 
            e.target.classList.contains('education-major') || 
            e.target.classList.contains('education-degree') || 
            e.target.classList.contains('education-time')) {
            updatePreview();
        }
    });

    // 项目经验
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('project-name') || 
            e.target.classList.contains('project-time') || 
            e.target.classList.contains('project-role') || 
            e.target.classList.contains('project-description')) {
            updatePreview();
        }
    });
}

// 加载简历数据到表单
function loadResumeData(resume) {
    const { content } = resume;
    
    // 基本信息
    document.getElementById('detail-name').value = content.name || '';
    document.getElementById('detail-position').value = content.position || '';
    document.getElementById('detail-phone').value = content.phone || '';
    document.getElementById('detail-email').value = content.email || '';
    document.getElementById('detail-experience').value = content.experience || '';
    document.getElementById('detail-summary').value = content.summary || '';
    document.getElementById('detail-skills').value = content.skills || '';

    // 模板选择
    document.querySelector(`[data-template="${resume.template}"]`).classList.add('selected');

    // 工作经历
    if (content.workExperience && content.workExperience.length > 0) {
        document.getElementById('work-experience-container').innerHTML = '';
        content.workExperience.forEach(work => {
            addWorkExperience(work);
        });
    }

    // 教育背景
    if (content.education && content.education.length > 0) {
        document.getElementById('education-container').innerHTML = '';
        content.education.forEach(edu => {
            addEducation(edu);
        });
    }

    // 项目经验
    if (content.projects && content.projects.length > 0) {
        document.getElementById('projects-container').innerHTML = '';
        content.projects.forEach(project => {
            addProject(project);
        });
    }
}

// 更新预览
function updatePreview() {
    const name = document.getElementById('detail-name').value || '姓名';
    const position = document.getElementById('detail-position').value || '求职意向';
    const phone = document.getElementById('detail-phone').value || '电话';
    const email = document.getElementById('detail-email').value || '邮箱';
    const experience = document.getElementById('detail-experience').value || '工作年限';
    const summary = document.getElementById('detail-summary').value || '个人简介内容';
    const skills = document.getElementById('detail-skills').value || '技能内容';

    document.getElementById('preview-name').textContent = name;
    document.getElementById('preview-position').textContent = position;
    document.getElementById('preview-phone').textContent = phone;
    document.getElementById('preview-email').textContent = email;
    document.getElementById('preview-experience').textContent = experience;
    document.getElementById('preview-summary').textContent = summary;
    document.getElementById('preview-skills').textContent = skills;

    // 更新工作经历预览
    updateWorkExperiencePreview();
    // 更新教育背景预览
    updateEducationPreview();
    // 更新项目经验预览
    updateProjectsPreview();
}

// 更新工作经历预览
function updateWorkExperiencePreview() {
    const workItems = document.querySelectorAll('.work-item');
    let html = '';

    workItems.forEach(item => {
        const company = item.querySelector('.work-company').value;
        const position = item.querySelector('.work-position').value;
        const startTime = item.querySelector('.work-start').value;
        const endTime = item.querySelector('.work-end').value;
        const description = item.querySelector('.work-description').value;

        if (company || position) {
            html += `
                <div style="margin-bottom: 16px;">
                    <strong>${company || '公司名称'}</strong> - ${position || '职位'} (${startTime || '开始时间'} - ${endTime || '结束时间'})
                    <br>${description || '工作内容描述'}
                </div>
            `;
        }
    });

    document.getElementById('preview-work-experience').innerHTML = html || '工作经历内容';
}

// 更新教育背景预览
function updateEducationPreview() {
    const educationItems = document.querySelectorAll('.education-item');
    let html = '';

    educationItems.forEach(item => {
        const school = item.querySelector('.education-school').value;
        const major = item.querySelector('.education-major').value;
        const degree = item.querySelector('.education-degree').value;
        const time = item.querySelector('.education-time').value;

        if (school || major) {
            html += `
                <div style="margin-bottom: 16px;">
                    <strong>${school || '学校名称'}</strong> - ${major || '专业'} (${degree || '学历'})
                    <br>${time || '时间'}
                </div>
            `;
        }
    });

    document.getElementById('preview-education').innerHTML = html || '教育背景内容';
}

// 更新项目经验预览
function updateProjectsPreview() {
    const projectItems = document.querySelectorAll('.project-item');
    let html = '';

    projectItems.forEach(item => {
        const name = item.querySelector('.project-name').value;
        const time = item.querySelector('.project-time').value;
        const role = item.querySelector('.project-role').value;
        const description = item.querySelector('.project-description').value;

        if (name || role) {
            html += `
                <div style="margin-bottom: 16px;">
                    <strong>${name || '项目名称'}</strong> - ${role || '角色'} (${time || '时间'})
                    <br>${description || '项目描述'}
                </div>
            `;
        }
    });

    document.getElementById('preview-projects').innerHTML = html || '项目经验内容';
}

// 添加工作经历
function addWorkExperience(workData = {}) {
    const container = document.getElementById('work-experience-container');
    const div = document.createElement('div');
    div.className = 'work-item mb-4 p-4 border rounded-lg';
    div.innerHTML = `
        <button type="button" onclick="removeItem(this)" class="float-right text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-grid form-grid-2">
            <div class="form-field">
                <label>公司名称</label>
                <input type="text" class="work-company" placeholder="公司名称" value="${workData.company || ''}">
            </div>
            <div class="form-field">
                <label>职位</label>
                <input type="text" class="work-position" placeholder="职位" value="${workData.position || ''}">
            </div>
        </div>
        <div class="form-grid form-grid-2">
            <div class="form-field">
                <label>开始时间</label>
                <input type="month" class="work-start" value="${workData.startTime || ''}">
            </div>
            <div class="form-field">
                <label>结束时间</label>
                <input type="month" class="work-end" value="${workData.endTime || ''}">
            </div>
        </div>
        <div class="form-field">
            <label>工作内容</label>
            <textarea class="work-description" rows="3" 
                      placeholder="描述你的主要工作内容和成就...">${workData.description || ''}</textarea>
        </div>
    `;
    container.appendChild(div);
}

// 添加教育背景
function addEducation(eduData = {}) {
    const container = document.getElementById('education-container');
    const div = document.createElement('div');
    div.className = 'education-item mb-4 p-4 border rounded-lg';
    div.innerHTML = `
        <button type="button" onclick="removeItem(this)" class="float-right text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-grid form-grid-2">
            <div class="form-field">
                <label>学校名称</label>
                <input type="text" class="education-school" placeholder="学校名称" value="${eduData.school || ''}">
            </div>
            <div class="form-field">
                <label>专业</label>
                <input type="text" class="education-major" placeholder="专业" value="${eduData.major || ''}">
            </div>
        </div>
        <div class="form-grid form-grid-2">
            <div class="form-field">
                <label>学历</label>
                <select class="education-degree">
                    <option value="">请选择</option>
                    <option value="高中" ${eduData.degree === '高中' ? 'selected' : ''}>高中</option>
                    <option value="专科" ${eduData.degree === '专科' ? 'selected' : ''}>专科</option>
                    <option value="本科" ${eduData.degree === '本科' ? 'selected' : ''}>本科</option>
                    <option value="硕士" ${eduData.degree === '硕士' ? 'selected' : ''}>硕士</option>
                    <option value="博士" ${eduData.degree === '博士' ? 'selected' : ''}>博士</option>
                </select>
            </div>
            <div class="form-field">
                <label>时间</label>
                <input type="text" class="education-time" placeholder="2017-2021" value="${eduData.time || ''}">
            </div>
        </div>
    `;
    container.appendChild(div);
}

// 添加项目经验
function addProject(projectData = {}) {
    const container = document.getElementById('projects-container');
    const div = document.createElement('div');
    div.className = 'project-item mb-4 p-4 border rounded-lg';
    div.innerHTML = `
        <button type="button" onclick="removeItem(this)" class="float-right text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-field">
            <label>项目名称</label>
            <input type="text" class="project-name" placeholder="项目名称" value="${projectData.name || ''}">
        </div>
        <div class="form-grid form-grid-2">
            <div class="form-field">
                <label>时间</label>
                <input type="text" class="project-time" placeholder="2023.03-2023.06" value="${projectData.time || ''}">
            </div>
            <div class="form-field">
                <label>角色</label>
                <input type="text" class="project-role" placeholder="前端开发" value="${projectData.role || ''}">
            </div>
        </div>
        <div class="form-field">
            <label>项目描述</label>
            <textarea class="project-description" rows="3" 
                      placeholder="描述项目背景、你的职责和成果...">${projectData.description || ''}</textarea>
        </div>
    `;
    container.appendChild(div);
}

// 移除项目
function removeItem(button) {
    button.parentElement.remove();
    updatePreview();
}

// 保存简历
function saveResume() {
    const name = document.getElementById('detail-name').value;
    const position = document.getElementById('detail-position').value;
    const phone = document.getElementById('detail-phone').value;
    const email = document.getElementById('detail-email').value;
    const experience = document.getElementById('detail-experience').value;
    const summary = document.getElementById('detail-summary').value;
    const skills = document.getElementById('detail-skills').value;

    // 验证必填字段
    if (!name || !position || !phone || !email || !summary) {
        alert('请填写所有必填字段');
        return;
    }

    // 收集工作经历
    const workExperience = [];
    document.querySelectorAll('.work-item').forEach(item => {
        const company = item.querySelector('.work-company').value;
        const position = item.querySelector('.work-position').value;
        const startTime = item.querySelector('.work-start').value;
        const endTime = item.querySelector('.work-end').value;
        const description = item.querySelector('.work-description').value;
        
        if (company || position) {
            workExperience.push({ company, position, startTime, endTime, description });
        }
    });

    // 收集教育背景
    const education = [];
    document.querySelectorAll('.education-item').forEach(item => {
        const school = item.querySelector('.education-school').value;
        const major = item.querySelector('.education-major').value;
        const degree = item.querySelector('.education-degree').value;
        const time = item.querySelector('.education-time').value;
        
        if (school || major) {
            education.push({ school, major, degree, time });
        }
    });

    // 收集项目经验
    const projects = [];
    document.querySelectorAll('.project-item').forEach(item => {
        const name = item.querySelector('.project-name').value;
        const time = item.querySelector('.project-time').value;
        const role = item.querySelector('.project-role').value;
        const description = item.querySelector('.project-description').value;
        
        if (name || role) {
            projects.push({ name, time, role, description });
        }
    });

    // 获取选中的模板
    const selectedTemplate = document.querySelector('.template-option.selected');
    const template = selectedTemplate ? selectedTemplate.dataset.template : 'modern';

    // 构建简历数据
    const resumeData = {
        name: `${name} - ${position}`,
        template: template,
        content: {
            name,
            position,
            phone,
            email,
            experience,
            summary,
            skills,
            workExperience,
            education,
            projects
        },
        lastModified: new Date()
    };

    if (currentResumeId) {
        // 更新现有简历
        const index = resumes.findIndex(r => r.id === currentResumeId);
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

    saveResumes();
    goBack();
}

// 删除简历
function deleteResume() {
    if (currentResumeId && confirm('确定要删除这个简历吗？')) {
        resumes = resumes.filter(r => r.id !== currentResumeId);
        saveResumes();
        goBack();
    }
}

// 返回列表
function goBack() {
    window.location.href = 'resume-list.html';
}