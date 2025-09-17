// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2sC5VOGzpFPKwWHKfchYsayGUOqZiou8",
  authDomain: "to-do-list-app-b322d.firebaseapp.com",
  projectId: "to-do-list-app-b322d",
  storageBucket: "to-do-list-app-b322d.firebasestorage.app",
  messagingSenderId: "501063235029",
  appId: "1:501063235029:web:fd27e3fe350b27b898f95c",
  measurementId: "G-8ZKXR2X9X4"
};

// My Firebase Initialization
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// My DOM Elements
const body = document.body;
const signinPage = document.getElementById('signin-page');
const signupPage = document.getElementById('signup-page');
const todoPage = document.getElementById('todo-page');
const profilePage = document.getElementById('profile-page');
// Navigation & Header
const signinLink = document.getElementById('signin-link');
const signupLink = document.getElementById('signup-link');
const profileMenu = document.getElementById('profile-menu');
const profileDropdown = document.querySelector('.profile-dropdown');
const profileLink = document.getElementById('profile-link');
const logoutBtn = document.getElementById('logout-btn');
const logo = document.querySelector('.logo');
const backBtn = document.getElementById('back-btn');
// Auth Forms
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup');
const showSignin = document.getElementById('show-signin');
const signinEmailInput = document.getElementById('signin-email');
const signinPasswordInput = document.getElementById('signin-password');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
// Profile Page
const profileForm = document.getElementById('profile-form');
const displayNameInput = document.getElementById('profile-name');
const profilePhotoInput = document.getElementById('profile-photo-input');
const profilePhotoPreview = document.getElementById('profile-photo-preview');
const menuProfilePhoto = document.getElementById('menu-profile-photo');
const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statPending = document.getElementById('stat-pending');
const themeToggle = document.getElementById('theme-toggle');
const accentColorPicker = document.getElementById('accent-color-picker');
const layoutSwitcher = document.getElementById('layout-switcher');
// Main Task View
const taskListView = document.getElementById('task-list-view');
const taskBoardView = document.getElementById('task-board-view');
const addTaskBtn = document.getElementById('add-task-btn');
const statusFilters = document.querySelector('.filters');
const categoryFilters = document.getElementById('category-filters');
// Add/Edit Task Modal
const taskModal = document.getElementById('task-modal');
const taskModalTitle = document.getElementById('modal-title');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('task-priority');
const deadlineDateInput = document.getElementById('task-deadline-date');
const deadlineTimeInput = document.getElementById('task-deadline-time');
const categorySelect = document.getElementById('task-category');
const customCategoryInput = document.getElementById('custom-category-input');
const subtaskForm = document.getElementById('subtask-form');
const subtaskInput = document.getElementById('subtask-input');
const subtaskList = document.getElementById('subtask-list');
const recurringSelect = document.getElementById('task-recurring');
const cancelTaskBtn = document.getElementById('modal-cancel-btn');
// Task Detail Modal
const taskDetailModal = document.getElementById('task-detail-modal');
const detailTaskTitle = document.getElementById('detail-task-title');
const detailSubtaskList = document.getElementById('detail-subtask-list');
const detailSubtaskForm = document.getElementById('detail-subtask-form');
const detailSubtaskInput = document.getElementById('detail-subtask-input');
const detailCloseBtn = document.getElementById('detail-close-btn');
// Feedback Elements
const signinFeedback = document.getElementById('signin-feedback');
const signupFeedback = document.getElementById('signup-feedback');
const profileFeedback = document.getElementById('profile-feedback');


// My App State
let allTasks = [];
let currentUser = null;
let userPreferences = { theme: 'light', layout: 'list', accentColor: '#d4a373' };
let currentStatusFilter = 'all';
let currentCategoryFilter = 'all';
let editingTaskId = null;
let detailTaskId = null;
let unsubscribeTasks, unsubscribeProfile;

const accentColors = ['#d4a373', '#f07167', '#00afb9', '#9d4edd', '#fb8500'];

// Date Picker Initialization
const datePicker = flatpickr(deadlineDateInput, { dateFormat: "Y-m-d" });
const timePicker = flatpickr(deadlineTimeInput, { enableTime: true, noCalendar: true, dateFormat: "H:i" });

// Page & UI Management
const showPage = (pageId) => {
    [signinPage, signupPage, todoPage, profilePage].forEach(page => page.classList.add('hide'));
    document.getElementById(pageId).classList.remove('hide');
    if (pageId === 'profile-page') {
        backBtn.classList.remove('hide');
        logo.classList.add('hide');
    } else {
        backBtn.classList.add('hide');
        logo.classList.remove('hide');
    }
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
        renderTasks();
    }
};

