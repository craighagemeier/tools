// CONFIG
const TIME_MULTIPLIER = 1; // 1 = normal, 60 = 1 second = 1 minute
const WEEK_STORAGE_KEY = 'timeTrackerWeek';

// GOALS
const TIMER_CONFIG = {
  development: { shortTarget: 2*60 + 30, longTarget: 3*60 + 30 },
  support:     { shortTarget: 3*60 + 0,  longTarget: 2*60 + 0  },
  general:     { shortTarget: 1*60 + 30, longTarget: 1*60 + 30 },
  management:  { shortTarget: 1*60 + 0,  longTarget: 1*60 + 0  }
};

// RUNTIME STATE
const timers = {
  development: { seconds: 0 },
  support:     { seconds: 0 },
  general:     { seconds: 0 },
  management:  { seconds: 0 }
};

let current = null;
let interval = null;

// LOAD SAVED STATE
if (localStorage.getItem('timers')) {
  const savedTimers = JSON.parse(localStorage.getItem('timers'));
  Object.keys(timers).forEach(k => { 
    if(savedTimers[k]) timers[k].seconds = savedTimers[k].seconds; 
  });
}

// FORMAT TIME hh:mm:ss
function formatTime(sec) {
  const h = String(Math.floor(sec/3600)).padStart(2,'0');
  const m = String(Math.floor((sec%3600)/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  return `${h}:${m}:${s}`;
}

// FORMAT GOAL TIME hh:mm
function formatGoal(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2,'0')}`;
}

// POPULATE TARGETS FROM SCRIPT
function populateTargets() {
  Object.entries(timers).forEach(([key]) => {
    const el = document.getElementById(key);
    if (!el) return;

    const config = TIMER_CONFIG[key];

    const shortEl = el.querySelector('.timer__target--short');
    const longEl  = el.querySelector('.timer__target--long');

    if (shortEl) shortEl.textContent = formatGoal(config.shortTarget);
    if (longEl)  longEl.textContent  = formatGoal(config.longTarget);
  });
}

// CIRCULAR PROGRESS
function setCircleProgress(circle, percent) {
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent/100);
  circle.style.strokeDashoffset = offset;
}

// UPDATE DISPLAY
function updateDisplay() {
  Object.entries(timers).forEach(([key,t]) => {
    const el = document.getElementById(key);
    el.querySelector('.timer__time-display').textContent = formatTime(t.seconds);

    const config = TIMER_CONFIG[key];
    const shortPct = Math.min(100, (t.seconds/(config.shortTarget*60))*100);
    const longPct  = Math.min(100, (t.seconds/(config.longTarget*60))*100);

    const svg = el.querySelector('.timer__progress-ring');
    setCircleProgress(svg.querySelector('.timer__progress-ring--short'), shortPct);
    setCircleProgress(svg.querySelector('.timer__progress-ring--long'), longPct);
  });

  localStorage.setItem('timers', JSON.stringify(timers));
  renderWeeklySummary();
}

// SAVE DAILY VALUES
function saveDay() {
  const today = new Date().toISOString().split('T')[0];
  const weekData = JSON.parse(localStorage.getItem(WEEK_STORAGE_KEY)||'{}');
  weekData[today] = {};
  Object.keys(timers).forEach(k=>weekData[today][k]=timers[k].seconds);
  localStorage.setItem(WEEK_STORAGE_KEY, JSON.stringify(weekData));
}

// START/STOP TIMER
function startTimer(key) {
  const el = document.getElementById(key);

  if(current === key) {
    clearInterval(interval);
    interval = null;
    current = null;
    el.classList.remove('timer--active');
  } else {
    if(interval) {
      document.getElementById(current)?.classList.remove('timer--active');
      clearInterval(interval);
    }
    current = key;
    el.classList.add('timer--active');
    interval = setInterval(() => {
      timers[current].seconds += TIME_MULTIPLIER;
      updateDisplay();
    }, 1000);
  }
}

// CLICK EVENT
document.querySelectorAll('.timer__button').forEach(btn => {
  btn.addEventListener('click', e => {
    const key = e.target.closest('.timer').id;
    startTimer(key);
  });
});

// GLOBAL KEYBOARD SHORTCUTS
document.addEventListener('keydown', e => {
  const keyMap = { 
    '1':'development', 
    '2':'support', 
    '3':'general', 
    '4':'management' 
  };

  if (keyMap[e.key]) {
    e.preventDefault();
    const key = keyMap[e.key];
    startTimer(key);

    // move focus to the button so it's clear visually
    const btn = document.getElementById(key)?.querySelector('.timer__button');
    btn?.focus();
  }

  // Pause all timers (P)
  if(e.key.toLowerCase() === 'p') {
    e.preventDefault();
    const pauseBtn = document.getElementById('pauseAll');
    pauseBtn.click();
    pauseBtn.focus();  // move focus to Pause button
  }
});

// SPACE/ENTER ON BUTTONS (tab navigation)
document.querySelectorAll('.timer__button').forEach(btn => {
  btn.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const key = e.target.closest('.timer').id;
      startTimer(key);
    }
  });
});

// NEW DAY
document.getElementById('newDay').addEventListener('click', () => {
  saveDay();
  Object.keys(timers).forEach(k => timers[k].seconds = 0);
  updateDisplay();
});

// PAUSE ALL
document.getElementById('pauseAll').addEventListener('click', () => {
  if(interval) clearInterval(interval);
  interval = null;
  current = null;
  document.querySelectorAll('.timer').forEach(t => t.classList.remove('timer--active'));
});

// WEEKLY SUMMARY
function renderWeeklySummary() {
  const tbody = document.querySelector('.weekly-summary__body');
  if(!tbody) return;

  tbody.innerHTML = '';
  const weekData = JSON.parse(localStorage.getItem(WEEK_STORAGE_KEY) || '{}');

  Object.keys(weekData).sort().forEach(day => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${day}</td>
      <td>${formatTime(weekData[day].development)}</td>
      <td>${formatTime(weekData[day].support)}</td>
      <td>${formatTime(weekData[day].general)}</td>
      <td>${formatTime(weekData[day].management)}</td>`;
    tbody.appendChild(tr);
  });
}

// INITIAL DISPLAY
populateTargets();
updateDisplay();