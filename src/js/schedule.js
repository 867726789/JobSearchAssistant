// 全局变量
let currentDate = new Date();
let selectedDate = new Date();
let events = [];
let selectedEventId = null;
let contextMenuEvent = null;

// 侧边栏功能
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

function toggleMobileSidebar() {
    sidebar.classList.toggle('mobile-open');
}

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('mobile-open');
        }
    });
});

function handleResize() {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('mobile-open');
    }
}

window.addEventListener('resize', handleResize);
handleResize();

// 日历功能
function generateCalendar(year, month) {
    const calendar = document.getElementById('calendar');
    const title = document.getElementById('calendarTitle');
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    title.textContent = `${year}年${month + 1}月`;
    
    calendar.innerHTML = '';
    
    // 添加星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // 生成日期
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        if (date.getMonth() !== month) {
            dayDiv.classList.add('other-month');
        }
        
        if (date.toDateString() === selectedDate.toDateString()) {
            dayDiv.classList.add('selected');
        }
        
        // 检查是否有事件
        const hasEvents = events.some(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === date.toDateString();
        });
        
        if (hasEvents) {
            dayDiv.classList.add('has-events');
        }
        
        dayDiv.innerHTML = `
            <div class="calendar-day-number">${date.getDate()}</div>
        `;
        
        dayDiv.addEventListener('click', () => selectDate(date));
        calendar.appendChild(dayDiv);
    }
}

function selectDate(date) {
    selectedDate = new Date(date);
    currentDate = new Date(date);
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    updateTimeline();
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
}

function goToToday() {
    selectedDate = new Date();
    currentDate = new Date();
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    updateTimeline();
}

// 时间轴功能
function updateTimeline() {
    const timeline = document.getElementById('timeline');
    const selectedDateText = document.getElementById('selectedDate');
    const conflictWarning = document.getElementById('conflictWarning');
    const conflictText = document.getElementById('conflictText');
    
    selectedDateText.textContent = selectedDate.toLocaleDateString('zh-CN');
    
    const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === selectedDate.toDateString();
    }).sort((a, b) => new Date(a.start) - new Date(b.start));
    
    if (dayEvents.length === 0) {
        timeline.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-calendar-day text-4xl mb-4 opacity-50"></i>
                <p>今天没有安排</p>
            </div>
        `;
        conflictWarning.style.display = 'none';
        return;
    }
    
    // 检测冲突
    const conflicts = [];
    for (let i = 0; i < dayEvents.length - 1; i++) {
        const current = dayEvents[i];
        const next = dayEvents[i + 1];
        
        if (new Date(current.end) > new Date(next.start)) {
            conflicts.push(`${current.title} 和 ${next.title}`);
        }
    }
    
    if (conflicts.length > 0) {
        conflictText.textContent = `时间冲突：${conflicts.join('、')}`;
        conflictWarning.style.display = 'block';
    } else {
        conflictWarning.style.display = 'none';
    }
    
    timeline.innerHTML = dayEvents.map(event => {
        const startTime = new Date(event.start).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(event.end).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const hasConflict = conflicts.some(c => c.includes(event.title));
        
        return `
            <div class="timeline-item ${hasConflict ? 'conflict' : ''}" 
                 data-event-id="${event.id}"
                 oncontextmenu="showContextMenu(event, ${event.id})"
                 onclick="editEvent(${event.id})">
                <div class="timeline-time">${startTime} - ${endTime}</div>
                <div class="timeline-content ${event.type}">
                    <div class="font-semibold">${event.title}</div>
                    ${event.description ? `<div class="text-sm text-gray-600 mt-1">${event.description}</div>` : ''}
                    <div class="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                        <button onclick="event.stopPropagation(); editEvent(${event.id})" 
                                class="text-blue-500 hover:text-blue-700 mr-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="event.stopPropagation(); deleteEvent(${event.id})" 
                                class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 事件管理
function showAddEventModal() {
    document.getElementById('modalTitle').textContent = '添加新日程';
    document.getElementById('eventId').value = '';
    document.getElementById('eventForm').reset();
    
    const startInput = document.getElementById('eventStart');
    const endInput = document.getElementById('eventEnd');
    
    const startDate = new Date(selectedDate);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(10, 0, 0, 0);
    
    startInput.value = startDate.toISOString().slice(0, 16);
    endInput.value = endDate.toISOString().slice(0, 16);
    
    document.getElementById('eventModal').classList.remove('hidden');
}

function showEditEventModal(event) {
    document.getElementById('modalTitle').textContent = '编辑日程';
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventType').value = event.type;
    document.getElementById('eventStart').value = event.start;
    document.getElementById('eventEnd').value = event.end;
    document.getElementById('eventDescription').value = event.description || '';
    
    document.getElementById('eventModal').classList.remove('hidden');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
    document.getElementById('eventForm').reset();
}

function editEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        showEditEventModal(event);
    }
}

