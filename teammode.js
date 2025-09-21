// This file should be loaded after the main script.js

// --- DOM Elements --- //
const teamControlsContainer = document.querySelector('.team-controls-container');
const shareTasksBtn = document.getElementById('share-tasks-btn');
const shareTaskModal = document.getElementById('share-task-modal');
const shareTaskForm = document.getElementById('share-task-form');
const cancelShareBtn = document.getElementById('cancel-share-btn');
const shareEmailInput = document.getElementById('share-email-input');
const taskListViewForTeam = document.getElementById('task-list-view');
const teamWelcomeModal = document.getElementById('team-welcome-modal');
const startTeamModeBtn = document.getElementById('start-team-mode-btn');
const welcomeUserName = document.getElementById('welcome-user-name');

// Create and inject a feedback element into the share modal for non-disruptive messages
let shareModalFeedback;
if (shareTaskForm) {
    shareModalFeedback = document.createElement('p');
    shareModalFeedback.className = 'feedback';
    // Insert it before the modal action buttons
    const modalActions = shareTaskForm.querySelector('.modal-actions');
    if (modalActions) {
        shareTaskForm.insertBefore(shareModalFeedback, modalActions);
    }
}


// --- Team Mode State --- //
let isSharingActive = false;
let tasksToShare = new Set();
let sendSharedTasksBtn = null;
let unsubscribeTeamTasks;


// --- Main Team Mode Functions --- //

/**
 * Initializes Team Mode.
 * This function is called from script.js when the toggle is switched to "Team".
 */
function initTeamMode() {
    if (currentUser && displayNameInput) {
        welcomeUserName.textContent = `Welcome, ${displayNameInput.value || 'User'}!`;
    }
    teamWelcomeModal.classList.remove('hide');
    
    // Attach listeners
    startTeamModeBtn.addEventListener('click', handleStartTeamMode);
    shareTasksBtn.addEventListener('click', toggleSharingState);
    taskListViewForTeam.addEventListener('change', handleShareCheckboxChange);
    shareTaskForm.addEventListener('submit', handleShareFormSubmit);
    cancelShareBtn.addEventListener('click', closeShareModal);
}

/**
 * Tears down Team Mode.
 * Called from script.js when switching back to "Simple" mode.
 */
function tearDownTeamMode() {
    teamControlsContainer.classList.add('hide');
    if (isSharingActive) {
        toggleSharingState(); // Gracefully exit sharing mode if active
    }
    if (sendSharedTasksBtn) {
        sendSharedTasksBtn.classList.add('hide');
    }
    if (unsubscribeTeamTasks) unsubscribeTeamTasks();
}

/**
 * Handles the click on the "Let's Start" button in the welcome modal.
 */
