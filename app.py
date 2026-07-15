import os
import re
import pickle
import sqlite3
import pypdf
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, render_template
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

DB_PATH = os.path.join(os.getcwd(), 'data', 'internship_system.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

MODEL_PATH = os.path.join(os.getcwd(), 'models', 'employability_model.pkl')

# Preset lists of skills
SKILL_DICTIONARY = {
    'programming_languages': ['python', 'java', 'c\\+\\+', 'c#', 'javascript', 'typescript', 'sql', 'html', 'css', 'ruby', 'go', 'rust', 'kotlin', 'swift'],
    'frameworks_libraries': ['react', 'node\\.js', 'angular', 'vue\\.js', 'django', 'flask', 'spring boot', 'express', 'bootstrap', 'jquery', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'opencv', 'spacy', 'nltk', 'fastapi'],
    'tools_cloud_databases': ['git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'mysql', 'postgresql', 'sqlite', 'mongodb', 'redis', 'oracle', 'firebase', 'postman', 'linux', 'unix', 'jira'],
    'concepts_domains': ['machine learning', 'deep learning', 'artificial intelligence', 'nlp', 'computer vision', 'data structures', 'algorithms', 'software engineering', 'cybersecurity', 'networking', 'cloud computing', 'data science', 'web development', 'agile', 'scrum', 'ui/ux', 'figma']
}

COURSE_RECOMMENDATIONS = {
    'react': 'Modern React with Redux (Udemy)',
    'javascript': 'JavaScript: The Hard Parts (Frontend Masters)',
    'node.js': 'Learn Node.js Complete Course (Codecademy)',
    'python': 'Python for Everybody Specialization (University of Michigan via Coursera)',
    'machine learning': 'Machine Learning Specialization by Andrew Ng (Stanford via Coursera)',
    'deep learning': 'Deep Learning Specialization by Andrew Ng (DeepLearning.AI via Coursera)',
    'tensorflow': 'TensorFlow Developer Professional Certificate (Coursera)',
    'pytorch': 'Deep Neural Networks with PyTorch (edX)',
    'scikit-learn': 'Applied Data Science with Python (University of Michigan via Coursera)',
    'sql': 'SQL for Data Science (UC Davis via Coursera)',
    'aws': 'AWS Certified Cloud Practitioner Training (AWS)',
    'azure': 'Microsoft Azure Fundamentals AZ-900 (Microsoft)',
    'gcp': 'Google Cloud Digital Leader (Coursera)',
    'docker': 'Docker Technologies for DevOps and Developers (Udemy)',
    'kubernetes': 'Certified Kubernetes Administrator CKA (Udemy)',
    'cybersecurity': 'Google Cybersecurity Professional Certificate (Coursera)',
    'algorithms': 'Data Structures and Algorithms Specialization (UC San Diego via Coursera)',
    'data structures': 'Algorithms, Part I & II (Princeton University via Coursera)',
    'ui/ux': 'Google UX Design Professional Certificate (Coursera)',
    'figma': 'Figma UI/UX Design Essentials (Udemy)',
    'data science': 'IBM Data Science Professional Certificate (Coursera)'
}

# Mock Interview Questions and Answers Guide
ROLE_INTERVIEW_QUESTIONS = {
    "Machine Learning Intern": [
        {
            "question": "What is the difference between L1 and L2 regularization?",
            "keywords": ["l1", "l2", "lasso", "ridge", "sparsity", "absolute", "square", "coefficients"],
            "model_answer": "L1 regularization (Lasso) adds the sum of absolute values of weights to the loss, which drives some weights to exactly zero, creating feature sparsity. L2 regularization (Ridge) adds the sum of squared weights, penalizing larger weights but keeping all features."
        },
        {
            "question": "Explain the bias-variance tradeoff and how a Random Forest model manages it.",
            "keywords": ["bias", "variance", "tradeoff", "overfitting", "underfitting", "bagging", "bootstrap", "forest"],
            "model_answer": "Bias is error from erroneous assumptions (underfitting); variance is error from sensitivity to fluctuations (overfitting). Random Forest reduces variance by averaging predictions of multiple uncorrelated decision trees trained on bootstrap samples (bagging)."
        },
        {
            "question": "How does gradient descent optimize weights in neural networks?",
            "keywords": ["gradient", "descent", "loss", "backpropagation", "derivative", "learning rate", "weights"],
            "model_answer": "Gradient descent computes the derivative of the loss function with respect to each network weight using backpropagation, then updates the weights in the opposite direction of the gradient scaled by the learning rate to minimize error."
        }
    ],
    "Data Scientist Intern": [
        {
            "question": "Explain what a p-value represents in hypothesis testing.",
            "keywords": ["p-value", "null", "hypothesis", "probability", "significance", "evidence", "alpha"],
            "model_answer": "The p-value is the probability of obtaining test results at least as extreme as the observed results, assuming that the null hypothesis is true. A lower p-value indicates stronger evidence against the null hypothesis."
        },
        {
            "question": "How would you handle a feature column in pandas that has 50% missing values?",
            "keywords": ["missing", "imputation", "median", "mean", "drop", "nan", "pandas", "indicator"],
            "model_answer": "I would either impute values using the mean/median/mode (with an added binary indicator column for missingness), drop the column if it's not critical, or use predictive modeling like KNN to impute the missing values depending on the distribution."
        }
    ],
    "Frontend Developer Intern": [
        {
            "question": "What is the Virtual DOM in React and how does reconciliation work?",
            "keywords": ["virtual", "dom", "react", "reconciliation", "diff", "diffing", "render", "update"],
            "model_answer": "The Virtual DOM is a lightweight memory representation of the real DOM. When component state changes, React updates the Virtual DOM, diffs it against the previous version (reconciliation), and updates only the changed elements in the real DOM."
        },
        {
            "question": "Explain the differences between let, const, and var declarations in JavaScript.",
            "keywords": ["let", "const", "var", "scope", "hoisting", "reassignment", "block", "function"],
            "model_answer": "var is function-scoped, hoisted, and allows redeclaration. let and const are block-scoped, not redeclarable, and exist in the temporal dead zone. const does not allow reassignment of the variable identifier."
        }
    ],
    "Cloud Architect Intern": [
        {
            "question": "What is the difference between horizontal and vertical scaling in cloud environments?",
            "keywords": ["horizontal", "vertical", "scaling", "instances", "ram", "cpu", "load balancer", "up", "out"],
            "model_answer": "Vertical scaling (scaling up) means adding more power (CPU, RAM) to an existing instance. Horizontal scaling (scaling out) means adding more instances to your resource pool, typically managed behind a load balancer."
        },
        {
            "question": "What is a VPC subnet, and how do you secure a database in a private subnet?",
            "keywords": ["vpc", "private", "subnet", "security group", "nacl", "nat", "route table", "internet"],
            "model_answer": "A VPC subnet is a range of IP addresses in your cloud network. To secure a database, you place it in a private subnet (no direct internet routing) and apply security groups allowing incoming traffic only from the web application subnet on specific database ports."
        }
    ],
    "Software Engineer Intern": [
        {
            "question": "Explain what time complexity is and define O(log n) efficiency.",
            "keywords": ["time complexity", "complexity", "big o", "efficiency", "logarithm", "halving", "search"],
            "model_answer": "Time complexity quantifies the amount of time an algorithm takes to run relative to the input size. O(log n) means the execution time grows logarithmically, meaning the input size is cut in half at each iteration, as in binary search."
        },
        {
            "question": "What is the difference between a process and a thread?",
            "keywords": ["process", "thread", "memory", "resource", "sharing", "execution", "lightweight"],
            "model_answer": "A process is an independent execution unit with its own dedicated memory space allocated by the OS. A thread is a lightweight execution path within a process that shares the parent process's memory and resource space."
        }
    ]
}

ROLE_INTERVIEW_QUESTIONS["AI Research Intern"] = ROLE_INTERVIEW_QUESTIONS["Machine Learning Intern"]
ROLE_INTERVIEW_QUESTIONS["Cybersecurity Specialist Intern"] = ROLE_INTERVIEW_QUESTIONS["Cloud Architect Intern"]
ROLE_INTERVIEW_QUESTIONS["Product Management Intern"] = ROLE_INTERVIEW_QUESTIONS["Data Scientist Intern"]


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Internships table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS internships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        description TEXT NOT NULL,
        required_skills TEXT NOT NULL,
        location TEXT NOT NULL,
        duration TEXT NOT NULL,
        stipend TEXT NOT NULL
    )
    ''')
    
    # 2. Create Applications table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        student_email TEXT NOT NULL,
        internship_id INTEGER,
        match_score REAL,
        status TEXT DEFAULT 'Screening',
        interview_score REAL DEFAULT NULL,
        technical_score REAL DEFAULT NULL,
        communication_score REAL DEFAULT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (internship_id) REFERENCES internships(id)
    )
    ''')

    # Migration checking to dynamically add new columns if necessary
    cursor.execute("PRAGMA table_info(applications)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'interview_score' not in columns:
        cursor.execute("ALTER TABLE applications ADD COLUMN interview_score REAL DEFAULT NULL")
    if 'technical_score' not in columns:
        cursor.execute("ALTER TABLE applications ADD COLUMN technical_score REAL DEFAULT NULL")
    if 'communication_score' not in columns:
        cursor.execute("ALTER TABLE applications ADD COLUMN communication_score REAL DEFAULT NULL")

    # 3. Create Interviews table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        student_email TEXT NOT NULL,
        role TEXT NOT NULL,
        average_score REAL,
        technical_score REAL,
        communication_score REAL,
        filler_words TEXT,
        transcript TEXT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Pre-seed internship opportunities if empty
    cursor.execute("SELECT COUNT(*) FROM internships")
    if cursor.fetchone()[0] == 0:
        mock_internships = [
            ("Machine Learning Intern", "Google", "Develop and optimize predictive models and deep learning architectures. Work on large scale datasets and integrate models with production systems.", "python, tensorflow, scikit-learn, machine learning, algorithms, data structures", "Bangalore, IN", "6 Months", "₹60,000/month"),
            ("Data Scientist Intern", "Microsoft", "Analyze user engagement patterns, construct regression models, and design interactive SQL queries and data dashboards using Pandas/Numpy.", "python, sql, pandas, numpy, scikit-learn, machine learning", "Hyderabad, IN", "6 Months", "₹50,000/month"),
            ("Frontend Developer Intern", "Meta", "Build responsive modern user interfaces using React, JavaScript, and styled components. Work alongside design teams using Figma wireframes.", "react, javascript, html, css, figma", "Remote", "3 Months", "₹45,000/month"),
            ("Cloud Architect Intern", "AWS", "Support cloud deployment pipelines, container virtualization, and secure AWS resource management using Docker and CI/CD tools.", "aws, docker, kubernetes, linux, networking", "Bangalore, IN", "6 Months", "₹55,000/month"),
            ("Software Engineer Intern", "Netflix", "Participate in agile sprints, write clean structured backend logic in Node.js, and maintain robust API systems with relational databases.", "node.js, javascript, express, mysql, git, algorithms", "Mumbai, IN", "4 Months", "₹40,000/month"),
            ("AI Research Intern", "OpenAI", "Conduct research in large language models, NLP transformers, and optimize PyTorch neural network training scripts.", "python, pytz, pytorch, deep learning, nlp, algorithms", "Remote", "6 Months", "₹80,000/month"),
            ("Cybersecurity Specialist Intern", "Cisco", "Perform vulnerability scanning, audit networking configurations, and design security policies for cloud/hybrid infrastructure.", "cybersecurity, networking, linux, git", "Bangalore, IN", "6 Months", "₹48,000/month"),
            ("Product Management Intern", "Apple", "Coordinate feature releases, structure product roadmaps, conduct user feedback analysis, and utilize SQL for KPI tracking.", "sql, agile, jira, ui/ux", "Hyderabad, IN", "3 Months", "₹35,000/month")
        ]
        cursor.executemany("INSERT INTO internships (title, company, description, required_skills, location, duration, stipend) VALUES (?, ?, ?, ?, ?, ?, ?)", mock_internships)
        conn.commit()
        
    conn.close()

# Resume Parsing Logic
def parse_resume_text(text):
    text_lower = text.lower()
    
    # 1. Email Extraction
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else "unknown@university.edu"
    
    # 2. Name Extraction
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    name = "Ritvik Medam"
    if lines:
        for line in lines[:3]:
            if "@" not in line and "resume" not in line.lower() and len(line.split()) <= 4:
                name = line
                break
                
    # 3. CGPA Extraction
    cgpa = 7.8
    cgpa_matches = re.findall(r'(?:cgpa|gpa|pointer|percentage)\s*(?::|is)?\s*([4-9]\.\d{1,2}|10\.0|[7-9]\d(?:\.\d+)?)', text_lower)
    if cgpa_matches:
        try:
            val = float(cgpa_matches[0])
            if val > 10.0:
                cgpa = val / 10.0
            else:
                cgpa = val
        except ValueError:
            pass
    else:
        float_matches = re.findall(r'\b([5-9]\.\d{1,2}|10\.0)\b', text)
        if float_matches:
            cgpa = float(float_matches[0])

    # 4. Skill Extraction
    extracted_skills = []
    for category, skill_patterns in SKILL_DICTIONARY.items():
        for pattern in skill_patterns:
            if pattern == 'c\\+\\+':
                if 'c++' in text_lower:
                    extracted_skills.append('c++')
            elif pattern == 'node\\.js':
                if 'node.js' in text_lower or 'nodejs' in text_lower:
                    extracted_skills.append('node.js')
            elif pattern == 'vue\\.js':
                if 'vue.js' in text_lower or 'vuejs' in text_lower:
                    extracted_skills.append('vue.js')
            elif pattern == 'spring boot':
                if 'spring boot' in text_lower or 'springboot' in text_lower:
                    extracted_skills.append('spring boot')
            else:
                match = re.search(r'\b' + pattern + r'\b', text_lower)
                if match:
                    clean_name = pattern.replace('\\', '')
                    extracted_skills.append(clean_name)
                    
    extracted_skills = list(set(extracted_skills))
    
    # 5. Projects Extraction
    project_keywords = ['project', 'mini-project', 'capstone', 'developed', 'implemented']
    projects_count = min(5, sum(1 for word in project_keywords if word in text_lower))
    if projects_count == 0:
        projects_count = 2
        
    # 6. Certifications Extraction
    cert_keywords = ['certification', 'certified', 'certificate', 'credential', 'license']
    certifications_count = min(5, sum(1 for word in cert_keywords if word in text_lower))
    
    # 7. Experience Months
    experience_months = 0
    exp_matches = re.findall(r'(\d+)\s*(?:months?|yrs?|years?)\s*(?:of)?\s*(?:experience|internship)', text_lower)
    if exp_matches:
        try:
            experience_months = int(exp_matches[0])
            if experience_months > 12:
                experience_months = 12
        except ValueError:
            pass
            
    # 8. Communication & Extracurriculars
    comm_keywords = ['communication', 'presentation', 'leadership', 'teamwork', 'speaker', 'organized', 'seminar', 'debate']
    comm_score = min(5, max(2, sum(1 for word in comm_keywords if word in text_lower)))
    
    extra_keywords = ['sports', 'cultural', 'club', 'volunteer', 'hackathon', 'competition', 'society']
    extra_score = min(5, max(2, sum(1 for word in extra_keywords if word in text_lower)))

    return {
        'name': name,
        'email': email,
        'cgpa': round(cgpa, 2),
        'skills': extracted_skills,
        'projects_count': projects_count,
        'certifications_count': certifications_count,
        'experience_months': experience_months,
        'communication_score': comm_score,
        'extracurricular_score': extra_score
    }

# Generate Resume Score and Critique Checklist
def generate_resume_critique(profile):
    checklist = []
    
    # Evaluate Formatting / Structure Index
    formatting_score = 90
    if profile['experience_months'] == 0:
        formatting_score -= 10
        checklist.append({"task": "Expand internship/work experience logs to demonstrate industry exposure.", "completed": False})
    else:
        checklist.append({"task": "Professional experience section included.", "completed": True})
        
    # Academic score critique
    academic_score = 80 if profile['cgpa'] < 8.0 else (90 if profile['cgpa'] < 9.0 else 98)
    if profile['cgpa'] < 8.5:
        checklist.append({"task": "Aim for a CGPA of 8.5+ to unlock Tier-1 company screening criteria.", "completed": False})
    else:
        checklist.append({"task": "Target academic grade score (>=8.5 CGPA) achieved.", "completed": True})
        
    # Certifications critique
    cert_score = min(100, 60 + (profile['certifications_count'] * 20))
    if profile['certifications_count'] < 2:
        checklist.append({"task": "Complete at least 2 relevant Cloud, DevOps, or ML certifications (Coursera/Udemy/AWS).", "completed": False})
    else:
        checklist.append({"task": "Industry certifications quota fulfilled.", "completed": True})
        
    # Project critique
    proj_score = min(100, 50 + (profile['projects_count'] * 20))
    if profile['projects_count'] < 3:
        checklist.append({"task": "Add a third tech stack project (incorporate database deployment parameters).", "completed": False})
    else:
        checklist.append({"task": "Strong technical project index (3+ projects).", "completed": True})
        
    # Skills checklist
    has_cloud = any(sk in profile['skills'] for sk in ['aws', 'azure', 'gcp', 'docker', 'kubernetes'])
    if not has_cloud:
        checklist.append({"task": "Integrate virtualization or cloud tools (AWS, Docker) to boost cloud readiness.", "completed": False})
    else:
        checklist.append({"task": "Cloud-infrastructure and DevOps tools parsed.", "completed": True})
        
    # Overall score average
    overall = int((formatting_score + academic_score + cert_score + proj_score) / 4)
    
    scores = {
        "overall": overall,
        "formatting": formatting_score,
        "academic": int(academic_score),
        "certifications": cert_score,
        "projects": proj_score
    }
    return {"scores": scores, "checklist": checklist}

# Similarity Recommendation
def get_recommendations(student_skills, internships):
    if not student_skills:
        return []
        
    student_skills_str = " ".join(student_skills)
    corpus = [student_skills_str]
    
    for i in internships:
        corpus.append(i['required_skills'].replace(',', ' '))
        
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)
    
    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
    scores = cosine_sim[0]
    
    recommendations = []
    for idx, score in enumerate(scores):
        internship = dict(internships[idx])
        req_skills_list = [s.strip().lower() for s in internship['required_skills'].split(',')]
        
        matching_skills = [s for s in student_skills if s.lower() in req_skills_list]
        missing_skills = [s for s in req_skills_list if s not in [ms.lower() for ms in student_skills]]
        
        courses = []
        for s in missing_skills:
            if s in COURSE_RECOMMENDATIONS:
                courses.append({'skill': s, 'course': COURSE_RECOMMENDATIONS[s]})
            else:
                courses.append({'skill': s, 'course': f'{s.capitalize()} Foundation Course (Coursera/Udemy)'})
        
        overlap_ratio = len(matching_skills) / len(req_skills_list) if req_skills_list else 0
        final_match_score = round((0.4 * score + 0.6 * overlap_ratio) * 100, 1)
        final_match_score = min(100.0, max(10.0, final_match_score))
        
        recommendations.append({
            'id': internship['id'],
            'title': internship['title'],
            'company': internship['company'],
            'description': internship['description'],
            'required_skills': internship['required_skills'],
            'location': internship['location'],
            'duration': internship['duration'],
            'stipend': internship['stipend'],
            'match_score': final_match_score,
            'missing_skills': missing_skills,
            'courses': courses
        })
        
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    return recommendations

