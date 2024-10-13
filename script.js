// Selectors
const calendar = document.getElementById('calendar');
const monthYear = document.getElementById('monthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

const todoModal = document.getElementById('todoModal');
const closeTodoModalBtn = todoModal.querySelector('.close');
const selectedDateSpan = document.getElementById('selectedDate');
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const clearTodosBtn = document.getElementById('clearTodosBtn');
const todoList = document.getElementById('todoList');

const reminderModal = document.getElementById('reminderModal');
const closeReminderModalBtn = reminderModal.querySelector('.close');
const todayTodoList = document.getElementById('todayTodoList');

const toggleDarkModeBtn = document.getElementById('toggleDarkMode');

/* New Selectors for "View All To-Dos" */
const allTodosModal = document.getElementById('allTodosModal');
const closeAllTodosModalBtn = allTodosModal.querySelector('.close');
const allTodoList = document.getElementById('allTodoList');
const viewAllTodosBtn = document.getElementById('viewAllTodos');
const clearAllTodosBtn = document.getElementById('clearAllTodosBtn');

// Date Variables
let currentDate = new Date();
let currentMonth = currentDate.getMonth(); // 0-indexed (0 = January)
let currentYear = currentDate.getFullYear();

// To-Do Data Structure
// Key: 'YYYY-MM-DD', Value: Array of to-dos
let todos = {};

// Load to-dos from localStorage if available
if (localStorage.getItem('todos')) {
    todos = JSON.parse(localStorage.getItem('todos'));
}

// Function to save to-dos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Function to generate calendar
function generateCalendar(month, year) {
    calendar.innerHTML = '';

    // Month and Year Display
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    monthYear.textContent = `${monthNames[month]} ${year}`;

    // Day Names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayName = document.createElement('div');
        dayName.classList.add('day-name');
        dayName.textContent = day;
        calendar.appendChild(dayName);
    });

    // First day of the month
    const firstDay = new Date(year, month, 1).getDay();

    // Number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate day cells
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day', 'disabled');
        calendar.appendChild(emptyCell);
    }

    const today = new Date();
    const todayKey = formatDate(today);

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day');
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = dateKey;

        const dateSpan = document.createElement('span');
        dateSpan.classList.add('date');
        dateSpan.textContent = day;
        dayCell.appendChild(dateSpan);

        // To-Do Count
        if (todos[dateKey] && todos[dateKey].length > 0) {
            const todoCount = document.createElement('span');
            todoCount.classList.add('todo-count');
            todoCount.textContent = todos[dateKey].length;
            dayCell.appendChild(todoCount);
        }

        // Highlight today's date
        if (dateKey === todayKey) {
            dayCell.classList.add('current-day');
        }

        // Click Event to open modal
        dayCell.addEventListener('click', () => openTodoModal(dateKey));

        calendar.appendChild(dayCell);
    }

    // After generating the calendar, check for today's to-dos
    checkTodayTodos();
}

// Helper Function to Format Date as 'YYYY-MM-DD'
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper Function to Check if a Date Key is Today
function isToday(dateKey) {
    const todayKey = formatDate(new Date());
    return dateKey === todayKey;
}

// Function to open the To-Do modal
function openTodoModal(dateKey) {
    selectedDateSpan.textContent = dateKey;
    todoInput.value = '';
    todoList.innerHTML = '';

    if (todos[dateKey] && todos[dateKey].length > 0) {
        todos[dateKey].forEach((todo, index) => {
            addTodoToList(todo, index);
        });
    }

    todoModal.style.display = 'block';
}

// Function to close the To-Do modal
function closeTodoModal() {
    todoModal.style.display = 'none';
}

// Function to add a to-do to the list in the modal
function addTodoToList(todo, index) {
    const li = document.createElement('li');
    li.textContent = todo;
    li.style.opacity = 0;
    li.style.transform = 'translateX(-20px)';
    setTimeout(() => {
        li.style.transition = 'all 0.3s';
        li.style.opacity = 1;
        li.style.transform = 'translateX(0)';
    }, 10);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this to-do?')) {
            deleteTodo(selectedDateSpan.textContent, index);
        }
    });

    li.appendChild(deleteBtn);
    todoList.appendChild(li);
}

// Function to add a new to-do
function addTodo() {
    const todoText = todoInput.value.trim();
    if (todoText === '') return;

    const dateKey = selectedDateSpan.textContent;
    if (!todos[dateKey]) {
        todos[dateKey] = [];
    }
    todos[dateKey].push(todoText);
    saveTodos();

    addTodoToList(todoText, todos[dateKey].length - 1);
    updateCalendarAfterTodoChange(dateKey);
    todoInput.value = '';

    // Optional: Send Notification if it's today
    if (isToday(dateKey)) {
        sendBrowserNotification(`New To-Do Added`, `You have a new to-do for today: "${todoText}"`);
    }
}

// Function to delete a to-do
function deleteTodo(dateKey, index) {
    const todoArray = todos[dateKey];
    if (!todoArray || index < 0 || index >= todoArray.length) return;

    const todoText = todoArray[index];

    // Remove the to-do from the data structure
    todoArray.splice(index, 1);
    if (todoArray.length === 0) {
        delete todos[dateKey];
    }
    saveTodos();

    // Refresh both modals and calendar
    generateCalendar(currentMonth, currentYear);

    // If the To-Do modal for the date is open, refresh its content
    if (todoModal.style.display === 'block' && selectedDateSpan.textContent === dateKey) {
        openTodoModal(dateKey);
    }

    // If the "View All To-Dos" modal is open, refresh its content
    if (allTodosModal.style.display === 'block') {
        openAllTodosModal();
    }
}

