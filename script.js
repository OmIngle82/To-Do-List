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
db.enablePersistence()
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          console.warn("Firestore persistence failed: multiple tabs open.");
      } else if (err.code == 'unimplemented') {
          console.warn("Firestore persistence failed: browser not supported.");
      }
  })
const storage = firebase.storage();
const messaging = firebase.messaging();

// --- My DOM Elements --- //
const signinPage = document.getElementById('signin-page'), signupPage = document.getElementById('signup-page');
const todoPage = document.getElementById('todo-page'), profilePage = document.getElementById('profile-page'), adminPage = document.getElementById('admin-page'); // Add adminPage here
const signinLink = document.getElementById('signin-link'), signupLink = document.getElementById('signup-link');
const profileMenu = document.getElementById('profile-menu'), profileDropdown = document.querySelector('.profile-dropdown');
const profileLink = document.getElementById('profile-link'), logoutBtn = document.getElementById('logout-btn');
const adminLink = document.getElementById('admin-link');
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
const badgeModal = document.getElementById('badge-modal');
const badgeModalIcon = document.getElementById('badge-modal-icon');
const badgeModalName = document.getElementById('badge-modal-name');
const badgeModalOkBtn = document.getElementById('badge-modal-ok-btn');
const resetAchievementsBtn = document.getElementById('reset-achievements-btn');
const connectGoogleCalendarBtn = document.getElementById('connect-google-calendar-btn');
const exportExcelBtn = document.getElementById('export-excel-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');

// --- App State --- //
let allTasks = [], currentUser = null, currentUserProfile = {};
let userPreferences = { theme: 'light', layout: 'list', accentColor: '#d4a373', calendarDefault: 'monthly', palette: 'default' };
let currentStatusFilter = 'all', currentCategoryFilter = 'all', currentPriorityFilter = 'all', currentSearchTerm = '';
let selectedDateFilter = null;
let editingTaskId = null, detailTaskId = null;
let pendingSlackLink = null;
let analyticsChart = null;
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
let currentAdminFilter = 'all'; // Can be 'all', 'admin', 'premium', or 'free' 
const YEARLY_PLAN_ID = "plan_RZGREjjDG6aftY";
const MONTHLY_PLAN_ID = "plan_RZGPfzNRtiYgG0"; 
const SHARE_ASSIGN_LIMIT_MONTHLY = 20; 
const FREE_STORAGE_LIMIT = 100 * 1024 * 1024; // 100MB
const MONTHLY_STORAGE_LIMIT = 1 * 1024 * 1024 * 1024; // 1GB
const YEARLY_STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB
const ALL_BADGES = [
    {
        id: 'first_strike',
        name: 'First Strike',
        description: 'Complete your very first task.',
        icon: 'fa-solid fa-bolt',
        condition: (tasks) => tasks.filter(t => t.status === 'completed').length >= 1
    },
    {
        id: 'finisher_10',
        name: 'Task Finisher',
        description: 'Complete 10 tasks.',
        icon: 'fa-solid fa-star',
        condition: (tasks) => tasks.filter(t => t.status === 'completed').length >= 10
    },
    {
        id: 'workaholic_10',
        name: 'Workaholic',
        description: 'Complete 10 "Work" tasks.',
        icon: 'fa-solid fa-briefcase',
        condition: (tasks) => tasks.filter(t => t.status === 'completed' && t.category === 'Work').length >= 10
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete a task after 10 PM.',
        icon: 'fa-solid fa-moon',
        condition: (tasks) => new Date().getHours() >= 22 // 10 PM or later
    }
];

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

// --- Page & UI Management --- //
const showPage = (pageId) => {
    // Find analyticsPage here, only when it's needed.
    const analyticsPage = document.getElementById('analytics-page'); 

    // Use a filter to remove any pages that might not exist yet.
    [signinPage, signupPage, todoPage, profilePage, analyticsPage, adminPage] // Add adminPage here
        .filter(page => page)
        .forEach(page => page.classList.add('hide'));

    document.getElementById(pageId).classList.remove('hide');
    
    const isSubPage = pageId === 'profile-page' || pageId === 'analytics-page';
    backBtn.classList.toggle('hide', !isSubPage);
    logo.classList.toggle('hide', isSubPage);
};

const showFeedback = (element, message, type) => {
    element.textContent = message;
    element.className = 'feedback ' + type;
    setTimeout(() => { element.textContent = ''; element.className = 'feedback'; }, 4000);
};

const updateUIforLoginState = (user) => {
    currentUser = user;
    if (user) {
        // --- NEW LOGIC ---
        // If a user just logged in AND we were trying to link a Slack account,
        // go back to the linking page and auto-click the button.
        if (pendingSlackLink && pendingSlackLink.slackId) {
            showPage('link-slack-page');
            // Programmatically click the button to complete the link
            document.getElementById('complete-slack-link-btn')?.click();
            return; // Stop the function here
        }
        // --- END OF NEW LOGIC ---

        [signinLink, signupLink].forEach(el => el.classList.add('hide'));
        profileMenu.classList.remove('hide');
        showPage('todo-page');
        listenForProfile();
        listenForTasks();

    } else {
        [signinLink, signupLink].forEach(el => el.classList.remove('hide'));
        profileMenu.classList.add('hide');
        // If there's a pending link, show the link page instead of the default signin page
        if (pendingSlackLink && pendingSlackLink.slackId) {
            showPage('link-slack-page');
        } else {
            showPage('signin-page');
        }
        
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
    userPreferences = { theme: 'light', layout: 'list', accentColor: '#d4a373', calendarDefault: 'monthly', palette: 'default', ...prefs };
    calendarMode = userPreferences.calendarDefault;

    // Apply theme and palette
    document.body.classList.toggle('dark-theme', userPreferences.theme === 'dark');
    
    document.body.dataset.palette = userPreferences.palette || 'default';

    if(themeToggle) themeToggle.checked = userPreferences.theme === 'dark';

    // Check the correct radio buttons
    document.querySelectorAll('input[name="layout"]').forEach(input => {
        if(input.value === userPreferences.layout) input.checked = true;
    });
    
    document.querySelectorAll('input[name="palette"]').forEach(input => {
        if(input.value === (userPreferences.palette || 'default')) input.checked = true;
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

const updateUserPreference = async (key, value) => {
    if (!currentUser) return;
    const prefs = {};
    prefs[`preferences.${key}`] = value;
    try {
        await db.collection('users').doc(currentUser.uid).update(prefs);
    } catch (error) {
        console.error(`Failed to update preference '${key}':`, error);
    }
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

            // Add this logic to show/hide the admin link
            if (adminLink) {
                adminLink.classList.toggle('hide', currentUserProfile.role !== 'admin');
            }

            // --- ALL SUBSCRIPTION UI LOGIC ---
            
            // Get all the relevant UI elements
            const subStatusEl = document.getElementById('subscription-status');
            const planSelectionContainer = document.getElementById('plan-selection-container');
            const profilePhotoContainer = document.getElementById('profilePhotoContainer');
            const menuProfilePhotoContainer = document.getElementById('menuProfilePhotoContainer');
            const yearlyBadge = document.getElementById('yearly-premium-badge');
            const prioritySupportSection = document.getElementById('priority-support-section');

            const isPremium = currentUserProfile.subscription?.status === 'premium';
            const isYearly = isPremium && currentUserProfile.subscription?.planId === YEARLY_PLAN_ID;

            // 1. Show/Hide Premium Ring
            if (profilePhotoContainer) profilePhotoContainer.classList.toggle('premium-ring', isPremium);
            if (menuProfilePhotoContainer) menuProfilePhotoContainer.classList.toggle('premium-ring', isPremium);

            // 2. Show/Hide Plan Selection vs. Status Text
            if (subStatusEl) {
                subStatusEl.textContent = isPremium ? 'You are on the Premium Plan. ✨' : 'You are currently on the Free Plan.';
            }
            if (planSelectionContainer) {
                planSelectionContainer.classList.toggle('hide', isPremium); // Hide plan cards if already premium
            }

            // 3. Show/Hide "Premium Plus" Badge
            if (yearlyBadge) {
                yearlyBadge.classList.toggle('hide', !isYearly);
            }

            // 4. Show/Hide Priority Support Section
            if (prioritySupportSection) {
                prioritySupportSection.classList.toggle('hide', !isYearly);
            }
            // --- END OF SUBSCRIPTION UI LOGIC ---

            applyUserPreferences(currentUserProfile.preferences);
        }
    });
};

const listenForTasks = () => {
    if (!currentUser) return;
    if (unsubscribeTasks) unsubscribeTasks();

    let isFirstLoad = true; // Prevents achievements from firing on initial page load

    unsubscribeTasks = db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('order', 'asc')
        .onSnapshot(snapshot => {
            const oldCompletedCount = isFirstLoad ? 0 : allTasks.filter(t => t.status === 'completed').length;
            
            allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const newCompletedCount = allTasks.filter(t => t.status === 'completed').length;

            // If a task was just completed (and it's not the initial load), check for achievements
            if (!isFirstLoad && newCompletedCount > oldCompletedCount) {
                checkForAchievements();
            }
            
            renderAll();
            isFirstLoad = false; // Set to false after the first run
        });
};

const runTaskOrderMigration = async () => {
    if (!currentUser) return;

    // 1. Check if migration has already been completed for this user.
    const userPrefRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userPrefRef.get();
    if (userDoc.exists && userDoc.data().preferences?.dataMigrationV1Complete) {
        // console.log("Migration already completed for this user. Skipping.");
        return;
    }

    console.log("Running one-time task migration for user:", currentUser.uid);

    // 2. Find all tasks without an 'order' field.
    const tasksRef = userPrefRef.collection('tasks');
    const snapshot = await tasksRef.get();

    const tasksToUpdate = [];
    snapshot.forEach(doc => {
        if (!doc.data().hasOwnProperty('order')) {
            tasksToUpdate.push(doc);
        }
    });

    if (tasksToUpdate.length === 0) {
        console.log("No tasks needed migration.");
    } else {
        // 3. Update the tasks in a batch.
        const batch = db.batch();
        tasksToUpdate.forEach(doc => {
            const taskData = doc.data();
            const orderValue = taskData.createdAt ? taskData.createdAt.toMillis() : Date.now();
            batch.update(doc.ref, { order: orderValue });
        });
        await batch.commit();
        console.log(`Successfully migrated ${tasksToUpdate.length} tasks.`);
    }

    // 4. Set the flag so this migration doesn't run again for this user.
    await userPrefRef.update({
        'preferences.dataMigrationV1Complete': true
    });
    console.log("Migration flag set. Process complete.");
};

const syncTaskToGoogleCalendar = async (taskData) => {
    // 1. Check for deadline
    if (!taskData.deadline) {
        showFeedback(profileFeedback, "Task needs a deadline to be synced.", "error");
        return null;
    }

    // 2. Prepare event times
    const startTime = taskData.deadline.toDate();
    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 min duration

    // 3. Authenticate and get token
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/calendar.events');
        const result = await auth.signInWithPopup(provider);
        const accessToken = result.credential.accessToken;

        // 4. Prepare event data for API
        const event = {
            'summary': taskData.text,
            'description': 'Task created from Task Manager App.',
            'start': {
                'dateTime': startTime.toISOString(),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            'end': {
                'dateTime': endTime.toISOString(),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        };

        // 5. Make the API call
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        console.log('Event created:', data);
        showFeedback(profileFeedback, "Task successfully synced to Google Calendar!", "success");
        return data.id; // Return the new event's ID

    } catch (error) {
        console.error('Error syncing to Google Calendar:', error);
        showFeedback(profileFeedback, `Sync Failed: ${error.message}`, "error");
        return null;
    }
};

const deleteGoogleCalendarEvent = async (eventId) => {
    if (!eventId) return;

    console.log(`Attempting to delete Google Calendar event: ${eventId}`);

    try {
        // 1. Authenticate to get a fresh Access Token
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/calendar.events');
        const result = await auth.signInWithPopup(provider);
        const accessToken = result.credential.accessToken;

        // 2. Make the API call to DELETE the event
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) { // 204 No Content is a successful deletion
            console.log("Successfully deleted event from Google Calendar.");
            showFeedback(profileFeedback, "Event removed from Google Calendar.", "success");
        } else if (response.status === 410) { // 410 Gone means it was already deleted
             console.log("Event was already deleted from Google Calendar.");
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error.message);
        }

    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        // We show feedback but don't block the app's task deletion
        showFeedback(profileFeedback, `Could not remove event from calendar: ${error.message}`, "error");
    }
};


