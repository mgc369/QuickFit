// Initialize main variables
let workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
let points = parseInt(localStorage.getItem('points')) || 0;

// Define user profile
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    name: '',
    weeklyGoal: 60,
    fitnessLevel: 'beginner',
    achievements: []
};

// Define achievements
const ACHIEVEMENTS = {
    workoutStreak: {
        id: 'workoutStreak',
        icon: '🔥',
        name: 'Workout Streak',
        description: 'Work out 3 days in a row',
        checkCondition: (stats) => stats.workouts >= 3
    },
    earlyBird: {
        id: 'earlyBird',
        icon: '🌅',
        name: 'Early Bird',
        description: 'Complete a morning workout',
        checkCondition: (stats) => stats.hasEarlyWorkout
    },
    pointCollector: {
        id: 'pointCollector',
        icon: '⭐',
        name: 'Point Collector',
        description: 'Earn 100 points',
        checkCondition: (stats) => stats.points >= 100
    },
    squatMaster: {
        id: 'squatMaster',
        icon: '💪',
        name: 'Squat Master',
        description: 'Do 50 squats',
        checkCondition: (stats) => stats.squats >= 50
    }
};

// Get DOM elements
const themeBtn = document.getElementById('themeToggle');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');
const html = document.documentElement;
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const timerDisplay = document.getElementById('timer');
const pointsDisplay = document.getElementById('pointsDisplay');
const progressRing = document.querySelector('.progress-ring');
const workoutButtons = document.querySelectorAll('.workout-btn');
const profileModal = document.getElementById('profileModal');
const profileBtn = document.getElementById('profileBtn');
let squatsCount = parseInt(localStorage.getItem('squatsCount')) || 0;
document.getElementById('counter').textContent = squatsCount;

// Timer variables
let timerRunning = false;
let timeLeft = 300;
let initialTime = 300;
let timerInterval;
let activeWorkoutBtn = null;

// Theme functions
function toggleTheme() {
    if (document.body.classList.contains('dark')) {
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// Add event listener
themeBtn.addEventListener('click', toggleTheme);

// Call theme initialization on load
document.addEventListener('DOMContentLoaded', initTheme);

// Profile functions
function showProfile() {
    profileModal.style.display = 'flex';
    document.getElementById('userName').value = userProfile.name;
    document.getElementById('weeklyGoal').value = userProfile.weeklyGoal;
    document.getElementById('fitnessLevel').value = userProfile.fitnessLevel;
}

function closeProfile() {
    profileModal.style.display = 'none';
}

function saveProfile() {
    userProfile.name = document.getElementById('userName').value;
    userProfile.weeklyGoal = parseInt(document.getElementById('weeklyGoal').value);
    userProfile.fitnessLevel = document.getElementById('fitnessLevel').value;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    closeProfile();
    updateUI();
}

// Timer functions
function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const progress = (timeLeft / initialTime) * 251.2;
    progressRing.style.strokeDashoffset = 251.2 - progress;
}

function startTimer() {
    if (!timerRunning) {
        timerRunning = true;
        startBtn.textContent = 'Pause';
        
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimer();
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                startBtn.textContent = 'Start';
                
                if (activeWorkoutBtn) {
                    const workoutCard = activeWorkoutBtn.closest('.card');
                    const workoutName = workoutCard.querySelector('h3').textContent;
                    const earnedPoints = Number(activeWorkoutBtn.dataset.points);
                    
                    // Update points
                    points += earnedPoints;
                    localStorage.setItem('points', points.toString());
                    pointsDisplay.textContent = `${points} points`;
                    
                    // Save workout
                    saveWorkout(
                        workoutName,
                        Number(activeWorkoutBtn.dataset.duration),
                        earnedPoints
                    );
                    
                    // Check achievements after updating points and saving workout
                    const stats = {
                        workouts: workoutHistory.length,
                        points: points,
                        squats: squatsCount,
                        hasEarlyWorkout: workoutHistory.some(w => w.type.includes('Morning'))
                    };
                    checkAchievements(stats);
                    
                    activeWorkoutBtn.textContent = 'Completed';
                    activeWorkoutBtn.disabled = true;
                    
                    // Update interface
                    updateStatistics();
                    updateAchievementsDisplay();
                }
            }
        }, 1000);
    } else {
        clearInterval(timerInterval);
        timerRunning = false;
        startBtn.textContent = 'Start';
    }
}