const applyUserPreferences = (prefs = {}) => {
    userPreferences = {
        theme: 'light',
        layout: 'list',
        accentColor: '#d4a373',
        ...prefs
    };
    document.body.classList.toggle('dark-theme', userPreferences.theme === 'dark');
    themeToggle.checked = userPreferences.theme === 'dark';
    const layoutInput = document.querySelector(`input[name="layout"][value="${userPreferences.layout}"]`);
    if(layoutInput) layoutInput.checked = true;
    taskListView.classList.toggle('hide', userPreferences.layout !== 'list');
    taskBoardView.classList.toggle('hide', userPreferences.layout !== 'board');
    document.documentElement.style.setProperty('--primary-color', userPreferences.accentColor);
    document.documentElement.style.setProperty('--primary-hover', shadeColor(userPreferences.accentColor, -15));
    accentColorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.toggle('active', swatch.dataset.color === userPreferences.accentColor);
    });
};

// Data Listeners for Firebase
const listenForProfile = () => {
    if (!currentUser) return;
    if (unsubscribeProfile) unsubscribeProfile();
    unsubscribeProfile = db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
        if (doc.exists) {
            const userData = doc.data();
            displayNameInput.value = userData.displayName || '';
            const photoURL = userData.photoURL || 'https://placehold.co/100x100/d4a373/fefae0?text=User';
            profilePhotoPreview.src = photoURL;
            menuProfilePhoto.src = photoURL;
            applyUserPreferences(userData.preferences);
        }
    });
};

const listenForTasks = () => {
    if (!currentUser) return;
    if (unsubscribeTasks) unsubscribeTasks();
    unsubscribeTasks = db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateTaskCounters();
            renderCategoryFilters();
            renderTasks();
        });
};

// Render Functions for UI
const renderTasks = () => {
    if (userPreferences.layout === 'list') {
        renderListView();
    } else {
        renderBoardView();
    }
};

const getFilteredTasks = () => {
    const filteredByStatus = allTasks.filter(task => {
        if (currentStatusFilter === 'pending') return !task.completed;
        if (currentStatusFilter === 'completed') return task.completed;
        return true;
    });
    return filteredByStatus.filter(task => {
        if (currentCategoryFilter === 'all') return true;
        return task.category === currentCategoryFilter;
    });
};

const renderListView = () => {
    const filteredTasks = getFilteredTasks();
    taskListView.innerHTML = '';
    if (filteredTasks.length === 0) {
        taskListView.innerHTML = `<p class="no-tasks">No tasks here!</p>`;
        return;
    }
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        taskItem.dataset.priority = task.priority || 'low';
        const deadlineDate = task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleDateString() : '';
        const deadlineTime = task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
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
    const filteredTasks = getFilteredTasks();
    taskBoardView.innerHTML = `
        <div class="task-column"><h3>To-Do</h3><div class="task-cards" id="board-todo"></div></div>
        <div class="task-column"><h3>Completed</h3><div class="task-cards" id="board-completed"></div></div>
    `;
    const todoContainer = document.getElementById('board-todo');
    const completedContainer = document.getElementById('board-completed');

    filteredTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card-board';
        card.dataset.id = task.id;
        card.dataset.priority = task.priority || 'low';
        card.innerHTML = `<h4>${task.text}</h4><p>${task.category || ''}</p>`;

        if (task.completed) {
            completedContainer.appendChild(card);
        } else {
            todoContainer.appendChild(card);
        }
    });
};

const renderCategoryFilters = () => {
    const categories = [...new Set(allTasks.map(task => task.category).filter(Boolean))];
    categoryFilters.innerHTML = '';
    const allCatBtn = document.createElement('button');
    allCatBtn.className = 'category-btn';
    allCatBtn.textContent = 'All Categories';
    allCatBtn.dataset.filter = 'all';
    categoryFilters.appendChild(allCatBtn);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = cat;
        btn.dataset.filter = cat;
        categoryFilters.appendChild(btn);
    });

    const currentActive = categoryFilters.querySelector('.active');
    if (currentActive) currentActive.classList.remove('active');
    const newActive = categoryFilters.querySelector(`[data-filter="${currentCategoryFilter}"]`);
    if (newActive) newActive.classList.add('active');
};

const updateTaskCounters = () => {
    const total = allTasks.length;
    const completed = allTasks.filter(task => task.completed).length;
    statTotal.textContent = total;
    statCompleted.textContent = completed;
    statPending.textContent = total - completed;
};