const handleSlackLinking = () => {
    if (window.location.hash.startsWith('#link-slack')) {
        const queryString = window.location.hash.split('?')[1];
        const urlParams = new URLSearchParams(queryString);
        const slackId = urlParams.get('slack_id');

        if (slackId) {
            showPage('link-slack-page');
            const linkBtn = document.getElementById('complete-slack-link-btn');
            const feedbackEl = document.getElementById('link-slack-feedback');
            const instructionsEl = document.getElementById('link-slack-instructions');

            // This function runs when the page loads and when the link button is clicked
            const attemptToLink = async () => {
                // If user is not logged in, change the button to a "Sign In" button
                if (!currentUser) {
                    instructionsEl.textContent = "Please sign in to your To-Do List account first. After you sign in, come back to this tab and click the button again.";
                    linkBtn.textContent = "Sign In to Link Account";
                    linkBtn.onclick = () => {
                        // Open the sign-in page in a new tab
                        window.open(window.location.origin + window.location.pathname + '#signin', '_blank');
                    };
                    return; // Stop here until they are logged in
                }
                // --- NEW PREMIUM CHECK ---
                if (!isPremiumUser()) {
                    instructionsEl.textContent = "Slack Integration is a premium feature. Please upgrade your account to connect with Slack.";
                    showFeedback(feedbackEl, "Upgrade required", "error");
                    linkBtn.textContent = "Upgrade to Premium";
                    // Make the button take them to the profile page to upgrade
                    linkBtn.onclick = () => {
                        window.location.href = window.location.origin + window.location.pathname + '#profile';
                    };
                    return; // Stop the linking process
                }
                // --- END OF CHECK ---

                // If we get here, the user is logged in
                linkBtn.disabled = true;
                linkBtn.textContent = "Linking...";
                
                try {
                    const firestoreUserId = currentUser.uid;
                    await db.collection('slackIntegrations').doc(slackId).set({
                        firestoreUserId: firestoreUserId
                    });

                    // UX IMPROVEMENT 2: Show a clear success message and don't redirect
                    instructionsEl.textContent = "You can now create tasks from Slack using the /todo command.";
                    showFeedback(feedbackEl, "Success! Your Slack account is now linked. You can close this tab.", "success");
                    linkBtn.textContent = "Linked Successfully!";
                    // The button remains disabled

                } catch (error) {
                    console.error("Error linking Slack account:", error);
                    showFeedback(feedbackEl, "An error occurred. Please try again.", "error");
                    linkBtn.disabled = false;
                    linkBtn.textContent = "Complete Linking";
                }
            };

            // Add the listener to the button
            linkBtn.addEventListener('click', attemptToLink);
            
            // Also run the check immediately when the page loads
            attemptToLink();
        }
    }
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

    new Sortable(taskListView, {
        animation: 150,
        handle: '.task-content', // This makes the main content area the drag handle
        onEnd: (evt) => {
            const taskId = evt.item.dataset.id;
            const prevTaskElement = evt.item.previousElementSibling;
            const nextTaskElement = evt.item.nextElementSibling;

            // Find the corresponding tasks in our local 'allTasks' array
            const prevTask = prevTaskElement ? allTasks.find(t => t.id === prevTaskElement.dataset.id) : null;
            const nextTask = nextTaskElement ? allTasks.find(t => t.id === nextTaskElement.dataset.id) : null;

            // Calculate the new order value
            const prevOrder = prevTask ? prevTask.order : 0;
            const nextOrder = nextTask ? nextTask.order : Date.now() + 2000; // Add buffer for items dropped at the end

            const newOrder = (prevOrder + nextOrder) / 2;

            // Update the task's order in Firestore
            db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId).update({ order: newOrder });
        }
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
        card.innerHTML = `<h4>${task.text}</h4><p>${task.category || ''}</p>`;
        const container = containers[task.status || 'todo'];
        if (container) container.appendChild(card);
    });
    
    // NEW SortableJS implementation for all columns
    taskBoardView.querySelectorAll('.task-cards').forEach(column => {
        new Sortable(column, {
            group: 'board-tasks', // This allows dragging cards between columns
            animation: 150,
            onEnd: async (evt) => {
                const taskId = evt.item.dataset.id;
                const newStatus = evt.to.dataset.status;
                const oldStatus = evt.from.dataset.status;

                const prevTaskElement = evt.item.previousElementSibling;
                const nextTaskElement = evt.item.nextElementSibling;
                
                const prevTask = prevTaskElement ? allTasks.find(t => t.id === prevTaskElement.dataset.id) : null;
                const nextTask = nextTaskElement ? allTasks.find(t => t.id === nextTaskElement.dataset.id) : null;
                
                const prevOrder = prevTask ? prevTask.order : 0;
                const nextOrder = nextTask ? nextTask.order : Date.now() + 2000;
                
                const newOrder = (prevOrder + nextOrder) / 2;

                // Update both order and status in a single operation
                const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId);
                await taskRef.update({ 
                    order: newOrder,
                    status: newStatus 
                });

                // If status changed, log the update
                if (newStatus !== oldStatus) {
                    const task = allTasks.find(t => t.id === taskId);
                    let conversationId = task.conversationId || await createConversationForTask(taskId);
                    if (conversationId) addUpdateLog(conversationId, 'status', { oldValue: oldStatus, newValue: newStatus });
                }
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

    // Calculate the productivity score
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update the DOM elements
    if (statTotal) statTotal.textContent = total;
    if (statCompleted) statCompleted.textContent = completed;
    if (statPending) statPending.textContent = pending;

    // Find and update the new score element
    const statScore = document.getElementById('stat-score');
    if (statScore) statScore.textContent = `${score}%`;
};

const renderSimplePersonalAnalytics = () => {
    // 1. Get the DOM elements for the report numbers
    const dailyCountEl = document.getElementById('daily-completed-count');
    const weeklyCountEl = document.getElementById('weekly-completed-count');

    // 2. Define the date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at 00:00
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay()); // Start of the current week (Sunday)

    // 3. Filter the tasks based on their 'completedAt' timestamp
    const tasksCompletedToday = allTasks.filter(task => 
        task.completedAt && task.completedAt.toDate() >= todayStart
    );
    
    const tasksCompletedThisWeek = allTasks.filter(task => 
        task.completedAt && task.completedAt.toDate() >= weekStart
    );

    // 4. Update the HTML with the calculated counts
    if (dailyCountEl) {
        dailyCountEl.textContent = tasksCompletedToday.length;
    }
    if (weeklyCountEl) {
        weeklyCountEl.textContent = tasksCompletedThisWeek.length;
    }
};

// --- NEW: Advanced Personal Analytics for Yearly Users ---
const loadAndRenderAdvancedPersonalAnalytics = async () => {
    const container = document.getElementById('personal-analytics-container');
    if (!container || !currentUser) return;
    container.innerHTML = `<p>Loading advanced analytics...</p>`;

    try {
        // --- 1. Query the user's OWN completed tasks from the last 30 days ---
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoTimestamp = firebase.firestore.Timestamp.fromDate(thirtyDaysAgo);

        const snapshot = await db.collection('users').doc(currentUser.uid).collection('tasks')
            .where('status', '==', 'completed')
            .where('completedAt', '>=', thirtyDaysAgoTimestamp)
            .orderBy('completedAt', 'desc')
            .get();
            
        const completedTasks = snapshot.docs.map(doc => doc.data());

        // --- 2. Process data for the chart ---
        const dailyCounts = {}; // e.g., {"10/29/2025": 5, "10/30/2025": 2}
        for (let i = 0; i <= 30; i++) { // Pre-fill last 30 days with 0
            const date = new Date();
            date.setDate(date.getDate() - i);
            dailyCounts[date.toLocaleDateString()] = 0;
        }

        completedTasks.forEach(task => {
            if (task.completedAt) {
                const dateString = task.completedAt.toDate().toLocaleDateString();
                if (dailyCounts.hasOwnProperty(dateString)) {
                    dailyCounts[dateString]++;
                }
            }
        });

        // Sort data for the chart
        const sortedData = Object.entries(dailyCounts).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        const chartLabels = sortedData.map(entry => entry[0]);
        const chartData = sortedData.map(entry => entry[1]);

        // --- 3. Render the advanced UI ---
        container.innerHTML = `
            <div class="stats-container" style="margin-bottom: 2rem;">
                <div class="stat-card"><h4>Tasks Completed (Last 30 Days)</h4><p>${completedTasks.length}</p></div>
                <div class="stat-card"><h4>Average per Day</h4><p>${(completedTasks.length / 30).toFixed(1)}</p></div>
            </div>
            <div class="chart-container">
                <canvas id="personal-analytics-chart"></canvas>
            </div>
        `;

        // --- 4. Create the chart ---
        const ctx = document.getElementById('personal-analytics-chart').getContext('2d');
        if (analyticsChart) { // Reuse the same chart variable
            analyticsChart.destroy();
        }
        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: chartData,
                    backgroundColor: 'rgba(212, 163, 115, 0.2)',
                    borderColor: 'rgba(212, 163, 115, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Your Task Completion Trend (Last 30 Days)'
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error loading advanced personal analytics:", error);
        container.innerHTML = `<p class="feedback error">Could not load your analytics data.</p>`;
    }
};

const loadUsersForAdmin = async () => {
    const userListContainer = document.getElementById('user-list-container');
    if (!userListContainer) return;

    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
        userListContainer.innerHTML = `<p class="feedback error">You do not have permission to view this page.</p>`;
        return;
    }

    userListContainer.innerHTML = `<p>Loading users...</p>`;

    try {
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            userListContainer.innerHTML = `<p>No users found.</p>`;
            return;
        }

        // --- FILTERING LOGIC STARTS HERE ---
        allAdminUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        let filteredUsers;

        switch (currentAdminFilter) {
            case 'admin':
                filteredUsers = allAdminUsers.filter(user => user.role === 'admin');
                break;
            case 'premium':
                filteredUsers = allAdminUsers.filter(user => user.subscription?.status === 'premium');
                break;
            case 'free':
                filteredUsers = allAdminUsers.filter(user => user.role !== 'admin' && user.subscription?.status !== 'premium');
                break;
            default: // 'all'
                filteredUsers = allAdminUsers;
        }
        // --- FILTERING LOGIC ENDS HERE ---

        if (filteredUsers.length === 0) {
            userListContainer.innerHTML = `<p>No users match the current filter.</p>`;
            return;
        }

        let usersHTML = `
            <div class="admin-user-list">
                <div class="admin-user-item header">
                    <div class="user-info-wrapper">
                        <span>Display Name</span>
                        <span>Email</span>
                        <span>Role</span>
                        <span>Premium Status</span>
                    </div>
                    <div class="user-actions">
                        <span>Actions</span>
                    </div>
                </div>
        `;

        // Loop through the FILTERED users instead of all docs
        filteredUsers.forEach(user => {
            const isBanned = user.status === 'banned';
            const isAdmin = user.role === 'admin';

            const itemClass = isBanned ? 'admin-user-item banned-user' : 'admin-user-item';
            
            const banButton = isBanned 
                ? `<button class="user-action-btn unban-btn">Unban</button>`
                : `<button class="user-action-btn ban-btn">Ban</button>`;

            const roleButton = isAdmin
                ? `<button class="user-action-btn remove-admin-btn">Remove Admin</button>`
                : `<button class="user-action-btn role-btn">Make Admin</button>`;

            usersHTML += `
                <div class="${itemClass}" data-id="${user.id}">
                    <div class="user-info-wrapper">
                        <span class="admin-user-name-clickable" data-id="${user.id}">${user.displayName || 'N/A'}</span>
                        <span>${user.email}</span>
                        <span>${user.role || 'user'}</span>
                        <span>${user.subscription?.status === 'premium' ? 'Premium ✨' : 'Free'}</span>
                    </div>
                    <div class="user-actions">
                        ${banButton}
                        ${roleButton}
                    </div>
                </div>`;
        });    

        usersHTML += `</div>`;
        userListContainer.innerHTML = usersHTML;

    } catch (error) {
        console.error("Error loading users for admin:", error);
        userListContainer.innerHTML = `<p class="feedback error">Could not load user data.</p>`;
    }
};
// --- NEW: User Detail Modal Logic ---
const userDetailModal = document.getElementById('user-detail-modal');
const userDetailCloseBtn = document.getElementById('user-detail-close-btn');
const openUserDetailModal = () => userDetailModal?.classList.remove('hide');
const closeUserDetailModal = () => userDetailModal?.classList.add('hide');
userDetailCloseBtn?.addEventListener('click', closeUserDetailModal);

