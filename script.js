// My DOM Elements
const signinPage = document.getElementById('signin-page');
const signupPage = document.getElementById('signup-page');
const todoPage = document.getElementById('todo-page');

const signinLink = document.getElementById('signin-link');
const signupLink = document.getElementById('signup-link');
const logoutBtn = document.getElementById('logout-btn');

const showSignup = document.getElementById('show-signup');
const showSignin = document.getElementById('show-signin');

const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');

const signinUsernameInput = document.getElementById('signin-username');
const signinPasswordInput = document.getElementById('signin-password');
const signupUsernameInput = document.getElementById('signup-username');
const signupPasswordInput = document.getElementById('signup-password');

const signinFeedback = document.getElementById('signin-feedback');
const signupFeedback = document.getElementById('signup-feedback');

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');

// My App State
let tasks = [];
let currentFilter = 'all';

// Page Navigation
const showPage = (pageId) => {
    signinPage.classList.add('hide');
    signupPage.classList.add('hide');
    todoPage.classList.add('hide');

    document.getElementById(pageId).classList.remove('hide');
};

// Feedback Messages
const showFeedback = (element, message, type) => {
    element.textContent = message;
    element.className = 'feedback'; // Reset classes
    element.classList.add(type);
    element.classList.remove('hide');
};

// Update UI based on login state
const updateUI = () => {
    const loggedInUser = sessionStorage.getItem('loggedInUser');

    if (loggedInUser) {
        signinLink.classList.add('hide');
        signupLink.classList.add('hide');
        logoutBtn.classList.remove('hide');
        showPage('todo-page');
        tasks = getTasks(loggedInUser);
        renderTasks();
    } else {
        signinLink.classList.remove('hide');
        signupLink.classList.remove('hide');
        logoutBtn.classList.add('hide');
        showPage('signin-page');
    }
};

// Get user-specific tasks from LocalStorage
const getTasks = (username) => {
    return JSON.parse(localStorage.getItem(`tasks_${username}`)) || [];
};

// Save user-specific tasks to LocalStorage
const saveTasks = (username, tasks) => {
    localStorage.setItem(`tasks_${username}`, JSON.stringify(tasks));
};


// Render Tasks
const renderTasks = () => {
    taskList.innerHTML = '';
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) return;

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true; // 'all'
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<p class="no-tasks">No tasks here!</p>`;
        return;
    }

    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;

        taskItem.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <input type="text" class="task-text" value="${task.text}" readonly>
            <div class="actions">
                <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        taskList.appendChild(taskItem);
    });
};


// Event Listeners
signinLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('signin-page');
});

signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('signup-page');
});

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('signup-page');
});

showSignin.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('signin-page');
});


// Sign Up Logic
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = signupUsernameInput.value.trim();
    const password = signupPasswordInput.value.trim();
    const users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.find(user => user.username === username)) {
        showFeedback(signupFeedback, 'Username already exists!', 'error');
        return;
    }

    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    showFeedback(signupFeedback, 'Account created successfully! Please sign in.', 'success');
    signupForm.reset();
});

// Sign In Logic
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = signinUsernameInput.value.trim();
    const password = signinPasswordInput.value.trim();
    const users = JSON.parse(localStorage.getItem('users')) || [];

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        sessionStorage.setItem('loggedInUser', username);
        signinForm.reset();
        signinFeedback.classList.add('hide');
        updateUI();
    } else {
        showFeedback(signinFeedback, 'Invalid username or password.', 'error');
    }
});


// Logout Logic
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('loggedInUser');
    tasks = []; // Clear current tasks
    updateUI();
});


// Add Task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    const loggedInUser = sessionStorage.getItem('loggedInUser');

    if (taskText && loggedInUser) {
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false
        };
        tasks.push(newTask);
        saveTasks(loggedInUser, tasks);
        renderTasks();
        taskInput.value = '';
    }
});


// Edit, Delete, Complete Task
taskList.addEventListener('click', (e) => {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;

    const taskId = Number(taskItem.dataset.id);
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    const taskTextElement = taskItem.querySelector('.task-text');

    // Complete Task
    if (e.target.type === 'checkbox') {
        const task = tasks.find(t => t.id === taskId);
        task.completed = e.target.checked;
        saveTasks(loggedInUser, tasks);
        renderTasks();
    }

    // Delete Task
    if (e.target.closest('.delete-btn')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks(loggedInUser, tasks);
        renderTasks();
    }

    // Edit Task
    if (e.target.closest('.edit-btn')) {
        const icon = e.target.closest('.edit-btn').querySelector('i');
        const isEditing = !taskTextElement.readOnly;

        if (isEditing) {
            taskTextElement.readOnly = true;
            icon.classList.remove('fa-save');
            icon.classList.add('fa-pencil-alt');
            const task = tasks.find(t => t.id === taskId);
            task.text = taskTextElement.value.trim();
            saveTasks(loggedInUser, tasks);
        } else {
            taskTextElement.readOnly = false;
            taskTextElement.focus();
            icon.classList.remove('fa-pencil-alt');
            icon.classList.add('fa-save');
        }
    }
});

// Filter Tasks
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// Initial Load
document.addEventListener('DOMContentLoaded', updateUI);