// Function to update calendar to reflect to-do changes
function updateCalendarAfterTodoChange(dateKey) {
    generateCalendar(currentMonth, currentYear);
}

// Function to check and display today's to-dos
function checkTodayTodos() {
    const todayKey = formatDate(new Date());
    if (todos[todayKey] && todos[todayKey].length > 0) {
        // Populate the reminder modal
        todayTodoList.innerHTML = '';
        todos[todayKey].forEach((todo, index) => {
            const li = document.createElement('li');
            li.textContent = todo;
            todayTodoList.appendChild(li);
        });

        // Show the reminder modal
        reminderModal.style.display = 'block';

        // Optional: Send a browser notification
        sendBrowserNotification('Today\'s To-Dos', `You have ${todos[todayKey].length} to-do(s) today.`);
    }
}

// Function to close the reminder modal
function closeReminderModal() {
    reminderModal.style.display = 'none';
}

// Function to toggle Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');

    // Save user preference in localStorage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Event Listener for Toggle Button
toggleDarkModeBtn.addEventListener('click', toggleDarkMode);

// Function to Check and Apply Dark Mode Preference on Page Load
function applyDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
    }
}

// Apply Dark Mode Preference on Initialization
applyDarkModePreference();

// Function to send a browser notification
function sendBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const options = {
            body: body,
            icon: 'icon.png', // Optional: Path to an icon image
            // You can add more options like vibrate, actions, etc.
        };
        new Notification(title, options);
    }
}

// Function to request Notification Permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                }
            });
        }
    }
}

// Automatically request notification permission on first load
requestNotificationPermission();

// Event Listeners for Close Buttons
closeTodoModalBtn.addEventListener('click', closeTodoModal);
closeReminderModalBtn.addEventListener('click', closeReminderModal);

/* New Event Listeners for "View All To-Dos" Modal */

// Function to open "View All To-Dos" modal
function openAllTodosModal() {
    allTodoList.innerHTML = '';

    // Iterate through 'todos' object and list all to-dos
    for (const date in todos) {
        if (todos.hasOwnProperty(date)) {
            todos[date].forEach((todo, index) => {
                const li = document.createElement('li');
                li.textContent = `${date}: ${todo}`;
                li.setAttribute('data-date', date);
                li.setAttribute('data-index', index);

                // Add Delete Button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '&times;';
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this to-do?')) {
                        deleteTodo(date, index);
                    }
                });

                li.appendChild(deleteBtn);
                allTodoList.appendChild(li);
            });
        }
    }

    allTodosModal.style.display = 'block';
}

// Function to close "View All To-Dos" modal
function closeAllTodosModal() {
    allTodosModal.style.display = 'none';
}

// Event Listener for "View All To-Dos" Button
viewAllTodosBtn.addEventListener('click', openAllTodosModal);

// Event Listener for Close Button of "View All To-Dos" Modal
closeAllTodosModalBtn.addEventListener('click', closeAllTodosModal);

// Function to clear all to-dos for a specific date
function clearTodosForDate(dateKey) {
    if (todos[dateKey] && todos[dateKey].length > 0) {
        if (confirm(`Are you sure you want to delete all to-dos for ${dateKey}?`)) {
            delete todos[dateKey];
            saveTodos();
            generateCalendar(currentMonth, currentYear);

            // Refresh To-Do modal if it's open for this date
            if (todoModal.style.display === 'block' && selectedDateSpan.textContent === dateKey) {
                openTodoModal(dateKey);
            }

            // Refresh "View All To-Dos" modal if it's open
            if (allTodosModal.style.display === 'block') {
                openAllTodosModal();
            }
        }
    } else {
        alert(`No to-dos found for ${dateKey}.`);
    }
}

// Function to clear all to-dos across all dates
function clearAllTodos() {
    if (Object.keys(todos).length === 0) {
        alert('There are no to-dos to clear.');
        return;
    }

    if (confirm('Are you sure you want to delete all to-dos across all dates? This action cannot be undone.')) {
        todos = {};
        saveTodos();
        generateCalendar(currentMonth, currentYear);

        // Refresh To-Do modal if it's open
        if (todoModal.style.display === 'block') {
            openTodoModal(selectedDateSpan.textContent);
        }

        // Refresh "View All To-Dos" modal if it's open
        if (allTodosModal.style.display === 'block') {
            openAllTodosModal();
        }

        // Also clear the reminder modal if visible
        if (reminderModal.style.display === 'block') {
            closeReminderModal();
        }
    }
}

// Event Listener for "Clear All" Button in Individual To-Do Modal
clearTodosBtn.addEventListener('click', () => {
    const dateKey = selectedDateSpan.textContent;
    clearTodosForDate(dateKey);
});

// Event Listener for "Clear All To-Dos" Button in "View All To-Dos" Modal
clearAllTodosBtn.addEventListener('click', clearAllTodos);

// Close modals when clicking outside the modal content
window.addEventListener('click', (event) => {
    if (event.target == todoModal) {
        closeTodoModal();
    }
    if (event.target == reminderModal) {
        closeReminderModal();
    }
    if (event.target == allTodosModal) {
        closeAllTodosModal();
    }
});

// Add To-Do Button
addTodoBtn.addEventListener('click', addTodo);

// Allow pressing Enter to add a to-do
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// Initialize Calendar
generateCalendar(currentMonth, currentYear);

// Event Listener for Previous Month Button
prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11; // December
        currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
});

// Event Listener for Next Month Button
nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0; // January
        currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
});