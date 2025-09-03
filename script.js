// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filters = document.querySelectorAll('.filter-btn');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// Get tasks from LocalStorage
const getTasks = () => {
    return JSON.parse(localStorage.getItem('tasks')) || [];
};

// Save tasks to LocalStorage
const saveTasks = (tasks) => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Render tasks
const renderTasks = () => {
    taskList.innerHTML = '';
    let tasksToRender = tasks;

    if (currentFilter === 'pending') {
        tasksToRender = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        tasksToRender = tasks.filter(task => task.completed);
    }

    if (tasksToRender.length === 0) {
        taskList.innerHTML = '<p style="text-align:center; color:#999;">No tasks here!</p>';
        return;
    }

    tasksToRender.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);

        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <input type="text" class="task-text" value="${task.text}" readonly>
            <div class="actions">
                <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        taskList.appendChild(li);
    });
};

// Add a new task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (text === '') return;

    const newTask = {
        id: Date.now(),
        text,
        completed: false,
    };

    tasks.push(newTask);
    saveTasks(tasks);
    renderTasks();
    taskInput.value = '';
});

// Handle actions on task list (Toggle, Edit, Delete)
taskList.addEventListener('click', (e) => {
    const target = e.target;
    const taskItem = target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = Number(taskItem.getAttribute('data-id'));
    const taskText = taskItem.querySelector('.task-text');

    if (target.type === 'checkbox') {
        tasks = tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        saveTasks(tasks);
        renderTasks();
    }

    if (target.closest('.edit-btn')) {
        if (taskText.hasAttribute('readonly')) {
            taskText.removeAttribute('readonly');
            taskText.focus();
            target.closest('.edit-btn').innerHTML = '<i class="fa-solid fa-check"></i>';
        } else {
            taskText.setAttribute('readonly', true);
            tasks = tasks.map(task => 
                task.id === taskId ? { ...task, text: taskText.value } : task
            );
            saveTasks(tasks);
            target.closest('.edit-btn').innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
        }
    }
    
    if (target.closest('.delete-btn')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks(tasks);
        renderTasks();
    }
});

// Filter tasks
filters.forEach(button => {
    button.addEventListener('click', () => {
        filters.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.getAttribute('data-filter');
        renderTasks();
    });
});

// Initial Load
document.addEventListener('DOMContentLoaded', renderTasks);