const adminEditNameBtn = document.getElementById('admin-edit-name-btn');
const adminSaveNameBtn = document.getElementById('admin-save-name-btn');
const adminCancelNameBtn = document.getElementById('admin-cancel-name-btn');
const userDetailDisplayView = document.getElementById('user-detail-display-view');
const userDetailEditView = document.getElementById('user-detail-edit-view');
const editInput = document.getElementById('admin-edit-name-input');
const nameHeader = document.getElementById('user-detail-name');

// 1. Click Edit Pencil -> Show Input
adminEditNameBtn?.addEventListener('click', () => {
    // Pre-fill the input with the *current* header text in case it was just saved
    editInput.value = nameHeader.textContent;
    userDetailDisplayView.classList.add('hide');
    userDetailEditView.classList.remove('hide');
    editInput.focus();
});

// 2. Click Cancel X -> Hide Input
adminCancelNameBtn?.addEventListener('click', () => {
    userDetailDisplayView.classList.remove('hide');
    userDetailEditView.classList.add('hide');
});

// 3. Click Save Checkmark -> Call Function
adminSaveNameBtn?.addEventListener('click', async () => {
    const userId = userDetailModal.dataset.currentUserId;
    const newName = editInput.value.trim();
    const currentName = nameHeader.textContent;

    if (!userId) {
        alert("Error: No user ID found.");
        return;
    }

    // Check if the name is valid and different
    if (!newName || newName === "") {
        alert("Name cannot be empty.");
        return;
    }

    if (newName === currentName) {
        // No change, just close the edit view
        userDetailDisplayView.classList.remove('hide');
        userDetailEditView.classList.add('hide');
        return;
    }

    // --- Show saving state (optional, but good UX) ---
    adminSaveNameBtn.disabled = true;
    adminSaveNameBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        // 1. Call the Cloud Function
        const adminUpdateUserName = firebase.functions().httpsCallable('adminUpdateUserName');
        await adminUpdateUserName({ userId: userId, newName: newName });
        
        // 2. Update the modal title for immediate feedback
        nameHeader.textContent = newName;
        
        // 3. Refresh the main admin list in the background
        loadUsersForAdmin();

        // 4. Switch back to display view
        userDetailDisplayView.classList.remove('hide');
        userDetailEditView.classList.add('hide');
        
    } catch (error) {
        console.error("Error updating name:", error);
        alert(`Failed to update name: ${error.message}`);
    } finally {
        // 5. Reset button
        adminSaveNameBtn.disabled = false;
        adminSaveNameBtn.innerHTML = '<i class="fas fa-check"></i>';
    }
});
let allAdminUsers = [];