async function deleteEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const result = await Swal.fire({
        title: '确认删除',
        text: `确定要删除 "${event.title}" 吗？`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
        events = events.filter(e => e.id !== eventId);
        saveEvents();
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        updateTimeline();
        
        Swal.fire({
            title: '已删除',
            text: '日程已删除',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    }
}

// 右键菜单功能
function showContextMenu(event, eventId) {
    event.preventDefault();
    contextMenuEvent = eventId;
    
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
}

function editEventFromContext() {
    if (contextMenuEvent) {
        editEvent(contextMenuEvent);
        hideContextMenu();
    }
}

function deleteEventFromContext() {
    if (contextMenuEvent) {
        deleteEvent(contextMenuEvent);
        hideContextMenu();
    }
}

function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
    contextMenuEvent = null;
}

// 点击空白处关闭右键菜单
document.addEventListener('click', hideContextMenu);

// 同步面试功能
async function syncInterviews() {
    try {
        const companies = JSON.parse(localStorage.getItem('autumnRecruitmentCompanies') || '[]');
        const interviews = companies.filter(c => c.interviewStartTime && c.interviewEndTime);
        
        interviews.forEach(company => {
            const existingEvent = events.find(e => 
                e.companyId === company.id && 
                new Date(e.start).toDateString() === new Date(company.interviewStartTime).toDateString()
            );
            
            if (!existingEvent) {
                events.push({
                    id: Date.now() + Math.random(),
                    companyId: company.id,
                    title: `${company.name} 面试`,
                    type: 'interview',
                    start: company.interviewStartTime,
                    end: company.interviewEndTime,
                    description: `${company.position || '岗位'} - ${company.location || '地点未指定'}`
                });
            }
        });
        
        saveEvents();
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        updateTimeline();
        
        Swal.fire({
            title: '同步成功',
            text: `已同步 ${interviews.length} 个面试安排`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        Swal.fire({
            title: '同步失败',
            text: '无法读取面试数据',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// 表单提交
document.getElementById('eventForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value;
    const type = document.getElementById('eventType').value;
    const start = document.getElementById('eventStart').value;
    const end = document.getElementById('eventEnd').value;
    const description = document.getElementById('eventDescription').value;
    
    if (new Date(start) >= new Date(end)) {
        Swal.fire({
            title: '错误',
            text: '结束时间必须晚于开始时间',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }
    
    const eventData = {
        id: id ? parseInt(id) : Date.now(),
        title,
        type,
        start,
        end,
        description
    };
    
    if (id) {
        // 编辑现有事件
        const index = events.findIndex(e => e.id === parseInt(id));
        if (index !== -1) {
            events[index] = eventData;
        }
    } else {
        // 添加新事件
        events.push(eventData);
    }
    
    saveEvents();
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    updateTimeline();
    closeEventModal();
    
    Swal.fire({
        title: id ? '更新成功' : '添加成功',
        text: id ? '日程已更新' : '日程已添加',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
});

// 点击模态框外部关闭
document.getElementById('eventModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('eventModal')) {
        closeEventModal();
    }
});

// 数据存储
function saveEvents() {
    localStorage.setItem('scheduleEvents', JSON.stringify(events));
}

function loadEvents() {
    const saved = localStorage.getItem('scheduleEvents');
    events = saved ? JSON.parse(saved) : [];
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    updateTimeline();
    
    // 自动同步面试
    syncInterviews();
});