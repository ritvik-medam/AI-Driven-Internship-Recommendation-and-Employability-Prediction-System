// ==========================================================================
// CUSTOM GLASSMORPHIC TOAST NOTIFICATION SYSTEM & ALERT OVERRIDE
// ==========================================================================
(function() {
    let container = null;

    function ensureContainer() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    window.showToast = function(message, type = 'info') {
        ensureContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-check-circle';
        else if (type === 'error') iconClass = 'fa-exclamation-circle';
        else if (type === 'warning') iconClass = 'fa-triangle-exclamation';
        
        toast.innerHTML = `
            <i class="fas ${iconClass} toast-icon" style="color: var(--accent-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'error' ? 'red' : 'yellow'});"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-xmark"></i></button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('fading');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    };

    // Override default window.alert with custom glassmorphic toast
    window.alert = function(message) {
        let type = 'info';
        const msgLower = String(message).toLowerCase();
        if (msgLower.includes('success') || msgLower.includes('complete') || msgLower.includes('sync') || msgLower.includes('verified') || msgLower.includes('added') || msgLower.includes('created')) {
            type = 'success';
        } else if (msgLower.includes('fail') || msgLower.includes('error') || msgLower.includes('cannot') || msgLower.includes('could not') || msgLower.includes('invalid') || msgLower.includes('please check')) {
            type = 'error';
        } else if (msgLower.includes('please') || msgLower.includes('select') || msgLower.includes('warn') || msgLower.includes('select a target')) {
            type = 'warning';
        }
        window.showToast(message, type);
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    // ----------------- Authentication Elements -----------------
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabSignupBtn = document.getElementById('tab-signup-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Session headers
    const sessionUsername = document.getElementById('session-username');
    const sessionUserrole = document.getElementById('session-userrole');

    // Portals navigation menus
    const studentMenu = document.getElementById('student-menu');
    const recruiterMenu = document.getElementById('recruiter-menu');
    const universityMenu = document.getElementById('university-menu');

    // Core Left Nav tabs
    const menuButtons = document.querySelectorAll('.menu-btn');
    const panels = document.querySelectorAll('.dashboard-panel');

    // ----------------- Student Profile & Upload Elements -----------------
    const uploadZone = document.getElementById('upload-zone');
    const resumeInput = document.getElementById('resume-input');
    const fileLabel = document.getElementById('file-label');
    const uploadLoader = document.getElementById('upload-loader');

    const profilePlaceholder = document.getElementById('profile-placeholder');
    const critiqueReportCard = document.getElementById('critique-report-card');
    const profileDetailedContainer = document.getElementById('profile-detailed-container');
    const profileDetailsRow = document.getElementById('profile-details-row');
    const placementsTableContainer = document.getElementById('placements-table-container');
    const miniReadinessSec = document.getElementById('mini-readiness-sec');

    // Document & Resume Persistence Elements
    const activeResumeBanner = document.getElementById('active-resume-banner');
    const activeResumeName = document.getElementById('active-resume-name');
    const btnDownloadActiveResume = document.getElementById('btn-download-active-resume');
    const resumeHistorySection = document.getElementById('resume-history-section');
    const btnToggleResumeHistory = document.getElementById('btn-toggle-resume-history');
    const resumeHistoryCount = document.getElementById('resume-history-count');
    const resumeHistoryList = document.getElementById('resume-history-list');
    const resumeHistoryChevron = document.getElementById('resume-history-chevron');

    if (btnToggleResumeHistory) {
        btnToggleResumeHistory.addEventListener('click', () => {
            const isHidden = !resumeHistoryList.style.display || resumeHistoryList.style.display === 'none';
            resumeHistoryList.style.display = isHidden ? 'flex' : 'none';
            if (resumeHistoryChevron) {
                resumeHistoryChevron.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
            }
        });
    }

    // ----------------- Resume Builder Elements -----------------
    const resumeBuilderForm = document.getElementById('resume-builder-form');
    const exportResumePdfBtn = document.getElementById('export-resume-pdf-btn');

    // Live preview binding targets
    const previewName = document.getElementById('preview-name');
    const previewEmail = document.getElementById('preview-email');
    const previewCgpa = document.getElementById('preview-cgpa');
    const previewSkills = document.getElementById('preview-skills');
    const previewExperience = document.getElementById('preview-experience');
    const previewProj1Title = document.getElementById('preview-proj1-title');
    const previewProj1Desc = document.getElementById('preview-proj1-desc');
    const previewProj2Title = document.getElementById('preview-proj2-title');
    const previewProj2Desc = document.getElementById('preview-proj2-desc');
    const previewCertifications = document.getElementById('preview-certifications');

    // ----------------- Mock Interview Elements -----------------
    const startInterviewBtn = document.getElementById('start-interview-btn');
    const roleSelect = document.getElementById('interview-role-select');
    const terminalBody = document.getElementById('terminal-body');
    const terminalInput = document.getElementById('terminal-input-el');
    const terminalSubmitBtn = document.getElementById('terminal-submit-btn');
    const terminalPromptStr = document.getElementById('terminal-prompt-str');

    // Audio toggles
    const micBtn = document.getElementById('mic-btn');
    const speakerBtn = document.getElementById('speaker-btn');
    const replayBtn = document.getElementById('replay-btn');

    // ----------------- Recruiter Modal & Scorecards -----------------
    const transcriptModal = document.getElementById('transcript-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalDownloadReportBtn = document.getElementById('modal-download-report-btn');

    // Active session details
    let currentUserSession = null;
    let activeInterviewTranscriptData = null;

    // Charts
    let readinessChart = null;
    let forecastingChart = null;
    let skillRadarChart = null;
    let interviewTrendChart = null;
    let peerRadarChart = null;
    let marketSectorsChart = null;
    let marketSalaryChart = null;
    let candidateCompareChart = null;

    // Interview States
    let isInterviewRunning = false;
    let interviewRole = "";
    let currentQuestionIndex = 0;
    let currentQuestionText = "";
    let isWaitingForNext = false;
    let nextQuestionText = "";
    let isInterviewFinished = false;

    // Audio configs
    let isVoiceOutputEnabled = true;
    let recognition = null;
    let isRecordingInput = false;

    // =========================================================================
    // 1. TACTILE AUDIO SYNTHESIZER (Web Audio API - Pure Client Side)
    // =========================================================================
    let audioCtx = null;
    let soundFXEnabled = localStorage.getItem('placement_sound_fx') !== 'false';

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playClickSound() {
        if (!soundFXEnabled) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(750, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch(e) {}
    }

    function playSuccessChime() {
        if (!soundFXEnabled) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
            chords.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                const startTime = ctx.currentTime + idx * 0.08;
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.12, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.35);
            });
        } catch(e) {}
    }

    function playBoostSound() {
        if (!soundFXEnabled) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.16);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.18);
        } catch(e) {}
    }

    const soundToggleBtn = document.getElementById('sound-fx-toggle-btn');
    if (soundToggleBtn) {
        soundToggleBtn.innerHTML = soundFXEnabled ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-xmark" style="color: var(--accent-red);"></i>';
        soundToggleBtn.title = soundFXEnabled ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Enable)';
        soundToggleBtn.addEventListener('click', () => {
            soundFXEnabled = !soundFXEnabled;
            localStorage.setItem('placement_sound_fx', soundFXEnabled);
            soundToggleBtn.innerHTML = soundFXEnabled ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-xmark" style="color: var(--accent-red);"></i>';
            soundToggleBtn.title = soundFXEnabled ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Enable)';
            if (soundFXEnabled) playSuccessChime();
            showToast(soundFXEnabled ? 'Audio feedback enabled' : 'Audio feedback muted', 'info');
        });
    }

    // =========================================================================
    // 2. CELEBRATORY CONFETTI ENGINE (Vanilla Canvas Particles)
    // =========================================================================
    function triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = 'block';

        const particles = [];
        const colors = ['#00f2fe', '#4facfe', '#00f5a0', '#9b51e0', '#f59e0b', '#ec4899', '#38bdf8'];
        const count = 75;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: canvas.height * 0.45,
                vx: (Math.random() - 0.5) * 16,
                vy: -Math.random() * 14 - 6,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 12,
                gravity: 0.35,
                alpha: 1,
                decay: Math.random() * 0.015 + 0.01
            });
        }

        let animationId;
        function renderParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = 0;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.98;
                p.rotation += p.rotSpeed;
                p.alpha -= p.decay;

                if (p.alpha > 0) {
                    alive++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
                    ctx.restore();
                }
            });

            if (alive > 0) {
                animationId = requestAnimationFrame(renderParticles);
            } else {
                cancelAnimationFrame(animationId);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = 'none';
            }
        }
        renderParticles();
    }

    // =========================================================================
    // 3. SMOOTH NUMERIC COUNTER ANIMATOR
    // =========================================================================
    function animateCounter(element, target, duration = 800, suffix = '') {
        if (!element) return;
        const start = parseInt(element.textContent) || 0;
        const startTime = performance.now();
        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            const current = Math.round(start + (target - start) * ease);
            element.textContent = `${current}${suffix}`;
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = `${target}${suffix}`;
            }
        }
        requestAnimationFrame(update);
    }

    // =========================================================================
    // 4. INTERNSHIPS, WHAT-IF SIMULATOR & FILTERING STATE
    // =========================================================================
    let currentRecommendationsData = [];
    let currentBaseScore = 0;
    let currentStudentSkills = [];
    let simulatedActiveSkills = new Set();
    let savedInternshipIds = new Set(JSON.parse(localStorage.getItem('placement_saved_internships') || '[]'));
    let activeCategoryFilter = 'all';
    let currentSearchTerm = '';
    let currentSortOrder = 'match_desc';
    let latestStudentAnalysis = null;

    const SIMULATION_SKILL_POOL = [
        { name: 'Docker & Containers', skillKey: 'docker', boost: 6, icon: 'fa-cube' },
        { name: 'AWS Cloud Architecture', skillKey: 'aws', boost: 8, icon: 'fa-cloud' },
        { name: 'Kubernetes Orchestration', skillKey: 'kubernetes', boost: 7, icon: 'fa-dharmachakra' },
        { name: 'PyTorch Deep Learning', skillKey: 'pytorch', boost: 8, icon: 'fa-brain' },
        { name: 'System Design & Scalability', skillKey: 'system design', boost: 7, icon: 'fa-diagram-project' },
        { name: 'React / Next.js', skillKey: 'react', boost: 6, icon: 'fa-code' },
        { name: 'CI/CD & GitOps', skillKey: 'ci/cd', boost: 5, icon: 'fa-gears' },
        { name: 'FastAPI Microservices', skillKey: 'fastapi', boost: 6, icon: 'fa-bolt' },
        { name: 'PostgreSQL Performance', skillKey: 'postgresql', boost: 5, icon: 'fa-database' },
        { name: 'TypeScript', skillKey: 'typescript', boost: 5, icon: 'fa-file-code' }
    ];

    function initWhatIfSimulator(studentSkills) {
        const chipsContainer = document.getElementById('sim-chips-container');
        if (!chipsContainer) return;
        chipsContainer.innerHTML = '';
        simulatedActiveSkills.clear();

        const lowerStudentSkills = (studentSkills || []).map(s => s.toLowerCase());

        // Filter out skills the student already possesses
        const availablePool = SIMULATION_SKILL_POOL.filter(item => 
            !lowerStudentSkills.some(sk => sk.includes(item.skillKey) || item.skillKey.includes(sk))
        );

        availablePool.forEach(item => {
            const chip = document.createElement('div');
            chip.className = 'skill-sim-chip';
            chip.dataset.skill = item.skillKey;
            chip.dataset.boost = item.boost;
            chip.innerHTML = `
                <i class="fas ${item.icon}"></i>
                <span>${item.name}</span>
                <span class="boost-tag">+${item.boost}%</span>
            `;

            chip.addEventListener('click', () => {
                const isActive = chip.classList.toggle('active');
                if (isActive) {
                    simulatedActiveSkills.add(item.skillKey);
                    playBoostSound();
                } else {
                    simulatedActiveSkills.delete(item.skillKey);
                    playClickSound();
                }

                updateSimulationState(true);
            });

            chipsContainer.appendChild(chip);
        });

        updateSimulationState(false);
    }

    function updateSimulationState(playSound = true) {
        let totalBoost = 0;
        document.querySelectorAll('.skill-sim-chip.active').forEach(chip => {
            totalBoost += parseInt(chip.dataset.boost) || 0;
        });

        const badge = document.getElementById('simulated-boost-badge');
        const pointsVal = document.getElementById('boost-points-val');
        const unlockedMsg = document.getElementById('sim-unlocked-message');
        const unlockedText = document.getElementById('sim-unlocked-text');

        const boostedScore = Math.min(99, currentBaseScore + totalBoost);
        const progressCircle = document.querySelector('.gauge-progress');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = 440 - (boostedScore / 100) * 440;
        }

        animateCounter(document.getElementById('gauge-score-value'), boostedScore, 300, '%');

        if (totalBoost > 0) {
            if (badge) badge.style.display = 'inline-flex';
            if (pointsVal) pointsVal.textContent = totalBoost;

            if (boostedScore >= 80 && currentBaseScore < 80 && playSound) {
                triggerConfetti();
                playSuccessChime();
            }

            // Calculate how many opportunities got boosted
            let boostedCount = 0;
            currentRecommendationsData.forEach(rec => {
                const reqSkills = rec.required_skills.split(',').map(s => s.trim().toLowerCase());
                const simMatches = reqSkills.filter(sk => [...simulatedActiveSkills].some(sim => sk.includes(sim) || sim.includes(sk)));
                if (simMatches.length > 0) boostedCount++;
            });

            if (unlockedMsg && unlockedText) {
                unlockedMsg.style.display = 'block';
                unlockedText.innerHTML = `Simulation active: <strong>+${totalBoost}%</strong> readiness surge unlocked higher match tiers across <strong>${boostedCount}</strong> target internships below!`;
            }
        } else {
            if (badge) badge.style.display = 'none';
            if (unlockedMsg) unlockedMsg.style.display = 'none';
        }

        renderFilteredInternships();
    }

    const resetSimBtn = document.getElementById('btn-reset-simulator');
    if (resetSimBtn) {
        resetSimBtn.addEventListener('click', () => {
            playClickSound();
            document.querySelectorAll('.skill-sim-chip.active').forEach(chip => chip.classList.remove('active'));
            simulatedActiveSkills.clear();
            updateSimulationState(false);
            showToast('Simulation reset to baseline score', 'info');
        });
    }

    function renderFilteredInternships() {
        const recomTableBody = document.querySelector('#recommendation-table tbody');
        if (!recomTableBody) return;

        // Clone and compute effective match scores
        let processed = currentRecommendationsData.map(rec => {
            const reqSkills = rec.required_skills.split(',').map(s => s.trim());
            let matchedBaseCount = 0;
            let matchedSimCount = 0;

            const skillsAnalysis = reqSkills.map(sk => {
                const sClean = sk.toLowerCase();
                const matchedBase = currentStudentSkills.some(s => s === sClean || s.includes(sClean) || sClean.includes(s));
                const matchedSim = !matchedBase && [...simulatedActiveSkills].some(s => s === sClean || s.includes(sClean) || sClean.includes(s));
                
                if (matchedBase) matchedBaseCount++;
                if (matchedSim) matchedSimCount++;

                return {
                    name: sk,
                    status: matchedBase ? 'matched' : (matchedSim ? 'simulated' : 'missing')
                };
            });

            let effectiveScore = rec.match_score;
            let isBoosted = false;
            if (matchedSimCount > 0 && reqSkills.length > 0) {
                const simBoost = Math.round((matchedSimCount / reqSkills.length) * 22);
                effectiveScore = Math.min(99, rec.match_score + simBoost);
                isBoosted = true;
            }

            // Extract numeric stipend for sorting
            const stipendDigits = parseInt(rec.stipend.replace(/[^0-9]/g, '')) || 0;

            return {
                ...rec,
                effectiveScore,
                isBoosted,
                skillsAnalysis,
                stipendValue: stipendDigits
            };
        });

        // 1. Text Search Filter
        if (currentSearchTerm.trim() !== '') {
            const term = currentSearchTerm.toLowerCase();
            processed = processed.filter(item => 
                item.title.toLowerCase().includes(term) ||
                item.company.toLowerCase().includes(term) ||
                item.required_skills.toLowerCase().includes(term) ||
                item.location.toLowerCase().includes(term)
            );
        }

        // 2. Category Filter
        if (activeCategoryFilter === 'remote') {
            processed = processed.filter(item => item.location.toLowerCase().includes('remote'));
        } else if (activeCategoryFilter === 'high-stipend') {
            processed = processed.filter(item => item.stipendValue >= 25000 || /3[0-9]k|4[0-9]k|5[0-9]k|6[0-9]k|7[0-9]k|8[0-9]k|9[0-9]k/i.test(item.stipend));
        } else if (activeCategoryFilter === 'ai-ml') {
            processed = processed.filter(item => /ai|ml|machine learning|data|nlp|vision|python/i.test(item.title + ' ' + item.required_skills));
        } else if (activeCategoryFilter === 'software') {
            processed = processed.filter(item => /software|developer|frontend|backend|full stack|web|react|node|cloud/i.test(item.title + ' ' + item.required_skills));
        } else if (activeCategoryFilter === 'saved') {
            processed = processed.filter(item => savedInternshipIds.has(item.id));
        }

        // 3. Sorting
        if (currentSortOrder === 'match_desc') {
            processed.sort((a, b) => b.effectiveScore - a.effectiveScore);
        } else if (currentSortOrder === 'stipend_desc') {
            processed.sort((a, b) => b.stipendValue - a.stipendValue);
        } else if (currentSortOrder === 'company_asc') {
            processed.sort((a, b) => a.company.localeCompare(b.company));
        }

        // Update counts in UI
        const countBadge = document.getElementById('table-matches-count-badge');
        if (countBadge) countBadge.textContent = `Showing ${processed.length} of ${currentRecommendationsData.length} Opportunities`;
        const pillAll = document.getElementById('pill-count-all');
        if (pillAll) pillAll.textContent = currentRecommendationsData.length;
        const savedCount = document.getElementById('saved-bookmarks-count');
        if (savedCount) savedCount.textContent = savedInternshipIds.size;

        recomTableBody.innerHTML = '';

        if (processed.length === 0) {
            recomTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
                        <i class="fas fa-filter-circle-xmark" style="font-size: 1.8rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                        No internships matched your current filter criteria.
                        <div style="margin-top: 0.5rem;">
                            <button id="btn-clear-filters" class="btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;">Clear All Filters</button>
                        </div>
                    </td>
                </tr>
            `;
            const clearBtn = document.getElementById('btn-clear-filters');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    const searchInput = document.getElementById('internship-search-input');
                    if (searchInput) searchInput.value = '';
                    currentSearchTerm = '';
                    activeCategoryFilter = 'all';
                    document.querySelectorAll('#internship-category-pills .filter-pill').forEach(p => {
                        p.classList.toggle('active', p.dataset.category === 'all');
                    });
                    renderFilteredInternships();
                });
            }
            return;
        }

        processed.forEach(rec => {
            const tr = document.createElement('tr');
            let skillsHTML = '';
            rec.skillsAnalysis.forEach(sk => {
                let cls = 'skill-tag missing';
                let icon = 'fa-triangle-exclamation';
                if (sk.status === 'matched') {
                    cls = 'skill-tag matched';
                    icon = 'fa-check';
                } else if (sk.status === 'simulated') {
                    cls = 'skill-tag simulated';
                    icon = 'fa-wand-magic-sparkles';
                }
                skillsHTML += `<span class="${cls}"><i class="fas ${icon}"></i> ${sk.name}</span> `;
            });

            const isSaved = savedInternshipIds.has(rec.id);
            const scoreBadgeHTML = rec.isBoosted 
                ? `<span class="score-badge boosted" title="Boosted by What-If Simulator!"><i class="fas fa-bolt"></i> ${rec.effectiveScore}%</span>`
                : `<span class="score-badge">${rec.effectiveScore}%</span>`;

            tr.innerHTML = `
                <td style="font-weight: 600;">
                    <div style="font-size: 0.95rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                        ${rec.title}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.35rem; margin-top: 0.15rem;">
                        <i class="fas fa-building" style="font-size: 0.75rem;"></i> ${rec.company}
                    </div>
                </td>
                <td>${scoreBadgeHTML}</td>
                <td><div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">${skillsHTML}</div></td>
                <td>
                    <div style="font-size: 0.8rem; color: var(--text-primary);"><i class="fas fa-map-marker-alt" style="color: var(--accent-blue);"></i> ${rec.location}</div>
                    <div style="font-size: 0.75rem; color: var(--accent-green); margin-top: 0.15rem;"><i class="fas fa-wallet"></i> ${rec.stipend}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <button class="btn-bookmark ${isSaved ? 'saved' : ''}" data-id="${rec.id}" title="${isSaved ? 'Remove from Saved' : 'Save Internship'}">
                            <i class="${isSaved ? 'fas' : 'far'} fa-star"></i>
                        </button>
                        <button class="btn-primary apply-btn" data-id="${rec.id}" data-score="${rec.effectiveScore}">
                            <i class="fas fa-paper-plane"></i> Apply
                        </button>
                    </div>
                </td>
            `;

            recomTableBody.appendChild(tr);
        });

        // Wire Bookmark buttons
        recomTableBody.querySelectorAll('.btn-bookmark').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (savedInternshipIds.has(id)) {
                    savedInternshipIds.delete(id);
                    btn.classList.remove('saved');
                    btn.querySelector('i').className = 'far fa-star';
                    showToast('Removed from saved internships', 'info');
                } else {
                    savedInternshipIds.add(id);
                    btn.classList.add('saved');
                    btn.querySelector('i').className = 'fas fa-star';
                    showToast('Saved to your bookmarks!', 'success');
                }
                playClickSound();
                localStorage.setItem('placement_saved_internships', JSON.stringify([...savedInternshipIds]));
                const savedBadge = document.getElementById('saved-bookmarks-count');
                if (savedBadge) savedBadge.textContent = savedInternshipIds.size;
                if (activeCategoryFilter === 'saved') {
                    renderFilteredInternships();
                }
            });
        });

        // Wire Apply buttons
        recomTableBody.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                applyForInternship(btn, btn.dataset.id, btn.dataset.score);
            });
        });
    }

    // Toolbar Input Listeners
    const searchInput = document.getElementById('internship-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            renderFilteredInternships();
        });
    }

    const sortSelect = document.getElementById('internship-sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSortOrder = e.target.value;
            playClickSound();
            renderFilteredInternships();
        });
    }

    const filterPills = document.querySelectorAll('#internship-category-pills .filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            playClickSound();
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategoryFilter = pill.dataset.category;
            renderFilteredInternships();
        });
    });

    // =========================================================================
    // 5. PLACEMENT ROI & MARKET STIPEND CALCULATOR
    // =========================================================================
    function initROICalculator() {
        const sliderCgpa = document.getElementById('roi-slider-cgpa');
        const sliderProj = document.getElementById('roi-slider-projects');
        const sliderCerts = document.getElementById('roi-slider-certs');
        const sliderExp = document.getElementById('roi-slider-exp');

        if (!sliderCgpa) return;

        function updateROICalculation() {
            const cgpa = parseFloat(sliderCgpa.value) || 8.5;
            const proj = parseInt(sliderProj.value) || 3;
            const certs = parseInt(sliderCerts.value) || 2;
            const exp = parseInt(sliderExp.value) || 3;

            const cgpaVal = document.getElementById('slider-cgpa-val');
            if (cgpaVal) cgpaVal.textContent = cgpa.toFixed(1);
            const projVal = document.getElementById('slider-proj-val');
            if (projVal) projVal.textContent = `${proj} Project${proj === 1 ? '' : 's'}`;
            const certVal = document.getElementById('slider-cert-val');
            if (certVal) certVal.textContent = `${certs} Certification${certs === 1 ? '' : 's'}`;
            const expVal = document.getElementById('slider-exp-val');
            if (expVal) expVal.textContent = `${exp} Month${exp === 1 ? '' : 's'}`;

            // Weighted readiness calculation
            const cgpaScore = ((cgpa - 5) / 5) * 35; // 35 max
            const projScore = Math.min(30, (proj / 5) * 30); // 30 max
            const certScore = Math.min(20, (certs / 4) * 20); // 20 max
            const expScore = Math.min(15, (exp / 6) * 15); // 15 max
            const totalIndex = Math.max(10, Math.min(99, Math.round(cgpaScore + projScore + certScore + expScore)));

            // Calculate stipend range
            const baseStipend = 18000;
            const minStipend = Math.round((baseStipend + totalIndex * 520) / 1000) * 1000;
            const maxStipend = Math.round((minStipend * 1.38) / 1000) * 1000;

            const stipendEl = document.getElementById('roi-projected-stipend');
            if (stipendEl) stipendEl.textContent = `₹${minStipend.toLocaleString('en-IN')} - ₹${maxStipend.toLocaleString('en-IN')}`;

            const shortlistEl = document.getElementById('roi-shortlist-pct');
            const progressEl = document.getElementById('roi-progress-bar');
            const probPct = Math.min(96, Math.max(25, Math.round(totalIndex * 0.98)));
            if (shortlistEl) shortlistEl.textContent = `${probPct}%`;
            if (progressEl) progressEl.style.width = `${probPct}%`;

            const tipEl = document.getElementById('roi-tip-text');
            if (tipEl) {
                if (proj < 3) {
                    tipEl.innerHTML = `Building <strong>${3 - proj} more full-stack production project(s)</strong> will elevate your stipend potential by approx <strong>+₹18,000/mo</strong> and bypass initial resume filters.`;
                } else if (certs < 2) {
                    tipEl.innerHTML = `Acquiring <strong>1 cloud or Kubernetes certification</strong> increases Tier-1 interview shortlist probability by <strong>+24%</strong> across leading MNCs.`;
                } else if (cgpa < 8.0) {
                    tipEl.innerHTML = `Strong project portfolio currently offsets CGPA. Sustaining 8.0+ unlocks automated application gates for high-frequency trading & Tier-1 product firms.`;
                } else {
                    tipEl.innerHTML = `Exceptional profile strength! You qualify for the top 5% compensation bracket with estimated offers upwards of <strong>₹65,000/mo</strong>.`;
                }
            }
        }

        [sliderCgpa, sliderProj, sliderCerts, sliderExp].forEach(slider => {
            if (slider) slider.addEventListener('input', updateROICalculation);
        });

        updateROICalculation();
    }

    // =========================================================================
    // 6. EMPLOYABILITY PASSPORT DIGITAL BADGE
    // =========================================================================
    function initEmployabilityPassport() {
        const openBtn = document.getElementById('btn-open-passport');
        const modal = document.getElementById('passport-modal');
        const closeBtn = document.getElementById('passport-modal-close-btn');
        const copyLinkBtn = document.getElementById('btn-copy-passport-link');
        const printBtn = document.getElementById('btn-print-passport');

        if (!modal) return;

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                playClickSound();

                const userName = currentUserSession ? currentUserSession.name : 'Ritvik Medam';
                const userEmail = currentUserSession ? currentUserSession.email : 'student@university.edu';
                
                // Initials
                const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
                const avatarEl = document.getElementById('passport-avatar-initials');
                if (avatarEl) avatarEl.textContent = initials;

                const nameEl = document.getElementById('passport-name');
                if (nameEl) nameEl.textContent = userName;

                const emailEl = document.getElementById('passport-email');
                if (emailEl) emailEl.textContent = userEmail;

                const score = latestStudentAnalysis ? latestStudentAnalysis.employability_score : 85;
                const scoreEl = document.getElementById('passport-score');
                if (scoreEl) scoreEl.textContent = `${score}%`;

                const cgpa = (latestStudentAnalysis && latestStudentAnalysis.student_profile) 
                    ? latestStudentAnalysis.student_profile.cgpa 
                    : '8.45';
                const cgpaEl = document.getElementById('passport-cgpa');
                if (cgpaEl) cgpaEl.textContent = cgpa;

                const tierBadge = document.getElementById('passport-tier-badge');
                if (tierBadge) {
                    if (score >= 85) {
                        tierBadge.innerHTML = '<i class="fas fa-crown" style="color: var(--accent-yellow);"></i> Level 4: Industry Ready';
                    } else if (score >= 70) {
                        tierBadge.innerHTML = '<i class="fas fa-award" style="color: var(--accent-green);"></i> Level 3: Placement Qualified';
                    } else {
                        tierBadge.innerHTML = '<i class="fas fa-bolt" style="color: var(--accent-blue);"></i> Level 2: Skill Accelerating';
                    }
                }

                // Skills tags
                const skillsTagsContainer = document.getElementById('passport-skills-tags');
                const skillsCountEl = document.getElementById('passport-skills-count');
                const skills = (latestStudentAnalysis && latestStudentAnalysis.student_profile) 
                    ? latestStudentAnalysis.student_profile.skills 
                    : ['Python', 'Machine Learning', 'Docker', 'AWS Cloud', 'React', 'SQL', 'Git'];

                if (skillsCountEl) skillsCountEl.textContent = `${skills.length} Skills`;

                if (skillsTagsContainer) {
                    skillsTagsContainer.innerHTML = '';
                    skills.slice(0, 8).forEach(sk => {
                        const span = document.createElement('span');
                        span.className = 'p-skill-pill';
                        span.innerHTML = `<i class="fas fa-check" style="font-size: 0.65rem;"></i> ${sk}`;
                        skillsTagsContainer.appendChild(span);
                    });
                }

                // Credential Hash
                const credEl = document.getElementById('passport-code-val');
                if (credEl) {
                    const hash = Math.abs(userName.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)).toString(16).toUpperCase();
                    credEl.textContent = `PI-VERIFIED-${hash}`;
                }

                modal.style.display = 'flex';
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                playSuccessChime();
                const credHash = document.getElementById('passport-code-val')?.textContent || 'PI-VERIFIED';
                const shareUrl = `${window.location.origin}/verify/${credHash}`;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        showToast('Verification URL copied to clipboard!', 'success');
                    }).catch(() => {
                        showToast(`Verification Link: ${shareUrl}`, 'info');
                    });
                } else {
                    showToast(`Verification Link: ${shareUrl}`, 'info');
                }
            });
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    // ----------------- Auth State Checks -----------------
    checkUserSession();

    function checkUserSession() {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data.logged_in) {
                    currentUserSession = data.user;
                    initUserWorkspace(currentUserSession);
                } else {
                    showAuthPortal();
                }
            });
    }

    function showAuthPortal() {
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    function initUserWorkspace(user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';

        sessionUsername.textContent = user.name;
        sessionUserrole.textContent = user.role === 'university' ? 'University Director' : `${user.role} workspace`;
        const avatarEl = document.getElementById('sidebar-user-avatar');
        if (avatarEl && user.name) {
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            avatarEl.textContent = initials || 'ST';
        }

        // Reset menu & tab displays
        studentMenu.style.display = 'none';
        recruiterMenu.style.display = 'none';
        universityMenu.style.display = 'none';

        menuButtons.forEach(btn => btn.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));

        if (user.role === 'student') {
            studentMenu.style.display = 'flex';
            document.querySelector('.menu-btn[data-tab="student-dashboard"]').classList.add('active');
            document.getElementById('student-dashboard').classList.add('active');
            loadStudentProfileDetails();
            startNotificationPolling();
            fetchStudentSlots();
            fetchActiveStudentResume();
            initROICalculator();
            initEmployabilityPassport();
            setTimeout(startOnboardingTour, 1000);
        } else if (user.role === 'recruiter') {
            recruiterMenu.style.display = 'flex';
            document.querySelector('.menu-btn[data-tab="employer-panel"]').classList.add('active');
            document.getElementById('employer-panel').classList.add('active');
            fetchRecruiterCandidates();
        } else if (user.role === 'university') {
            universityMenu.style.display = 'flex';
            document.querySelector('.menu-btn[data-tab="university-panel"]').classList.add('active');
            document.getElementById('university-panel').classList.add('active');
            fetchUniversityDashboard();
        }
    }

    // Toggle Tab forms
    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabSignupBtn.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });

    tabSignupBtn.addEventListener('click', () => {
        tabSignupBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    // Handle Login Signin
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
                return res.json();
            })
            .then(data => {
                currentUserSession = data.user;
                initUserWorkspace(currentUserSession);
            })
            .catch(err => alert(err.message));
    });

    // Handle Signup Registration
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const role = document.getElementById('signup-role').value;

        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
                return res.json();
            })
            .then(data => {
                currentUserSession = data.user;
                initUserWorkspace(currentUserSession);
            })
            .catch(err => alert(err.message));
    });

    // Handle Logout
    logoutBtn.addEventListener('click', () => {
        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => {
                currentUserSession = null;
                resetStudentDashboardState();
                showAuthPortal();
                if (window.speechSynthesis) window.speechSynthesis.cancel();
            });
    });

    // Global helper helper
    window.fillDemoAccount = function (email, password) {
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;
    };

    // ----------------- Date & Time Helpers -----------------
    function parseUTCDate(dateStr) {
        if (!dateStr) return null;
        let s = String(dateStr).trim();
        if (!s.includes('T')) s = s.replace(' ', 'T');
        if (!s.endsWith('Z') && !s.includes('+')) {
            s += 'Z';
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function formatFriendlyDate(dateStr) {
        if (!dateStr) return 'N/A';
        const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const y = parseInt(match[1]);
            const m = parseInt(match[2]) - 1;
            const d = parseInt(match[3]);
            const dt = new Date(y, m, d);
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        const d = parseUTCDate(dateStr);
        if (d) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return dateStr;
    }

    function formatTimeAgoOrLocal(timestampStr) {
        if (!timestampStr) return '';
        const d = parseUTCDate(timestampStr);
        if (!d) return timestampStr;

        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHr / 24);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) {
            return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        if (diffDays === 1) {
            return `Yesterday at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // ----------------- Account Document & Resume State Helpers -----------------
    function resetStudentDashboardState() {
        if (profilePlaceholder) profilePlaceholder.style.display = 'flex';
        if (critiqueReportCard) critiqueReportCard.style.display = 'none';
        if (profileDetailedContainer) profileDetailedContainer.style.display = 'none';
        if (profileDetailsRow) profileDetailsRow.style.display = 'none';
        if (placementsTableContainer) placementsTableContainer.style.display = 'none';
        if (miniReadinessSec) miniReadinessSec.style.display = 'none';

        const whatifContainer = document.getElementById('whatif-simulator-container');
        if (whatifContainer) whatifContainer.style.display = 'none';
        simulatedActiveSkills.clear();

        const radarContainer = document.getElementById('radar-chart-container');
        if (radarContainer) radarContainer.style.display = 'none';
        const peerContainer = document.getElementById('peer-comparison-container');
        if (peerContainer) peerContainer.style.display = 'none';

        if (fileLabel) fileLabel.innerHTML = 'Upload or drag resume (PDF, TXT)';
        if (resumeInput) resumeInput.value = '';

        if (activeResumeBanner) activeResumeBanner.style.display = 'none';
        if (resumeHistorySection) resumeHistorySection.style.display = 'none';
        if (resumeHistoryList) {
            resumeHistoryList.style.display = 'none';
            resumeHistoryList.innerHTML = '';
        }

        const resName = document.getElementById('res-name');
        if (resName) resName.textContent = '';
        const resEmail = document.getElementById('res-email');
        if (resEmail) resEmail.textContent = '';
        const resCgpa = document.getElementById('res-cgpa');
        if (resCgpa) resCgpa.textContent = '';
        const resSkills = document.getElementById('res-skills');
        if (resSkills) resSkills.innerHTML = '';

        const gaugeScore = document.getElementById('gauge-score-value');
        if (gaugeScore) gaugeScore.textContent = '0%';
        const progressCircle = document.querySelector('.gauge-progress');
        if (progressCircle) progressCircle.style.strokeDashoffset = 440;

        const tableBody = document.querySelector('#recommendation-table tbody');
        if (tableBody) tableBody.innerHTML = '';
        const courseContainer = document.getElementById('skill-gap-courses');
        if (courseContainer) courseContainer.innerHTML = '';
        const checklistContainer = document.getElementById('critique-checklist-container');
        if (checklistContainer) checklistContainer.innerHTML = '';
    }

    function updateActiveResumeUI(analysis, resumesList) {
        if (!analysis) return;
        const fileName = analysis.original_filename || 'Saved Resume';
        if (fileLabel) {
            fileLabel.innerHTML = `<span><i class="fas fa-file-circle-check" style="color:var(--accent-green); margin-right:0.35rem;"></i> Active: <b>${fileName}</b></span><br><span style="font-size:0.75rem; color:var(--text-secondary);">Click or drag to replace / upload new resume</span>`;
        }
        if (activeResumeBanner) {
            activeResumeBanner.style.display = 'flex';
            if (activeResumeName) activeResumeName.textContent = fileName;
            if (btnDownloadActiveResume) {
                btnDownloadActiveResume.href = `/api/student/resume/download/${analysis.resume_id}`;
            }
        }

        if (resumesList && resumesList.length > 0) {
            if (resumeHistorySection) resumeHistorySection.style.display = 'block';
            if (resumeHistoryCount) resumeHistoryCount.textContent = resumesList.length;
            if (resumeHistoryList) {
                resumeHistoryList.innerHTML = '';
                resumesList.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'resume-history-item';
                    const isActive = item.is_active || item.id === analysis.resume_id;
                    div.style.cssText = `display:flex; align-items:center; justify-content:space-between; padding:0.45rem 0.65rem; background:rgba(255,255,255,0.03); border:1px solid ${isActive ? 'var(--accent-blue)' : 'rgba(255,255,255,0.08)'}; border-radius:6px; font-size:0.75rem;`;
                    
                    const friendlyDate = formatFriendlyDate(item.uploaded_at);
                    const scoreBadge = item.employability_score ? `<span class="score-badge" style="font-size:0.65rem; padding:0.1rem 0.35rem;">${item.employability_score}%</span>` : '';
                    
                    div.innerHTML = `
                        <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:60%;">
                            <div style="font-weight:600; color: var(--text-primary); overflow:hidden; text-overflow:ellipsis;" title="${item.original_filename}">${item.original_filename}</div>
                            <div style="font-size:0.65rem; color:var(--text-secondary);">${friendlyDate} &bull; ${scoreBadge}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.35rem;">
                            ${isActive ? 
                                `<span style="color:var(--accent-green); font-size:0.7rem; font-weight:600;"><i class="fas fa-check-circle"></i> Active</span>` :
                                `<button class="btn-secondary btn-switch-resume" data-id="${item.id}" style="padding:0.2rem 0.45rem; font-size:0.68rem; cursor:pointer;"><i class="fas fa-arrows-rotate"></i> Use</button>`
                            }
                            <a href="/api/student/resume/download/${item.id}" target="_blank" class="btn-secondary" style="padding:0.2rem 0.45rem; font-size:0.68rem; text-decoration:none;" title="Download Original"><i class="fas fa-download"></i></a>
                        </div>
                    `;
                    resumeHistoryList.appendChild(div);
                });

                document.querySelectorAll('.btn-switch-resume').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const resId = btn.dataset.id;
                        btn.disabled = true;
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                        fetch(`/api/student/resume/switch/${resId}`, { method: 'POST' })
                            .then(res => res.json())
                            .then(data => {
                                if (data.success && data.analysis) {
                                    renderStudentResults(data.analysis);
                                    updateActiveResumeUI(data.analysis, data.resumes_list);
                                    showToast(data.message || 'Active resume updated', 'success');
                                }
                            })
                            .catch(err => alert('Failed to switch resume: ' + err.message));
                    });
                });
            }
        } else {
            if (resumeHistorySection) resumeHistorySection.style.display = 'none';
        }
    }

    function fetchActiveStudentResume() {
        fetch('/api/student/resume/latest')
            .then(res => res.json())
            .then(data => {
                if (data.has_resume && data.analysis) {
                    if (profilePlaceholder) profilePlaceholder.style.display = 'none';
                    if (critiqueReportCard) critiqueReportCard.style.display = 'block';
                    if (profileDetailedContainer) profileDetailedContainer.style.display = 'flex';
                    if (profileDetailsRow) profileDetailsRow.style.display = 'flex';
                    if (placementsTableContainer) placementsTableContainer.style.display = 'block';
                    if (miniReadinessSec) miniReadinessSec.style.display = 'block';

                    renderStudentResults(data.analysis);
                    updateActiveResumeUI(data.analysis, data.resumes_list);
                } else {
                    resetStudentDashboardState();
                }
            })
            .catch(err => {
                console.error("Failed to load active resume:", err);
            });
    }

    // ----------------- Tab Navigation -----------------
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            playClickSound();
            const targetId = btn.dataset.tab;

            menuButtons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');

            if (targetId === 'employer-panel') {
                fetchRecruiterCandidates();
            } else if (targetId === 'university-panel') {
                fetchUniversityDashboard();
            } else if (targetId === 'resume-builder-panel') {
                loadResumeBuilderData();
            } else if (targetId === 'my-applications-panel') {
                fetchMyApplications();
            } else if (targetId === 'mock-interview-panel') {
                fetchInterviewHistory();
            } else if (targetId === 'career-advisor-panel') {
                fetchCareerRoadmap();
            } else if (targetId === 'market-insights-panel') {
                fetchMarketInsights();
            } else if (targetId === 'mock-coding-panel') {
                fetchSandboxProblem();
            }

            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        });
    });

    // ----------------- Student Profile Resume Builder -----------------
    function loadStudentProfileDetails() {
        previewName.textContent = currentUserSession.name;
        previewEmail.textContent = currentUserSession.email;
    }

    function loadResumeBuilderData() {
        fetch('/api/student/profile')
            .then(res => res.json())
            .then(data => {
                if (data.profile) {
                    const p = data.profile;
                    document.getElementById('builder-cgpa').value = p.cgpa;
                    document.getElementById('builder-experience').value = p.experience;
                    document.getElementById('builder-skills').value = p.skills;
                    document.getElementById('builder-certifications').value = p.certifications;

                    // Parse projects split
                    const projs = p.projects.split('||');
                    if (projs.length >= 2) {
                        const pr1 = projs[0].split('::');
                        const pr2 = projs[1].split('::');

                        document.getElementById('builder-project1').value = pr1[0] || '';
                        document.getElementById('builder-project1-desc').value = pr1[1] || '';

                        document.getElementById('builder-project2').value = pr2[0] || '';
                        document.getElementById('builder-project2-desc').value = pr2[1] || '';
                    }
                    updateLiveResumePreview();
                } else {
                    updateLiveResumePreview();
                }
            });
    }

    // Live binding update events
    const fields = [
        'builder-cgpa', 'builder-experience', 'builder-skills',
        'builder-certifications', 'builder-project1', 'builder-project1-desc',
        'builder-project2', 'builder-project2-desc'
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateLiveResumePreview);
    });

    const themeSelect = document.getElementById('builder-theme');
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            const paper = document.getElementById('resume-paper-container');
            if (paper) {
                paper.className = 'resume-paper ' + themeSelect.value;
            }
        });
    }

    function updateLiveResumePreview() {
        previewName.textContent = currentUserSession ? currentUserSession.name : 'Candidate Name';
        previewEmail.textContent = currentUserSession ? currentUserSession.email : 'email@university.edu';

        previewCgpa.textContent = document.getElementById('builder-cgpa').value || '0.0';
        previewSkills.textContent = document.getElementById('builder-skills').value || 'None added yet.';
        previewExperience.textContent = document.getElementById('builder-experience').value || 'No internship logged.';

        previewProj1Title.textContent = document.getElementById('builder-project1').value || 'Project 1';
        previewProj1Desc.textContent = document.getElementById('builder-project1-desc').value || 'Description text...';

        previewProj2Title.textContent = document.getElementById('builder-project2').value || 'Project 2';
        previewProj2Desc.textContent = document.getElementById('builder-project2-desc').value || 'Description text...';

        previewCertifications.textContent = document.getElementById('builder-certifications').value || 'None logged.';
    }

    // Save and Compile Resume profiles
    resumeBuilderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cgpa = parseFloat(document.getElementById('builder-cgpa').value);
        const experience = document.getElementById('builder-experience').value;
        const skills = document.getElementById('builder-skills').value;
        const certifications = document.getElementById('builder-certifications').value;

        const proj1 = document.getElementById('builder-project1').value + '::' + document.getElementById('builder-project1-desc').value;
        const proj2 = document.getElementById('builder-project2').value + '::' + document.getElementById('builder-project2-desc').value;
        const projects = proj1 + '||' + proj2;

        fetch('/api/student/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cgpa, experience, skills, certifications, projects })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Resume metrics compiled successfully and synced to placement databases!");
                    // Trigger resume re-parse calculations
                    triggerResumeRecalculations(cgpa, skills, experience, certifications, proj1, proj2);
                }
            });
    });

    function triggerResumeRecalculations(cgpa, skills, experience, certifications, proj1, proj2) {
        // Construct mock parsing content text
        const text = `
            ${currentUserSession.name}
            Email: ${currentUserSession.email}
            Academic CGPA: ${cgpa}
            Experience of years: ${experience}
            Keywords: ${skills}
            Certifications completed: ${certifications}
            Projects developed: ${proj1} and ${proj2}
        `;

        const formData = new FormData();
        const blob = new Blob([text], { type: 'text/plain' });
        formData.append('resume', blob, 'resume_profile.txt');

        fetch('/api/upload_resume', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                profilePlaceholder.style.display = 'none';
                critiqueReportCard.style.display = 'block';
                profileDetailedContainer.style.display = 'flex';
                profileDetailsRow.style.display = 'flex';
                placementsTableContainer.style.display = 'block';
                miniReadinessSec.style.display = 'block';
                renderStudentResults(data);
                fetchActiveStudentResume();
            });
    }

    // Export PDF print trigger
    exportResumePdfBtn.addEventListener('click', () => {
        window.print();
    });

    // ----------------- Resume Parsing Upload Handlers -----------------
    uploadZone.addEventListener('click', () => resumeInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--accent-blue)';
        uploadZone.style.background = 'rgba(0, 242, 254, 0.05)';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        uploadZone.style.background = 'rgba(255, 255, 255, 0.01)';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        uploadZone.style.background = 'rgba(255, 255, 255, 0.01)';

        if (e.dataTransfer.files.length > 0) {
            resumeInput.files = e.dataTransfer.files;
            uploadAndParseResume(e.dataTransfer.files[0]);
        }
    });

    resumeInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            uploadAndParseResume(e.target.files[0]);
        }
    });

    function uploadAndParseResume(file) {
        fileLabel.textContent = `Processing: ${file.name}`;
        uploadLoader.style.display = 'block';

        critiqueReportCard.style.display = 'none';
        profileDetailedContainer.style.display = 'none';
        profileDetailsRow.style.display = 'none';
        placementsTableContainer.style.display = 'none';
        miniReadinessSec.style.display = 'none';
        profilePlaceholder.style.display = 'flex';

        const formData = new FormData();
        formData.append('resume', file);

        fetch('/api/upload_resume', {
            method: 'POST',
            body: formData
        })
            .then(res => {
                if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
                return res.json();
            })
            .then(data => {
                uploadLoader.style.display = 'none';
                profilePlaceholder.style.display = 'none';

                critiqueReportCard.style.display = 'block';
                profileDetailedContainer.style.display = 'flex';
                profileDetailsRow.style.display = 'flex';
                placementsTableContainer.style.display = 'block';
                miniReadinessSec.style.display = 'block';

                renderStudentResults(data);
                fetchActiveStudentResume();
                showToast("Resume saved to your account!", "success");
            })
            .catch(err => {
                uploadLoader.style.display = 'none';
                alert(`Parsing Failed: ${err.message}`);
                fileLabel.textContent = 'Upload or drag resume (PDF, TXT)';
            });
    }

    function renderStudentResults(data) {
        latestStudentAnalysis = data;
        const profile = data.student_profile;
        const critique = data.critique;

        currentRecommendationsData = data.recommendations || [];
        currentBaseScore = data.employability_score || 0;
        currentStudentSkills = (profile.skills || []).map(s => s.toLowerCase());
        simulatedActiveSkills.clear();

        document.getElementById('res-name').textContent = profile.name;
        document.getElementById('res-email').textContent = profile.email;
        document.getElementById('res-cgpa').textContent = profile.cgpa;

        const skillsContainer = document.getElementById('res-skills');
        skillsContainer.innerHTML = '';
        profile.skills.forEach(sk => {
            const span = document.createElement('span');
            span.className = 'skill-tag';
            span.innerHTML = `<i class="fas fa-check"></i> ${sk}`;
            skillsContainer.appendChild(span);
        });

        // Gauge values & Animated Counter
        const score = data.employability_score;
        const progressCircle = document.querySelector('.gauge-progress');
        const offset = 440 - (score / 100) * 440;
        if (progressCircle) progressCircle.style.strokeDashoffset = offset;
        animateCounter(document.getElementById('gauge-score-value'), score, 900, '%');

        const readinessBadge = document.getElementById('readiness-badge');
        readinessBadge.textContent = `${data.placement_readiness} Readiness`;
        readinessBadge.className = 'badge-readiness ' + data.placement_readiness.toLowerCase();

        // Celebration chime & confetti if high readiness
        if (score >= 75) {
            setTimeout(() => {
                triggerConfetti();
                playSuccessChime();
            }, 300);
        }

        // Sub scores
        document.getElementById('score-format').textContent = `${critique.scores.formatting}%`;
        document.getElementById('fill-format').style.width = `${critique.scores.formatting}%`;

        document.getElementById('score-certs').textContent = `${critique.scores.certifications}%`;
        document.getElementById('fill-certs').style.width = `${critique.scores.certifications}%`;

        document.getElementById('score-projects').textContent = `${critique.scores.projects}%`;
        document.getElementById('fill-projects').style.width = `${critique.scores.projects}%`;

        // Recommendation checks
        const checklistContainer = document.getElementById('critique-checklist-container');
        checklistContainer.innerHTML = '';
        critique.checklist.forEach(item => {
            const div = document.createElement('div');
            const cls = item.completed ? 'critique-item completed' : 'critique-item pending';
            const icon = item.completed ? 'fa-circle-check' : 'fa-circle-xmark';
            div.className = cls;
            div.innerHTML = `<i class="fas ${icon}"></i> <span>${item.task}</span>`;
            checklistContainer.appendChild(div);
        });

        // Initialize Interactive What-If Simulator
        const whatifContainer = document.getElementById('whatif-simulator-container');
        if (whatifContainer) whatifContainer.style.display = 'block';
        initWhatIfSimulator(profile.skills || []);

        // Render Filtered & Interactive Recommendations Table
        renderFilteredInternships();

        // Curated Learn links
        const courseContainer = document.getElementById('skill-gap-courses');
        courseContainer.innerHTML = '';
        let courseSet = new Set();
        let courseList = [];
        data.recommendations.slice(0, 3).forEach(rec => {
            rec.courses.forEach(c => {
                if (!courseSet.has(c.course)) {
                    courseSet.add(c.course);
                    courseList.push(c);
                }
            });
        });

        if (courseList.length === 0) {
            courseContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--accent-green);"><i class="fas fa-circle-check"></i> Skills perfectly optimized!</div>';
        } else {
            courseList.slice(0, 4).forEach(item => {
                const card = document.createElement('div');
                card.className = 'course-card';
                card.innerHTML = `
                    <div class="course-info">
                        <span class="course-skill">${item.skill} gap</span>
                        <span class="course-title">${item.course}</span>
                    </div>
                    <a href="https://www.coursera.org" target="_blank" class="btn-secondary" style="font-size: 0.7rem; text-decoration: none; padding: 0.25rem 0.6rem;">
                        <i class="fas fa-up-right-from-square"></i> Learn
                    </a>
                `;
                courseContainer.appendChild(card);
            });
        }

        // Render skill radar chart
        renderSkillRadarChart(data.recommendations);

        // Fetch peer comparison analytics
        fetchPeerComparison();

        // Populate cover letter opportunity options
        populateCoverLetterRoles(data.recommendations);
    }

    function applyForInternship(button, internshipId, matchScore) {
        if (!currentUserSession) return;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting';

        fetch('/api/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_name: currentUserSession.name,
                student_email: currentUserSession.email,
                internship_id: parseInt(internshipId),
                match_score: parseFloat(matchScore)
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    button.innerHTML = '<i class="fas fa-circle-check"></i> Applied';
                    button.style.background = 'rgba(0, 245, 160, 0.15)';
                    button.style.color = 'var(--accent-green)';
                    button.style.border = '1px solid rgba(0, 245, 160, 0.3)';
                    triggerConfetti();
                    playSuccessChime();
                    showToast('Application successfully submitted! Recruiter notified.', 'success');
                } else {
                    button.disabled = false;
                    button.innerHTML = '<i class="fas fa-paper-plane"></i> Apply';
                    showToast(data.error || 'Failed to submit application', 'error');
                }
            })
            .catch(err => {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-paper-plane"></i> Apply';
                showToast('Application submission error: ' + err.message, 'error');
            });
    }

    // ----------------- Mock Interview Terminal -----------------
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecordingInput = true;
            micBtn.classList.add('recording');
            terminalInput.placeholder = "Listening... Speak your answer clearly.";
        };

        recognition.onresult = (e) => {
            terminalInput.value = e.results[0][0].transcript;
        };

        recognition.onend = () => {
            isRecordingInput = false;
            micBtn.classList.remove('recording');
            terminalInput.placeholder = "Type your answer here...";
        };

        recognition.onerror = (e) => {
            console.error("STT Error:", e.error);
            isRecordingInput = false;
            micBtn.classList.remove('recording');
            terminalInput.placeholder = "Type your answer here...";
        };
    } else {
        micBtn.style.display = 'none';
    }

    // Toggle Audio speaker
    speakerBtn.addEventListener('click', () => {
        speakerBtn.classList.toggle('active');
        isVoiceOutputEnabled = speakerBtn.classList.contains('active');
        if (!isVoiceOutputEnabled && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    });

    // Toggle Microphone recording
    micBtn.addEventListener('click', () => {
        if (!recognition || !isInterviewRunning) return;
        if (isRecordingInput) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    // Toggle repeat question audio
    replayBtn.addEventListener('click', () => {
        if (isInterviewRunning && currentQuestionText) {
            speakQuestion(currentQuestionText);
        }
    });

    // Pre-trigger loading of voices
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    function speakQuestion(text) {
        if (!isVoiceOutputEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const cleanText = text.replace(/\[SYSTEM\]|\[AI Coach\]|\[AI Interviewer\]/gi, "").trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);

        const voices = window.speechSynthesis.getVoices();
        const preferredVoices = ['google us english', 'samantha', 'daniel', 'microsoft zira desktop', 'apple'];

        let selectedVoice = null;
        for (const preferred of preferredVoices) {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes(preferred) && v.lang.includes('en'));
            if (selectedVoice) break;
        }

        if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('en'));
        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.rate = 0.90;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
    }

    // Start practice round
    startInterviewBtn.addEventListener('click', () => {
        if (isInterviewRunning) return;

        interviewRole = roleSelect.value;
        startInterviewBtn.disabled = true;
        startInterviewBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting Round...';

        terminalBody.innerHTML = `
            <div class="terminal-line">
                <span class="terminal-system-msg">[SYSTEM] Starting technical assessment framework for ${interviewRole}...</span>
            </div>
            <div class="terminal-line">
                <span class="terminal-system-msg">[SYSTEM] Fetching candidate details: ${currentUserSession.name}...</span>
            </div>
        `;

        fetch('/api/interview/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: interviewRole })
        })
            .then(res => res.json())
            .then(data => {
                isInterviewRunning = true;
                isWaitingForNext = false;
                isInterviewFinished = false;
                terminalSubmitBtn.innerHTML = '<i class="fas fa-share"></i> Send';

                currentQuestionIndex = data.question_index;
                startInterviewBtn.innerHTML = '<i class="fas fa-headset"></i> Interviewing...';

                terminalInput.disabled = false;
                terminalSubmitBtn.disabled = false;
                if (recognition) micBtn.disabled = false;
                terminalPromptStr.textContent = `${currentUserSession.name.toLowerCase().replace(' ', '')}@rvuniversity:~$`;
                terminalInput.focus();

                appendTerminalLine('AI Coach', data.question);
                speakQuestion(data.question);
                currentQuestionText = data.question;
                replayBtn.disabled = false;
            });
    });

    terminalSubmitBtn.addEventListener('click', submitTerminalAnswer);
    terminalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitTerminalAnswer();
    });

    function submitTerminalAnswer() {
        if (!isInterviewRunning) return;

        if (isWaitingForNext) {
            if (isInterviewFinished) {
                // End interview
                isInterviewRunning = false;
                startInterviewBtn.disabled = false;
                startInterviewBtn.innerHTML = '<i class="fas fa-play"></i> Start Practice Session';
                terminalInput.disabled = true;
                terminalSubmitBtn.disabled = true;
                if (recognition) micBtn.disabled = true;
                terminalPromptStr.textContent = 'guest@rvuniversity:~$';

                const finishMsg = document.createElement('div');
                finishMsg.className = 'terminal-line';
                finishMsg.innerHTML = `<span class="terminal-system-msg">[SYSTEM] Assessment round completed successfully! grades synced to databases.</span>`;
                terminalBody.appendChild(finishMsg);
                speakQuestion("Interview completed. Your grades have been recorded.");
                replayBtn.disabled = true;
                currentQuestionText = "";

                isWaitingForNext = false;
                isInterviewFinished = false;
                terminalSubmitBtn.innerHTML = '<i class="fas fa-share"></i> Send';
            } else {
                // Progress
                isWaitingForNext = false;
                terminalInput.disabled = false;
                terminalSubmitBtn.disabled = false;
                if (recognition) micBtn.disabled = false;
                terminalInput.value = '';
                terminalInput.focus();

                appendTerminalLine('AI Coach', nextQuestionText);
                speakQuestion(nextQuestionText);
                currentQuestionText = nextQuestionText;
                replayBtn.disabled = false;

                terminalSubmitBtn.innerHTML = '<i class="fas fa-share"></i> Send';
            }
            terminalBody.scrollTop = terminalBody.scrollHeight;
            return;
        }

        const text = terminalInput.value.trim();
        if (!text) return;

        if (window.speechSynthesis) window.speechSynthesis.cancel();

        appendTerminalLine('You', text);
        terminalInput.value = '';

        terminalInput.disabled = true;
        terminalSubmitBtn.disabled = true;
        if (recognition) micBtn.disabled = true;

        const typingEl = document.createElement('div');
        typingEl.className = 'terminal-line';
        typingEl.id = 'terminal-typing';
        typingEl.innerHTML = `<span class="terminal-system-msg">[AI Coach is evaluating technical accuracy & filler word density...]</span>`;
        terminalBody.appendChild(typingEl);
        terminalBody.scrollTop = terminalBody.scrollHeight;

        fetch('/api/interview/submit_answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: interviewRole,
                question_index: currentQuestionIndex,
                answer: text,
                student_name: currentUserSession.name,
                student_email: currentUserSession.email
            })
        })
            .then(res => res.json())
            .then(data => {
                document.getElementById('terminal-typing').remove();

                // Print Score Card
                const scoreCard = document.createElement('div');
                scoreCard.className = 'terminal-score-card';
                scoreCard.innerHTML = `
                <div style="font-weight:600; color: var(--accent-blue); margin-bottom: 0.25rem; display:flex; justify-content:space-between;">
                    <span><i class="fas fa-circle-check"></i> TECHNICAL ACCURACY: ${data.technical_score}/100</span>
                    <span style="color:var(--accent-purple);"><i class="fas fa-volume-high"></i> DELIVERY CLARITY: ${data.communication_score}/100</span>
                </div>
                <div style="font-size:0.8rem; color: var(--text-secondary); line-height: 1.4;"><span style="color: var(--text-primary); font-weight:500;">Critique & Grammar:</span> ${data.feedback}</div>
                <div style="font-size:0.8rem; color: var(--text-secondary); line-height: 1.4; margin-top:0.25rem;"><span style="color:#00f5a0; font-weight:500;">Model Answer:</span> ${data.model_answer}</div>
            `;
                terminalBody.appendChild(scoreCard);

                if (data.is_finished) {
                    isInterviewFinished = true;
                    nextQuestionText = "";
                } else {
                    isInterviewFinished = false;
                    currentQuestionIndex = data.next_question_index;
                    let nextQ = data.next_question;
                    if (data.follow_up) {
                        nextQ = `${data.follow_up} For the next topic: ${nextQ}`;
                    }
                    nextQuestionText = nextQ;
                }

                isWaitingForNext = true;
                terminalSubmitBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Next Question';
                terminalSubmitBtn.disabled = false;

                terminalBody.scrollTop = terminalBody.scrollHeight;
            });
    }

    function appendTerminalLine(sender, text) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        if (sender === 'You') {
            line.innerHTML = `<span class="terminal-prompt">${currentUserSession.name.toLowerCase().replace(' ', '')}@rvuniversity:~$</span> <span style="color: var(--text-primary);">${text}</span>`;
        } else {
            line.innerHTML = `<span style="color:var(--accent-purple); font-weight:600;">[AI Interviewer]</span> <span class="terminal-ai-text">${text}</span>`;
        }
        terminalBody.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // ----------------- Employer Recruiter Board -----------------
    let currentCandidatesList = [];

    function fetchRecruiterCandidates() {
        const tableBody = document.querySelector('#employer-table tbody');
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Syncing applicant list...</td></tr>';

        fetch('/api/employer_candidates')
            .then(res => res.json())
            .then(data => {
                currentCandidatesList = data;
                tableBody.innerHTML = '';

                // Reset Select-All checkbox
                const selectAllCheckbox = document.getElementById('select-all-candidates-checkbox');
                if (selectAllCheckbox) selectAllCheckbox.checked = false;
                updateBulkActionsDisplay();

                // Populate comparison selectors
                populateComparisonSelects(data);

                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No active applications in the queue.</td></tr>';
                    return;
                }

                data.forEach(c => {
                    const tr = document.createElement('tr');
                    const date = formatFriendlyDate(c.applied_at);

                    const mockGrade = c.interview_score !== null ?
                        `<span class="clickable-score score-badge" data-email="${c.student_email}" data-role="${c.internship_title}" style="color:var(--accent-green); border-color:rgba(0,245,160,0.3); cursor:pointer;">${c.interview_score}/100</span>` :
                        '<span style="color:var(--text-secondary); font-size:0.75rem;">Not Taken</span>';

                    const resumeCol = c.active_resume_id ?
                        `<a href="/api/student/resume/download/${c.active_resume_id}" target="_blank" class="btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.72rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;" title="Download Candidate Resume"><i class="fas fa-file-pdf" style="color:var(--accent-red);"></i> CV</a>` :
                        `<span style="color:var(--text-secondary); font-size:0.75rem;">None</span>`;

                    const statusOptions = ['Screening', 'Interviewing', 'Shortlisted', 'Offered', 'Rejected'];
                    let optionsHTML = '';
                    statusOptions.forEach(opt => {
                        const sel = opt === c.status ? 'selected' : '';
                        optionsHTML += `<option value="${opt}" ${sel}>${opt}</option>`;
                    });

                    tr.innerHTML = `
                    <td><input type="checkbox" class="candidate-checkbox" data-email="${c.student_email}" data-id="${c.internship_id}"></td>
                    <td style="font-weight:600;">
                        <div style="color: var(--text-primary);">${c.student_name}</div>
                        <div style="font-size:0.75rem; color: var(--text-secondary);">${c.student_email}</div>
                    </td>
                    <td style="font-weight:500;">${c.internship_title}</td>
                    <td><span class="score-badge">${c.match_score}%</span></td>
                    <td>${mockGrade}</td>
                    <td>
                        <div class="select-wrapper">
                            <select class="status-select recruiter-status-select" data-email="${c.student_email}" data-id="${c.internship_id}">
                                ${optionsHTML}
                            </select>
                        </div>
                    </td>
                    <td style="color: var(--text-secondary); font-size: 0.8rem;">${date}</td>
                    <td>${resumeCol}</td>
                `;
                    tableBody.appendChild(tr);
                });

                // Wire individual checkbox listeners
                document.querySelectorAll('.candidate-checkbox').forEach(cb => {
                    cb.addEventListener('change', updateBulkActionsDisplay);
                });

                document.querySelectorAll('.recruiter-status-select').forEach(sel => {
                    sel.addEventListener('change', () => {
                        updateCandidateStatus(sel.dataset.email, sel.dataset.id, sel.value);
                    });
                });

                document.querySelectorAll('.clickable-score').forEach(btn => {
                    btn.addEventListener('click', () => {
                        openCandidateTranscript(btn.dataset.email, btn.dataset.role);
                    });
                });

                // Sync the Kanban View
                renderRecruiterKanban(data);

                // Fetch created interview slots
                fetchRecruiterSlots();
            });
    }

    function openCandidateTranscript(email, role) {
        fetch(`/api/interview/transcript?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`)
            .then(res => {
                if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
                return res.json();
            })
            .then(data => {
                activeInterviewTranscriptData = data;

                document.getElementById('modal-avg-score').textContent = `${data.average_score}%`;
                document.getElementById('modal-tech-score').textContent = `${data.technical_score}%`;
                document.getElementById('modal-comm-score').textContent = `${data.communication_score}%`;
                document.getElementById('modal-student-email').textContent = data.student_email;
                document.getElementById('modal-filler-words').textContent = data.filler_words;

                document.getElementById('modal-transcript-text').textContent = data.transcript;

                transcriptModal.style.display = "block";
            })
            .catch(err => {
                alert(`Could not load audit log: ${err.message}`);
            });
    }

    // Modal PDF Exporter
    modalDownloadReportBtn.addEventListener('click', () => {
        if (!activeInterviewTranscriptData) return;
        const d = activeInterviewTranscriptData;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>AI Assessment Scorecard - ${d.student_name}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
                    .header h2 { margin: 0; font-size: 24px; color: #0f172a; }
                    .header p { margin: 5px 0 0 0; font-size: 14px; color: #64748b; }
                    .score-grid { display: flex; justify-content: space-around; margin: 25px 0; }
                    .score-card { text-align: center; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; width: 30%; background: #f8fafc; }
                    .score-val { font-size: 28px; font-weight: 800; color: #2563eb; margin-bottom: 5px; }
                    .transcript-box { background: #0f172a; color: #38bdf8; font-family: monospace; padding: 20px; border-radius: 12px; white-space: pre-wrap; font-size: 13px; max-height: 400px; overflow-y: auto; border: 1px solid #1e293b; }
                    .meta-info { font-size: 14px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>AI Mock Assessment Report Card</h2>
                    <p>RV Placement & Employability Verification System</p>
                </div>
                <div class="meta-info">
                    <div><strong>Candidate Name:</strong> ${d.student_name}</div>
                    <div><strong>Email:</strong> ${d.student_email}</div>
                    <div><strong>Target Assessment Role:</strong> ${d.role}</div>
                    <div><strong>Verbal Filler Phrases Found:</strong> ${d.filler_words}</div>
                    <div><strong>Completed At:</strong> ${d.completed_at ? (parseUTCDate(d.completed_at) ? parseUTCDate(d.completed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : d.completed_at) : "N/A"}</div>
                </div>
                <div class="score-grid">
                    <div class="score-card">
                        <div class="score-val">${d.average_score}%</div>
                        <div style="font-size:12px; color:#94a3b8; text-transform:uppercase;">Overall Grade</div>
                    </div>
                    <div class="score-card">
                        <div class="score-val" style="color:#16a34a;">${d.technical_score}%</div>
                        <div style="font-size:12px; color:#94a3b8; text-transform:uppercase;">Technical accuracy</div>
                    </div>
                    <div class="score-card">
                        <div class="score-val" style="color:#7c3aed;">${d.communication_score}%</div>
                        <div style="font-size:12px; color:#94a3b8; text-transform:uppercase;">Clarity index</div>
                    </div>
                </div>
                <h3>Dialogue Transcript Auditing Logs:</h3>
                <div class="transcript-box">${d.transcript}</div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });

    modalCloseBtn.addEventListener('click', () => {
        transcriptModal.style.display = "none";
    });

    window.addEventListener('click', (event) => {
        if (event.target === transcriptModal) {
            transcriptModal.style.display = "none";
        }
    });

    function updateCandidateStatus(email, intId, statusVal) {
        fetch('/api/apply/update_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_email: email,
                internship_id: parseInt(intId),
                status: statusVal
            })
        });
    }

    // ----------------- University Director Panel -----------------
    function fetchUniversityDashboard() {
        fetch('/api/university_stats')
            .then(res => res.json())
            .then(data => {
                document.getElementById('uni-students').textContent = data.total_students_monitored;
                document.getElementById('uni-cgpa').textContent = data.average_cgpa;
                document.getElementById('uni-apps').textContent = data.total_applications_submitted;
                document.getElementById('uni-match').textContent = `${data.average_match_score}%`;

                const labelsReadiness = Object.keys(data.employability_readiness_distribution);
                const valuesReadiness = Object.values(data.employability_readiness_distribution);

                const ctxReadiness = document.getElementById('readinessDistributionChart').getContext('2d');
                if (readinessChart) readinessChart.destroy();

                readinessChart = new Chart(ctxReadiness, {
                    type: 'doughnut',
                    data: {
                        labels: labelsReadiness,
                        datasets: [{
                            data: valuesReadiness,
                            backgroundColor: [
                                'rgba(0, 245, 160, 0.65)',
                                'rgba(244, 180, 26, 0.65)',
                                'rgba(255, 51, 102, 0.65)'
                            ],
                            borderColor: [
                                'rgba(0, 245, 160, 1)',
                                'rgba(244, 180, 26, 1)',
                                'rgba(255, 51, 102, 1)'
                            ],
                            borderWidth: 1.5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#d0d8e5', font: { family: 'Inter', size: 10 } }
                            }
                        }
                    }
                });

                const fore = data.forecasting;
                const ctxFore = document.getElementById('forecastingChart').getContext('2d');
                if (forecastingChart) forecastingChart.destroy();

                forecastingChart = new Chart(ctxFore, {
                    type: 'line',
                    data: {
                        labels: fore.cgpa_x.map(x => `${x} CGPA`),
                        datasets: [
                            {
                                label: 'Current Placement Ratio (%)',
                                data: fore.current_placement_y,
                                borderColor: 'rgba(0, 242, 254, 1)',
                                backgroundColor: 'rgba(0, 242, 254, 0.1)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.3
                            },
                            {
                                label: 'Forecasted Ratio (Revised Syllabus) (%)',
                                data: fore.forecasted_placement_y,
                                borderColor: 'rgba(155, 81, 224, 1)',
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                fill: false,
                                tension: 0.3
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { color: '#d0d8e5', font: { family: 'Inter' } }
                            },
                            y: {
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#d0d8e5', font: { family: 'Inter' }, stepSize: 20 }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { color: '#d0d8e5', font: { family: 'Inter', size: 10 } }
                            }
                        }
                    }
                });
            });
    }

    // ====================== PREMIUM FEATURES ======================

    // ----------------- Feature 1: Skill Radar Chart -----------------
    function renderSkillRadarChart(recommendations) {
        const container = document.getElementById('radar-chart-container');
        if (!recommendations || recommendations.length === 0) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';

        // Extract all unique required skills from top 5 internships
        const allSkills = new Set();
        const topRecs = recommendations.slice(0, 5);
        topRecs.forEach(r => {
            (r.required_skills || '').split(',').forEach(s => {
                const trimmed = s.trim().toLowerCase();
                if (trimmed) allSkills.add(trimmed);
            });
        });

        const skillLabels = Array.from(allSkills).slice(0, 10);

        // Student skill levels (1 if they have it, 0 if not)
        const studentSkillTags = document.querySelectorAll('#res-skills .skill-tag');
        const studentSkillsSet = new Set();
        studentSkillTags.forEach(tag => {
            studentSkillsSet.add(tag.textContent.trim().toLowerCase());
        });

        const studentData = skillLabels.map(s => studentSkillsSet.has(s) ? 1 : 0);

        // Average requirement scores for top internships
        const requirementData = skillLabels.map(skill => {
            let count = 0;
            topRecs.forEach(r => {
                const rSkills = (r.required_skills || '').toLowerCase().split(',').map(s => s.trim());
                if (rSkills.includes(skill)) count++;
            });
            return count / topRecs.length;
        });

        const ctx = document.getElementById('skillRadarChart').getContext('2d');
        if (skillRadarChart) skillRadarChart.destroy();
        skillRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: skillLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                datasets: [
                    {
                        label: 'Your Skills',
                        data: studentData,
                        backgroundColor: 'rgba(0, 245, 160, 0.15)',
                        borderColor: 'rgba(0, 245, 160, 0.8)',
                        borderWidth: 2,
                        pointBackgroundColor: '#00f5a0',
                        pointRadius: 4
                    },
                    {
                        label: 'Required (Top Internships)',
                        data: requirementData,
                        backgroundColor: 'rgba(155, 81, 224, 0.12)',
                        borderColor: 'rgba(155, 81, 224, 0.7)',
                        borderWidth: 2,
                        pointBackgroundColor: '#9b51e0',
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 1,
                        ticks: { display: false, stepSize: 0.25 },
                        grid: { color: 'rgba(255, 255, 255, 0.06)' },
                        angleLines: { color: 'rgba(255, 255, 255, 0.06)' },
                        pointLabels: { color: '#d0d8e5', font: { family: 'Inter', size: 11 } }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#d0d8e5', font: { family: 'Inter', size: 11 }, padding: 20 }
                    }
                }
            }
        });
    }

    // ----------------- Feature 2: Application Timeline -----------------
    function fetchMyApplications() {
        const container = document.getElementById('applications-timeline-container');
        container.innerHTML = '<div style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem; color: var(--accent-blue);"></i></div>';

        fetch('/api/student/applications')
            .then(res => res.json())
            .then(data => {
                if (!data || data.length === 0) {
                    container.innerHTML = `
                    <div class="timeline-empty">
                        <i class="fas fa-inbox" style="font-size: 3rem; color: rgba(255,255,255,0.06);"></i>
                        <p style="color: var(--text-secondary); margin-top: 1rem;">No applications submitted yet. Apply for internships from the Placement Matching dashboard.</p>
                    </div>`;
                    return;
                }

                const pipelineStages = ['Screening', 'Invite for Test', 'Technical Interview', 'Offered'];
                container.innerHTML = '';

                data.forEach(app => {
                    const card = document.createElement('div');
                    card.className = 'timeline-card';

                    const dateStr = formatFriendlyDate(app.applied_at);

                    const isRejected = app.status === 'Rejected';
                    let currentStageIndex = pipelineStages.indexOf(app.status);
                    if (currentStageIndex === -1 && !isRejected) currentStageIndex = 0;

                    let pipelineHTML = '';
                    pipelineStages.forEach((stage, i) => {
                        let stateClass = '';
                        let icon = '';
                        if (isRejected) {
                            stateClass = 'rejected';
                            icon = '<i class="fas fa-xmark"></i>';
                        } else if (i < currentStageIndex) {
                            stateClass = 'completed';
                            icon = '<i class="fas fa-check"></i>';
                        } else if (i === currentStageIndex) {
                            stateClass = 'active';
                            icon = '<i class="fas fa-circle" style="font-size: 0.4rem;"></i>';
                        }
                        pipelineHTML += `
                        <div class="pipeline-step ${stateClass}">
                            <div class="step-dot">${icon}</div>
                            ${stage}
                        </div>`;
                        if (i < pipelineStages.length - 1) {
                            pipelineHTML += `<div class="pipeline-connector ${i < currentStageIndex ? 'completed' : ''}"></div>`;
                        }
                    });

                    const interviewBadge = app.interview_score !== null ?
                        `<span style="color: var(--accent-green); font-weight: 600;">${app.interview_score}/100</span>` :
                        '<span style="color: var(--text-secondary); font-size: 0.75rem;">Not Taken</span>';

                    card.innerHTML = `
                    <div class="timeline-card-header">
                        <div class="timeline-role-info">
                            <h3>${app.title}</h3>
                            <span>${app.company} — ${app.location}</span>
                        </div>
                        <div class="timeline-match-badge">${app.match_score}% Match</div>
                    </div>
                    <div class="timeline-pipeline">${pipelineHTML}</div>
                    <div class="timeline-footer">
                        <span><i class="fas fa-calendar"></i> Applied: ${dateStr}</span>
                        <span><i class="fas fa-headset"></i> Mock Grade: ${interviewBadge}</span>
                    </div>`;

                    container.appendChild(card);
                });
            });
    }

    // ----------------- Feature 3: Interview Performance Trends -----------------
    function fetchInterviewHistory() {
        fetch('/api/interview/history')
            .then(res => res.json())
            .then(data => {
                const emptyDiv = document.getElementById('interview-history-empty');
                const chartWrap = document.getElementById('interview-history-chart-wrap');

                if (!data || data.length === 0) {
                    emptyDiv.style.display = 'block';
                    chartWrap.style.display = 'none';
                    return;
                }

                emptyDiv.style.display = 'none';
                chartWrap.style.display = 'block';

                const labels = data.map((d, i) => `Session ${i + 1}`);
                const avgScores = data.map(d => d.average_score);
                const techScores = data.map(d => d.technical_score);
                const commScores = data.map(d => d.communication_score);

                const ctx = document.getElementById('interviewTrendChart').getContext('2d');
                if (interviewTrendChart) interviewTrendChart.destroy();
                interviewTrendChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [
                            {
                                label: 'Overall Score',
                                data: avgScores,
                                borderColor: '#00f2fe',
                                backgroundColor: 'rgba(0, 242, 254, 0.1)',
                                borderWidth: 2.5,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 5,
                                pointBackgroundColor: '#00f2fe'
                            },
                            {
                                label: 'Technical',
                                data: techScores,
                                borderColor: '#00f5a0',
                                borderWidth: 2,
                                tension: 0.4,
                                pointRadius: 4,
                                pointBackgroundColor: '#00f5a0',
                                fill: false
                            },
                            {
                                label: 'Communication',
                                data: commScores,
                                borderColor: '#9b51e0',
                                borderWidth: 2,
                                tension: 0.4,
                                pointRadius: 4,
                                pointBackgroundColor: '#9b51e0',
                                fill: false
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { color: '#d0d8e5', font: { family: 'Inter' } }
                            },
                            y: {
                                min: 0,
                                max: 100,
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                ticks: { color: '#d0d8e5', font: { family: 'Inter' }, stepSize: 20 }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { color: '#d0d8e5', font: { family: 'Inter', size: 11 }, padding: 15 }
                            }
                        }
                    }
                });

                // Render interview sessions table & certificates
                renderInterviewHistoryTable(data);
            });
    }

    // ----------------- Feature 5: Notifications -----------------
    let notifPollingInterval = null;

    function startNotificationPolling() {
        fetchNotifications();
        if (notifPollingInterval) clearInterval(notifPollingInterval);
        notifPollingInterval = setInterval(fetchNotifications, 15000);
    }

    function fetchNotifications() {
        fetch('/api/notifications')
            .then(res => res.json())
            .then(data => {
                if (!data || !data.notifications) return;
                const badge = document.getElementById('notif-badge');
                const list = document.getElementById('notif-list');

                if (data.unread_count > 0) {
                    badge.style.display = 'flex';
                    badge.textContent = data.unread_count > 9 ? '9+' : data.unread_count;
                } else {
                    badge.style.display = 'none';
                }

                if (data.notifications.length === 0) {
                    list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
                    return;
                }

                list.innerHTML = '';
                data.notifications.forEach(n => {
                    const item = document.createElement('div');
                    item.className = `notif-item ${n.is_read ? '' : 'unread'}`;
                    const timeStr = formatTimeAgoOrLocal(n.created_at);
                    item.innerHTML = `
                    <div class="notif-icon"><i class="fas ${n.icon || 'fa-bell'}"></i></div>
                    <div>
                        <div class="notif-text">${n.message}</div>
                        <div class="notif-time">${timeStr}</div>
                    </div>`;
                    list.appendChild(item);
                });
            });
    }

    // Notification bell toggle
    document.getElementById('notif-bell-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('notif-dropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Mark all read
    document.getElementById('notif-mark-read-btn').addEventListener('click', () => {
        fetch('/api/notifications/read', { method: 'POST' })
            .then(() => {
                document.getElementById('notif-badge').style.display = 'none';
                document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
            });
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notif-dropdown');
        const bell = document.getElementById('notif-bell-btn');
        if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // ----------------- Feature 6: Company Profiles -----------------
    const companyColors = {
        'Google': 'linear-gradient(135deg, #4285f4, #34a853)',
        'Microsoft': 'linear-gradient(135deg, #00a4ef, #7fba00)',
        'Meta': 'linear-gradient(135deg, #0081FB, #00C2FF)',
        'AWS': 'linear-gradient(135deg, #FF9900, #FF6B00)',
        'Netflix': 'linear-gradient(135deg, #E50914, #B20710)',
        'OpenAI': 'linear-gradient(135deg, #10A37F, #00D4AA)',
        'Cisco': 'linear-gradient(135deg, #049FD9, #04629E)',
        'Apple': 'linear-gradient(135deg, #555555, #000000)'
    };

    function fetchCompanies() {
        const grid = document.getElementById('companies-grid');
        grid.innerHTML = '<div style="text-align:center; padding: 3rem; color: var(--text-secondary); grid-column: 1/-1;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i></div>';

        fetch('/api/companies')
            .then(res => res.json())
            .then(data => {
                grid.innerHTML = '';
                if (!data || data.length === 0) {
                    grid.innerHTML = '<div style="text-align:center; padding:3rem; color: var(--text-secondary); grid-column: 1/-1;">No companies found.</div>';
                    return;
                }

                data.forEach(company => {
                    const card = document.createElement('div');
                    card.className = 'company-card';
                    const logo = company.name.charAt(0);
                    const bgColor = companyColors[company.name] || 'linear-gradient(135deg, #6366f1, #8b5cf6)';

                    let cultureHTML = '';
                    (company.culture || []).forEach(c => {
                        cultureHTML += `<span class="culture-tag">${c}</span>`;
                    });

                    let internshipsHTML = '';
                    (company.internships || []).forEach(intern => {
                        internshipsHTML += `
                        <div class="company-intern-item">
                            <div>
                                <span class="intern-title">${intern.title}</span>
                                <div style="font-size: 0.7rem; color: var(--text-secondary);"><i class="fas fa-location-dot" style="margin-right: 0.25rem;"></i>${intern.location} • ${intern.duration}</div>
                            </div>
                            <span class="intern-stipend">${intern.stipend}</span>
                        </div>`;
                    });

                    card.innerHTML = `
                    <div class="company-card-header">
                        <div class="company-logo" style="background: ${bgColor};">${logo}</div>
                        <div>
                            <h3>${company.name}</h3>
                            <span class="company-industry">${company.industry}</span>
                        </div>
                    </div>
                    <div class="company-meta">
                        <span><i class="fas fa-users"></i>${company.size}</span>
                        <span><i class="fas fa-location-dot"></i>${company.hq}</span>
                    </div>
                    <div class="culture-tags">${cultureHTML}</div>
                    <div class="company-internships">
                        <h4><i class="fas fa-briefcase" style="margin-right: 0.35rem;"></i>Open Positions (${company.internships.length})</h4>
                        ${internshipsHTML}
                    </div>`;
                    grid.appendChild(card);
                });
            });
    }

    // ==========================================================================
    // v3.0 PREMIUM SERVICES - JS ENGINES
    // ==========================================================================

    // ----------------- AI Career Path Advisor -----------------
    document.getElementById('roadmap-role-select').addEventListener('change', fetchCareerRoadmap);

    function fetchCareerRoadmap() {
        const role = document.getElementById('roadmap-role-select').value;
        const container = document.getElementById('roadmap-flow-container');
        container.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-blue);"></i>';

        fetch(`/api/career-path?role=${encodeURIComponent(role)}`)
            .then(res => res.json())
            .then(data => {
                container.innerHTML = '';

                // Build the visual nodes connected horizontally
                data.nodes.forEach((node, idx) => {
                    const nodeEl = document.createElement('div');
                    nodeEl.className = `roadmap-node status-${node.status}`;
                    nodeEl.innerHTML = `
                    <div class="roadmap-node-label">${node.label}</div>
                    <div class="roadmap-node-type">${node.type}</div>
                `;
                    container.appendChild(nodeEl);

                    // Add connect arrow if not the last node
                    if (idx < data.nodes.length - 1) {
                        const arrowEl = document.createElement('div');
                        arrowEl.className = 'roadmap-connector-arrow';
                        arrowEl.innerHTML = '<i class="fas fa-chevron-right"></i>';
                        container.appendChild(arrowEl);
                    }
                });

                // Populate recommendations table
                const tbody = document.querySelector('#roadmap-courses-table tbody');
                tbody.innerHTML = '';

                const gaps = data.nodes.filter(n => n.type === 'gap');
                if (gaps.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--accent-green); font-weight:600; padding:1.5rem;"><i class="fas fa-check-circle"></i> No skill gaps detected for this path! You are fully job-ready.</td></tr>';
                    return;
                }

                gaps.forEach(node => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                    <td style="font-weight: 700; color: var(--text-primary);">${node.label}</td>
                    <td>
                        <div style="font-size:0.9rem; color: var(--text-primary); font-weight:600;">${node.course}</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Self-paced syllabus study with project implementation parameters.</div>
                    </td>
                    <td><span class="score-badge" style="background:rgba(245,166,35,0.1); color:#f5a623; border: 1px solid rgba(245,166,35,0.25);">${node.time}</span></td>
                    <td><span class="score-badge" style="background:rgba(255,71,87,0.1); color:#ff4757; border: 1px solid rgba(255,71,87,0.25);">Gap Area</span></td>
                `;
                    tbody.appendChild(tr);
                });
            });
    }

    // ----------------- Smart Job Market Insights -----------------
    function fetchMarketInsights() {
        fetch('/api/market-insights')
            .then(res => res.json())
            .then(data => {
                // Update KPIs
                document.getElementById('market-postings').textContent = data.hiring_pulse.active_postings;
                document.getElementById('market-interviews').textContent = data.hiring_pulse.interviews_today;
                document.getElementById('market-offers').textContent = data.hiring_pulse.offers_released;
                document.getElementById('market-success').textContent = data.hiring_pulse.success_rate;

                // Render Heatmap Tiles
                const heatmap = document.getElementById('market-heatmap-grid');
                heatmap.innerHTML = '';
                data.trending_skills.forEach(item => {
                    const tile = document.createElement('div');
                    let heatClass = 'heat-low';
                    if (item.demand >= 90) heatClass = 'heat-high';
                    else if (item.demand >= 75) heatClass = 'heat-medium';

                    tile.className = `heat-tile ${heatClass}`;
                    tile.innerHTML = `
                    <div class="heat-tile-name">${item.skill}</div>
                    <div class="heat-tile-val">Demand: ${item.demand}% (${item.growth})</div>
                `;
                    heatmap.appendChild(tile);
                });

                // Sector Growth Chart
                const ctxSec = document.getElementById('marketSectorsChart').getContext('2d');
                if (marketSectorsChart) marketSectorsChart.destroy();
                marketSectorsChart = new Chart(ctxSec, {
                    type: 'bar',
                    data: {
                        labels: data.industry_growth.map(d => d.sector),
                        datasets: [{
                            label: 'Hiring Growth Index (%)',
                            data: data.industry_growth.map(d => d.growth),
                            backgroundColor: [
                                'rgba(0, 242, 254, 0.7)',
                                'rgba(155, 81, 224, 0.7)',
                                'rgba(0, 245, 160, 0.7)',
                                'rgba(255, 71, 87, 0.7)',
                                'rgba(245, 166, 35, 0.7)'
                            ],
                            borderWidth: 0,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: { grid: { display: false }, ticks: { color: '#d0d8e5' } },
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#d0d8e5' } }
                        }
                    }
                });

                // Salary distribution chart
                const ctxSal = document.getElementById('marketSalaryChart').getContext('2d');
                if (marketSalaryChart) marketSalaryChart.destroy();
                marketSalaryChart = new Chart(ctxSal, {
                    type: 'line',
                    data: {
                        labels: data.salary_distribution.map(d => d.role),
                        datasets: [
                            {
                                label: 'Minimum Stipend (₹/mo)',
                                data: data.salary_distribution.map(d => d.min),
                                borderColor: 'rgba(255, 71, 87, 0.8)',
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                tension: 0.2
                            },
                            {
                                label: 'Average Stipend (₹/mo)',
                                data: data.salary_distribution.map(d => d.avg),
                                borderColor: 'rgba(0, 242, 254, 0.8)',
                                backgroundColor: 'rgba(0, 242, 254, 0.05)',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.2
                            },
                            {
                                label: 'Maximum Stipend (₹/mo)',
                                data: data.salary_distribution.map(d => d.max),
                                borderColor: 'rgba(0, 245, 160, 0.8)',
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                tension: 0.2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { labels: { color: '#d0d8e5' } }
                        },
                        scales: {
                            x: { grid: { display: false }, ticks: { color: '#d0d8e5' } },
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#d0d8e5' } }
                        }
                    }
                });
                initROICalculator();
            });
    }

    // ----------------- Peer Comparison Analytics -----------------
    function fetchPeerComparison() {
        const container = document.getElementById('peer-comparison-container');
        container.style.display = 'grid';

        fetch('/api/peer-comparison')
            .then(res => res.json())
            .then(data => {
                document.getElementById('percentile-text').textContent = `Top ${data.percentile}%`;

                let msg = '';
                if (data.percentile <= 20) msg = 'Outstanding performance! You are leading the cohort index.';
                else if (data.percentile <= 50) msg = 'Above average bracket. Complete more certifications to hit top 10%.';
                else msg = 'Below median rank. Upskill using missing skill guidelines to boost positioning.';
                document.getElementById('percentile-feedback').textContent = msg;

                // Render Peer Radar Chart
                const ctxPeer = document.getElementById('peerRadarChart').getContext('2d');
                if (peerRadarChart) peerRadarChart.destroy();

                const u = data.user_metrics;
                const c = data.cohort_averages;

                peerRadarChart = new Chart(ctxPeer, {
                    type: 'radar',
                    data: {
                        labels: ['CGPA Index', 'Skills Parsed', 'Projects', 'Certifications', 'Experience (Months)'],
                        datasets: [
                            {
                                label: 'Your Metric',
                                data: [u.cgpa, u.skills, u.projects, u.certs, u.experience],
                                borderColor: 'rgba(0, 242, 254, 1)',
                                backgroundColor: 'rgba(0, 242, 254, 0.2)',
                                borderWidth: 2
                            },
                            {
                                label: 'Cohort Average',
                                data: [c.cgpa, c.skills, c.projects, c.certs, c.experience],
                                borderColor: 'rgba(155, 81, 224, 1)',
                                backgroundColor: 'rgba(155, 81, 224, 0.1)',
                                borderWidth: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: '#d0d8e5' } }
                        },
                        scales: {
                            r: {
                                angleLines: { color: 'rgba(255,255,255,0.05)' },
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                pointLabels: { color: '#d0d8e5', font: { size: 10 } },
                                ticks: { display: false }
                            }
                        }
                    }
                });
            });
    }

    // ----------------- Cover Letter Engine -----------------
    function populateCoverLetterRoles(recommendations) {
        const select = document.getElementById('cover-letter-role-select');
        select.innerHTML = '<option value="">-- Select Target Internship --</option>';
        if (!recommendations || recommendations.length === 0) return;

        recommendations.forEach(rec => {
            const opt = document.createElement('option');
            opt.value = JSON.stringify({ role: rec.title, company: rec.company });
            opt.textContent = `${rec.title} at ${rec.company}`;
            select.appendChild(opt);
        });
    }

    document.getElementById('generate-cover-btn').addEventListener('click', () => {
        const val = document.getElementById('cover-letter-role-select').value;
        if (!val) {
            alert('Please select a target internship first.');
            return;
        }

        const data = JSON.parse(val);
        const btn = document.getElementById('generate-cover-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating';

        fetch('/api/generate-cover-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role_title: data.role,
                company_name: data.company
            })
        })
            .then(res => res.json())
            .then(resData => {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate';

                document.getElementById('cover-letter-result-group').style.display = 'block';
                document.getElementById('builder-cover-letter').value = resData.cover_letter;
            });
    });

    document.getElementById('export-cover-pdf-btn').addEventListener('click', () => {
        const text = document.getElementById('builder-cover-letter').value;
        if (!text.trim()) return;

        // Populate printable print-text block
        document.getElementById('cover-letter-print-text').textContent = text;

        // Hide resume paper during this specific print job
        const originalResumeStyle = document.getElementById('resume-paper-container').style.display;
        document.getElementById('resume-paper-container').style.display = 'none';

        // Show cover letter paper
        document.getElementById('cover-letter-paper-container').style.display = 'block';

        window.print();

        // Restore elements
        document.getElementById('resume-paper-container').style.display = originalResumeStyle;
        document.getElementById('cover-letter-paper-container').style.display = 'none';
    });

    // ----------------- Light/Dark Theme Switcher -----------------
    const themeBtn = document.getElementById('theme-toggle-btn');
    // Ensure default theme is dark as requested; clear any lingering light theme override
    if (localStorage.getItem('theme') === 'light') {
        localStorage.setItem('theme', 'dark');
    }
    document.body.classList.remove('theme-light');
    if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-moon"></i>';

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            if (document.body.classList.contains('theme-light')) {
                document.body.classList.remove('theme-light');
                localStorage.setItem('theme', 'dark');
                themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                document.body.classList.add('theme-light');
                localStorage.setItem('theme', 'light');
                themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            }
        });
    }

    // ----------------- Onboarding Tour -----------------
    const tourSteps = [
        {
            title: "Resume Parser & Employability Score",
            location: "Left Sidebar ➔ Placement Matching ➔ Resume Parser",
            tabId: "student-dashboard",
            targetSelector: "#upload-zone",
            beaconLabel: "Resume Parser",
            text: "Upload your resume (PDF/TXT) here. Our NLP parser and ML Random Forest classifier extract your skills, predict your Employability Score, and generate resume recommendations."
        },
        {
            title: "Interactive Resume Builder",
            location: "Left Sidebar ➔ Resume Builder",
            tabId: "resume-builder-panel",
            targetSelector: "#resume-builder-form",
            beaconLabel: "Resume Builder Form",
            text: "Build and customize your resume with real-time live A4 preview, switch corporate color templates, and generate tailored cover letters for your applications."
        },
        {
            title: "AI Technical Mock Interview Coach",
            location: "Left Sidebar ➔ AI Interview Coach",
            tabId: "mock-interview-panel",
            targetSelector: ".terminal-card",
            beaconLabel: "AI Interview Terminal",
            text: "Practice technical verbal interviews in this terminal. The AI evaluates concept accuracy, detects verbal filler words, and awards verification certificates for scores ≥ 70%."
        },
        {
            title: "Job Market Trends & Intelligence",
            location: "Left Sidebar ➔ Market Insights",
            tabId: "market-insights-panel",
            targetSelector: "#market-insights-panel .grid-container",
            beaconLabel: "Market Intelligence",
            text: "Inspect active technology placement numbers, industry sector distributions, trending skill requirements, and entry-level stipend curves across top tech domains."
        }
    ];

    let currentTourStep = 0;
    let tourActiveTarget = null;

    function startOnboardingTour(force = false) {
        if (!force && localStorage.getItem('tour_completed_v2')) return;

        currentTourStep = 0;
        const overlay = document.getElementById('onboarding-tour-overlay');
        if (overlay) {
            overlay.style.display = 'block';
            showTourStep(0);
        }
    }

    function positionTourCard(target) {
        const card = document.getElementById('tour-card-el');
        if (!card || !target) return;

        const rect = target.getBoundingClientRect();
        const cardWidth = Math.min(380, window.innerWidth - 30);
        card.style.width = `${cardWidth}px`;
        card.style.position = 'fixed';
        card.style.zIndex = '10005';

        const vW = window.innerWidth;
        const vH = window.innerHeight;
        const cardH = card.offsetHeight || 260;

        let left, top;
        let arrowClass = 'arrow-left';

        // 1. Try placing to the right of target if there is room
        if (rect.right + cardWidth + 25 < vW && rect.right > 280) {
            left = rect.right + 20;
            top = Math.max(25, Math.min(vH - cardH - 25, rect.top + (rect.height / 2) - (cardH / 2)));
            arrowClass = 'arrow-left';
        }
        // 2. Try placing below target
        else if (rect.bottom + cardH + 30 < vH && rect.bottom > 0) {
            left = Math.max(300, Math.min(vW - cardWidth - 25, rect.left + (rect.width / 2) - (cardWidth / 2)));
            top = rect.bottom + 16;
            arrowClass = 'arrow-top';
        }
        // 3. Try placing above target
        else if (rect.top - cardH - 30 > 0) {
            left = Math.max(300, Math.min(vW - cardWidth - 25, rect.left + (rect.width / 2) - (cardWidth / 2)));
            top = Math.max(20, rect.top - cardH - 16);
            arrowClass = 'arrow-bottom';
        }
        // 4. Try placing to the left of target (outside sidebar width 280px)
        else if (rect.left - cardWidth - 25 > 280) {
            left = rect.left - cardWidth - 20;
            top = Math.max(25, Math.min(vH - cardH - 25, rect.top + (rect.height / 2) - (cardH / 2)));
            arrowClass = 'arrow-right';
        }
        // Fallback: Safe centered position in workspace
        else {
            left = Math.max(300, Math.min(vW - cardWidth - 25, (vW + 280) / 2 - cardWidth / 2));
            top = Math.max(30, Math.min(vH - cardH - 30, vH / 2 - cardH / 2));
            arrowClass = 'no-arrow';
        }

        card.style.left = `${Math.round(left)}px`;
        card.style.top = `${Math.round(top)}px`;
        card.className = `tour-card ${arrowClass}`;
    }

    // Reposition card on resize or scroll while tour is open
    window.addEventListener('resize', () => {
        const overlay = document.getElementById('onboarding-tour-overlay');
        if (overlay && overlay.style.display !== 'none' && tourActiveTarget) {
            positionTourCard(tourActiveTarget);
        }
    });

    window.addEventListener('scroll', () => {
        const overlay = document.getElementById('onboarding-tour-overlay');
        if (overlay && overlay.style.display !== 'none' && tourActiveTarget) {
            positionTourCard(tourActiveTarget);
        }
    }, true);

    function showTourStep(idx) {
        const step = tourSteps[idx];
        document.getElementById('tour-step-idx').textContent = `Step ${idx + 1} of ${tourSteps.length}`;
        document.getElementById('tour-title-el').textContent = step.title;
        document.getElementById('tour-text-el').textContent = step.text;

        const locText = document.getElementById('tour-location-text');
        if (locText) locText.textContent = step.location;

        // Remove previous spotlights, beacons, and sidebar highlights
        document.querySelectorAll('.tour-spotlight').forEach(el => el.classList.remove('tour-spotlight'));
        document.querySelectorAll('.tour-sidebar-highlight').forEach(el => el.classList.remove('tour-sidebar-highlight'));
        document.querySelectorAll('.tour-locator-beacon').forEach(el => el.remove());

        // Switch to the relevant tab in the UI
        const tabBtn = document.querySelector(`.menu-btn[data-tab="${step.tabId}"]`);
        if (tabBtn) {
            tabBtn.click();
            tabBtn.classList.add('tour-sidebar-highlight');
        }

        // Wait for tab transition and layout
        setTimeout(() => {
            const target = document.querySelector(step.targetSelector) || tabBtn;
            tourActiveTarget = target;
            if (target) {
                target.classList.add('tour-spotlight');

                // Attach pulsating beacon pin
                const beacon = document.createElement('div');
                beacon.className = 'tour-locator-beacon';
                beacon.innerHTML = `<i class="fas fa-crosshairs"></i> ${step.beaconLabel}`;
                
                const computedPos = window.getComputedStyle(target).position;
                if (computedPos === 'static') {
                    target.style.position = 'relative';
                }
                target.appendChild(beacon);

                // Smoothly scroll target into view
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Position card adjacent to target
                positionTourCard(target);
            }
        }, 150);

        document.getElementById('tour-prev-btn').style.display = idx > 0 ? 'inline-block' : 'none';
        document.getElementById('tour-next-btn').textContent = idx === tourSteps.length - 1 ? 'Finish' : 'Next';
    }

    document.getElementById('tour-next-btn').addEventListener('click', () => {
        if (currentTourStep < tourSteps.length - 1) {
            currentTourStep++;
            showTourStep(currentTourStep);
        } else {
            closeTour();
        }
    });

    document.getElementById('tour-prev-btn').addEventListener('click', () => {
        if (currentTourStep > 0) {
            currentTourStep--;
            showTourStep(currentTourStep);
        }
    });

    document.getElementById('tour-skip-btn').addEventListener('click', closeTour);

    const tourBackdrop = document.getElementById('onboarding-tour-backdrop');
    if (tourBackdrop) {
        tourBackdrop.addEventListener('click', closeTour);
    }

    const restartTourBtn = document.getElementById('restart-tour-btn');
    if (restartTourBtn) {
        restartTourBtn.addEventListener('click', () => {
            startOnboardingTour(true);
        });
    }

    function closeTour() {
        document.getElementById('onboarding-tour-overlay').style.display = 'none';
        document.querySelectorAll('.tour-spotlight').forEach(el => el.classList.remove('tour-spotlight'));
        document.querySelectorAll('.tour-sidebar-highlight').forEach(el => el.classList.remove('tour-sidebar-highlight'));
        document.querySelectorAll('.tour-locator-beacon').forEach(el => el.remove());
        tourActiveTarget = null;
        localStorage.setItem('tour_completed_v2', 'true');

        // Return to student dashboard
        const defaultTab = document.querySelector('.menu-btn[data-tab="student-dashboard"]');
        if (defaultTab) defaultTab.click();
    }

    // ----------------- Recruiter Kanban Pipeline -----------------
    const viewTableBtn = document.getElementById('view-mode-table-btn');
    const viewKanbanBtn = document.getElementById('view-mode-kanban-btn');
    const recruiterTableCard = document.getElementById('recruiter-table-card');
    const recruiterKanbanContainer = document.getElementById('recruiter-kanban-container');

    viewTableBtn.addEventListener('click', () => {
        viewTableBtn.classList.add('active');
        viewTableBtn.classList.replace('btn-secondary', 'btn-primary');
        viewKanbanBtn.classList.remove('active');
        viewKanbanBtn.classList.replace('btn-primary', 'btn-secondary');

        recruiterTableCard.style.display = 'block';
        recruiterKanbanContainer.style.display = 'none';
        document.getElementById('kanban-bulk-actions').style.display = 'none';
    });

    viewKanbanBtn.addEventListener('click', () => {
        viewKanbanBtn.classList.add('active');
        viewKanbanBtn.classList.replace('btn-secondary', 'btn-primary');
        viewTableBtn.classList.remove('active');
        viewTableBtn.classList.replace('btn-primary', 'btn-secondary');

        recruiterTableCard.style.display = 'none';
        recruiterKanbanContainer.style.display = 'flex';
        updateBulkActionsDisplay();
    });

    function renderRecruiterKanban(candidates) {
        const stages = ['Screening', 'Interviewing', 'Shortlisted', 'Offered', 'Rejected'];

        stages.forEach(stage => {
            const colWrapper = document.getElementById(`kanban-${stage.toLowerCase()}-cards`);
            colWrapper.innerHTML = '';

            const list = candidates.filter(c => c.status === stage);

            // Update count badges
            colWrapper.parentElement.querySelector('.count-badge').textContent = list.length;

            if (list.length === 0) {
                colWrapper.innerHTML = `<div style="text-align:center; padding:1.5rem; font-size:0.75rem; color:var(--text-secondary); border: 1px dashed rgba(255,255,255,0.02); border-radius:8px;">Empty</div>`;
                return;
            }

            list.forEach(c => {
                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.draggable = true;

                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', c.student_email);
                    e.dataTransfer.setData('internship-id', c.internship_id);
                    card.classList.add('dragging');
                });

                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                });

                const gradeHTML = c.interview_score !== null ?
                    `<span style="color:var(--accent-green); font-weight:700;">Grade: ${c.interview_score}</span>` :
                    `<span style="color:var(--text-secondary);">No Mock</span>`;

                card.innerHTML = `
                    <div class="kanban-card-title">${c.student_name}</div>
                    <div class="kanban-card-role">${c.internship_title}</div>
                    <div class="kanban-card-meta">
                        <span class="score-badge">${c.match_score}% Match</span>
                        ${gradeHTML}
                    </div>
                `;

                colWrapper.appendChild(card);
            });
        });

        initKanbanDragAndDrop();
    }

    function initKanbanDragAndDrop() {
        const columns = document.querySelectorAll('.kanban-column');
        columns.forEach(col => {
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            col.addEventListener('drop', (e) => {
                e.preventDefault();
                const email = e.dataTransfer.getData('text/plain');
                const intIdStr = e.dataTransfer.getData('internship-id');
                const newStatus = col.dataset.status;

                if (email && intIdStr) {
                    const intId = parseInt(intIdStr);
                    updateCandidateStatus(email, intId, newStatus);
                }
            });
        });
    }

    // ----------------- Candidate Comparison Modal -----------------
    const comparisonModal = document.getElementById('candidate-comparison-modal');
    const compareCloseBtn = document.getElementById('compare-modal-close-btn');

    document.getElementById('comparison-toggle-btn').addEventListener('click', () => {
        comparisonModal.style.display = 'block';
        updateComparisonChart();
    });

    compareCloseBtn.addEventListener('click', () => {
        comparisonModal.style.display = 'none';
    });

    document.getElementById('compare-candidate-a').addEventListener('change', updateComparisonChart);
    document.getElementById('compare-candidate-b').addEventListener('change', updateComparisonChart);

    function populateComparisonSelects(candidates) {
        const selectA = document.getElementById('compare-candidate-a');
        const selectB = document.getElementById('compare-candidate-b');

        selectA.innerHTML = '<option value="">-- Select Candidate A --</option>';
        selectB.innerHTML = '<option value="">-- Select Candidate B --</option>';

        candidates.forEach(c => {
            const optA = document.createElement('option');
            optA.value = c.student_email;
            optA.textContent = `${c.student_name} (${c.internship_title})`;
            selectA.appendChild(optA);

            const optB = document.createElement('option');
            optB.value = c.student_email;
            optB.textContent = `${c.student_name} (${c.internship_title})`;
            selectB.appendChild(optB);
        });
    }

    function updateComparisonChart() {
        const emailA = document.getElementById('compare-candidate-a').value;
        const emailB = document.getElementById('compare-candidate-b').value;

        const candidateA = currentCandidatesList.find(c => c.student_email === emailA);
        const candidateB = currentCandidatesList.find(c => c.student_email === emailB);

        const summary = document.getElementById('compare-summary-metrics');
        summary.innerHTML = '';

        const datasets = [];

        if (candidateA) {
            datasets.push({
                label: candidateA.student_name,
                data: [
                    candidateA.match_score,
                    candidateA.interview_score || 0,
                    candidateA.technical_score || 0,
                    candidateA.communication_score || 0
                ],
                borderColor: 'rgba(0, 242, 254, 1)',
                backgroundColor: 'rgba(0, 242, 254, 0.15)',
                borderWidth: 2
            });
            summary.innerHTML += `<div style="padding:0.35rem 0; border-bottom:1px solid var(--border-color);"><strong>${candidateA.student_name}</strong>: Match Index ${candidateA.match_score}%, Interview Grade ${candidateA.interview_score || 'N/A'}/100</div>`;
        }

        if (candidateB) {
            datasets.push({
                label: candidateB.student_name,
                data: [
                    candidateB.match_score,
                    candidateB.interview_score || 0,
                    candidateB.technical_score || 0,
                    candidateB.communication_score || 0
                ],
                borderColor: 'rgba(155, 81, 224, 1)',
                backgroundColor: 'rgba(155, 81, 224, 0.15)',
                borderWidth: 2
            });
            summary.innerHTML += `<div style="padding:0.35rem 0;"><strong>${candidateB.student_name}</strong>: Match Index ${candidateB.match_score}%, Interview Grade ${candidateB.interview_score || 'N/A'}/100</div>`;
        }

        const ctx = document.getElementById('candidateCompareChart').getContext('2d');
        if (candidateCompareChart) candidateCompareChart.destroy();

        candidateCompareChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Match Score', 'Interview Score', 'Technical Accuracy', 'Clarity Score'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#d0d8e5' } }
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.05)' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        pointLabels: { color: '#d0d8e5', font: { size: 11 } },
                        ticks: { display: false }
                    }
                }
            }
        });
    }

    // ----------------- Bulk Select Action -----------------
    const selectAllCheckbox = document.getElementById('select-all-candidates-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const checked = selectAllCheckbox.checked;
            document.querySelectorAll('.candidate-checkbox').forEach(cb => {
                cb.checked = checked;
            });
            updateBulkActionsDisplay();
        });
    }

    function updateBulkActionsDisplay() {
        const checkedBoxes = document.querySelectorAll('.candidate-checkbox:checked');
        const count = checkedBoxes.length;
        document.getElementById('bulk-select-count').textContent = count;

        const bulkDiv = document.getElementById('kanban-bulk-actions');
        if (count > 0) {
            bulkDiv.style.display = 'flex';
        } else {
            bulkDiv.style.display = 'none';
        }
    }

    document.getElementById('bulk-apply-btn').addEventListener('click', () => {
        const newStatus = document.getElementById('bulk-status-select').value;
        if (!newStatus) {
            alert('Please select a target stage.');
            return;
        }

        const checkedBoxes = document.querySelectorAll('.candidate-checkbox:checked');
        const emails = [];
        const internshipIds = [];

        checkedBoxes.forEach(cb => {
            emails.push(cb.dataset.email);
            internshipIds.push(parseInt(cb.dataset.id));
        });

        fetch('/api/apply/bulk_update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emails: emails,
                internship_ids: internshipIds,
                status: newStatus
            })
        })
            .then(res => res.json())
            .then(data => {
                fetchRecruiterCandidates();
            });
    });

    // ----------------- Certificates History Table & Verification Modal -----------------
    const certModal = document.getElementById('certificate-modal');
    const certModalClose = document.getElementById('cert-modal-close-btn');

    certModalClose.addEventListener('click', () => {
        certModal.style.display = 'none';
    });

    document.getElementById('print-cert-btn').addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Verification Certificate</title>
                <style>
                    body { margin: 0; padding: 40px; background: #fff; }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                ${document.getElementById('certificate-print-area').outerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
    });

    function renderInterviewHistoryTable(sessions) {
        const tableWrap = document.getElementById('interview-history-table-wrap');
        const tbody = document.querySelector('#interview-sessions-table tbody');
        tbody.innerHTML = '';

        if (!sessions || sessions.length === 0) {
            tableWrap.style.display = 'none';
            return;
        }

        tableWrap.style.display = 'block';

        sessions.forEach(session => {
            const tr = document.createElement('tr');

            const dObj = parseUTCDate(session.completed_at);
            const date = dObj ? dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (session.completed_at || "N/A");

            const certBtn = session.average_score >= 70 ?
                `<button class="btn-primary cert-view-btn" data-name="${currentUserSession.name}" data-score="${session.average_score}" data-role="${session.role}" data-date="${date}" style="padding:0.25rem 0.5rem; font-size:0.75rem; border-radius:6px; border:none; cursor:pointer;"><i class="fas fa-certificate"></i> View Certificate</button>` :
                `<span style="color:var(--text-secondary); font-size:0.75rem;"><i class="fas fa-lock" style="margin-right:0.25rem;"></i>Requires >=70%</span>`;

            tr.innerHTML = `
                <td style="font-weight: 600; color: var(--text-primary);">${session.role}</td>
                <td style="color:var(--text-secondary); font-size:0.8rem;">${date}</td>
                <td><span class="score-badge" style="color:var(--accent-green); border-color:rgba(0,245,160,0.2);">${session.technical_score}%</span></td>
                <td><span class="score-badge" style="color:var(--accent-purple); border-color:rgba(155,81,224,0.2);">${session.communication_score}%</span></td>
                <td><span class="score-badge" style="font-weight:700;">${session.average_score}%</span></td>
                <td>${certBtn}</td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.cert-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('cert-student-name').textContent = btn.dataset.name;
                document.getElementById('cert-score-val').textContent = `${btn.dataset.score}%`;
                document.getElementById('cert-role-val').textContent = btn.dataset.role;
                document.getElementById('cert-date-val').textContent = `Verified on ${btn.dataset.date.split(',')[0]}`;
                document.getElementById('certificate-modal').style.display = 'block';
            });
        });
    }

    // ==========================================================================
    // v3.1 SUBSYSTEMS - SANDBOX, SCHEDULER, EXPORTER, CHATBOT ENGINE
    // ==========================================================================

    // ----------------- Mock Coding Sandbox -----------------
    const codingProblems = {
        two_sum: {
            description: `Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.<br><br>
You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.<br><br>
<strong>Example 1:</strong><br>
Input: nums = [2,7,11,15], target = 9<br>
Output: [0,1]`,
            signature: "def two_sum(nums, target):\n    # Write python logic here\n    pass",
            template: "def two_sum(nums, target):\n    # TODO: Implement\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []"
        },
        fizzbuzz: {
            description: `Given an integer <code>n</code>, return <em>a string array answer (1-indexed) where</em>:<br><br>
- <code>answer[i] == "Fizz"</code> if <code>i</code> is divisible by 3.<br>
- <code>answer[i] == "Buzz"</code> if <code>i</code> is divisible by 5.<br>
- <code>answer[i] == "FizzBuzz"</code> if <code>i</code> is divisible by 3 and 5.<br>
- <code>answer[i] == str(i)</code> if none of the above conditions are true.`,
            signature: "def fizzbuzz(n):\n    # Write python logic here\n    pass",
            template: "def fizzbuzz(n):\n    # TODO: Implement\n    res = []\n    for i in range(1, n + 1):\n        if i % 3 == 0 and i % 5 == 0:\n            res.append('FizzBuzz')\n        elif i % 3 == 0:\n            res.append('Fizz')\n        elif i % 5 == 0:\n            res.append('Buzz')\n        else:\n            res.append(str(i))\n    return res"
        },
        palindrome: {
            description: `A phrase is a <strong>palindrome</strong> if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.<br><br>
Given a string <code>s</code>, return <code>true</code> if it is a palindrome, or <code>false</code> otherwise.`,
            signature: "def is_palindrome(s):\n    # Write python logic here\n    pass",
            template: "def is_palindrome(s):\n    # TODO: Implement\n    clean = [c.lower() for c in s if c.isalnum()]\n    return clean == clean[::-1]"
        }
    };

    function fetchSandboxProblem() {
        const problemId = document.getElementById('sandbox-problem-select').value;
        const problem = codingProblems[problemId];

        document.getElementById('sandbox-problem-description').innerHTML = problem.description;
        document.getElementById('sandbox-expected-signature').textContent = problem.signature;
        document.getElementById('sandbox-code-editor').value = problem.template;

        document.getElementById('sandbox-console-log').textContent = '';
        document.getElementById('sandbox-run-status').textContent = '';
    }

    const selectProb = document.getElementById('sandbox-problem-select');
    if (selectProb) {
        selectProb.addEventListener('change', fetchSandboxProblem);
    }

    const runCodeBtn = document.getElementById('sandbox-run-btn');
    if (runCodeBtn) {
        runCodeBtn.addEventListener('click', () => {
            const problemId = document.getElementById('sandbox-problem-select').value;
            const code = document.getElementById('sandbox-code-editor').value;
            const statusEl = document.getElementById('sandbox-run-status');
            const logEl = document.getElementById('sandbox-console-log');

            runCodeBtn.disabled = true;
            runCodeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing';
            statusEl.textContent = '';
            logEl.textContent = 'Running tests in sandbox...';

            fetch('/api/sandbox/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problem_id: problemId, code: code })
            })
                .then(res => res.json())
                .then(data => {
                    runCodeBtn.disabled = false;
                    runCodeBtn.innerHTML = '<i class="fas fa-play"></i> Run Code';

                    logEl.textContent = data.output;
                    if (data.passed) {
                        statusEl.textContent = 'PASS';
                        statusEl.style.color = 'var(--accent-green)';
                    } else {
                        statusEl.textContent = 'FAIL';
                        statusEl.style.color = 'var(--accent-red)';
                    }
                })
                .catch(err => {
                    runCodeBtn.disabled = false;
                    runCodeBtn.innerHTML = '<i class="fas fa-play"></i> Run Code';
                    logEl.textContent = `Error: ${err.message}`;
                    statusEl.textContent = 'ERROR';
                    statusEl.style.color = 'var(--accent-red)';
                });
        });
    }

    // ----------------- Recruiter Interview Scheduler -----------------
    const slotForm = document.getElementById('recruiter-post-slot-form');
    if (slotForm) {
        slotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = document.getElementById('slot-date-input').value;
            const time = document.getElementById('slot-time-input').value;
            const name = document.getElementById('slot-interviewer-input').value;

            fetch('/api/scheduler/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot_date: date,
                    slot_time: time,
                    interviewer_name: name
                })
            })
                .then(res => res.json())
                .then(data => {
                    slotForm.reset();
                    fetchRecruiterSlots();
                });
        });
    }

    function fetchRecruiterSlots() {
        const tbody = document.querySelector('#recruiter-slots-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading slots...</td></tr>';

        fetch('/api/scheduler/slots')
            .then(res => res.json())
            .then(data => {
                tbody.innerHTML = '';
                if (data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">No slots created yet. Use the form above to add slots.</td></tr>';
                    return;
                }

                data.forEach(slot => {
                    const tr = document.createElement('tr');
                    const bookedCol = slot.booked_by_student_email ? `<span style="color: var(--text-primary);">${slot.booked_by_student_email}</span>` : '<span style="color:var(--text-secondary);">Unbooked</span>';
                    const statusCol = slot.status === 'Booked' ?
                        `<span class="score-badge" style="color:var(--accent-green); border-color:rgba(0,245,160,0.25);">Booked</span>` :
                        `<span class="score-badge" style="color:var(--accent-blue); border-color:rgba(0,242,254,0.25);">Available</span>`;

                    tr.innerHTML = `
                    <td style="color: var(--text-primary); font-weight:600;">${formatFriendlyDate(slot.slot_date)}</td>
                    <td>${slot.slot_time}</td>
                    <td>${slot.interviewer_name}</td>
                    <td>${bookedCol}</td>
                    <td>${statusCol}</td>
                `;
                    tbody.appendChild(tr);
                });
            });
    }

    // ----------------- Student Interview Booking Scheduler -----------------
    function fetchStudentSlots() {
        const grid = document.getElementById('student-slots-grid');
        if (!grid) return;
        grid.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:1.5rem; color:var(--accent-blue);"></i>';

        fetch('/api/scheduler/slots')
            .then(res => res.json())
            .then(data => {
                grid.innerHTML = '';
                document.getElementById('student-scheduler-card').style.display = 'block';

                if (data.length === 0) {
                    grid.innerHTML = '<div style="color:var(--text-secondary); font-size:0.85rem;">No technical assessment slots available currently. Check back later!</div>';
                    return;
                }

                data.forEach(slot => {
                    const card = document.createElement('div');
                    card.className = 'scheduler-slot-card';

                    const isBookedByMe = slot.booked_by_student_email === currentUserSession.email;
                    let actionBtnHTML = '';

                    if (slot.status === 'Booked') {
                        if (isBookedByMe) {
                            actionBtnHTML = `<button class="btn-primary" style="width:100%; font-size:0.75rem; background:var(--accent-green); border:none;" disabled><i class="fas fa-check-circle"></i> Booked by You</button>`;
                        } else {
                            actionBtnHTML = `<button class="btn-secondary" style="width:100%; font-size:0.75rem;" disabled>Booked</button>`;
                        }
                    } else {
                        actionBtnHTML = `<button class="btn-primary book-slot-btn" data-id="${slot.id}" style="width:100%; font-size:0.75rem;"><i class="fas fa-calendar-plus"></i> Reserve Slot</button>`;
                    }

                    card.innerHTML = `
                    <div class="scheduler-slot-date"><i class="fas fa-calendar-day" style="margin-right:0.35rem; color:var(--accent-blue);"></i>${formatFriendlyDate(slot.slot_date)}</div>
                    <div class="scheduler-slot-time">${slot.slot_time}</div>
                    <div class="scheduler-slot-interviewer"><i class="fas fa-user-tie" style="margin-right:0.35rem;"></i>${slot.interviewer_name}</div>
                    <div style="margin-top:0.5rem;">${actionBtnHTML}</div>
                `;
                    grid.appendChild(card);
                });

                document.querySelectorAll('.book-slot-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const slotId = parseInt(btn.dataset.id);
                        btn.disabled = true;
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking';

                        fetch('/api/scheduler/book', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ slot_id: slotId })
                        })
                            .then(res => res.json())
                            .then(data => {
                                fetchStudentSlots();
                            });
                    });
                });
            });
    }

    // ----------------- Floating AI Assistant Chatbot -----------------
    const chatTrigger = document.getElementById('chatbot-float-trigger');
    const chatWindow = document.getElementById('chatbot-window');
    const chatClose = document.getElementById('chatbot-close-btn');
    const chatSend = document.getElementById('chatbot-send-btn');
    const chatInput = document.getElementById('chatbot-input-el');
    const chatBody = document.getElementById('chatbot-chat-body');

    if (chatTrigger) {
        chatTrigger.addEventListener('click', () => {
            if (chatWindow.style.display === 'none') {
                chatWindow.style.display = 'flex';
                chatTrigger.style.transform = 'scale(0.9) rotate(45deg)';
            } else {
                chatWindow.style.display = 'none';
                chatTrigger.style.transform = 'none';
            }
        });

        chatClose.addEventListener('click', () => {
            chatWindow.style.display = 'none';
            chatTrigger.style.transform = 'none';
        });

        chatSend.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }

    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';

        // Append user bubble
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-msg user-msg';
        userDiv.textContent = text;
        chatBody.appendChild(userDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Typing placeholder
        const typeDiv = document.createElement('div');
        typeDiv.className = 'chat-msg ai-msg';
        typeDiv.style.alignSelf = 'flex-start';
        typeDiv.style.background = 'rgba(255,255,255,0.03)';
        typeDiv.style.border = '1px solid var(--border-color)';
        typeDiv.style.padding = '0.6rem 0.8rem';
        typeDiv.style.borderRadius = '10px';
        typeDiv.style.fontSize = '0.8rem';
        typeDiv.style.maxWidth = '85%';
        typeDiv.style.color = '#e2e8f0';
        typeDiv.style.lineHeight = '1.4';
        typeDiv.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Coach typing...';
        chatBody.appendChild(typeDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        fetch('/api/chatbot/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text })
        })
            .then(res => res.json())
            .then(data => {
                typeDiv.remove();

                const replyDiv = document.createElement('div');
                replyDiv.className = 'chat-msg ai-msg';
                replyDiv.style.alignSelf = 'flex-start';
                replyDiv.style.background = 'rgba(255,255,255,0.03)';
                replyDiv.style.border = '1px solid var(--border-color)';
                replyDiv.style.padding = '0.6rem 0.8rem';
                replyDiv.style.borderRadius = '10px';
                replyDiv.style.fontSize = '0.8rem';
                replyDiv.style.maxWidth = '85%';
                replyDiv.style.color = '#e2e8f0';
                replyDiv.style.lineHeight = '1.4';
                replyDiv.style.whiteSpace = 'pre-wrap';
                replyDiv.textContent = data.reply;

                chatBody.appendChild(replyDiv);
                chatBody.scrollTop = chatBody.scrollHeight;
            });
    }

    // ----------------- University Director Exporter -----------------
    const exportBtn = document.getElementById('export-cohort-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.location.href = '/api/university/export';
        });
    }
});