// Modal Functions
const openTaskModal = (task = null) => {
    taskForm.reset();
    subtaskList.innerHTML = '';
    customCategoryInput.classList.add('hide');
    if (task) {
        editingTaskId = task.id;
        taskModalTitle.textContent = 'Edit Task';
        taskInput.value = task.text;
        prioritySelect.value = task.priority || 'low';
        if (task.deadline) {
            const deadline = new Date(task.deadline.seconds * 1000);
            datePicker.setDate(deadline);
            timePicker.setDate(deadline);
        } else {
            datePicker.clear();
            timePicker.clear();
        }
        recurringSelect.value = task.recurring || 'none';
        const defaultCategories = ['Personal', 'Work', 'Shopping', 'Study'];
        if (task.category && !defaultCategories.includes(task.category)) {
            categorySelect.value = 'custom';
            customCategoryInput.classList.remove('hide');
            customCategoryInput.value = task.category;
        } else {
            categorySelect.value = task.category || 'Personal';
        }
        if (task.subtasks) task.subtasks.forEach(subtask => renderSubtaskInModal(subtask, subtaskList, false));
    } else {
        editingTaskId = null;
        taskModalTitle.textContent = 'Add New Task';
        datePicker.clear();
        timePicker.clear();
    }
    taskModal.classList.remove('hide');
};

const openDetailModal = (task) => {
    detailTaskId = task.id;
    detailTaskTitle.textContent = task.text;
    detailSubtaskList.innerHTML = '';
    if (task.subtasks) task.subtasks.forEach(subtask => renderSubtaskInModal(subtask, detailSubtaskList, true));
    taskDetailModal.classList.remove('hide');
};

const renderSubtaskInModal = (subtask, listElement, isDetailView = false) => {
    const item = document.createElement('div');
    item.className = `subtask-item ${subtask.completed ? 'completed' : ''}`;
    
    let subtaskHTML = '';
    if (isDetailView) {
        subtaskHTML = `
            <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
            <input type="text" class="detail-subtask-text" value="${subtask.text}">
            <button type="button" class="delete-subtask-btn"><i class="fas fa-times"></i></button>
        `;
    } else {
        subtaskHTML = `
            <input type="text" value="${subtask.text}">
            <button type="button" class="delete-subtask-btn"><i class="fas fa-times"></i></button>
        `;
    }
    item.innerHTML = subtaskHTML;
    listElement.appendChild(item);
};

const saveSubtasksFromDetail = () => {
    if (!currentUser || !detailTaskId) return;
    const subtasks = Array.from(detailSubtaskList.querySelectorAll('.subtask-item')).map(item => ({
        text: item.querySelector('input[type="text"]').value.trim(),
        completed: item.querySelector('input[type="checkbox"]').checked
    }));
    db.collection('users').doc(currentUser.uid).collection('tasks').doc(detailTaskId).update({ subtasks });
};

// Event Listeners
// Initialize color picker
accentColors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    accentColorPicker.appendChild(swatch);
});

// Navigation & Auth
backBtn.addEventListener('click', () => showPage('todo-page'));
logo.addEventListener('click', () => { if (currentUser) showPage('todo-page'); });
signinLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signin-page'); });
signupLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
profileLink.addEventListener('click', (e) => { e.preventDefault(); showPage('profile-page'); profileDropdown.classList.remove('show'); });
showSignup.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
showSignin.addEventListener('click', (e) => { e.preventDefault(); showPage('signin-page'); });
logoutBtn.addEventListener('click', () => { auth.signOut(); profileDropdown.classList.remove('show'); });
profileMenu.addEventListener('click', (e) => { e.stopPropagation(); profileDropdown.classList.toggle('show'); });
window.addEventListener('click', () => { if (profileDropdown.classList.contains('show')) profileDropdown.classList.remove('show'); });
auth.onAuthStateChanged(user => updateUIforLoginState(user));

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    auth.createUserWithEmailAndPassword(signupEmailInput.value, signupPasswordInput.value)
        .then(cred => {
            db.collection('users').doc(cred.user.uid).set({
                displayName: signupEmailInput.value.split('@')[0],
                photoURL: 'https://placehold.co/100x100/d4a373/fefae0?text=User',
                preferences: { theme: 'light', layout: 'list', accentColor: '#d4a373' }
            });
        })
        .catch(error => showFeedback(signupFeedback, error.message, 'error'));
});
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(signinEmailInput.value, signinPasswordInput.value)
        .catch(error => showFeedback(signinFeedback, error.message, 'error'));
});

// Profile Management & Preferences
profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) return;
    db.collection('users').doc(currentUser.uid).set({
        displayName: displayNameInput.value,
        preferences: userPreferences
    }, { merge: true }).then(() => {
        showFeedback(profileFeedback, "Profile saved!", "success");
    }).catch(error => {
        showFeedback(profileFeedback, error.message, "error");
    });
});

profilePhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    const ref = storage.ref(`profile_photos/${currentUser.uid}/${file.name}`);
    ref.put(file).then(snapshot => snapshot.ref.getDownloadURL().then(url => db.collection('users').doc(currentUser.uid).set({ photoURL: url }, { merge: true })));
});

