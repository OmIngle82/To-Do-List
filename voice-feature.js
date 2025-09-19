document.addEventListener('DOMContentLoaded', () => {
    const voiceAddTaskBtn = document.getElementById('voice-add-btn');
    const taskInput = document.getElementById('task-input');

    // Check if the necessary elements and functions from the original script are available
    if (!voiceAddTaskBtn || !taskInput || typeof openTaskModal !== 'function') {
        console.error("Voice feature could not initialize. Required elements or functions are missing.");
        if (voiceAddTaskBtn) voiceAddTaskBtn.style.display = 'none';
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            voiceAddTaskBtn.classList.add('active');
        };

        recognition.onend = () => {
            voiceAddTaskBtn.classList.remove('active');
        };

        recognition.onerror = (event) => {
            let errorMessage = "An unknown error occurred with speech recognition.";
            // Provide more specific feedback based on the error type
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMessage = "Microphone access was denied. Please allow microphone access in your browser's site settings to use this feature.";
            } else if (event.error === 'no-speech') {
                errorMessage = "No speech was detected. Please make sure your microphone is working and try again.";
            } else if (event.error === 'network') {
                errorMessage = "A network error occurred during speech recognition. Please check your internet connection.";
            }
            
            console.error("Speech Recognition Error:", event.error, `| Message: ${errorMessage}`);
            // The alert has been removed as it is disruptive. More detailed errors are now in the console.
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            
            // Call the global function from the original script.js
            openTaskModal(); 
            
            // Populate the input from the original script.js
            taskInput.value = transcript.charAt(0).toUpperCase() + transcript.slice(1);

            // Trigger the AI suggestion if it exists
            if (typeof getAISuggestion === 'function') {
                taskInput.dispatchEvent(new Event('keyup'));
            }
        };

        voiceAddTaskBtn.addEventListener('click', () => {
            recognition.start();
        });

    } else {
        // If the browser doesn't support the API, hide the button.
        console.warn("Speech Recognition API not supported in this browser.");
        voiceAddTaskBtn.style.display = 'none';
    }
});

