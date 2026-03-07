// CONFIG
const TIME_MULTIPLIER = 60; // 1 = normal, 60 = 1 second = 1 minute
const WEEK_STORAGE_KEY = 'timeTrackerWeek';

// TIMERS
const timers = {
  development: { seconds: 0, shortTarget: 2*60+24, longTarget: 1*60+36 },
  support:     { seconds: 0, shortTarget: 3*60+12, longTarget: 4*60+0 },
  general:     { seconds: 0, shortTarget: 1*60+36, longTarget: 1*60+36 },
  management:  { seconds: 0, shortTarget: 0*60+48, longTarget: 1*60+36 }
};

let current = null;
let interval = null;
let paused = false;

// LOAD SAVED STATE
if (localStorage.getItem('timers')) {
  const savedTimers = JSON.parse(localStorage.getItem('timers'));
  Object.keys(timers).forEach(k => { if(savedTimers[k]) timers[k].seconds = savedTimers[k].seconds; });
}

// FORMAT TIME hh:mm:ss
function formatTime(sec) {
  const h = String(Math.floor(sec/3600)).padStart(2,'0');
  const m = String(Math.floor((sec%3600)/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  return `${h}:${m}:${s}`;
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
    el.querySelector('.time-display').textContent = formatTime(t.seconds);

    const shortPct = Math.min(100, (t.seconds/(t.shortTarget*60))*100);
    const longPct  = Math.min(100, (t.seconds/(t.longTarget*60))*100);

    const svg = el.querySelector('.progress-ring');
    setCircleProgress(svg.querySelector('.progress-ring-short'), shortPct);
    setCircleProgress(svg.querySelector('.progress-ring-long'), longPct);
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

// START/STOP BUTTON (click + keyboard)
function startTimer(key) {
  const el = document.getElementById(key);

  if(current === key) {
    clearInterval(interval);
    interval = null;
    current = null;
    el.classList.remove('active');
  } else {
    if(interval) {
      document.getElementById(current)?.classList.remove('active');
      clearInterval(interval);
    }
    current = key;
    el.classList.add('active');
    interval = setInterval(() => {
      timers[current].seconds += TIME_MULTIPLIER;
      updateDisplay();
    }, 1000);
  }
}

// click
document.querySelectorAll('.timer-button').forEach(btn => {
  btn.addEventListener('click', e => {
    const key = e.target.closest('.timer').id;
    startTimer(key);
  });
});

// keyboard shortcuts 1-4
document.addEventListener('keydown', e => {
  const keyMap = { '1':'development', '2':'support', '3':'general', '4':'management' };
  if(keyMap[e.key]) {
    e.preventDefault();
    startTimer(keyMap[e.key]);
  }
});

// optional: allow Space/Enter on buttons (tab navigation)
document.querySelectorAll('.timer-button').forEach(btn => {
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
  document.querySelectorAll('.timer').forEach(t => t.classList.remove('active'));
  // NO 'paused' block here — buttons/keyboard still work
});

// WEEKLY SUMMARY
function renderWeeklySummary() {
  const tbody=document.querySelector('#weekly-summary tbody');
  if(!tbody) return;
  tbody.innerHTML='';
  const weekData=JSON.parse(localStorage.getItem(WEEK_STORAGE_KEY)||'{}');
  Object.keys(weekData).sort().forEach(day=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${day}</td>
      <td>${formatTime(weekData[day].development)}</td>
      <td>${formatTime(weekData[day].support)}</td>
      <td>${formatTime(weekData[day].general)}</td>
      <td>${formatTime(weekData[day].management)}</td>`;
    tbody.appendChild(tr);
  });
}

// INITIAL DISPLAY
updateDisplay();