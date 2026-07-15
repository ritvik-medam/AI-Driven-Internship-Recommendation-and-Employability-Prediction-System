document.addEventListener('DOMContentLoaded', () => {
    // Left navigation tabs
    const menuButtons = document.querySelectorAll('.menu-btn');
    const panels = document.querySelectorAll('.dashboard-panel');
    
    // File upload elements
    const uploadZone = document.getElementById('upload-zone');
    const resumeInput = document.getElementById('resume-input');
    const fileLabel = document.getElementById('file-label');
    const uploadLoader = document.getElementById('upload-loader');
    
    // Student Hub Dynamic Panels
    const profilePlaceholder = document.getElementById('profile-placeholder');
    const critiqueReportCard = document.getElementById('critique-report-card');
    const profileDetailedContainer = document.getElementById('profile-detailed-container');
    const placementsTableContainer = document.getElementById('placements-table-container');
    const miniReadinessSec = document.getElementById('mini-readiness-sec');

    // Mock Interview Elements
    const startInterviewBtn = document.getElementById('start-interview-btn');
    const roleSelect = document.getElementById('interview-role-select');
    const terminalBody = document.getElementById('terminal-body');
    const terminalInput = document.getElementById('terminal-input-el');
    const terminalSubmitBtn = document.getElementById('terminal-submit-btn');
    const terminalPromptStr = document.getElementById('terminal-prompt-str');
    
    // Hands-free controls
    const micBtn = document.getElementById('mic-btn');
    const speakerBtn = document.getElementById('speaker-btn');
    const replayBtn = document.getElementById('replay-btn');

    // Recruiter Modal
    const transcriptModal = document.getElementById('transcript-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Charts
    let readinessChart = null;
    let forecastingChart = null;

    // Student profile storage
    let currentStudentProfile = null;
    let currentRecommendations = [];
    
    // Interview State variables
    let isInterviewRunning = false;
    let interviewRole = "";
    let currentQuestionIndex = 0;
    let currentQuestionText = "";
    let isWaitingForNext = false;
    let nextQuestionText = "";
    let isInterviewFinished = false;

    // Audio Speech synthesis (TTS) & recognition (STT) setup
    let isVoiceOutputEnabled = true;
    let recognition = null;
    let isRecordingInput = false;

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
            const transcript = e.results[0][0].transcript;
            terminalInput.value = transcript;
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
        micBtn.style.display = 'none'; // Hide if browser lacks STT support
        console.log("Speech recognition not supported in this browser.");
    }

    // Toggle Speak Output (TTS)
    speakerBtn.addEventListener('click', () => {
        speakerBtn.classList.toggle('active');
        isVoiceOutputEnabled = speakerBtn.classList.contains('active');
        if (!isVoiceOutputEnabled && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    });

    // Toggle Mic Recording (STT)
    micBtn.addEventListener('click', () => {
        if (!recognition || !isInterviewRunning) return;
        if (isRecordingInput) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    // Toggle Replay (TTS Repeat)
    replayBtn.addEventListener('click', () => {
        if (isInterviewRunning && currentQuestionText) {
            speakQuestion(currentQuestionText);
        }
    });

    // Pre-trigger loading of speech voices to avoid empty async arrays
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    function speakQuestion(text) {
        if (!isVoiceOutputEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Stop current speech
        
        // Clean out prompt system symbols for verbal clarity
        const cleanText = text.replace(/\[SYSTEM\]|\[AI Coach\]|\[AI Interviewer\]/gi, "").trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        const voices = window.speechSynthesis.getVoices();
        
        // Preferred natural voices in order of quality
        const preferredVoices = [
            'google us english',
            'samantha',
            'daniel',
            'microsoft zira desktop',
            'apple'
        ];
        
        let selectedVoice = null;
        for (const preferred of preferredVoices) {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes(preferred) && v.lang.includes('en'));
            if (selectedVoice) break;
        }
        
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('en'));
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        utterance.rate = 0.90;  // Slightly slower, warm pace
        utterance.pitch = 1.0;  // Natural vocal tone
        utterance.volume = 1.0; // Clear volume
        
        window.speechSynthesis.speak(utterance);
    }

    // Tab Navigation
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.tab;
            
            // Remove active states
            menuButtons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Add active states
            btn.classList.add('active');
            document.getElementById(targetId).classList.add('active');

            // Tab-specific loads
            if (targetId === 'employer-panel') {
                fetchRecruiterCandidates();
            } else if (targetId === 'university-panel') {
                fetchUniversityDashboard();
            }
            
            // Stop speech synthesis if shifting tabs
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        });
    });

    // File Upload Zones
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
        
        // Clear old view
        critiqueReportCard.style.display = 'none';
        profileDetailedContainer.style.display = 'none';
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
            if (!res.ok) {
                return res.json().then(e => { throw new Error(e.error || 'Upload error') });
            }
            return res.json();
        })
        .then(data => {
            uploadLoader.style.display = 'none';
            profilePlaceholder.style.display = 'none';
            
            critiqueReportCard.style.display = 'block';
            profileDetailedContainer.style.display = 'flex';
            placementsTableContainer.style.display = 'block';
            miniReadinessSec.style.display = 'block';

            currentStudentProfile = data.student_profile;
            currentRecommendations = data.recommendations;

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

        // 1. Text elements
        document.getElementById('res-name').textContent = profile.name;
        document.getElementById('res-email').textContent = profile.email;
        document.getElementById('res-cgpa').textContent = profile.cgpa;

        // 2. Skill Cloud
        const skillsContainer = document.getElementById('res-skills');
        skillsContainer.innerHTML = '';
        profile.skills.forEach(sk => {
            const span = document.createElement('span');
            span.className = 'skill-tag';
            span.innerHTML = `<i class="fas fa-check"></i> ${sk}`;
            skillsContainer.appendChild(span);
        });

        // 3. Employability gauge
        const score = data.employability_score;
        const progressCircle = document.querySelector('.gauge-progress');
        const offset = 440 - (score / 100) * 440;
        progressCircle.style.strokeDashoffset = offset;
        document.getElementById('gauge-score-value').textContent = `${score}%`;
        
        const readinessBadge = document.getElementById('readiness-badge');
        readinessBadge.textContent = `${data.placement_readiness} Readiness`;
        readinessBadge.className = 'badge-readiness ' + data.placement_readiness.toLowerCase();

        // 4. Critique Scores progress bars
        document.getElementById('score-format').textContent = `${critique.scores.formatting}%`;
        document.getElementById('fill-format').style.width = `${critique.scores.formatting}%`;
        
        document.getElementById('score-certs').textContent = `${critique.scores.certifications}%`;
        document.getElementById('fill-certs').style.width = `${critique.scores.certifications}%`;

        document.getElementById('score-projects').textContent = `${critique.scores.projects}%`;
        document.getElementById('fill-projects').style.width = `${critique.scores.projects}%`;

        // 5. Critique checklist
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

        // 6. Placements list
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

        // 7. Course Recommendations
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
            courseContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--accent-green);"><i class="fas fa-circle-check"></i> Profile skills fully optimized for this role!</div>';
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
    }

    function applyForInternship(button, internshipId, matchScore) {
        if (!currentStudentProfile) return;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting';

        fetch('/api/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_name: currentStudentProfile.name,
                student_email: currentStudentProfile.email,
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

    // ----------------- Mock Interview Chat System -----------------
    startInterviewBtn.addEventListener('click', () => {
        if (!currentStudentProfile) {
            alert("A student profile must be registered first. Please go to 'Student Dashboard' and upload a resume.");
            return;
        }

        if (isInterviewRunning) return;
        
        interviewRole = roleSelect.value;
        startInterviewBtn.disabled = true;
        startInterviewBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting Round...';
        
        terminalBody.innerHTML = `
            <div class="terminal-line">
                <span class="terminal-system-msg">[SYSTEM] Starting technical assessment framework for ${interviewRole}...</span>
            </div>
            <div class="terminal-line">
                <span class="terminal-system-msg">[SYSTEM] Parsing candidates skills profile: ${currentStudentProfile.name}...</span>
            </div>
            <div class="terminal-line">
                <span class="terminal-system-msg">[SYSTEM] Audio voice readouts: ${isVoiceOutputEnabled ? 'Enabled' : 'Muted'} (Microphone active).</span>
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
            terminalPromptStr.textContent = `${currentStudentProfile.name.toLowerCase().replace(' ', '')}@rvuniversity:~$`;
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

        // Flow 1: If we are currently showing evaluation and waiting for the user to progress
        if (isWaitingForNext) {
            if (isInterviewFinished) {
                // End interview cleanups
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
                
                // Reset states
                isWaitingForNext = false;
                isInterviewFinished = false;
                terminalSubmitBtn.innerHTML = '<i class="fas fa-share"></i> Send';
            } else {
                // Progress to the next question
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

        // Flow 2: Normal submit response flow
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
                student_name: currentStudentProfile.name,
                student_email: currentStudentProfile.email
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
            
            // Save next question details but do not display yet
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

            // Set waiting state and modify send button to Next Question
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
            line.innerHTML = `<span class="terminal-prompt">${currentStudentProfile.name.toLowerCase().replace(' ', '')}@rvuniversity:~$</span> <span style="color:#fff;">${text}</span>`;
        } else {
            line.innerHTML = `<span style="color:var(--accent-purple); font-weight:600;">[AI Interviewer]</span> <span class="terminal-ai-text">${text}</span>`;
        }
        terminalBody.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // ----------------- Employer Recruiter Board -----------------
    function fetchRecruiterCandidates() {
        const tableBody = document.querySelector('#employer-table tbody');
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Syncing applicant list...</td></tr>';

        fetch('/api/employer_candidates')
        .then(res => res.json())
        .then(data => {
            tableBody.innerHTML = '';
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No active applications in the queue.</td></tr>';
                return;
            }

            data.forEach(c => {
                const tr = document.createElement('tr');
                const date = new Date(c.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                const mockGrade = c.interview_score !== null ? 
                    `<span class="clickable-score score-badge" data-email="${c.student_email}" data-role="${c.internship_title}" style="color:var(--accent-green); border-color:rgba(0,245,160,0.3);">${c.interview_score}/100</span>` : 
                    '<span style="color:var(--text-secondary); font-size:0.75rem;">Not Taken</span>';
                
                const statusOptions = ['Screening', 'Invite for Test', 'Technical Interview', 'Offered', 'Rejected'];
                let optionsHTML = '';
                statusOptions.forEach(opt => {
                    const sel = opt === c.status ? 'selected' : '';
                    optionsHTML += `<option value="${opt}" ${sel}>${opt}</option>`;
                });

                tr.innerHTML = `
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

            // Status change events
            document.querySelectorAll('.recruiter-status-select').forEach(sel => {
                sel.addEventListener('change', () => {
                    updateCandidateStatus(sel.dataset.email, sel.dataset.id, sel.value);
                });
            });

            // Click events on grades to open transcript logs
            document.querySelectorAll('.clickable-score').forEach(btn => {
                btn.addEventListener('click', () => {
                    openCandidateTranscript(btn.dataset.email, btn.dataset.role);
                });
            });
        });
    }

    function openCandidateTranscript(email, role) {
        fetch(`/api/interview/transcript?email=${email}&role=${role}`)
        .then(res => {
            if (!res.ok) {
                return res.json().then(e => { throw new Error(e.error) });
            }
            return res.json();
        })
        .then(data => {
            document.getElementById('modal-avg-score').textContent = `${data.average_score}%`;
            document.getElementById('modal-tech-score').textContent = `${data.technical_score}%`;
            document.getElementById('modal-comm-score').textContent = `${data.communication_score}%`;
            document.getElementById('modal-student-email').textContent = data.student_email;
            document.getElementById('modal-filler-words').textContent = data.filler_words;
            
            // Format log lines with color
            document.getElementById('modal-transcript-text').textContent = data.transcript;

            transcriptModal.style.display = "block";
        })
        .catch(err => {
            alert(`Could not load audit log: ${err.message}`);
        });
    }

    // Modal Close operations
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
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log(`Status updated to: ${statusVal}`);
            }
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
                            labels: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
                        }
                    }
                }
            });

            // Forecasting linear curves
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
                            ticks: { color: '#94a3b8', font: { family: 'Inter' } }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#94a3b8', font: { family: 'Inter' }, stepSize: 20 }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
                        }
                    }
                }
            });
        });
    }
});
