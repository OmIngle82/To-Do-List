// --- DOM Elements --- //
const teamControlsContainer = document.querySelector('.team-controls-container');
const shareTasksBtn = document.getElementById('share-tasks-btn');
const assignTasksBtn = document.getElementById('assign-tasks-btn');
const shareTaskModal = document.getElementById('share-task-modal');
const shareModalTitle = document.getElementById('share-modal-title');
const shareTaskForm = document.getElementById('share-task-form');
const cancelShareBtn = document.getElementById('cancel-share-btn');
const shareEmailInput = document.getElementById('share-email-input');
const taskListViewForTeam = document.getElementById('task-list-view');
const teamWelcomeModal = document.getElementById('team-welcome-modal');
const startTeamModeBtn = document.getElementById('start-team-mode-btn');
const welcomeUserName = document.getElementById('welcome-user-name');
let shareModalFeedback;
if (shareTaskForm) {
    shareModalFeedback = document.createElement('p');
    shareModalFeedback.className = 'feedback';
    const modalActions = shareTaskForm.querySelector('.modal-actions');
    if (modalActions) shareTaskForm.insertBefore(shareModalFeedback, modalActions);
}

// --- Team Mode State --- //
let teamModeActive = false;
let currentTeamAction = null; // Can be 'share' or 'assign'
let tasksToProcess = new Set();
let sendTasksBtn = null;
let unsubscribeTeamTasks;

const shareButtonHandler = () => {
    toggleSelectionMode('share');
};
const assignButtonHandler = () => {
    toggleSelectionMode('assign');
};

// --- Main Team Mode Functions --- //
// In teammode.js

function initTeamMode() {
    if (currentUser && displayNameInput) {
        welcomeUserName.textContent = `Welcome, ${displayNameInput.value || 'User'}!`;
    }
    teamWelcomeModal.classList.remove('hide');
    startTeamModeBtn.addEventListener('click', handleStartTeamMode, { once: true });
    taskListViewForTeam.addEventListener('change', handleSelectionCheckboxChange);
    shareTaskForm.addEventListener('submit', handleSendFormSubmit);
    cancelShareBtn.addEventListener('click', closeSendModal);
}

// In teammode.js

function tearDownTeamMode() {
    teamControlsContainer.classList.add('hide');

    shareTasksBtn.removeEventListener('click', shareButtonHandler);
    assignTasksBtn.removeEventListener('click', assignButtonHandler);

    if (teamModeActive) {
        toggleSelectionMode(null); // Reset selection state
    }
    if (sendTasksBtn) {
        sendTasksBtn.remove();
        sendTasksBtn = null;
    }
    if (unsubscribeTeamTasks) unsubscribeTeamTasks();
    teamModeActive = false;
}

function handleStartTeamMode() {
    teamWelcomeModal.classList.add('hide');
    teamControlsContainer.classList.remove('hide');
    teamModeActive = true;

    shareTasksBtn.removeEventListener('click', shareButtonHandler);
    assignTasksBtn.removeEventListener('click', assignButtonHandler);
    shareTasksBtn.addEventListener('click', shareButtonHandler);
    assignTasksBtn.addEventListener('click', assignButtonHandler);

    if (!document.getElementById('send-tasks-btn')) {
        sendTasksBtn = document.createElement('button');
        sendTasksBtn.id = 'send-tasks-btn';
        sendTasksBtn.className = 'hide';
        teamControlsContainer.prepend(sendTasksBtn);
        sendTasksBtn.addEventListener('click', openSendModal);
    }
    listenForTeamTasks();
}

function listenForTeamTasks() {
    if (!currentUser) return;
    if (unsubscribeTeamTasks) unsubscribeTeamTasks();
    unsubscribeTeamTasks = db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('order', 'asc')
        .onSnapshot(snapshot => {
            allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAll();
        });
}

function toggleSelectionMode(action) {
    const isCancelling = currentTeamAction === action;
    shareTasksBtn.classList.remove('active');
    assignTasksBtn.classList.remove('active');
    currentTeamAction = isCancelling ? null : action;
    if (currentTeamAction) {
        document.getElementById(`${currentTeamAction}-tasks-btn`).classList.add('active');
    }
    toggleSelectionCheckboxesVisibility(!isCancelling, currentTeamAction);
    tasksToProcess.clear();
    updateSendButtonVisibility();
}