// Workout functions
function saveWorkout(type, duration, pointsEarned) {
    const workout = {
        type: type,
        duration: duration,
        points: pointsEarned,
        date: new Date().toISOString()
    };
    
    workoutHistory.push(workout);
    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
    
    const stats = {
        workouts: workoutHistory.length,
        points: points,
        squats: squatsCount,
        hasEarlyWorkout: workoutHistory.some(w => w.type.includes('Morning'))
    };
    
    checkAchievements(stats);
    updateStatistics();
    pointsDisplay.textContent = `${points} points`;
}

// Statistics functions
function updateStatistics() {
    const stats = document.createElement('div');
    stats.className = 'card bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6';
    
    // Calculate weekly statistics
    const thisWeek = workoutHistory.filter(w => {
        const workoutDate = new Date(w.date);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return workoutDate >= weekAgo;
    });
    
    // Correct minutes calculation
    const weeklyMinutes = thisWeek.reduce((sum, w) => sum + w.duration, 0);
    const weeklyGoal = userProfile.weeklyGoal || 45; // Use 45 minutes as default
    const weeklyProgress = Math.min((weeklyMinutes / weeklyGoal) * 100, 100); // Limit to 100% max

    stats.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p class="text-gray-600 dark:text-gray-400 text-sm">Total Workouts</p>
                    <p class="text-2xl font-bold text-black dark:text-white mt-1">
                        ${workoutHistory.length}
                    </p>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p class="text-gray-600 dark:text-gray-400 text-sm">Total Points</p>
                    <p class="text-2xl font-bold text-black dark:text-white mt-1">
                        ${points}
                    </p>
                </div>
            </div>
            
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                    <p class="text-gray-600 dark:text-gray-400 text-sm">Progress to Weekly Goal</p>
                    <p class="text-sm font-medium text-black dark:text-white">
                        ${weeklyMinutes} / ${weeklyGoal} min
                    </p>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                        style="width: ${weeklyProgress}%">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingStats = document.querySelector('.statistics');
    if (existingStats) {
        existingStats.replaceWith(stats);
    } else {
        document.querySelector('.statistics').appendChild(stats);
    }
}