const populateAndShowUserDetailModal = (userId) => {
    userDetailModal.dataset.currentUserId = userId;
    const user = allAdminUsers.find(u => u.id === userId);
    if (!user) {
        alert("Could not find user data.");
        return;
    }

    const modalName = document.getElementById('user-detail-name');
    const modalBody = document.getElementById('user-detail-body');

    const editInput = document.getElementById('admin-edit-name-input');
    const displayName = user.displayName || user.email;
    
    // Set both the header and the input field
    modalName.textContent = displayName;
    editInput.value = displayName;

    // Reset views to default
    document.getElementById('user-detail-display-view').classList.remove('hide');
    document.getElementById('user-detail-edit-view').classList.add('hide');

    modalName.textContent = user.displayName || user.email;

    // 1. Determine Subscription Status
    let subStatus = "Free";
    let storageLimit = FREE_STORAGE_LIMIT;
    let teamLimitText = "N/A";

    if (user.subscription?.status === 'premium') {
        if (user.subscription?.planId === YEARLY_PLAN_ID) {
            subStatus = "Premium (Yearly)";
            storageLimit = YEARLY_STORAGE_LIMIT;
            teamLimitText = "Unlimited";
        } else {
            subStatus = "Premium (Monthly)";
            storageLimit = MONTHLY_STORAGE_LIMIT;
            const teamUsage = user.teamUsage?.sharedAssignedCount || 0;
            teamLimitText = `${teamUsage} / ${SHARE_ASSIGN_LIMIT_MONTHLY}`;
        }
    }

    // 2. Format Storage
    const storageUsed = user.storageUsed || 0;
    const storageText = `${formatBytes(storageUsed)} / ${formatBytes(storageLimit)}`;
    const storagePercent = (storageUsed / storageLimit) * 100;

    // 3. Build Modal HTML
    modalBody.innerHTML = `
        <div class="user-detail-grid">
            <div class="user-detail-card">
                <h4>Subscription</h4>
                <p>${subStatus}</p>
                <small>${user.email}</small>
            </div>
            <div class="user-detail-card">
                <h4>Team Share/Assign Limit</h4>
                <p>${teamLimitText}</p>
                <small>${subStatus === 'Premium (Monthly)' ? 'Resets monthly' : ''}</small>
            </div>
            <div class="user-detail-card">
                <h4>Storage Usage</h4>
                <p>${storageText}</p>
                <small>${storagePercent.toFixed(2)}% Used</small>
                <div class="overall-progress-bar-background" style="margin-top: 10px;">
                    <div class="overall-progress-bar" style="width: ${storagePercent}%;"></div>
                </div>
            </div>
        </div>
        <div class="user-detail-card">
            <h4>Raw User Data</h4>
            <pre style="white-space: pre-wrap; word-wrap: break-word; max-height: 200px; overflow-y: auto; background-color: var(--border-color); padding: 10px; border-radius: 5px;">${JSON.stringify(user, null, 2)}</pre>
        </div>
    `;

    openUserDetailModal();
};

const loadAndRenderAnalytics = async () => {
    const container = document.getElementById('analytics-container');
    if (!container) return;

    try {
        const snapshot = await db.collection('system_analytics').orderBy('date', 'desc').limit(7).get();

        if (snapshot.empty) {
            container.innerHTML = `<p>No analytics data found yet. The first report will be generated within 24 hours.</p>`;
            return;
        }
        
        const reports = snapshot.docs.map(doc => doc.data());
        const latestReport = reports[0];

        container.innerHTML = `
            <div class="stats-container" style="margin-bottom: 2rem;">
                <div class="stat-card"><h4>Total Users</h4><p id="analytics-total-users">0</p></div>
                <div class="stat-card"><h4>New Users (24h)</h4><p id="analytics-new-users">0</p></div>
                <div class="stat-card"><h4>Total Tasks</h4><p id="analytics-total-tasks">0</p></div>
                <div class="stat-card"><h4>Tasks Completed</h4><p id="analytics-completed-tasks">0</p></div>
            </div>
            <div class="chart-container">
                <canvas id="analytics-chart"></canvas>
            </div>
        `;

        document.getElementById('analytics-total-users').textContent = latestReport.totalUsers;
        document.getElementById('analytics-new-users').textContent = latestReport.newUsers;
        document.getElementById('analytics-total-tasks').textContent = latestReport.totalTasks;
        document.getElementById('analytics-completed-tasks').textContent = latestReport.completedTasks;

        const chartLabels = reports.map(r => new Date(r.date.seconds * 1000).toLocaleDateString()).reverse();
        const totalTasksData = reports.map(r => r.totalTasks).reverse();
        const completedTasksData = reports.map(r => r.completedTasks).reverse();
        
        const ctx = document.getElementById('analytics-chart').getContext('2d');

        // --- THIS IS THE FIX ---
        // 1. Check if a chart instance already exists and destroy it.
        if (analyticsChart) {
            analyticsChart.destroy();
        }
        
        // 2. Create the new chart and assign it to our global variable.
        analyticsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Total Tasks Created',
                        data: totalTasksData,
                        backgroundColor: 'rgba(212, 163, 115, 0.6)',
                        borderColor: 'rgba(212, 163, 115, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Tasks Completed',
                        data: completedTasksData,
                        backgroundColor: 'rgba(42, 157, 143, 0.6)',
                        borderColor: 'rgba(42, 157, 143, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        // --- END OF FIX ---

    } catch (error) {
        console.error("Error loading system analytics:", error);
        container.innerHTML = `<p class="feedback error">Could not load analytics data.</p>`;
    }
};

const renderBadges = () => {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    // For existing users, unlockedBadges might not exist, so default to an empty array.
    const unlockedBadges = currentUserProfile.unlockedBadges || [];
    
    container.innerHTML = ''; // Clear existing badges
    ALL_BADGES.forEach(badge => {
        const isUnlocked = unlockedBadges.includes(badge.id);
        const badgeEl = document.createElement('div');
        badgeEl.className = `badge ${isUnlocked ? 'unlocked' : ''}`;
        
        badgeEl.innerHTML = `
            <i class="fas ${badge.icon}"></i>
            <h4>${badge.name}</h4>
            <p>${badge.description}</p>
        `;
        container.appendChild(badgeEl);
    });
};

const checkForAchievements = () => {
    const unlockedBadges = currentUserProfile.unlockedBadges || [];
    
    const newlyUnlockedBadges = ALL_BADGES.filter(badge => 
        !unlockedBadges.includes(badge.id) && badge.condition(allTasks)
    );

    if (newlyUnlockedBadges.length > 0) {
    newlyUnlockedBadges.forEach(badge => {
        // Show the new achievement pop-up modal
        showAchievementModal(badge);
        
        // Add the new badge to the user's profile in Firestore
        const userRef = db.collection('users').doc(currentUser.uid);
        userRef.update({
            unlockedBadges: firebase.firestore.FieldValue.arrayUnion(badge.id)
            });
        });
    }
}

const showAchievementModal = (badge) => {
    if (!badgeModal) return;
    
    // Populate the modal with the specific badge info
    badgeModalIcon.className = `fas ${badge.icon}`;
    badgeModalName.textContent = badge.name;
    
    // Show the modal
    badgeModal.classList.remove('hide');
};

const hideAchievementModal = () => {
    if (badgeModal) badgeModal.classList.add('hide');
};