# Base Route
@app.route('/')
def home():
    return render_template('index.html')

# Core APIs
@app.route('/api/internships', methods=['GET'])
def get_internships():
    conn = get_db_connection()
    internships = conn.execute('SELECT * FROM internships').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in internships])

@app.route('/api/upload_resume', methods=['POST'])
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)
    
    # Text Extraction
    text = ""
    if file.filename.endswith('.pdf'):
        text = extract_text_from_pdf(file_path)
    else:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        except Exception:
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    text = f.read()
            except Exception as e:
                return jsonify({'error': f'Failed to read text file: {e}'}), 500
                
    if not text.strip():
        return jsonify({'error': 'Could not extract text from resume.'}), 400
        
    student_profile = parse_resume_text(text)
    
    # Model placement prediction
    employability_score = 50.0
    placement_readiness = "Medium"
    
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            
            core_skills_score = min(10, len(student_profile['skills']))
            features = np.array([[
                student_profile['cgpa'],
                student_profile['projects_count'],
                student_profile['certifications_count'],
                core_skills_score,
                student_profile['communication_score'],
                student_profile['experience_months'],
                student_profile['extracurricular_score']
            ]])
            
            prob = model.predict_proba(features)[0][1]
            employability_score = round(prob * 100, 1)
            
            if employability_score >= 75.0:
                placement_readiness = "High"
            elif employability_score >= 50.0:
                placement_readiness = "Medium"
            else:
                placement_readiness = "Low"
        except Exception as e:
            print(f"Prediction Error: {e}")
            
    # Recommendations
    conn = get_db_connection()
    internships = [dict(r) for r in conn.execute('SELECT * FROM internships').fetchall()]
    conn.close()
    
    recommendations = get_recommendations(student_profile['skills'], internships)
    
    # Critique Report
    critique_report = generate_resume_critique(student_profile)
    
    return jsonify({
        'student_profile': student_profile,
        'employability_score': employability_score,
        'placement_readiness': placement_readiness,
        'recommendations': recommendations,
        'critique': critique_report
    })