function unlockAchievement(achievementId) {
    const achievement = document.querySelector(`[data-achievement="${achievementId}"]`);
    if (achievement && !achievement.classList.contains('achievement-unlocked')) {
        achievement.classList.add('achievement-unlocked');
        
        // Show notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-xl">🏆</span>
                <div>
                    <div class="font-bold">New Achievement!</div>
                    <div class="text-sm">${achievements[achievementId].name}</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Achievement functions

function checkAchievements(stats) {
    let updated = false;

    Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (!userProfile.achievements.includes(achievement.id) && 
            achievement.checkCondition(stats)) {
            
            userProfile.achievements.push(achievement.id);
            updated = true;
            
            // Show notification
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3';
            notification.innerHTML = `
                <span class="text-2xl">${achievement.icon}</span>
                <div>
                    <div class="font-bold">New Achievement!</div>
                    <div class="text-sm">${achievement.name}</div>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    });

    if (updated) {
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        updateAchievementsDisplay();
        updateStatistics();
    }

    // Always update statistics display
    updateStatistics();
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3';
    notification.innerHTML = `
        <span class="text-2xl">${achievement.icon}</span>
        <div>
            <div class="font-bold">New Achievement!</div>
            <div class="text-sm opacity-90">${achievement.name}</div>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(100px)';
        notification.style.transition = 'all 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function updateAchievementsDisplay() {
    const container = document.getElementById('achievements');
    if (!container) return;

    container.innerHTML = Object.values(ACHIEVEMENTS).map(achievement => {
        const isUnlocked = userProfile.achievements.includes(achievement.id);
        return `
            <div class="achievement-card bg-gray-800 p-4 rounded-lg ${isUnlocked ? '' : 'opacity-50'}" 
                data-achievement="${achievement.id}">
                <div class="text-3xl mb-2">${achievement.icon}</div>
                <h3 class="text-lg font-medium text-white">${achievement.name}</h3>
                <p class="text-sm text-gray-400">${achievement.description}</p>
                ${isUnlocked ? '<div class="mt-2 text-xs text-green-400">✓ Unlocked</div>' : ''}
            </div>
        `;
    }).join('');
}

function initializeAchievements() {
    userProfile.achievements.forEach(achievementId => {
        const achievement = document.querySelector(`[data-achievement="${achievementId}"]`);
        if (achievement) {
            achievement.classList.add('achievement-unlocked');
        }
    });
}

// Squats
function updateSquatsCount(newCount) {
    squatsCount = Math.max(0, newCount);
    document.getElementById('counter').textContent = squatsCount;
    
    if (squatsCount % 10 === 0 && squatsCount > 0) {
        points += 5;
        localStorage.setItem('points', points);
        pointsDisplay.textContent = `${points} points`;

        // Check achievements after updating points
        const stats = {
            workouts: workoutHistory.length,
            points: points,
            squats: squatsCount,
            hasEarlyWorkout: workoutHistory.some(w => w.type.includes('Morning'))
        };
        checkAchievements(stats);
    }

    // Always save squats count
    localStorage.setItem('squatsCount', squatsCount);
}

// Scheduler
function scheduleWorkout() {
    const time = document.getElementById('workoutTime').value;
    const type = document.getElementById('workoutType').value;
    
    if (!time) return;
    
    const schedule = JSON.parse(localStorage.getItem('workoutSchedule') || '[]');
    schedule.push({ time, type });
    localStorage.setItem('workoutSchedule', JSON.stringify(schedule));
    
    updateScheduleDisplay();
    
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

function updateScheduleDisplay() {
    const schedule = JSON.parse(localStorage.getItem('workoutSchedule') || '[]');
    const container = document.getElementById('scheduledWorkouts');
    
    container.innerHTML = schedule.map(item => `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-100 dark:bg-gray-700 p-3 rounded gap-2">
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Time:</span>
                <span class="text-black dark:text-white">${item.time}</span>
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400 ml-0 sm:ml-4">Workout:</span>
                <span class="text-black dark:text-white">${getWorkoutName(item.type)}</span>
            </div>
            <button onclick="removeScheduledWorkout('${item.time}')" 
                    class="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg">
                Delete
            </button>
        </div>
    `).join('');
}

function getWorkoutName(type) {
    const names = {
        morning: 'Morning Workout',
        office: 'Office Workout',
        cardio: 'Cardio Interval'
    };
    return names[type] || type;
}

function removeScheduledWorkout(time) {
    let schedule = JSON.parse(localStorage.getItem('workoutSchedule') || '[]');
    schedule = schedule.filter(item => item.time !== time);
    localStorage.setItem('workoutSchedule', JSON.stringify(schedule));
    updateScheduleDisplay();
}

// Event handlers
workoutButtons.forEach(button => {
    button.addEventListener('click', function() {
        clearInterval(timerInterval);
        timerRunning = false;
        timeLeft = Number(this.dataset.duration);
        initialTime = timeLeft;
        activeWorkoutBtn = this;
        updateTimer();
        startTimer();
    });
});

document.getElementById('minusBtn').addEventListener('click', () => updateSquatsCount(squatsCount - 1));
document.getElementById('plusBtn').addEventListener('click', () => updateSquatsCount(squatsCount + 1));

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerRunning = false;
    timeLeft = initialTime;
    startBtn.textContent = 'Start';
    updateTimer();
});

profileBtn.addEventListener('click', showProfile);
profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        closeProfile();
    }
});

