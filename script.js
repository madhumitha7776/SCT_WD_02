let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;

const display = document.getElementById("display");
const startStopBtn = document.getElementById("startStopBtn");
const resetBtn = document.getElementById("resetBtn");
const lapBtn = document.getElementById("lapBtn");
const lapsContainer = document.getElementById("laps");
const themeToggle = document.getElementById("themeToggle");
const fastestLapSpan = document.getElementById("fastestLap");
const slowestLapSpan = document.getElementById("slowestLap");

let laps = [];
// Reuse audio context for better compatibility
let beepCtx = null;
let runningOsc = null;
let runningGain = null;
function playBeep(freq = 600, duration = 80) {
  try {
    if (!beepCtx || beepCtx.state === 'closed') {
      beepCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = beepCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
    }, duration);
  } catch (e) {}
}

function startRunningSound() {
  try {
    if (!beepCtx || beepCtx.state === 'closed') {
      beepCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (runningOsc) return; // already running
    runningOsc = beepCtx.createOscillator();
    runningGain = beepCtx.createGain();
    runningOsc.type = 'sine'; // Sine wave is the most pleasant and soft
    runningOsc.frequency.value = 392; // G4 note, gentle and not harsh
    runningGain.gain.value = 0.025; // Soft volume
    runningOsc.connect(runningGain);
    runningGain.connect(beepCtx.destination);
    runningOsc.start();
  } catch (e) {}
}

function stopRunningSound() {
  if (runningOsc) {
    runningOsc.stop();
    runningOsc.disconnect();
    runningOsc = null;
  }
  if (runningGain) {
    runningGain.disconnect();
    runningGain = null;
  }
}

// Format time as hh:mm:ss.ms
function timeToString(time) {
  let diffInHrs = Math.floor(time / 3600000);
  let diffInMin = Math.floor((time % 3600000) / 60000);
  let diffInSec = Math.floor((time % 60000) / 1000);
  let diffInMs = Math.floor((time % 1000));

  let formattedHrs = diffInHrs.toString().padStart(2, "0");
  let formattedMin = diffInMin.toString().padStart(2, "0");
  let formattedSec = diffInSec.toString().padStart(2, "0");
  let formattedMs = diffInMs.toString().padStart(3, "0");

  return `${formattedHrs}:${formattedMin}:${formattedSec}.${formattedMs}`;
}

// Start the stopwatch
function animateDigits() {
  display.classList.remove('digit-animate');
  void display.offsetWidth; // trigger reflow
  display.classList.add('digit-animate');
}

function start() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(function () {
    elapsedTime = Date.now() - startTime;
    display.textContent = timeToString(elapsedTime);
    animateDigits();
  }, 10);
  startStopBtn.textContent = "Pause";
  isRunning = true;
  playBeep(700, 100);
  startRunningSound();
}

// Pause the stopwatch
function pause() {
  clearInterval(timerInterval);
  startStopBtn.textContent = "Start";
  isRunning = false;
  playBeep(400, 100);
  stopRunningSound();
}

// Reset stopwatch
function reset() {
  clearInterval(timerInterval);
  display.textContent = "00:00:00.000";
  elapsedTime = 0;
  startStopBtn.textContent = "Start";
  lapsContainer.innerHTML = "";
  laps = [];
  updateLapStats();
  isRunning = false;
  playBeep(200, 120);
  stopRunningSound();
}

// Record lap
function lap() {
  if (isRunning) {
    const lapTime = elapsedTime;
    laps.push(lapTime);
    const li = document.createElement("li");
    li.textContent = `Lap ${laps.length}: ${timeToString(lapTime)}`;
    lapsContainer.appendChild(li);
    updateLapStats();
    playBeep(900, 80);
  }
}

function updateLapStats() {
  if (laps.length === 0) {
    fastestLapSpan.textContent = 'Fastest: --';
    slowestLapSpan.textContent = 'Slowest: --';
    return;
  }
  let min = Math.min(...laps);
  let max = Math.max(...laps);
  fastestLapSpan.textContent = `Fastest: ${timeToString(min)}`;
  slowestLapSpan.textContent = `Slowest: ${timeToString(max)}`;
}

// Button listeners
startStopBtn.addEventListener("click", function () {
  if (!isRunning) {
    start();
  } else {
    pause();
  }
});

resetBtn.addEventListener("click", reset);
lapBtn.addEventListener("click", lap);

// Theme toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  themeToggle.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
});

// Keyboard accessibility
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    startStopBtn.click();
    e.preventDefault();
  } else if (e.code === 'KeyL') {
    lapBtn.click();
  } else if (e.code === 'KeyR') {
    resetBtn.click();
  }
});

// Animation CSS for digits
const style = document.createElement('style');
style.innerHTML = `
.digit-animate {
  animation: pop 0.18s cubic-bezier(.4,2,.6,1) 1;
}
@keyframes pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.08); }
  100% { transform: scale(1); }
}`;
document.head.appendChild(style);

// Ensure lap stats are correct on load
updateLapStats();
