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

// --- Main Team Mode Functions --- //
function initTeamMode() {
    if (currentUser && displayNameInput) {
        welcomeUserName.textContent = `Welcome, ${displayNameInput.value || 'User'}!`;
    }
    teamWelcomeModal.classList.remove('hide');
    startTeamModeBtn.addEventListener('click', handleStartTeamMode, { once: true });
    shareTasksBtn.addEventListener('click', () => toggleSelectionMode('share'));
    assignTasksBtn.addEventListener('click', () => toggleSelectionMode('assign'));
    taskListViewForTeam.addEventListener('change', handleSelectionCheckboxChange);
    shareTaskForm.addEventListener('submit', handleSendFormSubmit);
    cancelShareBtn.addEventListener('click', closeSendModal);
}

function tearDownTeamMode() {
    teamControlsContainer.classList.add('hide');
    if (teamModeActive) {
        toggleSelectionMode(null);
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

    let isFirstLoad = true; // Prevents achievements from firing on initial load

    unsubscribeTeamTasks = db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            // Logic copied from the simple mode listener to ensure achievements work here too.
            const oldCompletedCount = isFirstLoad ? 0 : allTasks.filter(t => t.status === 'completed').length;
            
            allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const newCompletedCount = allTasks.filter(t => t.status === 'completed').length;

            if (!isFirstLoad && newCompletedCount > oldCompletedCount) {
                checkForAchievements();
            }
            
            renderAll();
            isFirstLoad = false;
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
    const submitBtn = shareTaskForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending...`;
    try {
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('email', '==', recipientEmail).get();
        if (querySnapshot.empty) {
            showShareFeedback('User not found. Please check the email.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }
        const recipient = querySnapshot.docs[0];
        const recipientUid = recipient.id;
        const recipientData = recipient.data();
        if (currentTeamAction === 'share') {
            await executeShare(recipientUid);
        } else if (currentTeamAction === 'assign') {
            await executeAssign(recipientUid, recipientData.displayName || recipientEmail.split('@')[0]);
        }
        showShareFeedback(`Successfully sent ${tasksToProcess.size} task(s)!`, 'success');
        setTimeout(() => {
            closeSendModal();
            toggleSelectionMode(null);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }, 1500);
    } catch (error) {
        console.error(`Error processing '${currentTeamAction}' action:`, error);
        showShareFeedback('An error occurred. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

async function executeShare(recipientUid) {
    const sharerDisplayName = currentUserProfile.displayName || currentUser.email.split('@')[0];
    const batch = db.batch();
    const senderTasksRef = db.collection('users').doc(currentUser.uid).collection('tasks');
    const recipientTasksRef = db.collection('users').doc(recipientUid).collection('tasks');

    for (const taskId of tasksToProcess) {
        const originalTask = allTasks.find(t => t.id === taskId);
        if (!originalTask) continue;

        let conversationId = originalTask.conversationId;

        // **FIX:** If no conversation exists, create one before sharing.
        if (!conversationId) {
            const convoRef = db.collection('task_conversations').doc();
            conversationId = convoRef.id;
            batch.set(convoRef, { authorizedUsers: [currentUser.uid], createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            const originalTaskRef = senderTasksRef.doc(taskId);
            batch.update(originalTaskRef, { conversationId: conversationId });
        }
        
        const { id, ...taskData } = originalTask;
        const newDocRef = recipientTasksRef.doc();
        batch.set(newDocRef, {
            ...taskData,
            conversationId: conversationId, // Ensure the new task has the correct conversationId
            status: 'todo',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            sharedBy: { name: sharerDisplayName, uid: currentUser.uid }
        });

        // Add recipient to the authorized users list for the conversation
        const convoRef = db.collection('task_conversations').doc(conversationId);
        batch.update(convoRef, {
            authorizedUsers: firebase.firestore.FieldValue.arrayUnion(recipientUid)
        });
    }
    await batch.commit();
}

async function executeAssign(recipientUid, recipientName) {
    const batch = db.batch();
    const senderTasksRef = db.collection('users').doc(currentUser.uid).collection('tasks');
    const recipientTasksRef = db.collection('users').doc(recipientUid).collection('tasks');
    const senderName = currentUserProfile.displayName || currentUser.email.split('@')[0];
    for (const taskId of tasksToProcess) {
        const originalTask = allTasks.find(t => t.id === taskId);
        if (!originalTask) continue;

        let conversationId = originalTask.conversationId;

        // **FIX:** If no conversation exists, create one before assigning.
        if (!conversationId) {
            const convoRef = db.collection('task_conversations').doc();
            conversationId = convoRef.id;
            batch.set(convoRef, { authorizedUsers: [currentUser.uid], createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            const originalTaskRef = senderTasksRef.doc(taskId);
            batch.update(originalTaskRef, { conversationId: conversationId });
        }
        
        const { id, ...taskData } = originalTask;
        const newRecipientTaskRef = recipientTasksRef.doc();
        batch.set(newRecipientTaskRef, {
            ...taskData,
            conversationId: conversationId, // Ensure the new task has the correct conversationId
            status: 'todo',
            category: 'Assigned',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            assignedBy: { name: senderName, uid: currentUser.uid },
            originalTaskId: taskId,
            originalAssignerUid: currentUser.uid,
        });
        
        const originalTaskRef = senderTasksRef.doc(taskId);
        batch.update(originalTaskRef, {
            assignedTo: { name: recipientName, uid: recipientUid, status: 'pending' }
        });

        // Add recipient to the authorized users list for the conversation
        const convoRef = db.collection('task_conversations').doc(conversationId);
        batch.update(convoRef, {
            authorizedUsers: firebase.firestore.FieldValue.arrayUnion(recipientUid)
        });
    }
    await batch.commit();
}