// --- My Firebase Configuration --- //
const firebaseConfig = {
  apiKey: "AIzaSyB2sC5VOGzpFPKwWHKfchYsayGUOqZiou8",
  authDomain: "to-do-list-app-b322d.firebaseapp.com",
  projectId: "to-do-list-app-b322d",
  storageBucket: "to-do-list-app-b322d.firebasestorage.app",
  messagingSenderId: "501063235029",
  appId: "1:501063235029:web:fd27e3fe350b27b898f95c",
  measurementId: "G-8ZKXR2X9X4"
};

// --- Firebase Initialization --- //
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const messaging = firebase.messaging();

// --- My DOM Elements --- //
const signinPage = document.getElementById('signin-page'), signupPage = document.getElementById('signup-page');
const todoPage = document.getElementById('todo-page'), profilePage = document.getElementById('profile-page');
const signinLink = document.getElementById('signin-link'), signupLink = document.getElementById('signup-link');
const profileMenu = document.getElementById('profile-menu'), profileDropdown = document.querySelector('.profile-dropdown');
const profileLink = document.getElementById('profile-link'), logoutBtn = document.getElementById('logout-btn');
const logo = document.querySelector('.logo'), backBtn = document.getElementById('back-btn');
const signinForm = document.getElementById('signin-form'), signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup'), showSignin = document.getElementById('show-signin');
const signinEmailInput = document.getElementById('signin-email'), signinPasswordInput = document.getElementById('signin-password');
const signupEmailInput = document.getElementById('signup-email'), signupPasswordInput = document.getElementById('signup-password');
const profileForm = document.getElementById('profile-form'), displayNameInput = document.getElementById('profile-name');
const profilePhotoInput = document.getElementById('profile-photo-input'), profilePhotoPreview = document.getElementById('profile-photo-preview');
const menuProfilePhoto = document.getElementById('menu-profile-photo');
const statTotal = document.getElementById('stat-total'), statCompleted = document.getElementById('stat-completed');
const statPending = document.getElementById('stat-pending');
const themeToggle = document.getElementById('theme-toggle'), accentColorPicker = document.getElementById('accent-color-picker');
const layoutSwitcher = document.getElementById('layout-switcher');
const taskListView = document.getElementById('task-list-view'), taskBoardView = document.getElementById('task-board-view');
const calendarView = document.getElementById('calendar-view'), addTaskBtn = document.getElementById('add-task-btn');
const statusFilters = document.getElementById('status-filters'), categoryFilters = document.getElementById('category-filters');
const priorityFilters = document.getElementById('priority-filters');
const searchInput = document.getElementById('search-input');
const taskModal = document.getElementById('task-modal'), taskModalTitle = document.getElementById('modal-title');
const taskForm = document.getElementById('task-form'), taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('task-priority'), taskStatusSelect = document.getElementById('task-status');
const deadlineDateInput = document.getElementById('task-deadline-date'), deadlineTimeInput = document.getElementById('task-deadline-time');
const categorySelect = document.getElementById('task-category'), customCategoryInput = document.getElementById('custom-category-input');
const subtaskInput = document.getElementById('subtask-input'), subtaskAddBtn = document.getElementById('subtask-add-btn');
const subtaskList = document.getElementById('subtask-list'), cancelTaskBtn = document.getElementById('modal-cancel-btn');
const saveTaskBtn = document.getElementById('modal-save-btn');
const taskDetailModal = document.getElementById('task-detail-modal'), detailTaskTitle = document.getElementById('detail-task-title-full');
const detailSubtaskList = document.getElementById('detail-subtask-list');
const detailSubtaskInput = document.getElementById('detail-subtask-input'), detailSubtaskAddBtn = document.getElementById('detail-subtask-add-btn');
const detailAttachmentsList = document.getElementById('detail-attachments-list');
const detailCommentsList = document.getElementById('detail-comments-list'), detailCommentForm = document.getElementById('detail-comment-form');
const detailCommentInput = document.getElementById('detail-comment-input'), detailCloseBtn = document.getElementById('detail-close-btn');
const taskAttachmentsInput = document.getElementById('task-attachments-input'), attachmentsListModal = document.getElementById('attachments-list-modal');
const signinFeedback = document.getElementById('signin-feedback'), signupFeedback = document.getElementById('signup-feedback');
const profileFeedback = document.getElementById('profile-feedback');
const voiceAddTaskBtn = document.getElementById('voice-add-btn');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');
const aiSuggestionBox = document.getElementById('ai-suggestion-box');
const modeToggle = document.getElementById('mode-toggle-checkbox');


// --- App State --- //
let allTasks = [], currentUser = null, currentUserProfile = {};
let userPreferences = { theme: 'light', layout: 'list', accentColor: '#d4a373', calendarDefault: 'monthly' };
let currentStatusFilter = 'all', currentCategoryFilter = 'all', currentPriorityFilter = 'all', currentSearchTerm = '';
let selectedDateFilter = null;
let editingTaskId = null, detailTaskId = null;
let existingAttachments = [];
let originalAttachmentsBeforeEdit = [];
let calendarDate = new Date();
let calendarMode = userPreferences.calendarDefault;
let unsubscribeTasks, unsubscribeProfile, unsubscribeComments, unsubscribeUpdateLog;
const accentColors = ['#d4a373', '#f07167', '#00afb9', '#9d4edd', '#fb8500'];
let conversationCreationLocks = new Map();
let isPostingComment = false;
let activeListenerToken = null; 
let lastCommentTime = 0; 

// --- File Upload State --- //
const MAX_FILE_SIZE_MB = 10;
const MAX_TOTAL_UPLOAD_MB = 50;
const ALLOWED_FILE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/gif': ['.gif'], 'image/webp': ['.webp'], 'image/heic': ['.heic'],
    'application/pdf': ['.pdf'], 'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
};
let filesToUpload = []; // Stores objects: { file, id, progress, status, error }


// --- Initializations --- //
let datePicker, timePicker, dateFilterInstance;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
}

// --- Page & UI Management --- //
const showPage = (pageId) => {
    [signinPage, signupPage, todoPage, profilePage].forEach(page => page.classList.add('hide'));
    document.getElementById(pageId).classList.remove('hide');
    backBtn.classList.toggle('hide', pageId !== 'profile-page');
    logo.classList.toggle('hide', pageId === 'profile-page');
};

const showFeedback = (element, message, type) => {
    element.textContent = message;
    element.className = 'feedback ' + type;
    setTimeout(() => { element.textContent = ''; element.className = 'feedback'; }, 4000);
};

const updateUIforLoginState = (user) => {
    currentUser = user;
    if (user) {
        [signinLink, signupLink].forEach(el => el.classList.add('hide'));
        profileMenu.classList.remove('hide');
        showPage('todo-page');
        listenForProfile();
        listenForTasks();
    } else {
        [signinLink, signupLink].forEach(el => el.classList.remove('hide'));
        profileMenu.classList.add('hide');
        showPage('signin-page');
        if (unsubscribeTasks) unsubscribeTasks();
        if (unsubscribeProfile) unsubscribeProfile();
        cleanupCommentListener();
        allTasks = [];
        currentUserProfile = {};
        applyUserPreferences({});
        renderAll();
    }
};

