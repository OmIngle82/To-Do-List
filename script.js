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
const searchBtn = document.getElementById('search-btn');
const taskModal = document.getElementById('task-modal'), taskModalTitle = document.getElementById('modal-title');
const taskForm = document.getElementById('task-form'), taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('task-priority'), taskStatusSelect = document.getElementById('task-status');
const deadlineDateInput = document.getElementById('task-deadline-date'), deadlineTimeInput = document.getElementById('task-deadline-time');
const categorySelect = document.getElementById('task-category'), customCategoryInput = document.getElementById('custom-category-input');
const subtaskForm = document.getElementById('subtask-form'), subtaskInput = document.getElementById('subtask-input');
const subtaskList = document.getElementById('subtask-list'), cancelTaskBtn = document.getElementById('modal-cancel-btn');
const taskDetailModal = document.getElementById('task-detail-modal'), detailTaskTitle = document.getElementById('detail-task-title');
const detailSubtaskList = document.getElementById('detail-subtask-list'), detailSubtaskForm = document.getElementById('detail-subtask-form');
const detailSubtaskInput = document.getElementById('detail-subtask-input'), detailCloseBtn = document.getElementById('detail-close-btn');
const signinFeedback = document.getElementById('signin-feedback'), signupFeedback = document.getElementById('signup-feedback');
const profileFeedback = document.getElementById('profile-feedback');
// New Smart Feature Elements
const voiceAddTaskBtn = document.getElementById('voice-add-btn');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');
const aiSuggestionBox = document.getElementById('ai-suggestion-box');


// --- App State --- //
let allTasks = [], currentUser = null;
let userPreferences = { theme: 'light', layout: 'list', accentColor: '#d4a373' };
let currentStatusFilter = 'all', currentCategoryFilter = 'all', currentPriorityFilter = 'all', currentSearchTerm = '';
let editingTaskId = null, detailTaskId = null;
let calendarDate = new Date();
let unsubscribeTasks, unsubscribeProfile;
const accentColors = ['#d4a373', '#f07167', '#00afb9', '#9d4edd', '#fb8500'];

// --- Initializations --- //
const datePicker = flatpickr(deadlineDateInput, { dateFormat: "Y-m-d", altInput: true, altFormat: "M j, Y" });
const timePicker = flatpickr(deadlineTimeInput, { enableTime: true, noCalendar: true, dateFormat: "H:i", altInput: true, altFormat: "h:i K" });
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if(SpeechRecognition) {
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
    element.className = 'feedback';
    element.classList.add(type);
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
        allTasks = [];
        applyUserPreferences({});
        renderAll();
    }
};

const applyUserPreferences = (prefs = {}) => {
    userPreferences = { theme: 'light', layout: 'list', accentColor: '#d4a373', ...prefs };
    document.body.classList.toggle('dark-theme', userPreferences.theme === 'dark');
    if(themeToggle) themeToggle.checked = userPreferences.theme === 'dark';
    const layoutInput = document.querySelector(`input[name="layout"][value="${userPreferences.layout}"]`);
    if(layoutInput) layoutInput.checked = true;
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
            const userData = doc.data();
            if(displayNameInput) displayNameInput.value = userData.displayName || '';
            const photoURL = userData.photoURL || 'https://placehold.co/100x100/d4a373/fefae0?text=User';
            if(profilePhotoPreview) profilePhotoPreview.src = photoURL; 
            if(menuProfilePhoto) menuProfilePhoto.src = photoURL;
            applyUserPreferences(userData.preferences);
        }
    });
};

