// --- DOM Elements --- //
const teamControlsContainer = document.querySelector('.team-controls-container');

// FIX 1: Change 'const' to 'let' so we can update them when we clone elements
let shareTasksBtn = document.getElementById('share-tasks-btn');
let assignTasksBtn = document.getElementById('assign-tasks-btn');

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

function initTeamMode() {
    if (currentUser && displayNameInput) {
        welcomeUserName.textContent = `Welcome, ${displayNameInput.value || 'User'}!`;
    }
    teamWelcomeModal.classList.remove('hide');
    
    // Setup Start Button
    startTeamModeBtn.removeEventListener('click', handleStartTeamMode); 
    startTeamModeBtn.addEventListener('click', handleStartTeamMode, { once: true });

    // Setup Form Listeners
    taskListViewForTeam.removeEventListener('change', handleSelectionCheckboxChange);
    taskListViewForTeam.addEventListener('change', handleSelectionCheckboxChange);
    
    shareTaskForm.removeEventListener('submit', handleSendFormSubmit);
    shareTaskForm.addEventListener('submit', handleSendFormSubmit);
    
    cancelShareBtn.removeEventListener('click', closeSendModal);
    cancelShareBtn.addEventListener('click', closeSendModal);

    // --- FIX 2: Correctly update global variables after cloning ---
    const shareBtn = document.getElementById('share-tasks-btn');
    const assignBtn = document.getElementById('assign-tasks-btn');

    if (shareBtn) {
        const newShare = shareBtn.cloneNode(true);
        shareBtn.parentNode.replaceChild(newShare, shareBtn);
        newShare.addEventListener('click', shareButtonHandler);
        shareTasksBtn = newShare; // Update global reference
    }

    if (assignBtn) {
        const newAssign = assignBtn.cloneNode(true);
        assignBtn.parentNode.replaceChild(newAssign, assignBtn);
        newAssign.addEventListener('click', assignButtonHandler);
        assignTasksBtn = newAssign; // Update global reference
    }
}

function tearDownTeamMode() {
    teamControlsContainer.classList.add('hide');

    if (shareTasksBtn) shareTasksBtn.removeEventListener('click', shareButtonHandler);
    if (assignTasksBtn) assignTasksBtn.removeEventListener('click', assignButtonHandler);

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
    // No specific listener needed as we use the main task list.
    // We rely on the UI toggle logic to show/hide functionality.
}

function toggleSelectionMode(action) {
    const isCancelling = currentTeamAction === action;
    
    // Remove active class from BOTH buttons using current DOM references
    if(shareTasksBtn) shareTasksBtn.classList.remove('active');
    if(assignTasksBtn) assignTasksBtn.classList.remove('active');
    
    currentTeamAction = isCancelling ? null : action;
    
    if (currentTeamAction) {
        const activeBtn = document.getElementById(`${currentTeamAction}-tasks-btn`);
        if(activeBtn) activeBtn.classList.add('active');
    }
    
    toggleSelectionCheckboxesVisibility(!isCancelling, currentTeamAction);
    tasksToProcess.clear();
    updateSendButtonVisibility();
}

function toggleSelectionCheckboxesVisibility(show, action) {
    // FIX 3: Updated selector to match the new class 'task-row-modern'
    taskListViewForTeam.querySelectorAll('.task-row-modern').forEach(item => {
        const taskId = item.dataset.id;
        const task = typeof allTasks !== 'undefined' ? allTasks.find(t => t.id === taskId) : null;
        
        const checkboxWrapper = item.querySelector('.share-checkbox-wrapper');
        
        if (checkboxWrapper) {
            const isEligible = task && !task.sharedBy && !task.assignedBy && !task.assignedTo;
            
            if (show && isEligible) {
                const colorVar = action === 'assign' ? 'var(--assign-color)' : 'var(--team-color)';
                
                // FIX 4: Added onclick="event.stopPropagation()" to prevent opening modal
                // Also added dynamic style injection to ensure correct color (Teal vs Indigo)
                checkboxWrapper.innerHTML = `
                    <input type="checkbox" 
                           class="share-checkbox" 
                           data-task-id="${taskId}" 
                           onclick="event.stopPropagation()">
                    <style>
                        .share-checkbox[data-task-id="${taskId}"]:checked {
                            background-color: ${colorVar} !important;
                            border-color: ${colorVar} !important;
                        }
                    </style>
                `;
            } else {
                checkboxWrapper.innerHTML = '';
            }
        }
    });
}

function handleSelectionCheckboxChange(e) {
    if (!e.target.matches('.share-checkbox')) return;
    // Extra safety: stop propagation here too
    e.stopPropagation();
    
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
        
        // NEW: Inject the SVG Structure for the animation
        sendTasksBtn.innerHTML = `
          <div class="svg-wrapper-1">
            <div class="svg-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"></path>
                <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"></path>
              </svg>
            </div>
          </div>
          <span>${actionText} ${tasksToProcess.size} Task(s)</span>
        `;
        
        // Dynamic background update based on action
        if (currentTeamAction === 'assign') {
             // Teal Gradient for Assign
             sendTasksBtn.style.background = 'linear-gradient(to bottom, #0D9488 0%, #2DD4BF 100%)';
        } else {
             // Brand Gradient for Share
             sendTasksBtn.style.background = 'var(--brand-gradient)';
        }
    }
}

// ... (Rest of the file remains unchanged) ...
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
        const shareOrAssignFunction = firebase.functions().httpsCallable('shareOrAssignTasks');
        const result = await shareOrAssignFunction({
            recipientEmail: recipientEmail,
            taskIds: Array.from(tasksToProcess),
            action: currentTeamAction
        });

        if (result.data.success) {
            showShareFeedback(result.data.message || `Successfully sent ${tasksToProcess.size} task(s)!`, 'success');
            setTimeout(() => {
                closeSendModal();
                toggleSelectionMode(null); 
            }, 1500);
        } else {
             throw new Error(result.data.message || 'Function reported failure.');
        }

    } catch (error) {
        console.error(`Error calling shareOrAssignTasks for '${currentTeamAction}':`, error);
        let feedbackMessage = 'An error occurred. Please try again.';
        if (error.message) {
            feedbackMessage = error.message; 
        }
        showShareFeedback(feedbackMessage, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}