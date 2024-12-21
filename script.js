// Инициализация основных переменных
let workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
let points = parseInt(localStorage.getItem('points')) || 0;

// Определение профиля пользователя
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    name: '',
    weeklyGoal: 60,
    fitnessLevel: 'beginner',
    achievements: []
};

// Определение достижений
const ACHIEVEMENTS = {
    workoutStreak: {
        id: 'workoutStreak',
        icon: '🔥',
        name: 'Серия тренировок',
        description: 'Тренируйтесь 3 дня подряд',
        checkCondition: (stats) => stats.workouts >= 3
    },
    earlyBird: {
        id: 'earlyBird',
        icon: '🌅',
        name: 'Ранняя пташка',
        description: 'Выполните утреннюю тренировку',
        checkCondition: (stats) => stats.hasEarlyWorkout
    },
    pointCollector: {
        id: 'pointCollector',
        icon: '⭐',
        name: 'Коллекционер очков',
        description: 'Наберите 100 очков',
        checkCondition: (stats) => stats.points >= 100
    },
    squatMaster: {
        id: 'squatMaster',
        icon: '💪',
        name: 'Мастер приседаний',
        description: 'Выполните 50 приседаний',
        checkCondition: (stats) => stats.squats >= 50
    }
};

// Получение элементов DOM
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

// Переменные для таймера
let timerRunning = false;
let timeLeft = 300;
let initialTime = 300;
let timerInterval;
let activeWorkoutBtn = null;

// Функции для работы с темой
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

// Инициализация темы
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

// Добавление обработчика событий
themeBtn.addEventListener('click', toggleTheme);

// Вызов инициализации темы при загрузке
document.addEventListener('DOMContentLoaded', initTheme);

// Функции профиля
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

// Функции таймера
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
        startBtn.textContent = 'Пауза';
        
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimer();
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                startBtn.textContent = 'Старт';
                
                if (activeWorkoutBtn) {
                    const workoutCard = activeWorkoutBtn.closest('.card');
                    const workoutName = workoutCard.querySelector('h3').textContent;
                    const earnedPoints = Number(activeWorkoutBtn.dataset.points);
                    
                    // Обновляем очки
                    points += earnedPoints;
                    localStorage.setItem('points', points.toString());
                    pointsDisplay.textContent = `${points} очков`;
                    
                    // Сохраняем тренировку
                    saveWorkout(
                        workoutName,
                        Number(activeWorkoutBtn.dataset.duration),
                        earnedPoints
                    );
                    
                    // Проверяем достижения после обновления очков и сохранения тренировки
                    const stats = {
                        workouts: workoutHistory.length,
                        points: points,
                        squats: squatsCount,
                        hasEarlyWorkout: workoutHistory.some(w => w.type.includes('Утренняя'))
                    };
                    checkAchievements(stats);
                    
                    activeWorkoutBtn.textContent = 'Выполнено';
                    activeWorkoutBtn.disabled = true;
                    
                    // Обновляем интерфейс
                    updateStatistics();
                    updateAchievementsDisplay();
                }
            }
        }, 1000);
    } else {
        clearInterval(timerInterval);
        timerRunning = false;
        startBtn.textContent = 'Старт';
    }
}

// Функции для работы с тренировками
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
        hasEarlyWorkout: workoutHistory.some(w => w.type.includes('Утренняя'))
    };
    
    checkAchievements(stats);
    updateStatistics();
    pointsDisplay.textContent = `${points} очков`;
}