const applyUserPreferences = (prefs = {}) => {
    userPreferences = { theme: 'light', layout: 'list', accentColor: '#d4a373', calendarDefault: 'monthly', ...prefs };
    calendarMode = userPreferences.calendarDefault;
    document.body.classList.toggle('dark-theme', userPreferences.theme === 'dark');
    if(themeToggle) themeToggle.checked = userPreferences.theme === 'dark';

    document.querySelectorAll('input[name="layout"]').forEach(input => {
        if(input.value === userPreferences.layout) input.checked = true;
    });

    document.querySelectorAll('input[name="calendar-default"]').forEach(input => {
        if(input.value === userPreferences.calendarDefault) input.checked = true;
    });

    if(taskListView) taskListView.classList.toggle('hide', userPreferences.layout !== 'list');
    if(taskBoardView) taskBoardView.classList.toggle('hide', userPreferences.layout !== 'board');
    if (calendarView) calendarView.classList.toggle('hide', userPreferences.layout !== 'calendar');
    document.documentElement.style.setProperty('--primary-color', userPreferences.accentColor);
    document.documentElement.style.setProperty('--primary-hover', shadeColor(userPreferences.accentColor, -15));
    accentColorPicker?.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.toggle('active', swatch.dataset.color === userPreferences.accentColor);
    });
};

// --- Data Listeners --- //
const listenForProfile = () => {
    if (!currentUser) return;
    if (unsubscribeProfile) unsubscribeProfile();
    unsubscribeProfile = db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
        if (doc.exists) {
            currentUserProfile = { id: doc.id, ...doc.data() };
            if(displayNameInput) displayNameInput.value = currentUserProfile.displayName || '';
            const photoURL = currentUserProfile.photoURL || 'https://placehold.co/100x100/d4a373/fefae0?text=User';
            if(profilePhotoPreview) profilePhotoPreview.src = photoURL;
            if(menuProfilePhoto) menuProfilePhoto.src = photoURL;
            applyUserPreferences(currentUserProfile.preferences);
        }
    });
};

const listenForTasks = () => {
    if (!currentUser) return;
    if (unsubscribeTasks) unsubscribeTasks();
    unsubscribeTasks = db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAll();
        });
};

// --- Main Render Functions --- //
const renderAll = () => {
    updateTaskCounters();
    renderCategoryFilters();
    renderCurrentView();
};

const renderCurrentView = () => {
    if (userPreferences.layout === 'list') renderListView();
    else if (userPreferences.layout === 'board') renderBoardView();
    else if (userPreferences.layout === 'calendar') renderCalendarView();
};

const getFilteredTasks = () => {
    const searchTerm = currentSearchTerm;
    let tasksToFilter = allTasks;

    if (selectedDateFilter) {
        tasksToFilter = tasksToFilter.filter(task => {
            if (!task.deadline || !task.deadline.seconds) return false;
            const taskDate = new Date(task.deadline.seconds * 1000);
            return taskDate.toDateString() === selectedDateFilter.toDateString();
        });
    }

    return tasksToFilter.filter(task => {
        const searchMatch = searchTerm === '' ||
            (task.text && task.text.toLowerCase().includes(searchTerm)) ||
            (task.category && task.category.toLowerCase().includes(searchTerm));

        const statusMatch = currentStatusFilter === 'all' ||
            (currentStatusFilter === 'pending' && task.status !== 'completed') ||
            (currentStatusFilter === 'completed' && task.status === 'completed');

        const categoryMatch = currentCategoryFilter === 'all' || task.category === currentCategoryFilter;
        const priorityMatch = currentPriorityFilter === 'all' || task.priority === currentPriorityFilter;

        return searchMatch && statusMatch && categoryMatch && priorityMatch;
    });
};

const renderListView = () => {
    if (!taskListView) return;
    const filteredTasks = getFilteredTasks();
    taskListView.innerHTML = '';
    if (filteredTasks.length === 0) {
        taskListView.innerHTML = `<p class="no-tasks">No tasks found. Try adjusting your filters!</p>`;
        return;
    }
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        const isCompleted = task.status === 'completed' || (task.assignedTo && task.assignedTo.status === 'completed');
        taskItem.className = `task-item ${isCompleted ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        taskItem.dataset.priority = task.priority || 'low';

        const deadlineDate = task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleDateString() : '';
        const deadlineTime = task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        let teamTagHTML = '';
        if (task.sharedBy) {
            teamTagHTML = `<div class="team-tag shared-by"><i class="fas fa-user-friends"></i> Shared by ${task.sharedBy.name}</div>`;
        } else if (task.assignedBy) {
            teamTagHTML = `<div class="team-tag assigned-by"><i class="fas fa-user-check"></i> Assigned by ${task.assignedBy.name}</div>`;
        } else if (task.assignedTo) {
            if (task.assignedTo.status === 'completed') {
                const completedDate = task.assignedTo.completedAt ? new Date(task.assignedTo.completedAt.seconds * 1000).toLocaleDateString() : '';
                teamTagHTML = `<div class="team-tag assigned-to completed"><i class="fas fa-check-double"></i> Completed by ${task.assignedTo.name} on ${completedDate}</div>`;
            } else {
                teamTagHTML = `<div class="team-tag assigned-to"><i class="fas fa-user-clock"></i> Assigned to ${task.assignedTo.name}</div>`;
            }
        }

        taskItem.innerHTML = `
            <div class="share-checkbox-wrapper"></div>
            <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
            <div class="task-content">
                <h3>${task.text}</h3>
                <div class="task-meta">
                    ${task.category ? `<span><i class="fas fa-tag"></i> ${task.category}</span>` : ''}
                    ${deadlineDate ? `<span><i class="fas fa-calendar-alt"></i> ${deadlineDate}</span>` : ''}
                    ${deadlineTime ? `<span><i class="fas fa-clock"></i> ${deadlineTime}</span>` : ''}
                </div>
                ${teamTagHTML}
            </div>
            <div class="task-actions">
                <button class="comment-btn"><i class="fas fa-comments"></i></button>
                <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        taskListView.appendChild(taskItem);
    });

    if (typeof toggleSelectionCheckboxesVisibility === 'function' && typeof currentTeamAction !== 'undefined' && currentTeamAction) {
        toggleSelectionCheckboxesVisibility(true, currentTeamAction);
    }
};


const renderBoardView = () => {
    if (!taskBoardView) return;
    const filteredTasks = getFilteredTasks();

    taskBoardView.innerHTML = `
        <div class="task-column"><h3>To-Do</h3><div class="task-cards" data-status="todo"></div></div>
        <div class="task-column"><h3>In Progress</h3><div class="task-cards" data-status="inprogress"></div></div>
        <div class="task-column"><h3>Completed</h3><div class="task-cards" data-status="completed"></div></div>
    `;

    if (filteredTasks.length === 0) {
        taskBoardView.innerHTML = `<p class="no-tasks">No tasks found. Try adjusting your filters!</p>`;
        return;
    }

    const containers = {
        todo: taskBoardView.querySelector('.task-cards[data-status="todo"]'),
        inprogress: taskBoardView.querySelector('.task-cards[data-status="inprogress"]'),
        completed: taskBoardView.querySelector('.task-cards[data-status="completed"]')
    };

    filteredTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card-board';
        card.dataset.id = task.id;
        card.dataset.priority = task.priority || 'low';
        card.draggable = true;
        card.innerHTML = `<h4>${task.text}</h4><p>${task.category || ''}</p>`;
        const container = containers[task.status || 'todo'];
        if (container) container.appendChild(card);
    });

    taskBoardView.querySelectorAll('.task-card-board').forEach(card => {
        card.addEventListener('dragstart', e => {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
        });
        card.addEventListener('dragend', e => e.target.classList.remove('dragging'));
    });
    taskBoardView.querySelectorAll('.task-cards').forEach(column => {
        column.addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
        column.addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
        column.addEventListener('drop', e => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = e.currentTarget.dataset.status;
            const task = allTasks.find(t => t.id === taskId);
            if (task && task.status !== newStatus) {
                db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId).update({ status: newStatus });
                addUpdateLog(taskId, 'status', { oldValue: task.status, newValue: newStatus });
            }
        });
    });
};