const listenForTasks = () => {
    if (!currentUser) return;
    if (unsubscribeTasks) unsubscribeTasks();
    unsubscribeTasks = db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            allTasks = snapshot.docs.map(doc => {
                const data = doc.data();
                // Backwards compatibility for old 'completed' boolean field
                if (typeof data.completed !== 'undefined' && !data.status) {
                    data.status = data.completed ? 'completed' : 'todo';
                }
                return { id: doc.id, ...data };
            });
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
    const searchTerm = currentSearchTerm; // Already pre-processed to lowercase and trimmed
    return allTasks.filter(task => {
        const searchMatch = searchTerm === '' ||
            (task.text && task.text.toLowerCase().includes(searchTerm)) ||
            (task.category && task.category.toLowerCase().includes(searchTerm));

        const statusMatch = currentStatusFilter === 'all' ||
            (currentStatusFilter === 'pending' && (task.status === 'todo' || task.status === 'inprogress')) ||
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
        taskItem.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        taskItem.dataset.priority = task.priority || 'low';
        const deadlineDate = task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleDateString() : '';
        const deadlineTime = task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''}>
            <div class="task-content">
                <h3>${task.text}</h3>
                <div class="task-meta">
                    ${task.category ? `<span><i class="fas fa-tag"></i> ${task.category}</span>` : ''}
                    ${deadlineDate ? `<span><i class="fas fa-calendar-alt"></i> ${deadlineDate}</span>` : ''}
                    ${deadlineTime ? `<span><i class="fas fa-clock"></i> ${deadlineTime}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        taskListView.appendChild(taskItem);
    });
};

const renderBoardView = () => {
    if (!taskBoardView) return;
    const filteredTasks = getFilteredTasks();
    
    taskBoardView.innerHTML = `
        <div class="task-column"><h3>To-Do</h3><div class="task-cards" data-status="todo"></div></div>
        <div class="task-column"><h3>In Progress</h3><div class="task-cards" data-status="inprogress"></div></div>
        <div class="task-column"><h3>Completed</h3><div class="task-cards" data-status="completed"></div></div>
    `;

    if (filteredTasks.length === 0 && (currentSearchTerm || currentCategoryFilter !== 'all' || currentPriorityFilter !== 'all' || currentStatusFilter !== 'all')) {
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

    // Add drag and drop listeners
    taskBoardView.querySelectorAll('.task-card-board').forEach(card => {
        card.addEventListener('dragstart', e => {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
        });
        card.addEventListener('dragend', e => e.target.classList.remove('dragging'));
    });
    taskBoardView.querySelectorAll('.task-cards').forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
        });
        column.addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
        column.addEventListener('drop', e => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = e.currentTarget.dataset.status;
            db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId).update({ status: newStatus });
        });
    });
};

const renderCalendarView = () => {
    if (!calendarView) return;
    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    calendarView.innerHTML = `
        <div class="calendar-header">
            <button id="prev-month-btn"><i class="fas fa-chevron-left"></i></button>
            <h2>${calendarDate.toLocaleString('default', { month: 'long' })} ${year}</h2>
            <button id="next-month-btn"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="calendar-grid">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
        </div>
    `;

    const grid = calendarView.querySelector('.calendar-grid');
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell other-month';
        grid.appendChild(emptyCell);
    }
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
            event.addEventListener('click', () => openDetailModal(task));
            tasksContainer.appendChild(event);
        });
    }

    calendarView.querySelector('#prev-month-btn')?.addEventListener('click', () => { calendarDate.setMonth(month - 1); renderCalendarView(); });
    calendarView.querySelector('#next-month-btn')?.addEventListener('click', () => { calendarDate.setMonth(month + 1); renderCalendarView(); });
};

const renderCategoryFilters = () => {
    if (!categoryFilters) return;
    const categories = [...new Set(allTasks.map(task => task.category).filter(Boolean))];
    let buttonsHTML = `<button class="filter-btn ${currentCategoryFilter === 'all' ? 'active' : ''}" data-filter="all">All Categories</button>`;
    categories.forEach(cat => {
        buttonsHTML += `<button class="filter-btn ${currentCategoryFilter === cat ? 'active' : ''}" data-filter="${cat}">${cat}</button>`;
    });
    categoryFilters.innerHTML = buttonsHTML;
};

const updateTaskCounters = () => {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'completed' || t.completed).length;
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
            datePicker.setDate(deadline); timePicker.setDate(deadline);
        } else {
            datePicker.clear(); timePicker.clear();
        }
        const defaultCategories = ['Personal', 'Work', 'Shopping', 'Study'];
        if (task.category && !defaultCategories.includes(task.category)) {
            categorySelect.value = 'custom';
            customCategoryInput.classList.remove('hide'); customCategoryInput.value = task.category;
        } else {
            categorySelect.value = task.category || 'Personal';
        }
        if (task.subtasks) task.subtasks.forEach(sub => renderSubtaskInModal(sub, subtaskList, false));
    } else {
        editingTaskId = null;
        taskModalTitle.textContent = 'Add New Task';
        if(taskStatusSelect) taskStatusSelect.value = 'todo';
        datePicker.clear(); timePicker.clear();
    }
    taskModal.classList.remove('hide');
};

const openDetailModal = (task) => {
    if (!taskDetailModal) return;
    detailTaskId = task.id;
    detailTaskTitle.textContent = task.text;
    detailSubtaskList.innerHTML = '';
    if (task.subtasks) task.subtasks.forEach(sub => renderSubtaskInModal(sub, detailSubtaskList, true));
    taskDetailModal.classList.remove('hide');
};

const renderSubtaskInModal = (subtask, listElement, isDetailView = false) => {
    const item = document.createElement('div');
    item.className = `subtask-item ${subtask.completed ? 'completed' : ''}`;
    item.innerHTML = isDetailView ? `
        <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
        <input type="text" class="detail-subtask-text" value="${subtask.text}" readonly>
        <button type="button" class="delete-subtask-btn"><i class="fas fa-times"></i></button>`
        : `<input type="text" value="${subtask.text}"><button type="button" class="delete-subtask-btn"><i class="fas fa-times"></i></button>`;
    listElement.appendChild(item);
};


// --- Smart Feature Functions --- //
const handleVoiceInput = () => {
    if (recognition) {
        voiceAddTaskBtn?.classList.add('active');
        recognition.start();
        recognition.onend = () => voiceAddTaskBtn?.classList.remove('active');
        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            openTaskModal();
            taskInput.value = speechToText;
            // Dispatch event to trigger AI suggestions from the other script
            taskInput.dispatchEvent(new Event('keyup')); 
        };
        recognition.onerror = (event) => {
             console.error("Speech Recognition Error:", event.error);
             voiceAddTaskBtn?.classList.remove('active');
        }
    } else {
        alert("Sorry, your browser doesn't support Speech Recognition.");
    }
};

const setupNotifications = () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !messaging) {
        showFeedback(profileFeedback, 'Notifications not supported.', 'error');
        return;
    }

    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            showFeedback(profileFeedback, 'Notifications enabled!', 'success');
            // IMPORTANT: Replace with your actual VAPID key from Firebase Project Settings > Cloud Messaging
            const vapidKey = 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE'; 
            messaging.getToken({ vapidKey: vapidKey })
                .then((currentToken) => {
                    if (currentToken) {
                        // Save the token to the user's profile in Firestore
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

// --- Event Listeners --- //
// Auth & Nav
auth.onAuthStateChanged(user => updateUIforLoginState(user));
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
    auth.createUserWithEmailAndPassword(signupEmailInput.value, signupPasswordInput.value)
        .then(cred => db.collection('users').doc(cred.user.uid).set({
            displayName: signupEmailInput.value.split('@')[0],
            preferences: { theme: 'light', layout: 'list', accentColor: '#d4a373' }
        }))
        .catch(error => showFeedback(signupFeedback, error.message, 'error'));
});
signinForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(signinEmailInput.value, signinPasswordInput.value)
        .catch(error => showFeedback(signinFeedback, error.message, 'error'));
});

// Profile & Preferences
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
layoutSwitcher?.addEventListener('change', (e) => { if (e.target.matches('input[name="layout"]')) { userPreferences.layout = e.target.value; applyUserPreferences(userPreferences); renderCurrentView(); } });

// Task & Modal Actions
addTaskBtn?.addEventListener('click', () => openTaskModal());
cancelTaskBtn?.addEventListener('click', () => taskModal.classList.add('hide'));
detailCloseBtn?.addEventListener('click', () => taskDetailModal.classList.add('hide'));
taskForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser || !taskInput.value.trim()) return;
    let category = categorySelect.value === 'custom' ? customCategoryInput.value.trim() || 'Uncategorized' : categorySelect.value;
    const deadlineDateVal = datePicker.selectedDates[0];
    const deadlineTimeVal = timePicker.selectedDates[0];
    let deadline = null;
    if (deadlineDateVal) {
        deadline = new Date(deadlineDateVal);
        if (deadlineTimeVal) {
            deadline.setHours(deadlineTimeVal.getHours());
            deadline.setMinutes(deadlineTimeVal.getMinutes());
            deadline.setSeconds(0, 0);
        }
    }
    const subtasks = Array.from(subtaskList.querySelectorAll('.subtask-item')).map(item => ({ text: item.querySelector('input[type="text"]').value.trim(), completed: false }));
    const status = taskStatusSelect ? taskStatusSelect.value : 'todo';
    const taskData = { text: taskInput.value.trim(), priority: prioritySelect.value, status: status, deadline: deadline ? firebase.firestore.Timestamp.fromDate(deadline) : null, category, subtasks };
    const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks');
    if (editingTaskId) {
        taskRef.doc(editingTaskId).update(taskData);
    } else {
        taskData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        taskRef.add(taskData);
    }
    taskModal.classList.add('hide');
});
categorySelect?.addEventListener('change', () => customCategoryInput.classList.toggle('hide', categorySelect.value !== 'custom'));


// Subtasks
subtaskForm?.addEventListener('submit', (e) => { e.preventDefault(); if (subtaskInput.value.trim()) { renderSubtaskInModal({ text: subtaskInput.value.trim(), completed: false }, subtaskList, false); subtaskInput.value = ''; } });
subtaskList?.addEventListener('click', (e) => { if (e.target.closest('.delete-subtask-btn')) e.target.closest('.subtask-item').remove(); });
detailSubtaskForm?.addEventListener('submit', (e) => { e.preventDefault(); if (detailSubtaskInput.value.trim()) { renderSubtaskInModal({ text: detailSubtaskInput.value.trim(), completed: false }, detailSubtaskList, true); detailSubtaskInput.value = ''; saveSubtasksFromDetail(); } });
detailSubtaskList?.addEventListener('click', (e) => {
    if (e.target.closest('.delete-subtask-btn')) {
        e.target.closest('.subtask-item').remove();
    }
    if (e.target.matches('input[type="checkbox"]')) {
        e.target.closest('.subtask-item').classList.toggle('completed');
    }
    saveSubtasksFromDetail();
});
const saveSubtasksFromDetail = () => {
    if (!currentUser || !detailTaskId) return;
    const subtasks = Array.from(detailSubtaskList.querySelectorAll('.subtask-item')).map(item => ({ text: item.querySelector('input[type="text"]').value.trim(), completed: item.querySelector('input[type="checkbox"]').checked }));
    db.collection('users').doc(currentUser.uid).collection('tasks').doc(detailTaskId).update({ subtasks });
};

// Task List Actions
taskListView?.addEventListener('click', (e) => {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem || !currentUser) return;
    const taskId = taskItem.dataset.id;
    const task = allTasks.find(t => t.id === taskId);
    const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId);
    if (!e.target.closest('.task-actions') && !e.target.matches('.task-checkbox')) {
        openDetailModal(task);
    } else if (e.target.matches('.task-checkbox')) {
        taskRef.update({ status: e.target.checked ? 'completed' : 'todo' });
    } else if (e.target.closest('.delete-btn')) {
        taskRef.delete();
    } else if (e.target.closest('.edit-btn')) {
        openTaskModal(task);
    }
});
taskBoardView?.addEventListener('click', (e) => {
    const taskCard = e.target.closest('.task-card-board');
    if (taskCard) openDetailModal(allTasks.find(t => t.id === taskCard.dataset.id));
});

// Filters & Search
const performSearch = () => {
    if (!searchInput) return;
    currentSearchTerm = searchInput.value.toLowerCase().trim();
    renderCurrentView();
};

searchBtn?.addEventListener('click', performSearch);
searchInput?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});
searchInput?.addEventListener('input', performSearch);

statusFilters?.addEventListener('click', (e) => { if (e.target.matches('.filter-btn')) { statusFilters.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); currentStatusFilter = e.target.dataset.filter; renderCurrentView(); } });
categoryFilters?.addEventListener('click', (e) => { if (e.target.matches('.filter-btn')) { if(categoryFilters.querySelector('.active')) categoryFilters.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); currentCategoryFilter = e.target.dataset.filter; renderCurrentView(); } });
priorityFilters?.addEventListener('click', (e) => { if (e.target.matches('.filter-btn')) { priorityFilters.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); currentPriorityFilter = e.target.dataset.priority; renderCurrentView(); } });

// New Feature Listeners
if(voiceAddTaskBtn) voiceAddTaskBtn.addEventListener('click', handleVoiceInput);
if(enableNotificationsBtn) enableNotificationsBtn.addEventListener('click', setupNotifications);

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

// Initialize Accent Color Picker
if (accentColorPicker) {
    accentColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        accentColorPicker.appendChild(swatch);
    });
}