// Функции для статистики
function updateStatistics() {
    const stats = document.createElement('div');
    stats.className = 'card bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6';
    
    // Подсчет недельной статистики
    const thisWeek = workoutHistory.filter(w => {
        const workoutDate = new Date(w.date);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return workoutDate >= weekAgo;
    });
    
    // Правильный подсчет минут
    const weeklyMinutes = thisWeek.reduce((sum, w) => sum + w.duration, 0);
    const weeklyGoal = userProfile.weeklyGoal || 45; // Используем 45 минут как значение по умолчанию
    const weeklyProgress = Math.min((weeklyMinutes / weeklyGoal) * 100, 100); // Ограничиваем максимум в 100%

    stats.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p class="text-gray-600 dark:text-gray-400 text-sm">Всего тренировок</p>
                    <p class="text-2xl font-bold text-black dark:text-white mt-1">
                        ${workoutHistory.length}
                    </p>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p class="text-gray-600 dark:text-gray-400 text-sm">Всего очков</p>
                    <p class="text-2xl font-bold text-black dark:text-white mt-1">
                        ${points}
                    </p>
                </div>
            </div>
            
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                    <p class="text-gray-600 dark:text-gray-400 text-sm">Прогресс к недельной цели</p>
                    <p class="text-sm font-medium text-black dark:text-white">
                        ${weeklyMinutes} / ${weeklyGoal} мин
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
        
        // Показываем уведомление
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-xl">🏆</span>
                <div>
                    <div class="font-bold">Новое достижение!</div>
                    <div class="text-sm">${achievements[achievementId].name}</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Функции для достижений

function checkAchievements(stats) {
    let updated = false;

    Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (!userProfile.achievements.includes(achievement.id) && 
            achievement.checkCondition(stats)) {
            
            userProfile.achievements.push(achievement.id);
            updated = true;
            
            // Показываем уведомление
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3';
            notification.innerHTML = `
                <span class="text-2xl">${achievement.icon}</span>
                <div>
                    <div class="font-bold">Новое достижение!</div>
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

    // Всегда обновляем отображение статистики
    updateStatistics();
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3';
    notification.innerHTML = `
        <span class="text-2xl">${achievement.icon}</span>
        <div>
            <div class="font-bold">Новое достижение!</div>
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
                ${isUnlocked ? '<div class="mt-2 text-xs text-green-400">✓ Получено</div>' : ''}
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

// Приседания
function updateSquatsCount(newCount) {
    squatsCount = Math.max(0, newCount);
    document.getElementById('counter').textContent = squatsCount;
    
    if (squatsCount % 10 === 0 && squatsCount > 0) {
        points += 5;
        localStorage.setItem('points', points);
        pointsDisplay.textContent = `${points} очков`;

        // После обновления очков сразу проверяем достижения
        const stats = {
            workouts: workoutHistory.length,
            points: points,
            squats: squatsCount,
            hasEarlyWorkout: workoutHistory.some(w => w.type.includes('Утренняя'))
        };
        checkAchievements(stats);
    }

    // Всегда сохраняем количество приседаний
    localStorage.setItem('squatsCount', squatsCount);
}

// Планировщик
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
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Время:</span>
                <span class="text-black dark:text-white">${item.time}</span>
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400 ml-0 sm:ml-4">Тренировка:</span>
                <span class="text-black dark:text-white">${getWorkoutName(item.type)}</span>
            </div>
            <button onclick="removeScheduledWorkout('${item.time}')" 
                    class="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg">
                Удалить
            </button>
        </div>
    `).join('');
}

function getWorkoutName(type) {
    const names = {
        morning: 'Утренняя зарядка',
        office: 'Разминка в офисе',
        cardio: 'Кардио-интервал'
    };
    return names[type] || type;
}

function removeScheduledWorkout(time) {
    let schedule = JSON.parse(localStorage.getItem('workoutSchedule') || '[]');
    schedule = schedule.filter(item => item.time !== time);
    localStorage.setItem('workoutSchedule', JSON.stringify(schedule));
    updateScheduleDisplay();
}

// Обработчики событий
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
    startBtn.textContent = 'Старт';
    updateTimer();
});

profileBtn.addEventListener('click', showProfile);
profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        closeProfile();
    }
});

function resetProgress() {
    if (confirm('Вы уверены? Это действие удалит все ваши достижения, очки и историю тренировок')) {
        // Сначала сбросим все переменные в памяти
        points = 0;
        squatsCount = 0;
        workoutHistory = [];
        userProfile = {
            name: '',
            weeklyGoal: 45,
            fitnessLevel: 'beginner',
            achievements: []
        };

        // Теперь очистим localStorage, сохранив только тему
        const currentTheme = localStorage.getItem('theme');
        localStorage.clear();
        if (currentTheme) {
            localStorage.setItem('theme', currentTheme);
        }

        // Создадим новый localStorage с начальными значениями
        localStorage.setItem('points', '0');
        localStorage.setItem('squatsCount', '0');
        localStorage.setItem('workoutHistory', JSON.stringify([]));
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('workoutSchedule', JSON.stringify([]));

        // Обновим все элементы на странице
        document.getElementById('counter').textContent = '0';
        pointsDisplay.textContent = '0 очков';
        document.querySelector('.profile-name').textContent = 'Гость';

        // Сбросим расписание
        document.getElementById('scheduledWorkouts').innerHTML = '';

        // Сбросим таймер
        clearInterval(timerInterval);
        timerRunning = false;
        timeLeft = 300;
        initialTime = 300;
        updateTimer();

        // Разблокируем все кнопки тренировок
        document.querySelectorAll('.workout-btn').forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Начать';
        });

        // Обновим статистику напрямую
        const statsContainer = document.querySelector('.statistics');
        if (statsContainer) {
            statsContainer.querySelector('[class*="font-bold"]').textContent = '0';
            statsContainer.querySelectorAll('[class*="font-bold"]')[1].textContent = '0';
            const progressBar = statsContainer.querySelector('[class*="rounded-full"]');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
            statsContainer.querySelector('[class*="text-sm font-medium"]').textContent = '0 / 45 мин';
        }

        // Обновим достижения
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

        // Закроем модальное окно
        closeProfile();

        // Покажем уведомление
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = 'Прогресс успешно сброшен';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);

        // Выполним полное обновление страницы через небольшую задержку
        setTimeout(() => {
            location.reload();
        }, 500);
    }
}

// Обновление интерфейса
function updateUI() {
    updateStatistics();
    const nameDisplay = document.querySelector('.profile-name');
    if (nameDisplay) {
        nameDisplay.textContent = userProfile.name || 'Гость';
    }
    pointsDisplay.textContent = `${points} очков`;
}

// Инициализация
if (localStorage.getItem('theme') === 'dark') {
    toggleTheme();
}

// Проверка расписания каждую минуту
setInterval(() => {
    const schedule = JSON.parse(localStorage.getItem('workoutSchedule') || '[]');
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    schedule.forEach(item => {
        if (item.time === currentTime && Notification.permission === 'granted') {
            new Notification('Время тренировки!', {
                body: `Пора начать ${getWorkoutName(item.type)}`
            });
        }
    });
}, 60000);

function initializeApp() {
    // Инициализация таймера
    updateTimer();

    // Загрузка статистики
    updateStatistics();

    // Обновление планировщика
    updateScheduleDisplay();

    // Обновление интерфейса
    updateUI();

    updateAchievementsDisplay();
    checkAchievements();

    // Инициализация очков
    pointsDisplay.textContent = `${points} очков`;
}

document.addEventListener('DOMContentLoaded', initializeApp);