function toggleSelectionCheckboxesVisibility(show, action) {
    taskListViewForTeam.querySelectorAll('.task-item').forEach(item => {
        const taskId = item.dataset.id;
        const task = allTasks.find(t => t.id === taskId);
        const checkboxWrapper = item.querySelector('.share-checkbox-wrapper');
        if (checkboxWrapper) {
            const isEligible = task && !task.sharedBy && !task.assignedBy && !task.assignedTo;
            if (show && isEligible) {
                const colorVar = action === 'assign' ? 'var(--assign-color)' : 'var(--team-color)';
                checkboxWrapper.innerHTML = `<input type="checkbox" class="share-checkbox" data-task-id="${taskId}" style="accent-color: ${colorVar};">`;
            } else {
                checkboxWrapper.innerHTML = '';
            }
        }
    });
}

function handleSelectionCheckboxChange(e) {
    if (!e.target.matches('.share-checkbox')) return;
    const taskId = e.target.dataset.taskId;
    if (e.target.checked) tasksToProcess.add(taskId);
    else tasksToProcess.delete(taskId);
    updateSendButtonVisibility();
}

function updateSendButtonVisibility() {
    if (!sendTasksBtn) return;
    const hasSelection = tasksToProcess.size > 0;
    sendTasksBtn.classList.toggle('hide', !hasSelection);
    if (hasSelection) {
        const actionText = currentTeamAction.charAt(0).toUpperCase() + currentTeamAction.slice(1);
        sendTasksBtn.innerHTML = `<i class="fas fa-paper-plane"></i> ${actionText} ${tasksToProcess.size} Task(s)`;
        const colorVar = `var(--${currentTeamAction === 'assign' ? 'assign-color' : 'team-color'})`;
        sendTasksBtn.style.backgroundColor = colorVar;
    }
}

function showShareFeedback(message, type) {
    if (shareModalFeedback) {
        shareModalFeedback.textContent = message;
        shareModalFeedback.className = 'feedback ' + type;
    }
}

function openSendModal() {
    if (tasksToProcess.size > 0) {
        shareModalTitle.textContent = currentTeamAction === 'assign' ? 'Assign Selected Tasks' : 'Share Selected Tasks';
        if (shareModalFeedback) shareModalFeedback.textContent = '';
        shareTaskModal.classList.remove('hide');
    }
}

function closeSendModal() {
    shareTaskModal.classList.add('hide');
    shareTaskForm.reset();
    if (shareModalFeedback) shareModalFeedback.textContent = '';
}

async function handleSendFormSubmit(e) {
    e.preventDefault();
    if (shareModalFeedback) shareModalFeedback.textContent = '';
    const recipientEmail = shareEmailInput.value.trim().toLowerCase();
    const sharer = auth.currentUser;

    if (!recipientEmail || !sharer || recipientEmail === sharer.email) {
        showShareFeedback("Invalid email or you cannot send tasks to yourself.", "error");
        return;
    }
    if (tasksToProcess.size === 0) {
        showShareFeedback("No tasks selected.", "error");
        return;
    }

    const submitBtn = shareTaskForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending...`;

    try {
        // --- CALL THE NEW CLOUD FUNCTION ---
        const shareOrAssignFunction = firebase.functions().httpsCallable('shareOrAssignTasks');
        const result = await shareOrAssignFunction({
            recipientEmail: recipientEmail,
            taskIds: Array.from(tasksToProcess), // Convert Set to Array
            action: currentTeamAction // 'share' or 'assign'
        });
        // --- END OF FUNCTION CALL ---

        // Check result from the function
        if (result.data.success) {
            showShareFeedback(result.data.message || `Successfully sent ${tasksToProcess.size} task(s)!`, 'success');
            setTimeout(() => {
                closeSendModal();
                toggleSelectionMode(null); // Reset selection UI
                // No need to manually update lists, Firestore listener will handle it
            }, 1500);
        } else {
            // This case might not happen if function throws errors, but good to have
             throw new Error(result.data.message || 'Function reported failure.');
        }

    } catch (error) {
        console.error(`Error calling shareOrAssignTasks for '${currentTeamAction}':`, error);
        // Display specific error messages from the Cloud Function
        let feedbackMessage = 'An error occurred. Please try again.';
        if (error.message) {
            feedbackMessage = error.message; // Show the specific error (e.g., limit reached)
        }
        showShareFeedback(feedbackMessage, 'error');
    } finally {
        // Always re-enable the button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