themeToggle.addEventListener('change', (e) => { userPreferences.theme = e.target.checked ? 'dark' : 'light'; applyUserPreferences(userPreferences); });
accentColorPicker.addEventListener('click', (e) => { if (e.target.matches('.color-swatch')) { userPreferences.accentColor = e.target.dataset.color; applyUserPreferences(userPreferences); } });
layoutSwitcher.addEventListener('change', (e) => { if (e.target.matches('input[name="layout"]')) { userPreferences.layout = e.target.value; applyUserPreferences(userPreferences); renderTasks(); } });

// Task & Modal Actions
addTaskBtn.addEventListener('click', () => openTaskModal());
cancelTaskBtn.addEventListener('click', () => taskModal.classList.add('hide'));
detailCloseBtn.addEventListener('click', () => taskDetailModal.classList.add('hide'));

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser || !taskInput.value.trim()) return;

    let category = categorySelect.value;
    if (category === 'custom') category = customCategoryInput.value.trim() || 'Uncategorized';
    
    const datePart = deadlineDateInput.value;
    const timePart = deadlineTimeInput.value || "00:00";
    const deadline = datePart ? firebase.firestore.Timestamp.fromDate(new Date(`${datePart} ${timePart}`)) : null;
    
    const subtasks = Array.from(subtaskList.querySelectorAll('.subtask-item')).map(item => ({ text: item.querySelector('input[type="text"]').value.trim(), completed: false }));

    const taskData = { text: taskInput.value.trim(), priority: prioritySelect.value, deadline, category, recurring: recurringSelect.value, subtasks };
    const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks');
    
    if (editingTaskId) {
        taskRef.doc(editingTaskId).update(taskData);
    } else {
        taskData.completed = false;
        taskData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        taskRef.add(taskData);
    }
    closeTaskModal();
});
categorySelect.addEventListener('change', () => customCategoryInput.classList.toggle('hide', categorySelect.value !== 'custom'));

// Subtask Logic in Main Modal
subtaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = subtaskInput.value.trim();
    if (!text) return;
    renderSubtaskInModal({ text: text, completed: false }, subtaskList, false); 
    subtaskInput.value = '';
});
subtaskList.addEventListener('click', (e) => { if (e.target.closest('.delete-subtask-btn')) e.target.closest('.subtask-item').remove(); });

// Subtask Logic in Detail Modal
detailSubtaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = detailSubtaskInput.value.trim();
    if (!text) return;
    renderSubtaskInModal({ text, completed: false }, detailSubtaskList, true);
    detailSubtaskInput.value = '';
    saveSubtasksFromDetail();
});
detailSubtaskList.addEventListener('click', (e) => {
    const subtaskItem = e.target.closest('.subtask-item');
    if (!subtaskItem) return;
    if (e.target.type === 'checkbox') {
        subtaskItem.classList.toggle('completed', e.target.checked);
        saveSubtasksFromDetail();
    }
    if (e.target.closest('.delete-subtask-btn')) {
        subtaskItem.remove();
        saveSubtasksFromDetail();
    }
});
detailSubtaskList.addEventListener('input', (e) => { if (e.target.matches('.detail-subtask-text')) saveSubtasksFromDetail(); });


// Task List Actions & Filters
taskListView.addEventListener('click', (e) => {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem || !currentUser) return;
    const taskId = taskItem.dataset.id;
    const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId);
    
    if (!e.target.closest('.task-actions') && !e.target.matches('.task-checkbox')) {
        const task = allTasks.find(t => t.id === taskId);
        if (task) openDetailModal(task);
        return;
    }
    if (e.target.matches('.task-checkbox')) taskRef.update({ completed: e.target.checked });
    if (e.target.closest('.delete-btn')) taskRef.delete();
    if (e.target.closest('.edit-btn')) {
        const taskToEdit = allTasks.find(t => t.id === taskId);
        if (taskToEdit) openTaskModal(taskToEdit);
    }
});
taskBoardView.addEventListener('click', (e) => {
    const taskCard = e.target.closest('.task-card-board');
    if (!taskCard) return;
    const taskId = taskCard.dataset.id;
    const task = allTasks.find(t => t.id === taskId);
    if(task) openDetailModal(task);
});

statusFilters.addEventListener('click', (e) => { if (e.target.matches('.filter-btn')) { statusFilters.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); currentStatusFilter = e.target.dataset.filter; renderTasks(); } });
categoryFilters.addEventListener('click', (e) => { if (e.target.matches('.category-btn')) { if(categoryFilters.querySelector('.active')) categoryFilters.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); currentCategoryFilter = e.target.dataset.filter; renderTasks(); } });

// Utility Functions
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);
    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);
    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;
    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));
    return "#" + RR + GG + BB;
}

