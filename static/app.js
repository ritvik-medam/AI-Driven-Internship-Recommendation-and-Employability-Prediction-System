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
            showAuthPortal();
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        });
    });

    // Global helper helper
    window.fillDemoAccount = function(email, password) {
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;
    };

    // ----------------- Tab Navigation -----------------
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.tab;
            
            menuButtons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'employer-panel') {
                fetchRecruiterCandidates();
            } else if (targetId === 'university-panel') {
                fetchUniversityDashboard();
            } else if (targetId === 'resume-builder-panel') {
                loadResumeBuilderData();
            } else if (targetId === 'my-applications-panel') {
                fetchMyApplications();
            } else if (targetId === 'leaderboard-panel') {
                fetchLeaderboard();
            } else if (targetId === 'companies-panel') {
                fetchCompanies();
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
        })
        .catch(err => {
            uploadLoader.style.display = 'none';
            alert(`Parsing Failed: ${err.message}`);
            fileLabel.textContent = 'Upload or drag resume (PDF, TXT)';
        });
    }

    function renderStudentResults(data) {
        const profile = data.student_profile;
        const critique = data.critique;

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

        // Gauge values
        const score = data.employability_score;
        const progressCircle = document.querySelector('.gauge-progress');
        const offset = 440 - (score / 100) * 440;
        progressCircle.style.strokeDashoffset = offset;
        document.getElementById('gauge-score-value').textContent = `${score}%`;
        
        const readinessBadge = document.getElementById('readiness-badge');
        readinessBadge.textContent = `${data.placement_readiness} Readiness`;
        readinessBadge.className = 'badge-readiness ' + data.placement_readiness.toLowerCase();

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

        // Placement Recommendations table
        const recomTableBody = document.querySelector('#recommendation-table tbody');
        recomTableBody.innerHTML = '';
        data.recommendations.forEach(rec => {
            const tr = document.createElement('tr');
            const reqSkills = rec.required_skills.split(',');
            let skillsHTML = '';
            reqSkills.forEach(sk => {
                const sClean = sk.trim().toLowerCase();
                const matched = profile.skills.map(s => s.toLowerCase()).includes(sClean);
                const cls = matched ? 'skill-tag matched' : 'skill-tag missing';
                const icon = matched ? 'fa-check' : 'fa-triangle-exclamation';
                skillsHTML += `<span class="${cls}"><i class="fas ${icon}"></i> ${sk.trim()}</span> `;
            });

            tr.innerHTML = `
                <td style="font-weight: 600;">
                    <div style="font-size: 0.95rem; color: #fff;">${rec.title}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${rec.company}</div>
                </td>
                <td><span class="score-badge">${rec.match_score}%</span></td>
                <td><div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">${skillsHTML}</div></td>
                <td>
                    <div style="font-size: 0.8rem; color: #fff;"><i class="fas fa-map-marker-alt"></i> ${rec.location}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);"><i class="fas fa-wallet"></i> ${rec.stipend}</div>
                </td>
                <td>
                    <button class="btn-primary apply-btn" data-id="${rec.id}" data-score="${rec.match_score}">
                        <i class="fas fa-paper-plane"></i> Apply
                    </button>
                </td>
            `;
            recomTableBody.appendChild(tr);
        });

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

        document.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                applyForInternship(btn, btn.dataset.id, btn.dataset.score);
            });
        });

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
            }
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
                <div style="font-size:0.8rem; color: var(--text-secondary); line-height: 1.4;"><span style="color:#fff; font-weight:500;">Critique & Grammar:</span> ${data.feedback}</div>
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
            line.innerHTML = `<span class="terminal-prompt">${currentUserSession.name.toLowerCase().replace(' ', '')}@rvuniversity:~$</span> <span style="color:#fff;">${text}</span>`;
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
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Syncing applicant list...</td></tr>';

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
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No active applications in the queue.</td></tr>';
                return;
            }

            data.forEach(c => {
                const tr = document.createElement('tr');
                const cleanDateStr = c.applied_at ? c.applied_at.replace(" ", "T") : "";
                const dObj = new Date(cleanDateStr);
                const date = isNaN(dObj.getTime()) ? (c.applied_at || "N/A") : dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                const mockGrade = c.interview_score !== null ? 
                    `<span class="clickable-score score-badge" data-email="${c.student_email}" data-role="${c.internship_title}" style="color:var(--accent-green); border-color:rgba(0,245,160,0.3); cursor:pointer;">${c.interview_score}/100</span>` : 
                    '<span style="color:var(--text-secondary); font-size:0.75rem;">Not Taken</span>';
                
                const statusOptions = ['Screening', 'Interviewing', 'Shortlisted', 'Offered', 'Rejected'];
                let optionsHTML = '';
                statusOptions.forEach(opt => {
                    const sel = opt === c.status ? 'selected' : '';
                    optionsHTML += `<option value="${opt}" ${sel}>${opt}</option>`;
                });

                tr.innerHTML = `
                    <td><input type="checkbox" class="candidate-checkbox" data-email="${c.student_email}" data-id="${c.internship_id}"></td>
                    <td style="font-weight:600;">
                        <div style="color: #fff;">${c.student_name}</div>
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
        fetch(`/api/interview/transcript?email=${email}&role=${role}`)
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
                    <div><strong>Completed At:</strong> ${d.completed_at ? new Date(d.completed_at.replace(" ", "T")).toLocaleString() : "N/A"}</div>
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

                const cleanDate = app.applied_at ? app.applied_at.replace(' ', 'T') : '';
                const dateObj = new Date(cleanDate);
                const dateStr = isNaN(dateObj.getTime()) ? (app.applied_at || 'N/A') : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

    // ----------------- Feature 4: Leaderboard -----------------
    function fetchLeaderboard() {
        const tbody = document.querySelector('#leaderboard-table tbody');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading rankings...</td></tr>';

        fetch('/api/leaderboard')
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">No student profiles found.</td></tr>';
                return;
            }

            data.forEach(entry => {
                const tr = document.createElement('tr');
                const isMe = currentUserSession && entry.email === currentUserSession.email;
                if (isMe) tr.className = 'lb-highlight-row';

                let rankClass = 'rank-other';
                if (entry.rank === 1) rankClass = 'rank-1';
                else if (entry.rank === 2) rankClass = 'rank-2';
                else if (entry.rank === 3) rankClass = 'rank-3';

                let badgesHTML = '';
                (entry.badges || []).forEach(b => {
                    badgesHTML += `<span class="lb-badge" style="background: ${b.color}15; color: ${b.color}; border: 1px solid ${b.color}30;"><i class="fas ${b.icon}"></i> ${b.label}</span>`;
                });

                tr.innerHTML = `
                    <td>
                        <div class="rank-badge ${rankClass}">${entry.rank}</div>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #fff;">${entry.name}${isMe ? ' <span style="color: var(--accent-blue); font-size: 0.7rem;">(You)</span>' : ''}</div>
                        <div style="font-size: 0.72rem; color: var(--text-secondary);">${entry.email}</div>
                    </td>
                    <td style="font-weight: 600; color: var(--accent-green);">${entry.cgpa || 'N/A'}</td>
                    <td>${entry.skills_count} skills</td>
                    <td>
                        <div class="lb-score-bar">
                            <div class="lb-score-track"><div class="lb-score-fill" style="width: ${entry.score}%;"></div></div>
                            <span class="lb-score-val">${entry.score}</span>
                        </div>
                    </td>
                    <td>${badgesHTML || '<span style="color: var(--text-secondary); font-size: 0.75rem;">None yet</span>'}</td>`;
                tbody.appendChild(tr);
            });
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
                const cleanDate = n.created_at ? n.created_at.replace(' ', 'T') : '';
                const dObj = new Date(cleanDate);
                const timeStr = isNaN(dObj.getTime()) ? '' : dObj.toLocaleString();
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
                    <td style="font-weight: 700; color: #fff;">${node.label}</td>
                    <td>
                        <div style="font-size:0.9rem; color:#fff; font-weight:600;">${node.course}</div>
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
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('theme-light');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
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

    // ----------------- Onboarding Tour -----------------
    const tourSteps = [
        {
            title: "Resume Parser & Analytics",
            text: "Upload your resume PDF to calculate placement readiness scores and job matches instantly.",
            elementId: "upload-zone"
        },
        {
            title: "Interactive Resume Builder",
            text: "Generate premium corporate resume templates or craft matching cover letters.",
            elementId: "resume-builder-panel"
        },
        {
            title: "AI Interview Practice",
            text: "Prepare with realistic verbal mock assessments and review clarity rating graphs.",
            elementId: "mock-interview-panel"
        },
        {
            title: "Job Market Trends",
            text: "Inspect real-time skill demand heatmaps and entry-level stipend curves.",
            elementId: "market-insights-panel"
        },
        {
            title: "Employability Leaderboard",
            text: "Check rankings and earn polyglot, scholar, or interview-ready badges.",
            elementId: "leaderboard-panel"
        }
    ];

    let currentTourStep = 0;
    
    function startOnboardingTour() {
        if (localStorage.getItem('tour_completed')) return;
        
        currentTourStep = 0;
        document.getElementById('onboarding-tour-overlay').style.display = 'flex';
        showTourStep(0);
    }
    
    function showTourStep(idx) {
        const step = tourSteps[idx];
        document.getElementById('tour-step-idx').textContent = `Step ${idx + 1} of ${tourSteps.length}`;
        document.getElementById('tour-title-el').textContent = step.title;
        document.getElementById('tour-text-el').textContent = step.text;
        
        // Remove previous spotlight class
        document.querySelectorAll('.tour-spotlight').forEach(el => el.classList.remove('tour-spotlight'));
        
        // Target spotlight highlight
        const target = document.getElementById(step.elementId) || document.querySelector(`[data-tab="${step.elementId}"]`);
        if (target) {
            target.classList.add('tour-spotlight');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
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
    
    function closeTour() {
        document.getElementById('onboarding-tour-overlay').style.display = 'none';
        document.querySelectorAll('.tour-spotlight').forEach(el => el.classList.remove('tour-spotlight'));
        localStorage.setItem('tour_completed', 'true');
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
            
            const cleanDateStr = session.completed_at ? session.completed_at.replace(" ", "T") : "";
            const dObj = new Date(cleanDateStr);
            const date = isNaN(dObj.getTime()) ? (session.completed_at || "N/A") : dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            const certBtn = session.average_score >= 70 ? 
                `<button class="btn-primary cert-view-btn" data-name="${currentUserSession.name}" data-score="${session.average_score}" data-role="${session.role}" data-date="${date}" style="padding:0.25rem 0.5rem; font-size:0.75rem; border-radius:6px; border:none; cursor:pointer;"><i class="fas fa-certificate"></i> View Certificate</button>` :
                `<span style="color:var(--text-secondary); font-size:0.75rem;"><i class="fas fa-lock" style="margin-right:0.25rem;"></i>Requires >=70%</span>`;
                
            tr.innerHTML = `
                <td style="font-weight: 600; color: #fff;">${session.role}</td>
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
                const bookedCol = slot.booked_by_student_email ? `<span style="color:#fff;">${slot.booked_by_student_email}</span>` : '<span style="color:var(--text-secondary);">Unbooked</span>';
                const statusCol = slot.status === 'Booked' ? 
                    `<span class="score-badge" style="color:var(--accent-green); border-color:rgba(0,245,160,0.25);">Booked</span>` :
                    `<span class="score-badge" style="color:var(--accent-blue); border-color:rgba(0,242,254,0.25);">Available</span>`;
                    
                tr.innerHTML = `
                    <td style="color:#fff; font-weight:600;">${slot.slot_date}</td>
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
                    <div class="scheduler-slot-date">${slot.slot_date}</div>
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