const renderCalendarView = () => {
    if (!calendarView) return;
    const year = calendarDate.getFullYear(), month = calendarDate.getMonth(), day = calendarDate.getDate();

    calendarView.innerHTML = `
        <div class="calendar-header">
             <div class="calendar-mode-toggle">
                <button data-mode="monthly" class="toggle-btn ${calendarMode === 'monthly' ? 'active' : ''}">Month</button>
                <button data-mode="weekly" class="toggle-btn ${calendarMode === 'weekly' ? 'active' : ''}">Week</button>
            </div>
            <button id="prev-btn"><i class="fas fa-chevron-left"></i></button>
            <h2 id="calendar-title"></h2>
            <button id="next-btn"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div id="calendar-grid-main" class="calendar-grid"></div>
    `;

    const grid = document.getElementById('calendar-grid-main'), title = document.getElementById('calendar-title');

    if (calendarMode === 'weekly') {
        const weekStart = new Date(calendarDate);
        weekStart.setDate(day - calendarDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        title.textContent = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
        grid.classList.add('weekly-view');
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => grid.insertAdjacentHTML('beforeend', `<div class="calendar-day-header">${d}</div>`));
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.innerHTML = `<div class="day-number">${currentDay.getDate()}</div><div class="calendar-tasks"></div>`;
            grid.appendChild(dayCell);

            const tasksForDay = allTasks.filter(task => {
                if (!task.deadline) return false;
                return new Date(task.deadline.seconds * 1000).toDateString() === currentDay.toDateString();
            });
            const tasksContainer = dayCell.querySelector('.calendar-tasks');
            tasksForDay.forEach(task => {
                const event = document.createElement('div');
                event.className = 'calendar-task-event';
                event.textContent = task.text;
                event.addEventListener('click', () => openDetailModal(task.id));
                tasksContainer.appendChild(event);
            });
        }
        document.getElementById('prev-btn').onclick = () => { calendarDate.setDate(day - 7); renderCalendarView(); };
        document.getElementById('next-btn').onclick = () => { calendarDate.setDate(day + 7); renderCalendarView(); };
    } else { // Monthly View
        title.textContent = `${calendarDate.toLocaleString('default', { month: 'long' })} ${year}`;
        grid.classList.remove('weekly-view');
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => grid.insertAdjacentHTML('beforeend', `<div class="calendar-day-header">${d}</div>`));
        for (let i = 0; i < firstDayOfMonth; i++) grid.insertAdjacentHTML('beforeend', '<div class="day-cell other-month"></div>');

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.innerHTML = `<div class="day-number">${i}</div><div class="calendar-tasks"></div>`;
            grid.appendChild(dayCell);
            const tasksForDay = allTasks.filter(task => {
                if (!task.deadline) return false;
                const taskDate = new Date(task.deadline.seconds * 1000);
                return taskDate.getFullYear() === year && taskDate.getMonth() === month && taskDate.getDate() === i;
            });
            const tasksContainer = dayCell.querySelector('.calendar-tasks');
            tasksForDay.forEach(task => {
                const event = document.createElement('div');
                event.className = 'calendar-task-event';
                event.textContent = task.text;
                event.addEventListener('click', () => openDetailModal(task.id));
                tasksContainer.appendChild(event);
            });
        }
        document.getElementById('prev-btn').onclick = () => { calendarDate.setMonth(month - 1); renderCalendarView(); };
        document.getElementById('next-btn').onclick = () => { calendarDate.setMonth(month + 1); renderCalendarView(); };
    }

    calendarView.querySelector('.calendar-mode-toggle').addEventListener('click', (e) => {
        if (e.target.matches('.toggle-btn')) {
            calendarMode = e.target.dataset.mode;
            renderCalendarView();
        }
    });
};

const renderCategoryFilters = () => {
    if (!categoryFilters) return;
    const categories = [...new Set(allTasks.map(task => task.category).filter(Boolean))];
    let buttonsHTML = `<button class="filter-btn ${currentCategoryFilter === 'all' ? 'active' : ''}" data-filter="all">All Categories</button>`;
    if (allTasks.some(t => t.category === 'Assigned')) {
        if (!categories.includes('Assigned')) categories.unshift('Assigned');
    }
    categories.forEach(cat => {
        buttonsHTML += `<button class="filter-btn ${currentCategoryFilter === cat ? 'active' : ''}" data-filter="${cat}">${cat}</button>`;
    });
    categoryFilters.innerHTML = buttonsHTML;
};

const updateTaskCounters = () => {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    if (statTotal) statTotal.textContent = total;
    if (statCompleted) statCompleted.textContent = completed;
    if (statPending) statPending.textContent = pending;
};

// --- Modal Functions --- //
const openTaskModal = (task = null) => {
    if (!taskModal) return;
    taskForm.reset();
    subtaskList.innerHTML = '';
    attachmentsListModal.innerHTML = '';
    filesToUpload = [];
    existingAttachments = [];
    originalAttachmentsBeforeEdit = [];
    if(aiSuggestionBox) aiSuggestionBox.innerHTML = '';
    customCategoryInput.classList.add('hide');
    if (task) {
        editingTaskId = task.id;
        taskModalTitle.textContent = 'Edit Task';
        taskInput.value = task.text;
        prioritySelect.value = task.priority || 'low';
        if(taskStatusSelect) taskStatusSelect.value = task.status || 'todo';
        if (task.deadline) {
            const deadline = new Date(task.deadline.seconds * 1000);
            datePicker.setDate(deadline, false);
            timePicker.setDate(deadline, false);
        } else {
            datePicker.clear(); timePicker.clear();
        }
        const defaultCategories = [...categorySelect.options].map(o => o.value);
        if (task.category && !defaultCategories.includes(task.category)) {
            categorySelect.value = 'custom';
            customCategoryInput.classList.remove('hide'); customCategoryInput.value = task.category;
        } else {
            categorySelect.value = task.category || 'Personal';
        }
        if (task.subtasks) task.subtasks.forEach(sub => renderSubtaskInModal(sub, subtaskList, false));
        if (task.attachments) {
            existingAttachments = [...task.attachments];
            originalAttachmentsBeforeEdit = [...task.attachments];
            renderAttachmentPreviews(attachmentsListModal, existingAttachments, false);
        }

    } else {
        editingTaskId = null;
        taskModalTitle.textContent = 'Add New Task';
        if(taskStatusSelect) taskStatusSelect.value = 'todo';
        datePicker.clear(); timePicker.clear();
    }
    taskModal.classList.remove('hide');
};