function resetProgress() {
    if (confirm('Are you sure? This will delete all your achievements, points and workout history')) {
        // First reset all variables in memory
        points = 0;
        squatsCount = 0;
        workoutHistory = [];
        userProfile = {
            name: '',
            weeklyGoal: 45,
            fitnessLevel: 'beginner',
            achievements: []
        };

        // Now clear localStorage, keeping only theme
        const currentTheme = localStorage.getItem('theme');
        localStorage.clear();
        if (currentTheme) {
            localStorage.setItem('theme', currentTheme);
        }

        // Create new localStorage with initial values
        localStorage.setItem('points', '0');
        localStorage.setItem('squatsCount', '0');
        localStorage.setItem('workoutHistory', JSON.stringify([]));
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('workoutSchedule', JSON.stringify([]));

        // Update all elements on the page
        document.getElementById('counter').textContent = '0';
        pointsDisplay.textContent = '0 points';
        document.querySelector('.profile-name').textContent = 'Guest';

        // Reset schedule
        document.getElementById('scheduledWorkouts').innerHTML = '';

        // Reset timer
        clearInterval(timerInterval);
        timerRunning = false;
        timeLeft = 300;
        initialTime = 300;
        updateTimer();

        // Reset all workout buttons
        document.querySelectorAll('.workout-btn').forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Start';
        });

        // Update statistics directly
        const statsContainer = document.querySelector('.statistics');
        if (statsContainer) {
            statsContainer.querySelector('[class*="font-bold"]').textContent = '0';
            statsContainer.querySelectorAll('[class*="font-bold"]')[1].textContent = '0';
            const progressBar = statsContainer.querySelector('[class*="rounded-full"]');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
            statsContainer.querySelector('[class*="text-sm font-medium"]').textContent = '0 / 45 min';
        }

        // Update achievements
        const achievementsContainer = document.getElementById('achievements');
        if (achievementsContainer) {
            const achievements = achievementsContainer.querySelectorAll('[data-achievement]');
            achievements.forEach(achievement => {
                achievement.classList.add('opacity-50');
                achievement.classList.remove('ring-2', 'ring-indigo-500');
                const checkmark = achievement.querySelector('[class*="text-green"]');
                if (checkmark) {
                    checkmark.remove();
                }
            });
        }

        // Close modal
        closeProfile();

        // Show notification
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = 'Progress successfully reset';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);

        // Perform full page refresh after short delay
        setTimeout(() => {
            location.reload();
        }, 500);
    }
}

// Interface update
function updateUI() {
    updateStatistics();
    const nameDisplay = document.querySelector('.profile-name');
    if (nameDisplay) {
        nameDisplay.textContent = userProfile.name || 'Guest';
    }
    pointsDisplay.textContent = `${points} points`;
}

// Initialization
if (localStorage.getItem('theme') === 'dark') {
    toggleTheme();
}

// Check schedule every minute
setInterval(() => {
    const schedule = JSON.parse(localStorage.getItem('workoutSchedule') || '[]');
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    schedule.forEach(item => {
        if (item.time === currentTime && Notification.permission === 'granted') {
            new Notification('Time to workout!', {
                body: `Time to start ${getWorkoutName(item.type)}`
            });
        }
    });
}, 60000);

function initializeApp() {
    // Initialize timer
    updateTimer();

    // Load statistics
    updateStatistics();

    // Update scheduler
    updateScheduleDisplay();

    // Update interface
    updateUI();

    updateAchievementsDisplay();
    checkAchievements();

    // Initialize points
    pointsDisplay.textContent = `${points} points`;
}

document.addEventListener('DOMContentLoaded', initializeApp);