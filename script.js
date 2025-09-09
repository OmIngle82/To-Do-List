document.addEventListener('DOMContentLoaded', () => {

    // Page & Nav Elements
    const pages = document.querySelectorAll('.page');
    const navLinks = {
        signin: document.getElementById('signin-link'),
        signup: document.getElementById('signup-link'),
        logout: document.getElementById('logout-btn')
    };

    // Auth Elements
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showSigninLink = document.getElementById('show-signin');
    const signinFeedback = document.getElementById('signin-feedback');
    const signupFeedback = document.getElementById('signup-feedback');

    // To-Do Elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // App State
    let tasks = [];
    let currentFilter = 'all';
    let currentUser = null;

    // show a page
    const showPage = (pageId) => {
        pages.forEach(page => {
            page.classList.toggle('hide', page.id !== pageId);
        });
    };

    // show feedback message
    const showFeedback = (element, message, type) => {
        element.textContent = message;
        element.className = `feedback ${type}`;
    };

    // update navigation visibility
    const updateNav = () => {
        const loggedIn = !!currentUser;
        navLinks.signin.classList.toggle('hide', loggedIn);
        navLinks.signup.classList.toggle('hide', loggedIn);
        navLinks.logout.classList.toggle('hide', !loggedIn);
    };

    // save tasks to localStorage
    const saveTasks = () => {
        if (!currentUser) return;
        localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
    };

    // load tasks from localStorage
    const loadTasks = () => {
        if (!currentUser) return;
        const savedTasks = localStorage.getItem(`tasks_${currentUser}`);
        tasks = savedTasks ? JSON.parse(savedTasks) : [];
    };
    
    // render tasks to the UI
    const renderTasks = () => {
        taskList.innerHTML = '';
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'completed') return task.completed;
            if (currentFilter === 'pending') return !task.completed;
            return true;
        });

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<p class="no-tasks">No tasks here!</p>';
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

    // handle signup
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.elements['signup-username'].value.trim();
        const password = e.target.elements['signup-password'].value.trim();
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.find(user => user.username === username)) {
            showFeedback(signupFeedback, 'Username already exists!', 'error');
            return;
        }

        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
        showFeedback(signupFeedback, 'Account created successfully! Please sign in.', 'success');
        signupForm.reset();
        setTimeout(() => showPage('signin-page'), 1500);
    });

    // handle signin
    signinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.elements['signin-username'].value.trim();
        const password = e.target.elements['signin-password'].value.trim();

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            currentUser = user.username;
            sessionStorage.setItem('currentUser', currentUser);
            loadTasks();
            updateNav();
            showPage('todo-page');
            renderTasks();
            signinForm.reset();
            signinFeedback.textContent = '';
        } else {
            showFeedback(signinFeedback, 'Invalid username or password.', 'error');
        }
    });

    // handle logout
    navLinks.logout.addEventListener('click', () => {
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        tasks = [];
        updateNav();
        showPage('signin-page');
    });

    // handle task form submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        if (taskText) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false
            };
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            taskInput.value = '';
        }
    });

    // handle clicks on task list (delegation)
    taskList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = Number(taskItem.dataset.id);
        const task = tasks.find(t => t.id === taskId);
        const taskTextEl = taskItem.querySelector('.task-text');

        if (e.target.type === 'checkbox') {
            task.completed = e.target.checked;
        } else if (e.target.closest('.edit-btn')) {
            const icon = e.target.closest('.edit-btn').querySelector('i');
            if (taskTextEl.readOnly) {
                taskTextEl.readOnly = false;
                taskTextEl.focus();
                icon.classList.replace('fa-pencil-alt', 'fa-save');
            } else {
                taskTextEl.readOnly = true;
                task.text = taskTextEl.value;
                icon.classList.replace('fa-save', 'fa-pencil-alt');
            }
        } else if (e.target.closest('.delete-btn')) {
            tasks = tasks.filter(t => t.id !== taskId);
        }
        
        saveTasks();
        renderTasks();
    });

    // handle filter button clicks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // navigation links
    showSignupLink.addEventListener('click', () => showPage('signup-page'));
    showSigninLink.addEventListener('click', () => showPage('signin-page'));
    navLinks.signin.addEventListener('click', () => showPage('signin-page'));
    navLinks.signup.addEventListener('click', () => showPage('signup-page'));

    // initial App Load
    const checkSession = () => {
        currentUser = sessionStorage.getItem('currentUser');
        if (currentUser) {
            loadTasks();
            showPage('todo-page');
        } else {
            showPage('signin-page');
        }
        updateNav();
        renderTasks();
    };

    checkSession();
});