const createConversationForTask = async (taskId) => {
    if (conversationCreationLocks.has(taskId)) {
        return conversationCreationLocks.get(taskId);
    }

    const creationPromise = (async () => {
        if (!currentUser) throw new Error("User not authenticated");
        
        const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId);
        
        try {
            return await db.runTransaction(async (transaction) => {
                const taskDoc = await transaction.get(taskRef);
                if (!taskDoc.exists) throw "Task document not found!";
                
                const taskData = taskDoc.data();
                if (taskData.conversationId) {
                    return taskData.conversationId;
                }

                const authorized = new Set([currentUser.uid]);
                if (taskData.sharedBy?.uid) authorized.add(taskData.sharedBy.uid);
                if (taskData.assignedBy?.uid) authorized.add(taskData.assignedBy.uid);
                if (taskData.assignedTo?.uid) authorized.add(taskData.assignedTo.uid);

                const convoRef = db.collection('task_conversations').doc();
                transaction.set(convoRef, {
                    authorizedUsers: Array.from(authorized),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                transaction.update(taskRef, { conversationId: convoRef.id });

                return convoRef.id;
            });
        } catch (error) {
            console.error("Conversation creation transaction failed: ", error);
            throw error; // Rethrow to be caught by the caller
        }
    })();
    
    conversationCreationLocks.set(taskId, creationPromise);
    creationPromise.then(conversationId => {
        const taskIndex = allTasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) allTasks[taskIndex].conversationId = conversationId;
    }).finally(() => {
        conversationCreationLocks.delete(taskId);
    });

    return creationPromise;
};

const openDetailModal = async (taskId) => {
    if (!taskDetailModal) return;
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    cleanupCommentListener();
    
    activeListenerToken = taskId;
    detailTaskId = taskId;
    detailTaskTitle.textContent = task.text;

    detailSubtaskList.innerHTML = '';
    if (task.subtasks) task.subtasks.forEach(sub => renderSubtaskInModal(sub, detailSubtaskList, true));
    renderAttachmentPreviews(detailAttachmentsList, task.attachments || [], true);
    
    const commentSection = detailCommentsList?.closest('.detail-section');
    const updateLogSection = document.getElementById('detail-update-log-section');
    
    if (typeof teamModeActive !== 'undefined' && teamModeActive) {
        if(commentSection) commentSection.style.display = 'block';
        if(updateLogSection) updateLogSection.style.display = 'block';
        renderUpdateLog(taskId);

        if (task.conversationId) {
            detailCommentsList.innerHTML = '<p class="no-comments">Loading comments...</p>';
            setupCommentListenerWithRetry(task.conversationId);
        } else {
            detailCommentsList.innerHTML = '<p class="no-comments">Starting conversation...</p>';
             createConversationForTask(taskId).then(newConversationId => {
                if (newConversationId && activeListenerToken === taskId) {
                    setupCommentListenerWithRetry(newConversationId);
                }
            }).catch(error => {
                console.error("Failed to create or retrieve conversation:", error);
                if (activeListenerToken === taskId) {
                    detailCommentsList.innerHTML = `<p class="no-comments error">Could not set up the comment section.</p>`;
                }
            });
        }
    } else {
        if(commentSection) commentSection.style.display = 'none';
        if(updateLogSection) updateLogSection.style.display = 'none';
    }

    const commentFeedback = document.getElementById('comment-feedback');
    if (commentFeedback) commentFeedback.textContent = '';
    taskDetailModal.classList.remove('hide');
};


const renderSubtaskInModal = (subtask, listElement, isDetailView = false) => {
    const item = document.createElement('div');
    item.className = `subtask-item ${subtask.completed ? 'completed' : ''}`;
    item.innerHTML = isDetailView ? `
        <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
        <span class="subtask-text">${subtask.text}</span>
        <button type="button" class="delete-subtask-btn"><i class="fas fa-times"></i></button>`
        : `<input type="text" value="${subtask.text}"><button type="button" class="delete-subtask-btn"><i class="fas fa-times"></i></button>`;
    listElement.appendChild(item);
};

// --- Attachment Functions --- //

const validateFile = (file) => {
    const errors = [];
    const existingFileNames = [...existingAttachments.map(f => f.name.toLowerCase()), ...filesToUpload.map(f => f.file.name.toLowerCase())];
    
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`'${file.name}' is too large (max ${MAX_FILE_SIZE_MB}MB).`);
    }

    const typeAllowed = !!ALLOWED_FILE_TYPES[file.type];
    if (!typeAllowed) {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const allowedExts = Object.values(ALLOWED_FILE_TYPES).flat();
        if (!allowedExts.includes('.' + ext)) {
            errors.push(`'${file.name}' has an unsupported file type.`);
        }
    }
    
    if (existingFileNames.includes(file.name.toLowerCase())) {
        errors.push(`A file named '${file.name}' has already been added.`);
    }
    return errors;
};

const validateFileList = (files) => {
    const validFiles = [];
    const errors = [];
    let currentTotalSize = [...existingAttachments, ...filesToUpload.map(f => f.file)].reduce((acc, f) => acc + (f.size || 0), 0);

    for (const file of files) {
        const fileErrors = validateFile(file);
        if (fileErrors.length > 0) {
            errors.push(...fileErrors);
            continue;
        }

        if (currentTotalSize + file.size > MAX_TOTAL_UPLOAD_MB * 1024 * 1024) {
            errors.push(`Cannot add '${file.name}', as total upload size would exceed ${MAX_TOTAL_UPLOAD_MB}MB.`);
            continue;
        }
        
        currentTotalSize += file.size;
        validFiles.push(file);
    }
    return { validFiles, errors };
};

const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    const { validFiles, errors } = validateFileList(newFiles);

    if (errors.length > 0) {
        const feedbackEl = taskModal.querySelector('.feedback') || profileFeedback;
        showFeedback(feedbackEl, `File validation failed:\n${errors.join('\n')}`, 'error');
    }

    if (validFiles.length > 0) {
        const newUploads = validFiles.map(file => ({
            file,
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            progress: 0,
            status: 'pending',
            error: null,
            bytesTransferred: 0
        }));
        filesToUpload.push(...newUploads);
        renderAttachmentPreviews(attachmentsListModal, [...existingAttachments, ...filesToUpload], false);
    }

    e.target.value = '';
};

const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'fa-solid fa-file-image';
    if (['pdf'].includes(extension)) return 'fa-solid fa-file-pdf';
    if (['doc', 'docx'].includes(extension)) return 'fa-solid fa-file-word';
    if (['xls', 'xlsx'].includes(extension)) return 'fa-solid fa-file-excel';
    return 'fa-solid fa-file';
};

const updateUploadProgress = (fileId, progress, status, errorMessage = null) => {
    const fileWrapper = filesToUpload.find(f => f.id === fileId);
    if(fileWrapper) {
        fileWrapper.progress = progress;
        fileWrapper.status = status;
        fileWrapper.error = errorMessage;
    }

    const previewItem = attachmentsListModal.querySelector(`[data-file-id="${fileId}"]`);
    if (!previewItem) return;

    const progressBar = previewItem.querySelector('.progress-bar');
    const statusIcon = previewItem.querySelector('.status-icon');
    const errorDisplay = previewItem.querySelector('.attachment-error');

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (errorDisplay) {
        errorDisplay.textContent = errorMessage || '';
        errorDisplay.style.display = errorMessage ? 'block' : 'none';
    }

    if (statusIcon) {
        statusIcon.className = 'status-icon fas';
        switch (status) {
            case 'uploading': statusIcon.classList.add('fa-spinner', 'fa-spin'); break;
            case 'success': statusIcon.classList.add('fa-check-circle'); break;
            case 'error': statusIcon.classList.add('fa-exclamation-circle'); break;
            default: statusIcon.className = 'status-icon'; break;
        }
    }
};