// --- Modal Functions --- //
const upgradeModal = document.getElementById('upgrade-modal');
const upgradeConfirmBtn = document.getElementById('upgrade-modal-confirm');
const upgradeCancelBtn = document.getElementById('upgrade-modal-cancel');

const openUpgradeModal = () => {
    if (upgradeModal) upgradeModal.classList.remove('hide');
};

const closeUpgradeModal = () => {
    if (upgradeModal) upgradeModal.classList.add('hide');
};

upgradeConfirmBtn?.addEventListener('click', () => {
    closeUpgradeModal();
    showPage('profile-page'); // Take user to profile to see subscription options
    // Optional: scroll to the subscription section
    document.getElementById('subscription-status')?.scrollIntoView({ behavior: 'smooth' });
});

upgradeCancelBtn?.addEventListener('click', closeUpgradeModal);
const openTaskModal = (task = null) => {
    if (!taskModal) return;

    // UPDATE THIS LOGIC
    const calendarSyncContainer = document.getElementById('google-calendar-sync-container');
    if (calendarSyncContainer) {
        const isCalendarLinked = currentUserProfile?.preferences?.googleCalendarLinked;
        calendarSyncContainer.classList.toggle('hide', !isCalendarLinked);
        // Uncheck the box every time the modal opens
        document.getElementById('google-calendar-sync-checkbox').checked = false;
    }

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
    
    // Update log is now always on
    if(commentSection) commentSection.style.display = 'block';
    if(updateLogSection) updateLogSection.style.display = 'block';

    if (task.conversationId) {
        renderUpdateLog(task.conversationId);
        detailCommentsList.innerHTML = '<p class="no-comments">Loading comments...</p>';
        setupCommentListenerWithRetry(task.conversationId);
    } else {
        detailCommentsList.innerHTML = '<p class="no-comments">Starting conversation...</p>';
        createConversationForTask(taskId).then(newConversationId => {
            if (newConversationId && activeListenerToken === taskId) {
                renderUpdateLog(newConversationId);
                setupCommentListenerWithRetry(newConversationId);
            }
        }).catch(error => {
            console.error("Failed to create or retrieve conversation:", error);
            if (activeListenerToken === taskId) {
                detailCommentsList.innerHTML = `<p class="no-comments error">Could not set up the comment section.</p>`;
            }
        });
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

const _updatePreviewItemClasses = (fileId, errorCode) => {
    const previewItem = attachmentsListModal.querySelector(`[data-file-id="${fileId}"]`);
    if (!previewItem) return;

    // Clear existing status classes
    previewItem.classList.remove(
        'upload-fallback-mode', 
        'upload-error-permission', 
        'upload-error-network', 
        'upload-error-size'
    );

    // Apply new class based on code
    if (errorCode === 'fallback') {
        previewItem.classList.add('upload-fallback-mode');
    } else if (errorCode === 'storage/unauthorized') {
        previewItem.classList.add('upload-error-permission');
    } else if (errorCode === 'storage/canceled' || errorCode === 'storage/retry-limit-exceeded') {
        previewItem.classList.add('upload-error-network');
    } else if (errorCode === 'storage/quota-exceeded') {
        previewItem.classList.add('upload-error-size');
    }
};


const updateUploadProgress = (fileId, progress, status, errorMessage = null, errorCode = null) => {
    const fileWrapper = filesToUpload.find(f => f.id === fileId);
    if(fileWrapper) {
        fileWrapper.progress = progress;
        fileWrapper.status = status;
        fileWrapper.error = errorMessage;
    }

    const previewItem = attachmentsListModal.querySelector(`[data-file-id="${fileId}"]`);
    if (!previewItem) return;
    
    if(errorCode) _updatePreviewItemClasses(fileId, errorCode);

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
        const filePath = isWrapper ? null : fileOrWrapper.path; // Get the path for existing files
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
                <button type="button" class="delete-attachment-btn" 
                        data-name="${fileName}" 
                        ${isWrapper ? `data-id="${fileId}"` : ''}
                        ${filePath ? `data-path="${filePath}"` : ''}>&times;</button>`;
        }
        container.appendChild(item);
    });
};

const getFriendlyStorageErrorMessage = (error) => {
    switch (error.code) {
        case 'storage/unauthorized': return "Permission denied. Please check your authentication status and ensure Firebase Storage rules are deployed correctly.";
        case 'storage/canceled': return "Upload was canceled.";
        case 'storage/quota-exceeded': return "Storage limit reached. Cannot upload more files.";
        case 'storage/retry-limit-exceeded': return "Network error. Please try again.";
        default: return "An unknown error occurred during upload.";
    }
};

const waitForAuthentication = async (timeout = 10000) => {
    if (currentUser?.uid && firebase.auth().currentUser?.uid) return currentUser;
    return new Promise((resolve, reject) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            if (user?.uid) {
                unsubscribe();
                resolve(user);
            }
        });
        setTimeout(() => {
            unsubscribe();
            reject(new Error('Authentication timeout'));
        }, timeout);
    });
};

const verifyConversationExists = async (conversationId, maxRetries = 5) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const doc = await db.collection('task_conversations').doc(conversationId).get();
            if (doc.exists && doc.data().authorizedUsers?.includes(currentUser.uid)) {
                return true;
            }
        } catch (error) {
            console.warn(`Conversation verification attempt ${i + 1} failed:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
    return false;
};

const _performUploadTask = (fileRef, fileWrapper, onProgress, computeOverallProgress) => {
    const { file, id } = fileWrapper;
    return new Promise((resolve, reject) => {
        const uploadTask = fileRef.put(file, metadata);
        uploadTask.on('state_changed',
            (snapshot) => {
                fileWrapper.bytesTransferred = snapshot.bytesTransferred;
                computeOverallProgress();
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(id, progress, 'uploading');
            },
            reject,
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                fileWrapper.status = 'success';
                onProgress(id, 100, 'success');
                computeOverallProgress();
                resolve({ 
                    name: file.name, 
                    url: downloadURL, 
                    size: file.size, 
                    path: fileRef.fullPath
                });
            }
        );
    });
};

const uploadFiles = async (conversationId, taskId, onProgress, onOverallProgress, updateDebug) => {
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
            const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/\s+/g, '_')}`;
            let uploadPath;
            let metadata = {}; // We'll pass this to _performUploadTask

            if (isPersonalTask) {
                // This is a personal task. Use the legacy path.
                // This path WILL be tracked by Cloud Functions.
                uploadPath = `task_attachments/${currentUser.uid}/${taskId}/${uniqueFileName}`;
                if(updateDebug) updateDebug('storage-path-text', 'Using personal path (quota tracked)', true);
            
            } else {
                // This is a shared/assigned task. Use the shared path.
                // This path will NOT be tracked by quota functions.
                uploadPath = `task_attachments/shared/${conversationId}/${uniqueFileName}`;
                // We add metadata for premium features, NOT for quota
                metadata = { customMetadata: { ownerId: currentUser.uid } }; 
                if(updateDebug) updateDebug('storage-path-text', 'Using shared path (unlimited)', true);
            }

            try {
                const fileRef = storage.ref(uploadPath);
                console.log("Attempting upload to designated path:", uploadPath);

                // Pass metadata (even if empty) to the upload task
                const result = await _performUploadTask(fileRef, fileWrapper, onProgress, computeOverallProgress, metadata);
                
                // 'result' already contains the path from _performUploadTask
                await addUpdateLog(conversationId, 'attachment_added', { fileName: result.name, fileSize: result.size, path: result.path });
                resolve(result);

            } catch (error) {
                // This will now catch "real" errors, not the fallback logic
                const message = getFriendlyStorageErrorMessage(error);
                console.error(`Upload failed for ${file.name}:`, error);
                fileWrapper.status = 'error';
                onProgress(id, 0, 'error', message, error.code);
                reject({ name: file.name, error });
            }
        });
    });

    const results = await Promise.allSettled(uploadPromises);
    const successfulUploads = results.filter(r => r.status === 'fulfilled').map(r => r.value);

    if (results.some(r => r.status === 'rejected')) {
        console.error("Some files failed to upload after all fallbacks.", results.filter(r => r.status === 'rejected'));
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
        await addUpdateLog(conversationId, 'commented', { text });

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

// --- Update Log Functions --- //

async function addUpdateLog(conversationId, action, details = {}) {
    if (!currentUser || !conversationId) return;
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
        await db.collection('task_conversations').doc(conversationId).collection('updates').add(logData);
    } catch (error) {
        console.error("Failed to add update log:", error);
    }
}

function renderUpdateLog(conversationId) {
    const logList = document.getElementById('detail-update-log-list');
    if (!logList) return;
    logList.innerHTML = '<p class="no-updates">Loading history...</p>';
    if (unsubscribeUpdateLog) unsubscribeUpdateLog();

    const ref = db.collection('task_conversations').doc(conversationId).collection('updates');
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
                    case 'created':
                        content = `created task: "<strong>${log.text.substring(0, 50)}...</strong>"`;
                        break;
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
                    case 'attachment_added':
                        content = `added attachment: <strong>${log.fileName}</strong> (${(log.fileSize / 1024 / 1024).toFixed(2)} MB)`;
                        break;
                    case 'attachment_removed':
                        content = `removed attachment: <strong>${log.fileName}</strong>`;
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



// --- Utility Functions --- //
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
const isPremiumUser = () => {
    // Use optional chaining (?.) to safely check for nested properties.
    // This prevents errors if a user has no subscription object at all.
    return currentUserProfile?.subscription?.status === 'premium';
};
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
    profileLink?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        renderBadges(); 
        showPage('profile-page'); 
        profileDropdown.classList.remove('show'); 
    });

    const analyticsLink = document.getElementById('analytics-link');
    analyticsLink?.addEventListener('click', (e) => {
        e.preventDefault();

        // --- NEW: Check if user is Yearly Premium ---
        const isYearly = isPremiumUser() && currentUserProfile?.subscription?.planId === YEARLY_PLAN_ID;
        
        if (isYearly) {
            // Load the advanced chart
            loadAndRenderAdvancedPersonalAnalytics();
        } else {
            // Load the simple text report
            renderSimplePersonalAnalytics();
        }
        // --- END NEW ---

        showPage('analytics-page');
        profileDropdown.classList.remove('show');
    });
    const adminUsersContent = document.getElementById('admin-users-content');
    const adminAnalyticsContent = document.getElementById('admin-analytics-content');
    adminLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('admin-page');
        // --- NEW: Set default tab view ---
        // Ensure Users content is visible
        adminUsersContent.classList.remove('hide');
        // Ensure Analytics content is hidden
        adminAnalyticsContent.classList.add('hide');
        // Make "User Data" button active
        adminNav?.querySelector('.active').classList.remove('active');
        document.getElementById('admin-nav-users')?.classList.add('active');
        // Load only the content for the default tab
        loadUsersForAdmin(); 
        // --- END NEW ---
        profileDropdown.classList.remove('show');
    });
    // --- NEW: Admin Panel Tab Switching Logic --- //
    const adminNav = document.querySelector('.admin-nav');
    const adminContentPanels = document.querySelectorAll('.admin-content-panel');

    adminNav?.addEventListener('click', (e) => {
        const clickedButton = e.target.closest('.admin-nav-btn');

        // Do nothing if the click wasn't on a button
        if (!clickedButton) return; 

        // Get the ID of the content panel to show
        const targetId = clickedButton.dataset.target;
        const targetPanel = document.getElementById(targetId);
        if (!targetPanel) return;

        // 1. Update button 'active' state
        adminNav.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        clickedButton.classList.add('active');

        // 2. Show the target panel and hide the others
        adminContentPanels.forEach(panel => {
            panel.classList.add('hide');
        });
        targetPanel.classList.remove('hide');

        // 3. Load the content for the clicked tab
        if (targetId === 'admin-users-content') {
            loadUsersForAdmin();
        } else if (targetId === 'admin-analytics-content') {
            // This is the key part that was missing
            loadAndRenderAnalytics();
        }
    });
    // --- END: Admin Panel Tab Switching Logic --- //
    // --- NEW: User Detail Modal Logic ---

    document.addEventListener('click', async (e) => {
        // --- NEW: Handle click on user name ---
        if (e.target.matches('.admin-user-name-clickable')) {
            const userId = e.target.dataset.id;
            populateAndShowUserDetailModal(userId);
            return; // Stop further execution
        }
        // --- END NEW ---
    // Find the parent user item for any button that might have been clicked
    const userItem = e.target.closest('.admin-user-item');
    if (!userItem) return; // Exit if the click was not inside a user row

    const userId = userItem.dataset.id;
    if (!userId) return;

    // Use a more specific selector to get the email text
    const userEmailSpan = userItem.querySelector('.user-info-wrapper span:nth-child(2)');
    const userEmail = userEmailSpan ? userEmailSpan.textContent : 'this user';
    
    // Prevent admins from performing actions on themselves
    if (userId === currentUser.uid && (e.target.matches('.ban-btn') || e.target.matches('.remove-admin-btn'))) {
        alert("You cannot perform this action on yourself.");
        return;
    }

    // --- BAN LOGIC ---
    if (e.target.matches('.ban-btn') && confirm(`Are you sure you want to ban ${userEmail}?`)) {
        const button = e.target;
        button.textContent = 'Banning...';
        button.disabled = true;
        try {
            const banUserFunction = firebase.functions().httpsCallable('banUser');
            await banUserFunction({ userId });
            alert('User banned successfully.');
            // Reload list to ensure UI is fully consistent
            loadUsersForAdmin(); 
        } catch (error) {
            alert(`Failed to ban user: ${error.message}`);
            button.textContent = 'Ban';
            button.disabled = false;
        }
    } 
    // --- UNBAN LOGIC ---
    else if (e.target.matches('.unban-btn') && confirm(`Are you sure you want to unban ${userEmail}?`)) {
        const button = e.target;
        button.textContent = 'Unbanning...';
        button.disabled = true;
        try {
            const unbanUserFunction = firebase.functions().httpsCallable('unbanUser');
            await unbanUserFunction({ userId });
            alert('User unbanned successfully.');
            loadUsersForAdmin(); // Reload list
        } catch (error) {
            alert(`Failed to unban user: ${error.message}`);
            button.textContent = 'Unban';
            button.disabled = false;
        }
    }
    // --- ROLE CHANGE LOGIC ---
    else if (e.target.matches('.role-btn') && confirm(`Are you sure you want to make ${userEmail} an admin?`)) {
        const button = e.target;
        button.textContent = 'Updating...';
        button.disabled = true;
        try {
            const changeUserRoleFunction = firebase.functions().httpsCallable('changeUserRole');
            await changeUserRoleFunction({ userId, newRole: 'admin' });
            alert('User role updated to admin.');
            loadUsersForAdmin();
        } catch (error) {
            alert(`Failed to update role: ${error.message}`);
            button.textContent = 'Make Admin';
            button.disabled = false;
        }
    } 
    else if (e.target.matches('.remove-admin-btn') && confirm(`Are you sure you want to remove admin rights for ${userEmail}?`)) {
        const button = e.target;
        button.textContent = 'Updating...';
        button.disabled = true;
        try {
            const changeUserRoleFunction = firebase.functions().httpsCallable('changeUserRole');
            await changeUserRoleFunction({ userId, newRole: 'user' });
            alert('User role updated to user.');
            loadUsersForAdmin();
        } catch (error) {
            alert(`Failed to update role: ${error.message}`);
            button.textContent = 'Remove Admin';
            button.disabled = false;
        }
    }
});
document.addEventListener('click', async (e) => {
    // Check if a plan selection button was clicked
    if (e.target.matches('.plan-select-btn')) {
        const planType = e.target.dataset.plan; // 'monthly' or 'yearly'
        e.target.textContent = 'Opening checkout...';
        e.target.disabled = true;

        try {
            // 1. Call the backend function, now PASSING the selected plan
            const createRazorpaySubscription = firebase.functions().httpsCallable('createRazorpaySubscription');
            const { data } = await createRazorpaySubscription({ planType: planType });

            const options = {
                key: "rzp_test_RSSlg4Qv0KAHrY",
                subscription_id: data.subscriptionId,
                name: `Task Manager - ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
                description: "Unlock all premium features",
                method: {
                    card: true, // Keep card enabled
                    upi: true,   // Explicitly enable the UPI tab for mandates
                    netbanking: true
                },
                handler: function (response){
                    alert("Payment successful! Your account will be upgraded shortly.");
                    console.log("Razorpay Response:", response);
                },
                prefill: {
                    name: currentUserProfile.displayName || "",
                    email: currentUser.email
                },
                theme: {
                    color: userPreferences.accentColor || "#d4a373"
                }
            };
            
            const rzp = new Razorpay(options);
            rzp.open();

            rzp.on('payment.failed', function (response){
                alert("Payment failed: " + response.error.description);
            });

        } catch (error) {
            console.error("Razorpay Checkout error:", error);
            alert('Could not initiate checkout. Please try again.');
        } finally {
            e.target.textContent = `Choose ${planType.charAt(0).toUpperCase() + planType.slice(1)}`;
            e.target.disabled = false;
        }
    }
});
// --- NEW: Event listener for showing feature comparison ---
const showComparisonBtn = document.getElementById('show-comparison-btn');
const featureComparisonContainer = document.getElementById('feature-comparison-container');

