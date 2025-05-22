function updateProgressBar(totalFrozen, totalSupply, duration) {
    const progressBar = document.getElementById('progress');
    const progressText = document.getElementById('progressText');

    const progress = (totalFrozen / totalSupply) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress.toFixed(2)}%`;
    updateCounter(duration);

    if (progress % 5 < 0.1) {
        progressBar.style.animation = 'none';
        void progressBar.offsetWidth;
        progressBar.style.animation = 'pulse 0.6s';
    }
    progressBar.style.background = 'linear-gradient(90deg, #3a7bd5, #00d2ff)';
}

function updateDALProgressBar(dalPercentage, duration) {
    const dalProgressBar = document.getElementById('dalProgress');
    const dalProgressText = document.getElementById('dalProgressText');

    dalProgressBar.style.width = `${dalPercentage}%`;
    dalProgressText.textContent = `${dalPercentage.toFixed(2)}%`;
    updateDALCounter(dalPercentage, duration);

    if (dalPercentage % 5 < 0.1) {
        dalProgressBar.style.animation = 'none';
        void dalProgressBar.offsetWidth;
        dalProgressBar.style.animation = 'pulse 0.6s';
    }
    dalProgressBar.style.background = 'linear-gradient(90deg, #ff6b6b, #feca57)';
}

const totalBackgrounds = 7;
let currentBackground = Math.floor(Math.random() * (totalBackgrounds)) + 1;

let ema = 0;
let dalEma = 0;
let stakingRatios = [];
let dalPercentages = [];
let cur = 0;
let dalCur = 0;
let initial = true;
let dalInitial = true;

async function fetchAndUpdateData() {
    try {
        const startTime = performance.now(); // Start measuring fetch time
        
        // Fetch Tezos staking data
        let response = await fetch("https://api.tzkt.io/v1/statistics/?sort.desc=level&limit=120");
        if (!response.ok) {
            // Retry with kukai.api.tzkt.io if fetch fails
            response = await fetch("https://kukai.api.tzkt.io/v1/statistics/?sort.desc=level&limit=120");
        }
        let data = await response.json();
        
        // Fetch DAL data
        let dalResponse = await fetch("https://dal-dashboard.vercel.app/api/history");
        let dalData = await dalResponse.json();
        
        const fetchTime = performance.now() - startTime; // Calculate fetch time
        
        // Process Tezos data
        stakingRatios = data.map((block) => block.totalFrozen / 1000000);
        ema = calculateEMA(stakingRatios, 'tezos');
        
        // Process DAL data
        dalPercentages = dalData.map((entry) => entry.dal_baking_power_percentage);
        dalEma = calculateEMA(dalPercentages, 'dal');
        
        const animationDuration = Math.max(0, 30000 - fetchTime); // Adjust animation time
        
        updateProgressBar(data[0].totalFrozen, data[0].totalSupply, animationDuration);
        updateDALProgressBar(dalData[0].dal_baking_power_percentage, animationDuration);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function calculateEMA(values, type) {
    if (!values.length)
        return 0;
    
    const smoothingFactor = 2 / (values.length + 1);
    let currentEma = type === 'tezos' ? ema : dalEma;
    let isInitial = type === 'tezos' ? initial : dalInitial;
    
    if (isInitial) {
        // Initialize EMA with SMA
        const sma = values.reduce((sum, value) => sum + value, 0) / values.length;
        currentEma = sma;
        if (type === 'tezos') {
            initial = false;
        } else {
            dalInitial = false;
        }
    }
    
    for (let i = values.length - 1; i >= 0; i--) {
        currentEma = (values[i] - currentEma) * smoothingFactor + currentEma;
    }
    
    return currentEma;
}

function updateCounter(duration) {
    const currentValue = cur;
    animateValue(currentValue, ema, duration, 'tezos');
    cur = ema;
}

function updateDALCounter(per, duration) {
    const currentValue = dalCur;
    animateValue(per, per, duration, 'dal');
    dalCur = dalEma;
}

function animateValue(start, end, duration, type) {
    let startTimestamp = null;
    const element = document.getElementById(type === 'tezos' ? "realtimeData" : "dalRealtimeData");
    
    const step = (timestamp) => {
        if (!startTimestamp)
            startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = start + progress * (end - start);

        if (type === 'tezos') {
            // Display formatted number with fixed width for Tezos
            element.textContent = `Staked ꜩ: ${current.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        } else {
            // Display DAL percentage
            element.textContent = `DAL Support: ${current.toFixed(2)}%`;
        }

        // Adjust font size dynamically based on content length
        const contentWidth = element.offsetWidth;
        const elementWidth = element.clientWidth;
        const fontSize = parseInt(window.getComputedStyle(element).fontSize);
        if (contentWidth > elementWidth) {
            element.style.fontSize = `${fontSize - 1}px`;
        } else if (fontSize < 24) {
            element.style.fontSize = "24px";
        }

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

setInterval(fetchAndUpdateData, 30000); // Update every 30 seconds

const musicButton = document.getElementById("musicButton");
const musicIcon = document.getElementById("musicIcon");
const backgroundMusic = document.getElementById("backgroundMusic");

let currentTrack = 1;
const totalTracks = 9;

const shuffleButton = document.getElementById("shuffleButton");
const shuffleIcon = document.getElementById("shuffleIcon");

musicButton.addEventListener("click", function () {
    if (backgroundMusic.paused) {
        playMusic();
    } else {
        pauseMusic();
    }
});

shuffleButton.addEventListener("click", function () {
    switchTrack();
});

function playMusic() {
    backgroundMusic
    .play()
    .then(function () {
        musicIcon.src = "icons/audio.png";
        musicIcon.alt = "Pause Icon";
    })
    .catch(function (error) {
        console.error("Failed to start audio playback:", error);
    });
}

function pauseMusic() {
    backgroundMusic.pause();
    musicIcon.src = "icons/silence.png";
    musicIcon.alt = "Audio Icon";
}

function switchTrack() {
    currentTrack = (currentTrack % totalTracks) + 1;
    backgroundMusic.src = `music/${currentTrack}.mp3`;
    backgroundMusic.load();
    playMusic();
}

const backgroundButton = document.getElementById("backgroundButton");
const backgroundIcon = document.getElementById("backgroundIcon");

backgroundButton.addEventListener("click", function () {
    switchBackground();
});

const preloaderVideo = document.getElementById("preloaderVideo");
const sourceElement = backgroundVideo.querySelector("source");
const preloaderSource = preloaderVideo.querySelector("source");
const overlay = document.getElementById("overlay");

async function switchBackground() {
    currentBackground = (currentBackground % totalBackgrounds) + 1;
    const videoUrl = `backgrounds/${currentBackground}.mp4`;
    overlay.style.display = 'block';
    overlay.style.opacity = '1';
    preloaderSource.src = videoUrl;
    preloaderVideo.load();
    await new Promise(resolve => {
        preloaderVideo.onloadedmetadata = resolve;
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    sourceElement.src = videoUrl;
    backgroundVideo.load();
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
    }, 100);
    preloaderVideo.onloadedmetadata = null;
}

window.onload = function () {
    switchBackground();
    fetchAndUpdateData();
    backgroundMusic.src = `music/1.mp3`;
}