const renderAttachmentPreviews = (container, files, isDetailView) => {
    container.innerHTML = '';
    if (!files || files.length === 0) {
        if (isDetailView) container.innerHTML = '<p class="no-comments">No attachments.</p>';
        return;
    }
    
    files.forEach((fileOrWrapper) => {
        const isWrapper = !!fileOrWrapper.file;
        const fileName = isWrapper ? fileOrWrapper.file.name : fileOrWrapper.name;
        const fileURL = isWrapper ? '#' : fileOrWrapper.url;
        const fileId = isWrapper ? fileOrWrapper.id : null;
        const iconClass = getFileIcon(fileName);

        const item = document.createElement('div');
        if (isDetailView) {
            item.className = 'attachment-item';
            item.innerHTML = `
                <i class="attachment-icon ${iconClass}"></i>
                <div class="attachment-info"><span>${fileName}</span></div>
                <div class="attachment-actions">
                    <a href="${fileURL}" target="_blank" rel="noopener noreferrer" class="view-attachment-btn">
                        <i class="fas fa-external-link-alt"></i> View
                    </a>
                </div>`;
        } else {
            item.className = 'attachment-item-preview';
            if (fileId) item.dataset.fileId = fileId;
            item.innerHTML = `
                <i class="${iconClass}"></i>
                <span>${fileName}</span>
                <div class="attachment-progress"><div class="progress-bar"></div></div>
                <i class="status-icon"></i>
                <p class="attachment-error"></p>
                <button type="button" class="delete-attachment-btn" data-name="${fileName}" ${isWrapper ? `data-id="${fileId}"` : ''}>&times;</button>`;
        }
        container.appendChild(item);
    });
};

const getFriendlyStorageErrorMessage = (error) => {
    switch (error.code) {
        case 'storage/unauthorized': return "Permission denied. You can't upload here.";
        case 'storage/canceled': return "Upload was canceled.";
        case 'storage/quota-exceeded': return "Storage limit reached. Cannot upload more files.";
        case 'storage/retry-limit-exceeded': return "Network error. Please try again.";
        default: return "An unknown error occurred during upload.";
    }
};

const uploadFiles = async (taskId, onProgress, onOverallProgress) => {
    if (!currentUser) {
        console.error("Authentication Error: Cannot upload files, user is not signed in.");
        return [];
    }
    const filesToProcess = filesToUpload.filter(f => f.status === 'pending' || f.status === 'error');
    if (filesToProcess.length === 0) return [];
    
    const computeOverallProgress = () => {
        const activeFiles = filesToUpload.filter(f => f.status === 'uploading' || f.status === 'success');
        const totalBytes = activeFiles.reduce((acc, f) => acc + f.file.size, 0) || 1;
        const transferred = activeFiles.reduce((acc, f) => acc + (f.bytesTransferred || 0), 0);
        onOverallProgress(transferred, totalBytes);
    };

    const uploadPromises = filesToProcess.map(fileWrapper => {
        const { file, id } = fileWrapper;
        fileWrapper.status = 'uploading';
        
        return new Promise(async (resolve, reject) => {
            let attempt = 0;
            const maxRetries = 3;
            
            while(attempt < maxRetries) {
                fileWrapper.bytesTransferred = 0;
                computeOverallProgress();

                try {
                    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/\s+/g, '_')}`;
                    const filePath = `task_attachments/${currentUser.uid}/${taskId}/${uniqueFileName}`;
                     console.log("Uploading to path:", filePath); // Path debugging
                    const fileRef = storage.ref(filePath);
                    
                    const result = await new Promise((resolveUpload, rejectUpload) => {
                        const uploadTask = fileRef.put(file);
                        uploadTask.on('state_changed', 
                            (snapshot) => {
                                fileWrapper.bytesTransferred = snapshot.bytesTransferred;
                                computeOverallProgress();
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                onProgress(id, progress, 'uploading');
                            }, 
                            rejectUpload, 
                            async () => {
                                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                                fileWrapper.status = 'success';
                                onProgress(id, 100, 'success');
                                computeOverallProgress();
                                resolveUpload({ name: file.name, url: downloadURL });
                            }
                        );
                    });
                    resolve(result);
                    return;
                } catch (error) {
                    console.error(`Upload error for ${file.name} on attempt ${attempt + 1}:`, {
                        path: `task_attachments/${currentUser.uid}/${taskId}/...`,
                        uid: currentUser.uid,
                        error: error
                    });
                    const isTransient = ['storage/unknown', 'storage/retry-limit-exceeded'].includes(error.code);
                    if (isTransient && attempt < maxRetries - 1) {
                        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt)));
                        attempt++;
                    } else {
                        const message = getFriendlyStorageErrorMessage(error);
                        fileWrapper.status = 'error';
                        onProgress(id, 0, 'error', message);
                        computeOverallProgress();
                        reject({ name: file.name, error });
                        return;
                    }
                }
            }
        });
    });

    const results = await Promise.allSettled(uploadPromises);
    const successfulUploads = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    
    if (results.some(r => r.status === 'rejected')) {
         console.error("Some files failed to upload after retries.", results.filter(r => r.status === 'rejected'));
    }

    return successfulUploads;
};


// --- Comment Functions --- //
const cleanupCommentListener = () => {
    if (unsubscribeComments) unsubscribeComments();
    if (unsubscribeUpdateLog) unsubscribeUpdateLog();
    unsubscribeComments = null;
    unsubscribeUpdateLog = null;
    activeListenerToken = null;
};

const setupCommentListenerWithRetry = (conversationId, retries = 3, delay = 1000) => {
    if (unsubscribeComments) unsubscribeComments(); 
    if (activeListenerToken !== detailTaskId) return; 

    const commentsRef = db.collection('task_conversations').doc(conversationId).collection('comments').orderBy('createdAt', 'asc');

    unsubscribeComments = commentsRef.onSnapshot(async (snapshot) => {
        if (activeListenerToken !== detailTaskId) return;

        if (snapshot.empty) {
            detailCommentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        detailCommentsList.innerHTML = '';

        const authorIds = [...new Set(snapshot.docs.map(doc => doc.data().authorId))];
        
        const profilePromises = authorIds.map(async (id) => {
            try {
                const doc = await db.collection('users').doc(id).get();
                return [id, doc.exists() ? doc.data() : { displayName: 'Unknown User', email: 'unknown' }];
            } catch (e) {
                console.error(`Failed to fetch profile for user ${id}:`, e);
                return [id, { displayName: 'Unknown User', email: 'unknown' }];
            }
        });
        const results = await Promise.all(profilePromises);
        const authorProfiles = Object.fromEntries(results);

        snapshot.docs.forEach(doc => {
            const comment = doc.data();
            const author = authorProfiles[comment.authorId];
            renderComment(comment, author);
        });
        detailCommentsList.scrollTop = detailCommentsList.scrollHeight;

    }, (error) => {
        console.error("Error listening for comments:", error.code, error.message);
        
        if (unsubscribeComments) unsubscribeComments();

        if (error.code === 'failed-precondition') {
            detailCommentsList.innerHTML = `<p class="no-comments error"><strong>Error:</strong> Comments can't be loaded because a required database configuration is missing. If you are the developer, please deploy the Firestore indexes.</p>`;
        } else if (error.code === 'permission-denied') {
            detailCommentsList.innerHTML = `<p class="no-comments error"><strong>Error:</strong> You do not have permission to view these comments.</p>`;
        } else {
             if (retries > 0) {
                setTimeout(() => {
                    if (activeListenerToken === detailTaskId && detailTaskId) {
                        setupCommentListenerWithRetry(conversationId, retries - 1, delay * 2);
                    }
                }, delay);
            } else {
                if (activeListenerToken === detailTaskId) {
                    detailCommentsList.innerHTML = `<p class="no-comments error"><strong>Error:</strong> We couldn't load comments after several attempts. Please check your internet connection and try opening the task again.</p>`;
                }
            }
        }
    });
};


const renderComment = (comment, author) => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    const timestamp = comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString() : 'Just now';

    item.innerHTML = `
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author-name">${author.displayName || 'Unknown User'}</span>
                <span class="comment-author-email">&lt;${author.email || 'No email'}&gt;</span>
                <span class="comment-timestamp">${timestamp}</span>
            </div>
            <p class="comment-text">${comment.text}</p>
        </div>
    `;
    detailCommentsList.appendChild(item);
};