# Recruitment workflow
@app.route('/api/apply', methods=['POST'])
def apply_internship():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400
        
    name = data.get('student_name')
    email = data.get('student_email')
    internship_id = data.get('internship_id')
    match_score = data.get('match_score', 50.0)
    
    if not name or not email or not internship_id:
        return jsonify({'error': 'Missing required fields'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    exists = cursor.execute('SELECT id FROM applications WHERE student_email = ? AND internship_id = ?', (email, internship_id)).fetchone()
    if exists:
        conn.close()
        return jsonify({'success': True, 'message': 'Already applied!'})
        
    cursor.execute(
        'INSERT INTO applications (student_name, student_email, internship_id, match_score, status) VALUES (?, ?, ?, ?, ?)',
        (name, email, internship_id, match_score, 'Screening')
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Application submitted successfully!'})

@app.route('/api/apply/update_status', methods=['POST'])
def update_application_status():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid body'}), 400
        
    email = data.get('student_email')
    internship_id = data.get('internship_id')
    new_status = data.get('status')
    
    if not email or not internship_id or not new_status:
        return jsonify({'error': 'Missing email, ID, or status'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE applications SET status = ? WHERE student_email = ? AND internship_id = ?',
        (new_status, email, internship_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': f'Status updated to {new_status}'})

@app.route('/api/employer_candidates', methods=['GET'])
def get_employer_candidates():
    conn = get_db_connection()
    query = '''
        SELECT a.student_name, a.student_email, a.match_score, a.status, a.applied_at, a.internship_id, a.interview_score, a.technical_score, a.communication_score, i.title as internship_title
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        ORDER BY a.match_score DESC
    '''
    candidates = conn.execute(query).fetchall()
    conn.close()
    return jsonify([dict(c) for c in candidates])

# ----------------- Mock Interview Simulator API -----------------
@app.route('/api/interview/start', methods=['POST'])
def start_interview():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400
        
    role = data.get('role', 'Software Engineer Intern')
    
    if role not in ROLE_INTERVIEW_QUESTIONS:
        role = "Software Engineer Intern"
        
    questions = ROLE_INTERVIEW_QUESTIONS[role]
    
    return jsonify({
        'role': role,
        'total_questions': len(questions),
        'question': questions[0]['question'],
        'question_index': 0
    })

@app.route('/api/interview/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid body'}), 400
        
    role = data.get('role', 'Software Engineer Intern')
    question_idx = data.get('question_index', 0)
    user_answer = data.get('answer', '').strip()
    student_name = data.get('student_name', 'Ritvik Medam')
    student_email = data.get('student_email', 'ritvik.medam@university.edu')
    
    if role not in ROLE_INTERVIEW_QUESTIONS:
        role = "Software Engineer Intern"
        
    questions = ROLE_INTERVIEW_QUESTIONS[role]
    if question_idx >= len(questions):
        return jsonify({'error': 'Question index out of range'}), 400
        
    q_data = questions[question_idx]
    
    # 1. Tech score (keyword checks)
    matched_keywords = []
    user_answer_lower = user_answer.lower()
    for kw in q_data['keywords']:
        if kw.replace('\\', '') in user_answer_lower:
            matched_keywords.append(kw)
            
    tech_score = int((len(matched_keywords) / len(q_data['keywords'])) * 100)
    tech_score = min(100, max(0, tech_score))
    
    # 2. Communication & Filler word analytics
    filler_words = ["um", "uh", "like", "basically", "actually", "you know", "sort of"]
    detected_fillers = []
    for fw in filler_words:
        matches = len(re.findall(r'\b' + fw + r'\b', user_answer_lower))
        if matches > 0:
            detected_fillers.extend([fw] * matches)
            
    comm_score = 100
    comm_score -= len(detected_fillers) * 6  # Deduct 6 points per occurrence
    
    if len(user_answer) < 50:
         comm_score -= 20  # Length penalty
         
    comm_score = min(100, max(0, comm_score))
    
    # Combined score
    calculated_score = int((tech_score * 0.7) + (comm_score * 0.3))
    
    # Dynamic Branching / Conversational follow-ups
    follow_up_prompt = ""
    if question_idx == 0:
        if role == "Machine Learning Intern" or role == "AI Research Intern":
            if "lasso" in user_answer_lower:
                follow_up_prompt = "You highlighted Lasso. Can you explain why the absolute weight penalization causes feature sparsity?"
            elif "ridge" in user_answer_lower:
                follow_up_prompt = "You mentioned Ridge. Can you describe how its squared penalization handles multicollinearity?"
        elif role == "Software Engineer Intern":
            if "binary" in user_answer_lower:
                follow_up_prompt = "Since you highlighted binary search, how does its halving logic handle unsorted arrays?"
                
    missing = [kw.replace('\\', '') for kw in q_data['keywords'] if kw not in matched_keywords]
    feedback = ""
    if calculated_score >= 80:
        feedback = "Excellent technical formulation. You explained key aspects with clarity."
    elif calculated_score >= 50:
        feedback = f"Good attempt. Expand on these variables in the next round: {', '.join(missing[:3])}."
    else:
        feedback = f"Response lacks detail. Focus on these terms: {', '.join(missing)}."
        
    if detected_fillers:
        feedback += f" (Note: Detected filler phrases: {', '.join(list(set(detected_fillers)))})."
        
    next_idx = question_idx + 1
    is_finished = next_idx >= len(questions)
    
    response_data = {
        'score': calculated_score,
        'technical_score': tech_score,
        'communication_score': comm_score,
        'feedback': feedback,
        'follow_up': follow_up_prompt,
        'model_answer': q_data['model_answer'],
        'next_question_index': next_idx,
        'is_finished': is_finished
    }
    
    if not is_finished:
        response_data['next_question'] = questions[next_idx]['question']
    else:
        # Save transcript to interviews table
        transcript_text = f"Q1: {questions[0]['question']}\nA1: {user_answer}\nGrades - Tech: {tech_score}%, Comm: {comm_score}%\nFiller phrases found: {len(detected_fillers)}"
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert interview log
        cursor.execute(
            'INSERT INTO interviews (student_name, student_email, role, average_score, technical_score, communication_score, filler_words, transcript) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (student_name, student_email, role, float(calculated_score), float(tech_score), float(comm_score), ", ".join(list(set(detected_fillers))), transcript_text)
        )
        # Sync scores directly with applications table
        cursor.execute(
            'UPDATE applications SET interview_score = ?, technical_score = ?, communication_score = ? WHERE student_email = ? AND internship_id IN (SELECT id FROM internships WHERE title = ?)',
            (float(calculated_score), float(tech_score), float(comm_score), student_email, role)
        )
        conn.commit()
        conn.close()
        
    return jsonify(response_data)

# Fetch Transcript for Recruiter view
@app.route('/api/interview/transcript', methods=['GET'])
def get_transcript():
    email = request.args.get('email')
    role = request.args.get('role')
    
    if not email or not role:
        return jsonify({'error': 'Missing email or role parameters'}), 400
        
    conn = get_db_connection()
    row = conn.execute(
        'SELECT * FROM interviews WHERE student_email = ? AND role = ? ORDER BY completed_at DESC LIMIT 1',
        (email, role)
    ).fetchone()
    conn.close()
    
    if not row:
        return jsonify({'error': 'No interview logs found for this applicant.'}), 404
        
    return jsonify({
        'student_name': row['student_name'],
        'role': row['role'],
        'average_score': row['average_score'],
        'technical_score': row['technical_score'],
        'communication_score': row['communication_score'],
        'filler_words': row['filler_words'] or "None",
        'transcript': row['transcript'],
        'completed_at': row['completed_at']
    })

# ----------------- University Dashboard analytics -----------------
@app.route('/api/university_stats', methods=['GET'])
def get_university_stats():
    conn = get_db_connection()
    total_apps = conn.execute('SELECT COUNT(*) FROM applications').fetchone()[0]
    avg_match = conn.execute('SELECT AVG(match_score) FROM applications').fetchone()[0] or 0.0
    conn.close()
    
    forecasting_data = {
        'cgpa_x': [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5],
        'current_placement_y': [25, 40, 55, 72, 85, 92, 97, 99],
        'forecasted_placement_y': [32, 48, 65, 80, 91, 96, 99, 100]
    }
    
    stats = {
        'total_students_monitored': 240,
        'average_cgpa': 7.65,
        'employability_readiness_distribution': {
            'High (>=75%)': 98,
            'Medium (50-74%)': 105,
            'Low (<50%)': 37
        },
        'skills_gap_frequency': [
            {'skill': 'React', 'count': 45},
            {'skill': 'Machine Learning', 'count': 38},
            {'skill': 'Docker', 'count': 32},
            {'skill': 'AWS', 'count': 28},
            {'skill': 'SQL', 'count': 22}
        ],
        'total_applications_submitted': total_apps,
        'average_match_score': round(avg_match, 1),
        'forecasting': forecasting_data
    }
    return jsonify(stats)

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    except Exception as e:
        print(f"Error extracting PDF: {e}")
    return text

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5050, debug=True)
