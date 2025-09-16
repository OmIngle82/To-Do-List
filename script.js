//Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2sC5VOGzpFPKwWHKfchYsayGUOqZiou8",
  authDomain: "to-do-list-app-b322d.firebaseapp.com",
  projectId: "to-do-list-app-b322d",
  storageBucket: "to-do-list-app-b322d.firebasestorage.app",
  messagingSenderId: "501063235029",
  appId: "1:501063235029:web:fd27e3fe350b27b898f95c",
  measurementId: "G-8ZKXR2X9X4"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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

const signinEmailInput = document.getElementById('signin-email');
const signinPasswordInput = document.getElementById('signin-password');
const signupEmailInput = document.getElementById('signup-email');
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
let currentUser = null;
let unsubscribe; // To stop listening for task updates when logged out

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
    setTimeout(() => element.classList.add('hide'), 3000); // Hide after 3 seconds
};

// Update UI based on login state
const updateUI = (user) => {
    currentUser = user;
    if (user) {
        signinLink.classList.add('hide');
        signupLink.classList.add('hide');
        logoutBtn.classList.remove('hide');
        showPage('todo-page');
        listenForTasks(); // Start listening for this user's tasks
    } else {
        signinLink.classList.remove('hide');
        signupLink.classList.remove('hide');
        logoutBtn.classList.add('hide');
        showPage('signin-page');
        if (unsubscribe) unsubscribe(); // Stop listening
        tasks = [];
        renderTasks();
    }
};

// Listen for real-time task updates from Firestore
const listenForTasks = () => {
    if (!currentUser) return;
    // Detach the old listener before attaching a new one
    if (unsubscribe) unsubscribe();

    unsubscribe = db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTasks();
        }, error => {
            console.error("Error fetching tasks: ", error);
        });
};


// Render Tasks to the DOM
const renderTasks = () => {
    taskList.innerHTML = '';

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


// --- EVENT LISTENERS ---

// Page Navigation Links
signinLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signin-page'); });
signupLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
showSignup.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
showSignin.addEventListener('click', (e) => { e.preventDefault(); showPage('signin-page'); });


// Firebase Auth State Change Listener
auth.onAuthStateChanged(user => {
    updateUI(user);
});

// Sign Up
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            showFeedback(signupFeedback, 'Account created! Please sign in.', 'success');
            signupForm.reset();
        })
        .catch(error => {
            showFeedback(signupFeedback, error.message, 'error');
        });
});

// Sign In
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = signinEmailInput.value;
    const password = signinPasswordInput.value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            signinForm.reset();
            signinFeedback.classList.add('hide');
            // The onAuthStateChanged listener will handle the UI update
        })
        .catch(error => {
            showFeedback(signinFeedback, error.message, 'error');
        });
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Add Task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();

    if (taskText && currentUser) {
        db.collection('users').doc(currentUser.uid).collection('tasks').add({
            text: taskText,
            completed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        taskInput.value = '';
    }
});

// Edit, Delete, Complete Task
taskList.addEventListener('click', (e) => {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem || !currentUser) return;

    const taskId = taskItem.dataset.id;
    const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId);

    // Complete Task
    if (e.target.type === 'checkbox') {
        taskRef.update({ completed: e.target.checked });
    }

    // Delete Task
    if (e.target.closest('.delete-btn')) {
        taskRef.delete();
    }

    // Edit Task
    if (e.target.closest('.edit-btn')) {
        const taskTextElement = taskItem.querySelector('.task-text');
        const icon = e.target.closest('.edit-btn').querySelector('i');
        const isEditing = !taskTextElement.readOnly;

        if (isEditing) {
            taskTextElement.readOnly = true;
            icon.classList.remove('fa-save');
            icon.classList.add('fa-pencil-alt');
            taskRef.update({ text: taskTextElement.value.trim() });
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