const addCommentWithRetry = async (ref, data, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await ref.add(data);
        } catch (err) {
            const isTransient = ['unavailable', 'deadline-exceeded', 'aborted'].includes(err.code) || !err.code;
            if (isTransient && attempt < maxRetries - 1) {
                const delay = 500 * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            } else {
                throw err;
            }
        }
    }
};

const handlePostComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
        const commentFeedback = document.getElementById('comment-feedback');
        if (commentFeedback) showFeedback(commentFeedback, 'Please sign in to post a comment.', 'error');
        return;
    }

    const now = Date.now();
    if (now - lastCommentTime < 800) return;
    
    const text = detailCommentInput.value.trim();
    if (!text || !detailTaskId || isPostingComment) return;
    
    lastCommentTime = now;
    isPostingComment = true;
    const submitBtn = detailCommentForm.querySelector('.comment-submit-btn');
    const commentFeedback = document.getElementById('comment-feedback');
    const originalBtnIcon = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    if(commentFeedback) commentFeedback.textContent = '';

    try {
        const task = allTasks.find(t => t.id === detailTaskId);
        if (!task) throw new Error("Task not found");

        let conversationId = task.conversationId || await createConversationForTask(detailTaskId);
        if (!conversationId) throw new Error("Failed to create or retrieve conversation.");

        const commentData = {
            text,
            authorId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const commentsRef = db.collection('task_conversations').doc(conversationId).collection('comments');
        await addCommentWithRetry(commentsRef, commentData);
        await addUpdateLog(detailTaskId, 'commented', { text });

        detailCommentInput.value = '';

    } catch (err) {
        console.error("Error posting comment: ", err);
        const errorMessage = err.code === 'permission-denied'
            ? 'You do not have permission to post comments here.'
            : 'Failed to post comment. Please check your network and try again.';
        if(commentFeedback) showFeedback(commentFeedback, errorMessage, 'error');
    } finally {
        isPostingComment = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnIcon;
    }
};

// --- Team Mode Update Log Functions --- //

async function addUpdateLogForUser(targetUid, taskId, action, details = {}) {
     if (!currentUser || !(typeof teamModeActive !== 'undefined' && teamModeActive)) return;
    try {
        const logData = {
            action,
            ...details,
            updatedBy: {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUserProfile.displayName || currentUser.email.split('@')[0]
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(targetUid).collection('tasks').doc(taskId).collection('updates').add(logData);
    } catch (error) {
        console.error("Failed to add update log for other user:", error);
    }
}

async function addUpdateLog(taskId, action, details = {}) {
    await addUpdateLogForUser(currentUser.uid, taskId, action, details);
}


function renderUpdateLog(taskId) {
    const logList = document.getElementById('detail-update-log-list');
    if (!logList) return;
    logList.innerHTML = '<p class="no-updates">Loading history...</p>';
    if (unsubscribeUpdateLog) unsubscribeUpdateLog();

    const ref = db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId).collection('updates');
    unsubscribeUpdateLog = ref.orderBy('updatedAt', 'desc').limit(20)
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                logList.innerHTML = '<p class="no-updates">No update history for this task.</p>';
                return;
            }
            logList.innerHTML = '';
            snapshot.docs.forEach(doc => {
                const log = doc.data();
                const item = document.createElement('div');
                item.className = 'update-log-item';
                const timestamp = log.updatedAt ? new Date(log.updatedAt.seconds * 1000).toLocaleString() : '';
                
                let content = '';
                switch(log.action) {
                    case 'status':
                        content = `changed status from <strong>${log.oldValue || 'N/A'}</strong> to <strong>${log.newValue || 'N/A'}</strong>`;
                        break;
                    case 'edit':
                        content = `updated the field <strong>${log.field}</strong>`;
                        break;
                    case 'subtask':
                         content = `updated subtasks`;
                        break;
                    case 'commented':
                        content = `added a comment: "${log.text.substring(0, 30)}..."`;
                        break;
                    case 'assigned_completed':
                        content = `marked an assigned task as complete`;
                        break;
                    default:
                        content = `made an update`;
                }

                item.innerHTML = `
                    <div class="update-log-header">
                        <span class="update-log-author">${log.updatedBy.displayName}</span>
                        <span class="update-log-timestamp">${timestamp}</span>
                    </div>
                    <p class="update-log-content">${content}</p>
                `;
                logList.appendChild(item);
            });
        }, (error) => {
            if (unsubscribeUpdateLog) unsubscribeUpdateLog();
            if (!logList) return;
            console.error("Error fetching update log:", error);
            if (error.code === 'permission-denied') {
                logList.innerHTML = '<p class="no-updates error"><strong>Error:</strong> You do not have permission to view update history.</p>';
            } else {
                logList.innerHTML = '<p class="no-updates error"><strong>Error:</strong> Could not load update history. Please try again.</p>';
            }
        });
}


// --- Smart Feature Functions --- //
const setupNotifications = () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !messaging) {
        showFeedback(profileFeedback, 'Notifications not supported.', 'error');
        return;
    }

    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            showFeedback(profileFeedback, 'Notifications enabled!', 'success');
            const vapidKey = 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE';
            messaging.getToken({ vapidKey: vapidKey })
                .then((currentToken) => {
                    if (currentToken) {
                        db.collection('users').doc(currentUser.uid).set({ fcmToken: currentToken }, { merge: true });
                    } else {
                        showFeedback(profileFeedback, 'Could not get notification token.', 'error');
                    }
                }).catch((err) => {
                    console.error('An error occurred while retrieving token. ', err);
                    showFeedback(profileFeedback, 'Error getting token.', 'error');
                });
        } else {
            showFeedback(profileFeedback, 'Notifications not granted.', 'error');
        }
    });
};

const handleVoiceInput = () => {
    if (recognition) {
        voiceAddTaskBtn?.classList.add('active');
        recognition.start();
        recognition.onend = () => voiceAddTaskBtn?.classList.remove('active');
        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            openTaskModal();
            taskInput.value = speechToText;
            taskInput.dispatchEvent(new Event('keyup'));
        };
        recognition.onerror = (event) => {
             console.error("Speech Recognition Error:", event.error);
             voiceAddTaskBtn?.classList.remove('active');
        };
    } else {
        alert("Sorry, your browser doesn't support Speech Recognition.");
        if (voiceAddTaskBtn) voiceAddTaskBtn.style.display = 'none';
    }
};

// --- Utility Functions --- //
function shadeColor(color, percent) {
    let [R,G,B] = [parseInt(color.substring(1,3),16), parseInt(color.substring(3,5),16), parseInt(color.substring(5,7),16)];
    R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100);
    R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255;
    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
    return "#" + RR + GG + BB;
}

