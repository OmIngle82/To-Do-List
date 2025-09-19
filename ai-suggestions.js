
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element & Global Variable References --- //
    const taskInput = document.getElementById('task-input');
    const aiSuggestionBox = document.getElementById('ai-suggestion-box');
    const categorySelect = document.getElementById('task-category');
    const customCategoryInput = document.getElementById('custom-category-input');

    // Check for required elements and variables from the main script.
    const isReady = taskInput && aiSuggestionBox && categorySelect && customCategoryInput &&
                    typeof datePicker !== 'undefined' && typeof timePicker !== 'undefined';

    if (!isReady) {
        console.error("AI Suggestions feature could not initialize. Required elements or Flatpickr instances are missing.");
        return;
    }

    // --- Keyword Definitions for AI Logic --- //
    const categoryKeywords = {
        'Shopping': ['buy', 'get', 'milk', 'bread', 'market', 'grocery', 'store', 'order'],
        'Work': ['meet', 'call', 'report', 'email', 'presentation', 'deadline', 'project', 'task', 'slack', 'team'],
        'Study': ['read', 'assignment', 'exam', 'learn', 'chapter', 'homework', 'quiz', 'paper'],
        'Personal': ['gym', 'workout', 'doctor', 'appointment', 'haircut', 'laundry', 'clean', 'meditate'],
        'Finance': ['pay bill', 'invoice', 'budget', 'bank', 'taxes', 'invest']
    };

    // --- Core AI Logic Functions --- //

    /**
     * Analyzes task text to recommend a category.
     * @param {string} text The task title.
     * @returns {string|null} The recommended category or null.
     */
    const recommendCategory = (text) => {
        const lowerText = text.toLowerCase();
        for (const category in categoryKeywords) {
            if (categoryKeywords[category].some(keyword => lowerText.includes(keyword))) {
                return category;
            }
        }
        return null;
    };

    /**
     * Analyzes task text to suggest a schedule (deadline).
     * @param {string} text The task title.
     * @returns {Date|null} A Date object for the suggested schedule or null.
     */
    const recommendSchedule = (text) => {
        const lowerText = text.toLowerCase();
        let recommendedDate = null;

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        // --- Day Recognition ---
        if (/\btomorrow\b/.test(lowerText)) {
            recommendedDate = tomorrow;
        } else if (/\btonight\b/.test(lowerText)) {
            recommendedDate = new Date();
            recommendedDate.setHours(20, 0, 0, 0); // Default to 8 PM
        } else if (/\btoday\b/.test(lowerText)) {
            recommendedDate = new Date();
        } else {
             // --- Day of the Week Recognition (e.g., "on Friday") ---
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            for (let i = 0; i < days.length; i++) {
                if (lowerText.includes(days[i])) {
                    const resultDate = new Date();
                    const currentDay = resultDate.getDay();
                    let dayDifference = i - currentDay;
                    if (dayDifference <= 0) { // If it's today or a past day of the week, move to next week
                        dayDifference += 7;
                    }
                    resultDate.setDate(resultDate.getDate() + dayDifference);
                    recommendedDate = resultDate;
                    break;
                }
            }
        }
       
        // --- Time Recognition (e.g., "at 5pm") ---
        if (recommendedDate) {
            if (/\bmorning\b/.test(lowerText)) recommendedDate.setHours(9, 0, 0, 0);
            else if (/\bafternoon\b/.test(lowerText)) recommendedDate.setHours(14, 0, 0, 0);
            else if (/\bevening\b/.test(lowerText)) recommendedDate.setHours(19, 0, 0, 0);

            const timeMatch = lowerText.match(/at (\d{1,2}):?(\d{2})?\s?(am|pm)?/);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const ampm = timeMatch[3];
                if (ampm === 'pm' && hour < 12) hour += 12;
                if (ampm === 'am' && hour === 12) hour = 0; // Midnight case
                recommendedDate.setHours(hour, minute, 0, 0);
            }
        }
        return recommendedDate;
    };

    /**
     * Helper to create a suggestion chip element.
     * @param {string} text The text for the chip.
     * @param {function} onClickHandler The function to call when the chip is clicked.
     */
    const createChip = (text, onClickHandler) => {
        const chip = document.createElement('div');
        chip.className = 'ai-suggestion-chip';
        chip.textContent = text;
        chip.onclick = onClickHandler;
        aiSuggestionBox.appendChild(chip);
    };

    /**
     * Renders suggestion chips for category and schedule.
     * @param {object} suggestions An object containing category and schedule recommendations.
     */
    const renderSuggestions = (suggestions) => {
        aiSuggestionBox.innerHTML = ''; // Clear previous suggestions
        aiSuggestionBox.style.display = 'none'; // Hide by default

        const hasCategory = !!suggestions.category;
        const hasSchedule = !!suggestions.schedule;

        // If there are any suggestions, prepare the container to display them side-by-side.
        if (hasCategory || hasSchedule) {
            aiSuggestionBox.style.display = 'flex';
            aiSuggestionBox.style.gap = '0.5rem';
            aiSuggestionBox.style.flexWrap = 'wrap';
        }

        // Render category suggestion chip
        if (hasCategory) {
            createChip(`Auto-Category: ${suggestions.category}`, () => {
                // Clicking the chip can just clear the suggestions area.
                aiSuggestionBox.innerHTML = '';
                aiSuggestionBox.style.display = 'none';
            });
        }
        
        // Render schedule suggestion chip
        if (hasSchedule) {
            const friendlyDate = suggestions.schedule.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
            createChip(`Suggested Schedule: ${friendlyDate}`, () => {
                datePicker.setDate(suggestions.schedule, true);
                timePicker.setDate(suggestions.schedule, true);
                aiSuggestionBox.innerHTML = ''; // Clear after applying
                aiSuggestionBox.style.display = 'none';
            });
        }
    };

    // --- Event Listener --- //
    
    // This listener handles the automatic categorization and schedule suggestions.
    taskInput.addEventListener('keyup', (e) => {
        const text = e.target.value;

        // 1. Handle Automatic Categorization
        const suggestedCategory = recommendCategory(text);
        if (suggestedCategory) {
            // Check if the category exists in the dropdown
            const categoryExists = [...categorySelect.options].some(option => option.value === suggestedCategory);
            if (categoryExists) {
                categorySelect.value = suggestedCategory;
                customCategoryInput.classList.add('hide');
            }
        }

        // 2. Handle Schedule Suggestions (as clickable chips)
        const suggestedSchedule = recommendSchedule(text);
        
        // 3. Render all suggestions to the UI
        renderSuggestions({ category: suggestedCategory, schedule: suggestedSchedule });
    });
});