function handleStartTeamMode() {
    teamWelcomeModal.classList.add('hide');
    teamControlsContainer.classList.remove('hide');

    // Dynamically create the "Send Selected" button if it doesn't exist
    if (!document.getElementById('send-shared-tasks-btn')) {
        sendSharedTasksBtn = document.createElement('button');
        sendSharedTasksBtn.id = 'send-shared-tasks-btn';
        sendSharedTasksBtn.className = 'hide'; // Hide it initially
        sendSharedTasksBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Send Selected`;
        teamControlsContainer.appendChild(sendSharedTasksBtn);
        sendSharedTasksBtn.addEventListener('click', openShareModal);
    }
    
    listenForTeamTasks();
}

/**
 * Listens for tasks in team mode. It's the same collection, but this ensures
 * the listener is active when in team mode.
 */
function listenForTeamTasks() {
    if (!currentUser) return;
    if (unsubscribeTeamTasks) unsubscribeTeamTasks();

    unsubscribeTeamTasks = db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAll(); // Use the main render function
        });
}


/**
 * Toggles the app in and out of "task selection" mode.
 */
function toggleSharingState() {
    isSharingActive = !isSharingActive;
    shareTasksBtn.classList.toggle('active', isSharingActive);
    shareTasksBtn.innerHTML = isSharingActive ?
        `<i class="fas fa-times"></i> Cancel` :
        `<i class="fas fa-share-alt"></i> Share`;
    
    toggleShareCheckboxesVisibility(isSharingActive);

    if (!isSharingActive) {
        tasksToShare.clear();
        updateSendButtonVisibility();
    }
}

/**
 * Shows or hides share checkboxes on all eligible tasks.
 * @param {boolean} show - Whether to show or hide the checkboxes.
 */
function toggleShareCheckboxesVisibility(show) {
    const taskItems = taskListViewForTeam.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        const taskId = item.dataset.id;
        const task = allTasks.find(t => t.id === taskId);
        const checkboxWrapper = item.querySelector('.share-checkbox-wrapper');

        if (checkboxWrapper) {
            // Only add checkboxes to tasks that are not already shared with the current user
            if (show && task && !task.sharedBy) {
                checkboxWrapper.innerHTML = `<input type="checkbox" class="share-checkbox" data-task-id="${taskId}">`;
            } else {
                checkboxWrapper.innerHTML = '';
            }
        }
    });
}

/**
 * Handles change events on any share checkbox.
 * @param {Event} e - The change event.
 */
function handleShareCheckboxChange(e) {
    if (!e.target.matches('.share-checkbox')) return;
    
    const taskId = e.target.dataset.taskId;
    if (e.target.checked) {
        tasksToShare.add(taskId);
    } else {
        tasksToShare.delete(taskId);
    }
    updateSendButtonVisibility();
}

/**
 * Shows or hides the "Send Selected" button based on selection.
 */
function updateSendButtonVisibility() {
    if (sendSharedTasksBtn) {
       sendSharedTasksBtn.classList.toggle('hide', tasksToShare.size === 0);
    }
}

/**
 * Shows feedback inside the share modal.
 * @param {string} message The message to display.
 * @param {string} type 'success' or 'error'.
 */
function showShareFeedback(message, type) {
    if (shareModalFeedback) {
        shareModalFeedback.textContent = message;
        shareModalFeedback.className = 'feedback'; // Reset classes
        shareModalFeedback.classList.add(type);
    }
}

function openShareModal() {
    // The button to open this modal is hidden if no tasks are selected, so an alert isn't necessary.
    if (tasksToShare.size > 0) {
        if (shareModalFeedback) shareModalFeedback.textContent = ''; // Clear previous feedback
        shareTaskModal.classList.remove('hide');
    }
}

function closeShareModal() {
    shareTaskModal.classList.add('hide');
    shareTaskForm.reset();
    if (shareModalFeedback) shareModalFeedback.textContent = ''; // Clear feedback on close
}

/**
 * Handles the submission of the share tasks form.
 * @param {Event} e - The form submission event.
 */
async function handleShareFormSubmit(e) {
    e.preventDefault();
    if (shareModalFeedback) shareModalFeedback.textContent = ''; // Clear previous feedback

    const recipientEmail = shareEmailInput.value.trim().toLowerCase();
    const sharer = auth.currentUser;

    if (!recipientEmail || !sharer) return;
    if (recipientEmail === sharer.email) {
        showShareFeedback("You cannot share tasks with yourself.", "error");
        return;
    }

    const submitBtn = shareTaskForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending...`;

    try {
        // 1. Find the recipient user by their email
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('email', '==', recipientEmail).get();

        if (querySnapshot.empty) {
            showShareFeedback('User not found. Please check the email address.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        const recipient = querySnapshot.docs[0];
        const recipientUid = recipient.id;
        const sharerDisplayName = sharer.displayName || sharer.email.split('@')[0];

        // 2. Create a batch write to add all tasks atomically
        const batch = db.batch();
        const recipientTasksRef = db.collection('users').doc(recipientUid).collection('tasks');

        tasksToShare.forEach(taskId => {
            const originalTask = allTasks.find(t => t.id === taskId);
            if (originalTask && !originalTask.sharedBy) { // Double check it's not a task shared with you
                const { id, ...taskData } = originalTask;
                const newTaskPayload = {
                    ...taskData,
                    status: 'todo', // Shared tasks should start as 'todo' for the recipient
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    sharedBy: { // This object structure is important for the security rule
                        name: sharerDisplayName,
                        uid: sharer.uid
                    }
                };
                // Add the new task to the batch, letting Firestore generate a new doc ID
                const newDocRef = recipientTasksRef.doc();
                batch.set(newDocRef, newTaskPayload);
            }
        });

        // 3. Commit the batch
        await batch.commit();
        
        showShareFeedback(`Successfully shared ${tasksToShare.size} task(s)!`, 'success');
        
        // 4. Reset UI after a delay to show the success message
        setTimeout(() => {
            closeShareModal();
            toggleSharingState(); // Exits sharing mode
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }, 1500);

    } catch (error) {
        console.error("Error sharing tasks: ", error);
        showShareFeedback('An error occurred while sharing tasks. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