// --- Initial Setup on DOMContentLoaded --- //
document.addEventListener('DOMContentLoaded', () => {
    datePicker = flatpickr(deadlineDateInput, { dateFormat: "Y-m-d", altInput: true, altFormat: "M j, Y" });
    timePicker = flatpickr(deadlineTimeInput, { enableTime: true, noCalendar: true, dateFormat: "H:i", altInput: true, altFormat: "h:i K" });

    if (accentColorPicker) {
        accentColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            accentColorPicker.appendChild(swatch);
        });
    }

    const dateFilterInput = document.getElementById('date-filter-input');
    const clearDateFilterBtn = document.getElementById('clear-date-filter');
    if(dateFilterInput) {
        dateFilterInstance = flatpickr(dateFilterInput, {
            dateFormat: "Y-m-d", altInput: true, altFormat: "M j, Y",
            onChange: function(selectedDates) {
                selectedDateFilter = selectedDates.length > 0 ? selectedDates[0] : null;
                clearDateFilterBtn.classList.toggle('hide', selectedDates.length === 0);
                renderCurrentView();
            }
        });
        clearDateFilterBtn.addEventListener('click', () => dateFilterInstance.clear());
    }

    const calendarLayoutLabel = document.querySelector('label input[value="calendar"]');
    if (calendarLayoutLabel) {
        const calendarSettings = document.getElementById('calendar-settings');
        calendarSettings.innerHTML = `
            <label>Default Calendar View</label>
            <div class="layout-switcher">
                <label><input type="radio" name="calendar-default" value="monthly" checked> Month</label>
                <label><input type="radio" name="calendar-default" value="weekly"> Week</label>
            </div>
        `;
        document.querySelectorAll('input[name="layout"]').forEach(input => {
            input.addEventListener('change', (e) => {
                 document.getElementById('calendar-settings').classList.toggle('hide', e.target.value !== 'calendar');
            });
        });
    }

    // --- ALL EVENT LISTENERS --- //
    auth.onAuthStateChanged(updateUIforLoginState);
    window.addEventListener('beforeunload', cleanupCommentListener);
    backBtn?.addEventListener('click', () => showPage('todo-page'));
    logo?.addEventListener('click', () => { if (currentUser) showPage('todo-page'); });
    signinLink?.addEventListener('click', (e) => { e.preventDefault(); showPage('signin-page'); });
    signupLink?.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
    profileLink?.addEventListener('click', (e) => { e.preventDefault(); showPage('profile-page'); profileDropdown.classList.remove('show'); });
    showSignup?.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
    showSignin?.addEventListener('click', (e) => { e.preventDefault(); showPage('signin-page'); });
    logoutBtn?.addEventListener('click', () => auth.signOut());
    profileMenu?.addEventListener('click', (e) => { e.stopPropagation(); profileDropdown.classList.toggle('show'); });
    window.addEventListener('click', () => { if (profileDropdown?.classList.contains('show')) profileDropdown.classList.remove('show'); });

    signupForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const userEmail = signupEmailInput.value;
        const userPassword = signupPasswordInput.value;
        auth.createUserWithEmailAndPassword(userEmail, userPassword)
            .then(cred => db.collection('users').doc(cred.user.uid).set({
                displayName: userEmail.split('@')[0],
                email: userEmail.toLowerCase(),
                photoURL: 'https://placehold.co/100x100/d4a373/fefae0?text=User',
                preferences: userPreferences
            }))
            .catch(error => showFeedback(signupFeedback, error.message, 'error'));
    });
    signinForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        auth.signInWithEmailAndPassword(signinEmailInput.value, signinPasswordInput.value)
            .catch(error => showFeedback(signinFeedback, error.message, 'error'));
    });

    profileForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser) return;
        db.collection('users').doc(currentUser.uid).set({
            displayName: displayNameInput.value,
            preferences: userPreferences
        }, { merge: true }).then(() => showFeedback(profileFeedback, "Profile saved!", "success"))
        .catch(error => showFeedback(profileFeedback, error.message, "error"));
    });
    profilePhotoInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;
        storage.ref(`profile_photos/${currentUser.uid}/${file.name}`).put(file)
            .then(snapshot => snapshot.ref.getDownloadURL()
            .then(url => db.collection('users').doc(currentUser.uid).set({ photoURL: url }, { merge: true })));
    });
    themeToggle?.addEventListener('change', (e) => { userPreferences.theme = e.target.checked ? 'dark' : 'light'; applyUserPreferences(userPreferences); });
    accentColorPicker?.addEventListener('click', (e) => { if (e.target.matches('.color-swatch')) { userPreferences.accentColor = e.target.dataset.color; applyUserPreferences(userPreferences); } });
    layoutSwitcher?.addEventListener('change', (e) => {
        if (e.target.matches('input[name="layout"]')) {
            userPreferences.layout = e.target.value;
            applyUserPreferences(userPreferences);
            renderCurrentView();
        }
        if (e.target.matches('input[name="calendar-default"]')) {
            userPreferences.calendarDefault = e.target.value;
            calendarMode = e.target.value;
        }
    });

    addTaskBtn?.addEventListener('click', () => openTaskModal());
    cancelTaskBtn?.addEventListener('click', () => taskModal.classList.add('hide'));
    detailCloseBtn?.addEventListener('click', () => {
        taskDetailModal.classList.add('hide');
        cleanupCommentListener();
        detailTaskId = null;
    });

    saveTaskBtn?.addEventListener('click', async () => {
        if (!currentUser || !taskInput.value.trim()) return;
        saveTaskBtn.disabled = true;

        const modalActions = taskModal.querySelector('.modal-actions');
        let progressContainer = document.getElementById('overall-progress-container');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'overall-progress-container';
            progressContainer.className = 'overall-progress-container';
            progressContainer.innerHTML = `
                <span>Overall Progress:</span>
                <div class="overall-progress-bar-background">
                    <div id="overall-progress-bar" class="overall-progress-bar" style="width: 0%;"></div>
                </div>`;
            modalActions.prepend(progressContainer);
        }
        progressContainer.style.display = 'none';

        const updateOverallProgress = (transferred, total) => {
            if (total > 0) {
                const percentage = (transferred / total) * 100;
                const progressBar = document.getElementById('overall-progress-bar');
                if (progressBar) progressBar.style.width = `${percentage}%`;
                if(progressContainer) progressContainer.style.display = 'block';
            }
        };

        let category = categorySelect.value === 'custom' ? customCategoryInput.value.trim() || 'Uncategorized' : categorySelect.value;
        const deadlineDateVal = datePicker.selectedDates[0];
        const deadlineTimeVal = timePicker.selectedDates[0];
        let deadline = null;
        if (deadlineDateVal) {
            deadline = new Date(deadlineDateVal);
            if (deadlineTimeVal) {
                deadline.setHours(deadlineTimeVal.getHours(), deadlineTimeVal.getMinutes(), 0, 0);
            }
        }
        const subtasks = Array.from(subtaskList.querySelectorAll('.subtask-item input[type="text"]'))
            .map(input => ({ text: input.value.trim(), completed: false }))
            .filter(sub => sub.text);
        const status = taskStatusSelect ? taskStatusSelect.value : 'todo';
        let taskData = { text: taskInput.value.trim(), priority: prioritySelect.value, status: status, deadline: deadline ? firebase.firestore.Timestamp.fromDate(deadline) : null, category, subtasks };
        const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks');
        let newAttachments = [];
        
        const originalTask = editingTaskId ? allTasks.find(t => t.id === editingTaskId) : null;

        try {
            if (editingTaskId) {
                newAttachments = await uploadFiles(editingTaskId, updateUploadProgress, updateOverallProgress);
                taskData.attachments = [...existingAttachments, ...newAttachments];
                await taskRef.doc(editingTaskId).update(taskData);
                
                Object.keys(taskData).forEach(key => {
                    if (originalTask && JSON.stringify(taskData[key]) !== JSON.stringify(originalTask[key])) {
                         if (key === 'deadline') {
                           addUpdateLog(editingTaskId, 'edit', { field: key, oldValue: originalTask[key] ? new Date(originalTask[key].seconds * 1000).toLocaleDateString() : 'None', newValue: taskData[key] ? new Date(taskData[key].seconds * 1000).toLocaleDateString() : 'None' });
                        } else if (key !== 'attachments' && key !== 'subtasks') {
                           addUpdateLog(editingTaskId, 'edit', { field: key, oldValue: originalTask[key], newValue: taskData[key] });
                        }
                    }
                });

            } else {
                const tempTaskId = taskRef.doc().id;
                newAttachments = await uploadFiles(tempTaskId, updateUploadProgress, updateOverallProgress);
                taskData.attachments = newAttachments;
                taskData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await taskRef.doc(tempTaskId).set(taskData);
            }
            taskModal.classList.add('hide');
        } catch (error) {
            console.error("Error saving task:", error);
            showFeedback(profileFeedback, "Error saving task. Some files may not have uploaded.", "error");

            if (!editingTaskId && newAttachments.length > 0) {
                await Promise.all(newAttachments.map(async (attachment) => {
                    try { await storage.refFromURL(attachment.url).delete(); } 
                    catch (e) { console.warn(`Failed to clean up orphaned file: ${attachment.url}`, e); }
                }));
            }
        } finally {
            saveTaskBtn.disabled = false;
            if(progressContainer) progressContainer.style.display = 'none';
        }
    });


    categorySelect?.addEventListener('change', () => customCategoryInput.classList.toggle('hide', categorySelect.value !== 'custom'));

    subtaskAddBtn?.addEventListener('click', () => {
        if (subtaskInput.value.trim()) {
            renderSubtaskInModal({ text: subtaskInput.value.trim(), completed: false }, subtaskList, false);
            subtaskInput.value = '';
        }
    });
    subtaskList?.addEventListener('click', (e) => { if (e.target.closest('.delete-subtask-btn')) e.target.closest('.subtask-item').remove(); });

    detailSubtaskAddBtn?.addEventListener('click', () => {
        if (detailSubtaskInput.value.trim()) {
            renderSubtaskInModal({ text: detailSubtaskInput.value.trim(), completed: false }, detailSubtaskList, true);
            detailSubtaskInput.value = '';
            saveSubtasksFromDetail();
        }
    });
    detailSubtaskList?.addEventListener('click', (e) => {
        if (e.target.closest('.delete-subtask-btn')) {
            e.target.closest('.subtask-item').remove();
            saveSubtasksFromDetail();
        }
        if (e.target.matches('input[type="checkbox"]')) {
            e.target.closest('.subtask-item').classList.toggle('completed');
            saveSubtasksFromDetail();
        }
    });

    const saveSubtasksFromDetail = () => {
        if (!currentUser || !detailTaskId) return;
        const subtasks = Array.from(detailSubtaskList.querySelectorAll('.subtask-item')).map(item => ({ text: item.querySelector('.subtask-text').textContent.trim(), completed: item.querySelector('input[type="checkbox"]').checked }));
        db.collection('users').doc(currentUser.uid).collection('tasks').doc(detailTaskId).update({ subtasks });
        addUpdateLog(detailTaskId, 'subtask', {});
    };

    taskListView?.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        const taskId = taskItem.dataset.id;
        const task = allTasks.find(t => t.id === taskId);
        const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId);

        if (e.target.matches('.task-checkbox')) {
            const isChecked = e.target.checked;
            if (task.assignedTo && task.assignedTo.status === 'pending') {
                e.preventDefault();
                return;
            }
            const newStatus = isChecked ? 'completed' : 'todo';
            taskRef.update({ status: newStatus });
            addUpdateLog(taskId, 'status', { oldValue: task.status, newValue: newStatus });
            if (isChecked && task.assignedBy && task.originalTaskId && task.originalAssignerUid) {
                const originalTaskRef = db.collection('users').doc(task.originalAssignerUid).collection('tasks').doc(task.originalTaskId);
                originalTaskRef.update({
                    'assignedTo.status': 'completed',
                    'assignedTo.completedAt': firebase.firestore.FieldValue.serverTimestamp()
                }).catch(err => console.error("Error updating original assigned task:", err));
                 addUpdateLogForUser(task.originalAssignerUid, task.originalTaskId, 'assigned_completed', {});
            }
        } else if (e.target.closest('.delete-btn')) {
            taskRef.delete();
        } else if (e.target.closest('.edit-btn')) {
            openTaskModal(task);
        } else if (e.target.closest('.comment-btn') || e.target.closest('.task-content')) {
             openDetailModal(taskId);
        }
    });

    taskBoardView?.addEventListener('click', (e) => {
        const taskCard = e.target.closest('.task-card-board');
        if (taskCard) {
            const taskId = taskCard.dataset.id;
            openDetailModal(taskId);
        }
    });

    searchInput?.addEventListener('input', () => { currentSearchTerm = searchInput.value.toLowerCase().trim(); renderCurrentView(); });
    statusFilters?.addEventListener('click', (e) => { if (e.target.matches('.filter-btn')) { statusFilters.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); currentStatusFilter = e.target.dataset.filter; renderCurrentView(); } });
    categoryFilters?.addEventListener('click', (e) => { if (e.target.matches('.filter-btn')) { if(categoryFilters.querySelector('.active')) categoryFilters.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); currentCategoryFilter = e.target.dataset.filter; renderCurrentView(); } });
    priorityFilters?.addEventListener('click', (e) => { if (e.target.matches('.filter-btn')) { priorityFilters.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); currentPriorityFilter = e.target.dataset.priority; renderCurrentView(); } });

    if(enableNotificationsBtn) enableNotificationsBtn.addEventListener('click', setupNotifications);
    if(voiceAddTaskBtn) voiceAddTaskBtn.addEventListener('click', handleVoiceInput);

    taskAttachmentsInput?.addEventListener('change', handleFileUpload);
    attachmentsListModal?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-attachment-btn');
        if (deleteBtn) {
            const { name, id } = deleteBtn.dataset;

            if (id) { 
                filesToUpload = filesToUpload.filter(f => f.id !== id);
            } else {
                existingAttachments = existingAttachments.filter(f => f.name !== name);
            }
            
            deleteBtn.closest('.attachment-item-preview').remove();
        }
    });

    detailCommentForm?.addEventListener('submit', handlePostComment);

    modeToggle?.addEventListener('change', (e) => {
        const isTeamMode = e.target.checked;
        if (isTeamMode) {
            if (typeof initTeamMode === 'function') initTeamMode();
            else console.error("teammode.js functions not loaded.");
        } else {
            if (typeof tearDownTeamMode === 'function') tearDownTeamMode();
            else console.error("teammode.js functions not loaded.");
            listenForTasks();
        }
    });
});