showComparisonBtn?.addEventListener('click', () => {
    const isHidden = featureComparisonContainer.classList.contains('hide');
    
    // Toggle the visibility of the container
    featureComparisonContainer.classList.toggle('hide');

    // Update the button text based on the state
    if (isHidden) {
        showComparisonBtn.textContent = 'Hide Comparison';
    } else {
        showComparisonBtn.textContent = 'Why Choose Premium?';
    }
});

// --- NEW: Event listener for admin user filters ---
const adminUserFilters = document.getElementById('admin-user-filters');
adminUserFilters?.addEventListener('click', (e) => {
    if (e.target.matches('.filter-btn')) {
        // Update the active button style
        adminUserFilters.querySelector('.active').classList.remove('active');
        e.target.classList.add('active');
        
        // Update the state variable
        currentAdminFilter = e.target.dataset.filter;
        
        // Reload the user list with the new filter
        loadUsersForAdmin();
    }
});

    badgeModalOkBtn?.addEventListener('click', hideAchievementModal);
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
                preferences: userPreferences,
                unlockedBadges: [],
                role: 'user' 
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
     themeToggle?.addEventListener('change', (e) => {
        userPreferences.theme = e.target.checked ? 'dark' : 'light';
        applyUserPreferences(userPreferences);
        updateUserPreference('theme', userPreferences.theme);
    });
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

    saveTaskBtn?.addEventListener('click', async () => {const signinPage = document.getElementById('signin-page'), signupPage = document.getElementById('signup-page');
    const todoPage = document.getElementById('todo-page'), profilePage = document.getElementById('profile-page');
    const signinLink = document.getElementById('signin-link'), signupLink = document.getElementById('signup-link');
    if (!taskInput.value.trim()) return;

    const syncCheckbox = document.getElementById('google-calendar-sync-checkbox');
    const debugPanel = document.getElementById('upload-debug-panel');
    const updateDebug = (target, text, success) => {
        const el = document.getElementById(target);
        if(el) {
            el.textContent = text;
            el.className = success === null ? '' : (success ? 'success' : 'error');
        }
    };

    if(debugPanel && filesToUpload.length > 0) debugPanel.style.display = 'block';

    try {
        updateDebug('auth-status-text', 'Authenticating...', null);
        currentUser = await waitForAuthentication();
        updateDebug('auth-status-text', 'Authenticated', true);
    } catch (authError) {
        updateDebug('auth-status-text', 'Failed', false);
        console.error("Authentication failed:", authError);
        showFeedback(profileFeedback, "Authentication failed. Please sign in again.", "error");
        return;
    }

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
    let conversationIdForCleanup = null;

    try {
        let conversationId;
        let finalTaskId = editingTaskId; // Keep track of the task ID
        // Determine if the task is personal. New tasks are always personal.
            let isPersonalTask = true; 
            if (editingTaskId) {
                const originalTask = allTasks.find(t => t.id === editingTaskId);
                // If it's already a shared/assigned task, it's not personal
                if (originalTask && (originalTask.sharedBy || originalTask.assignedBy || originalTask.assignedTo)) {
                    isPersonalTask = false;
                }
            }

        if (editingTaskId) {
             const originalTask = allTasks.find(t => t.id === editingTaskId);
             if (!originalTask) throw new Error("Task to edit not found");
             conversationId = originalTask.conversationId || await createConversationForTask(editingTaskId);
        } else {
             const convoRef = db.collection('task_conversations').doc();
             conversationId = convoRef.id;
             conversationIdForCleanup = conversationId;
             updateDebug('conversation-status-text', 'Creating...', null);
             await convoRef.set({ authorizedUsers: [currentUser.uid], createdAt: firebase.firestore.FieldValue.serverTimestamp() });
             await new Promise(res => setTimeout(res, 500)); 
        }
        
        updateDebug('conversation-status-text', 'Verifying...', null);
        const conversationVerified = await verifyConversationExists(conversationId);
        if (!conversationVerified) {
            updateDebug('conversation-status-text', 'Verification Failed', false);
            throw new Error("Conversation could not be verified in time.");
        }
        updateDebug('conversation-status-text', `Verified (${conversationId.substring(0,5)}...)`, true);

        if (editingTaskId) {
            newAttachments = await uploadFiles(conversationId, editingTaskId, updateUploadProgress, updateOverallProgress, updateDebug, isPersonalTask);
            taskData.attachments = [...existingAttachments, ...newAttachments];
            if (!allTasks.find(t=>t.id === editingTaskId).conversationId) taskData.conversationId = conversationId;

            await taskRef.doc(editingTaskId).update(taskData);
        } else {
            const tempTaskId = taskRef.doc().id;
            finalTaskId = tempTaskId; // The new task's ID
            newAttachments = await uploadFiles(conversationId, tempTaskId, updateUploadProgress, updateOverallProgress, updateDebug, isPersonalTask);
            taskData.attachments = newAttachments;
            taskData.conversationId = conversationId;
            taskData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            taskData.order = Date.now();

            await taskRef.doc(tempTaskId).set(taskData);
            await addUpdateLog(conversationId, 'created', { text: taskData.text });
        }

        // --- GOOGLE CALENDAR LOGIC STARTS HERE --- //
        if (syncCheckbox && syncCheckbox.checked) {
            taskData.id = finalTaskId; 
            
            const eventId = await syncTaskToGoogleCalendar(taskData);
            
            // If sync was successful, save the eventId back to the task in Firestore
            if (eventId && finalTaskId) {
                await taskRef.doc(finalTaskId).update({ googleCalendarEventId: eventId });
            }
        }
        // --- GOOGLE CALENDAR LOGIC ENDS HERE --- //

        taskModal.classList.add('hide');

    } catch (error) {
        console.error("Error saving task:", error);
        showFeedback(profileFeedback, "Error saving task. Check debug panel for details.", "error");

        if (!editingTaskId && newAttachments.length > 0) {
            console.log(`Cleaning up ${newAttachments.length} orphaned files...`);
            await Promise.all(newAttachments.map(async (attachment) => {
                try { 
                    await storage.refFromURL(attachment.url).delete(); 
                    console.log(`Deleted: ${attachment.url}`);
                } 
                catch (e) { console.warn(`Failed to clean up orphaned file: ${attachment.url}`, e); }
            }));
            if(conversationIdForCleanup) {
                try {
                    await db.collection('task_conversations').doc(conversationIdForCleanup).delete();
                } catch(e) { /* Fail silently */ }
            }
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

    const saveSubtasksFromDetail = async () => {
        if (!currentUser || !detailTaskId) return;
        const subtasks = Array.from(detailSubtaskList.querySelectorAll('.subtask-item')).map(item => ({ text: item.querySelector('.subtask-text').textContent.trim(), completed: item.querySelector('input[type="checkbox"]').checked }));
        db.collection('users').doc(currentUser.uid).collection('tasks').doc(detailTaskId).update({ subtasks });
        
        const task = allTasks.find(t => t.id === detailTaskId);
        if (task && task.conversationId) {
            addUpdateLog(task.conversationId, 'subtask', {});
        }
    };

    taskListView?.addEventListener('click', async (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        const taskId = taskItem.dataset.id;
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;
        const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId);

        if (e.target.matches('.task-checkbox')) {
            const isChecked = e.target.checked;
            if (task.assignedTo && task.assignedTo.status === 'pending') {
                e.preventDefault();
                return;
            }
            const newStatus = isChecked ? 'completed' : 'todo';
            const oldStatus = task.status; // Capture the old status for logging

            const updateData = {
                status: newStatus,
                completedAt: isChecked ? firebase.firestore.FieldValue.serverTimestamp() : null
            };
            taskRef.update(updateData);
    
            // The achievement check has been removed from here.
            // We also fix a minor logging bug by using our captured oldStatus.
            let conversationId = task.conversationId || await createConversationForTask(taskId);
            if (conversationId) {
                addUpdateLog(conversationId, 'status', { oldValue: oldStatus, newValue: newStatus });
            }

            if (isChecked && task.assignedBy && task.originalTaskId && task.originalAssignerUid) {
                const originalTaskRef = db.collection('users').doc(task.originalAssignerUid).collection('tasks').doc(task.originalTaskId);
                    originalTaskRef.get().then(doc => {
                        if (doc.exists && doc.data().conversationId) {
                        addUpdateLog(doc.data().conversationId, 'assigned_completed', {});
                        }
                    });
                    originalTaskRef.update({
                        'assignedTo.status': 'completed',
                        'assignedTo.completedAt': firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(err => console.error("Error updating original assigned task:", err));
            }
        } else if (e.target.closest('.delete-btn')) {
        // Confirm before deleting
        if (confirm(`Are you sure you want to delete the task "${task.text}"?`)) {
        // Check if the task is synced to Google Calendar
        if (task.googleCalendarEventId) {
            // If yes, attempt to delete the calendar event first
            deleteGoogleCalendarEvent(task.googleCalendarEventId).finally(() => {
                // Regardless of whether the calendar deletion succeeds or fails,
                // proceed with deleting the task from our app.
                taskRef.delete();
            });
        } else {
            // If not synced, just delete the task from our app
            taskRef.delete();
        }
    }
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

    taskAttachmentsInput?.addEventListener('change', handleFileUpload);
    attachmentsListModal?.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-attachment-btn');
        if (deleteBtn) {
            const { name, id, path } = deleteBtn.dataset;

            if (id) { // Removing a file selected for upload
                filesToUpload = filesToUpload.filter(f => f.id !== id);
            
            } else { // Removing a pre-existing attachment during edit
                existingAttachments = existingAttachments.filter(f => f.name !== name);
                if (path) {
                    if (path.startsWith(`task_attachments/${currentUser.uid}/`)) {
                        try {
                            await storage.ref(path).delete();
                            console.log(`Deleted personal file from storage: ${path}`);
                        } catch (error) {
                            console.error(`Failed to delete file from storage: ${path}`, error);
                            // Note: We still proceed to remove it from the UI.
                        }
                    }
                }
                // Log the removal of an existing attachment
                if (editingTaskId) {
                    const task = allTasks.find(t => t.id === editingTaskId);
                    if (task && task.conversationId) {
                        await addUpdateLog(task.conversationId, 'attachment_removed', { fileName: name });
                    }
                }
            }
            
            deleteBtn.closest('.attachment-item-preview').remove();
        }
    });

    detailCommentForm?.addEventListener('submit', handlePostComment);

    modeToggle?.addEventListener('change', (e) => {
        const isTeamMode = e.target.checked;
        if (isTeamMode && !isPremiumUser()) {
            e.preventDefault(); // Stop the toggle switch
            e.target.checked = false; // Visually revert the switch
            openUpgradeModal(); // Show the upgrade modal
            return; // Exit the function
        }
        if (isTeamMode) {
            if (typeof initTeamMode === 'function') initTeamMode();
            else console.error("teammode.js functions not loaded.");
        } else {
            if (typeof tearDownTeamMode === 'function') tearDownTeamMode();
            else console.error("teammode.js functions not loaded.");
            listenForTasks();
        }
    });

    const paletteSwitcher = document.getElementById('palette-switcher');
    paletteSwitcher?.addEventListener('change', e => {
        if (e.target.matches('input[name="palette"]')) {
            userPreferences.palette = e.target.value;
            applyUserPreferences(userPreferences);
        }
    });

   
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
        const updateOnlineStatus = () => {
            offlineIndicator.classList.toggle('hide', navigator.onLine);
        };
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus); 
        updateOnlineStatus(); // Set initial status
    }
    /**
     * Handles the achievement reset process.
     */
    const handleResetAchievements = async () => {
        if (!currentUser) return;

        if (!confirm("Are you sure you want to reset all your achievements? This action cannot be undone.")) {
            return;
        }

        try {
            const userRef = db.collection('users').doc(currentUser.uid);
            await userRef.update({
                unlockedBadges: []
            });

            if (currentUserProfile) {
                currentUserProfile.unlockedBadges = [];
            }
            renderBadges();

            showFeedback(profileFeedback, "Achievements reset successfully!", "success");

        } catch (error) {
            console.error("Error resetting achievements:", error);
            showFeedback(profileFeedback, "Failed to reset achievements. Please try again.", "error");
        }
    };

    resetAchievementsBtn?.addEventListener('click', handleResetAchievements);

    // --- Google Calendar Integration --- //
    const connectGoogleCalendarBtn = document.getElementById('connect-google-calendar-btn');

    // BLOCK 1: Handles the "Connect" button in the profile settings
    connectGoogleCalendarBtn?.addEventListener('click', () => {
        // First, check if a user is currently signed in.
        if (!auth.currentUser) {
            showFeedback(profileFeedback, "You must be signed in to connect your calendar.", "error");
            return;
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/calendar.events');

        provider.setCustomParameters({ prompt: 'select_account' });

        // Use linkWithPopup to connect to the *current* user, not sign in a new one.
        auth.currentUser.linkWithPopup(provider)
            .then((result) => {
                // The Google account is now linked to the existing user.
                const credential = result.credential;
                const accessToken = credential.accessToken;

                console.log("Successfully linked Google Calendar to current user!");
                console.log("Access Token:", accessToken);

                // Update UI
                connectGoogleCalendarBtn.innerHTML = '<i class="fab fa-google" style="margin-right: 8px;"></i> Calendar Connected';
                connectGoogleCalendarBtn.disabled = true;
                updateUserPreference('googleCalendarLinked', true);
                showFeedback(profileFeedback, "Google Calendar connected successfully!", "success");

            }).catch((error) => {
                // Handle the specific error when a Google account is already in use by another account
                if (error.code === 'auth/credential-already-in-use') {
                    showFeedback(profileFeedback, "This Google account is already linked to another user.", "error");
                } else if (error.code === 'auth/popup-closed-by-user') {
                    showFeedback(profileFeedback, "Connection process canceled.", "error");
                } else {
                    console.error(`Google Link Error (${error.code}):`, error.message);
                    showFeedback(profileFeedback, "Could not connect to Google Calendar.", "error");
                }
            });
    });

    // --- EXPORT FEATURE LOGIC --- //
    const exportBtn = document.getElementById('export-btn');
    const exportModal = document.getElementById('export-modal');
    const cancelExportBtn = document.getElementById('cancel-export-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    exportBtn?.addEventListener('click', () => {
        // Check if the user is premium
        if (isPremiumUser()) {
            // If premium, show the export options modal
            if (exportModal) exportModal.classList.remove('hide');
        } else {
            // If not premium, show the upgrade modal
            openUpgradeModal();
        }
    });
    cancelExportBtn?.addEventListener('click', () => exportModal.classList.add('hide'));

    const escapeCsvCell = (cell) => {
        if (cell === null || cell === undefined) {
            return '';
        }
        const cellStr = String(cell);
        // FIX: Changed /[,\\n"]/ to /[,\n"]/ to correctly find newline characters.
        if (cellStr.search(/[,"]/) >= 0) {
            // Also, escape any existing double quotes by doubling them.
            return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
    };

    const exportTasksToCsv = () => {
        const tasksToExport = getFilteredTasks();
        if (tasksToExport.length === 0) {
            alert("No tasks to export based on the current filters.");
            return;
        }

        const headers = ["Title", "Status", "Priority", "Category", "Deadline", "Subtasks"];
        
        const rows = tasksToExport.map(task => {
            const deadline = task.deadline ? task.deadline.toDate().toLocaleString() : '';
            const subtasks = task.subtasks ? task.subtasks.map(s => s.text).join('; ') : '';
            
            return [
                task.text,
                task.status,
                task.priority,
                task.category,
                deadline,
                subtasks
            ].map(escapeCsvCell).join(',');
        });

        // FIX: Changed '\\n' to '\n' to create proper newlines.
        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "tasks.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        exportModal.classList.add('hide');
    };
    const exportTasksToExcel = () => {
        const tasksToExport = getFilteredTasks();
        if (tasksToExport.length === 0) {
            alert("No tasks to export based on the current filters.");
            return;
        }

        // 1. Format the data into an array of objects
        const formattedData = tasksToExport.map(task => ({
            Title: task.text,
            Status: task.status,
            Priority: task.priority,
            Category: task.category,
            Deadline: task.deadline ? task.deadline.toDate().toLocaleString() : '',
            Subtasks: task.subtasks ? task.subtasks.map(s => s.text).join('; ') : ''
        }));

        // 2. Create a worksheet from the data
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // 3. Create a workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

        // 4. Trigger the download
        XLSX.writeFile(workbook, "tasks.xlsx");

        exportModal.classList.add('hide');
    };

    const exportTasksToPdf = () => {
        const tasksToExport = getFilteredTasks();
        if (tasksToExport.length === 0) {
            alert("No tasks to export based on the current filters.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 1. Define the table headers and rows
        const tableHeaders = [["Title", "Status", "Priority", "Category", "Deadline"]];
        const tableRows = tasksToExport.map(task => ([
            task.text,
            task.status,
            task.priority,
            task.category,
            task.deadline ? task.deadline.toDate().toLocaleDateString() : ''
        ]));

        // 2. Add a title to the document
        doc.text("My To-Do List", 14, 15);

        // 3. Use the autoTable plugin to generate the table
        doc.autoTable({
            head: tableHeaders,
            body: tableRows,
            startY: 20, // Start the table below the title
        });

        // 4. Trigger the download
        doc.save('tasks.pdf');

        exportModal.classList.add('hide');
    };

    exportPdfBtn?.addEventListener('click', exportTasksToPdf);
    exportExcelBtn?.addEventListener('click', exportTasksToExcel);
    exportCsvBtn?.addEventListener('click', exportTasksToCsv);
    handleSlackLinking();
});