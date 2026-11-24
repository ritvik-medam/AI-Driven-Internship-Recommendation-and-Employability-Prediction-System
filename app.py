import os
import re
import time
import json
import pickle
import sqlite3
import hashlib
import queue
from datetime import datetime
import pypdf
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, render_template, session, send_file, Response
from werkzeug.utils import secure_filename
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
app.secret_key = 'placement-intel-secret-key-change-in-production'
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

DB_PATH = os.path.join(os.getcwd(), 'data', 'internship_system.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

MODEL_PATH = os.path.join(os.getcwd(), 'models', 'employability_model.pkl')

# Preset technical skill words
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
    
    # 1. Create Users Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
    ''')

    # 2. Create Student Profile Table (for Resume Builder)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS student_profiles (
        user_id INTEGER PRIMARY KEY,
        cgpa REAL,
        skills TEXT,
        projects TEXT,
        certifications TEXT,
        experience TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')
    
    # 3. Create Internships table
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
    
    # 4. Create Applications table
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

    # 5. Create Interviews table
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

    # 6. Create Notifications table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        title TEXT DEFAULT 'Notification',
        message TEXT NOT NULL,
        category TEXT DEFAULT 'system',
        action_tab TEXT DEFAULT '',
        icon TEXT DEFAULT 'fa-bell',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    for col, col_type, col_def in [
        ('title', 'TEXT', "'Notification'"),
        ('category', 'TEXT', "'system'"),
        ('action_tab', 'TEXT', "''")
    ]:
        try:
            cursor.execute(f"ALTER TABLE notifications ADD COLUMN {col} {col_type} DEFAULT {col_def}")
        except Exception:
            pass

    # 7. Create Interview Slots table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS interview_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recruiter_email TEXT NOT NULL,
        slot_date TEXT NOT NULL,
        slot_time TEXT NOT NULL,
        interviewer_name TEXT NOT NULL,
        booked_by_student_email TEXT,
        status TEXT DEFAULT 'Available'
    )
    ''')

    # 8. Create User Resumes & Uploaded Documents Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        original_filename TEXT NOT NULL,
        saved_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        raw_text TEXT,
        parsed_profile_json TEXT,
        employability_score REAL,
        placement_readiness TEXT,
        critique_json TEXT,
        recommendations_json TEXT,
        is_active INTEGER DEFAULT 1,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')

    # Pre-seed interview slots if empty
    cursor.execute("SELECT COUNT(*) FROM interview_slots")
    if cursor.fetchone()[0] == 0:
        from datetime import date, timedelta
        today = date.today()
        mock_slots = [
            ("recruiter@google.com", (today + timedelta(days=1)).strftime("%Y-%m-%d"), "10:00 AM", "Sundar Pichai", None, "Available"),
            ("recruiter@google.com", (today + timedelta(days=2)).strftime("%Y-%m-%d"), "02:00 PM", "Jeff Dean", None, "Available"),
            ("recruiter@google.com", (today + timedelta(days=3)).strftime("%Y-%m-%d"), "11:30 AM", "Sanjay Ghemawat", None, "Available")
        ]
        cursor.executemany("INSERT INTO interview_slots (recruiter_email, slot_date, slot_time, interviewer_name, booked_by_student_email, status) VALUES (?, ?, ?, ?, ?, ?)", mock_slots)
        conn.commit()
    
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
        
    # Pre-seed default test accounts if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        test_users = [
            ("Ritvik Medam", "student@university.edu", "student123", "student"),
            ("Google Recruiter", "recruiter@google.com", "recruiter123", "recruiter"),
            ("University Admin", "admin@university.edu", "admin123", "university")
        ]
        cursor.executemany("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", test_users)
        conn.commit()

    # Pre-seed additional demo students for leaderboard
    cursor.execute("SELECT COUNT(*) FROM users WHERE role='student'")
    if cursor.fetchone()[0] < 4:
        extra_students = [
            ("Ananya Sharma", "ananya@university.edu", "student123", "student"),
            ("Karthik Reddy", "karthik@university.edu", "student123", "student"),
            ("Priya Nair", "priya@university.edu", "student123", "student"),
            ("Arjun Patel", "arjun@university.edu", "student123", "student"),
            ("Meera Iyer", "meera@university.edu", "student123", "student")
        ]
        for s in extra_students:
            try:
                cursor.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", s)
            except sqlite3.IntegrityError:
                pass
        conn.commit()

        # Seed profiles for leaderboard demo
        demo_profiles = [
            ("ananya@university.edu", 9.1, "python, machine learning, tensorflow, pandas", 4, 3, 6),
            ("karthik@university.edu", 8.4, "java, react, javascript, sql, git", 3, 2, 3),
            ("priya@university.edu", 8.8, "python, aws, docker, kubernetes, linux", 5, 4, 12),
            ("arjun@university.edu", 7.6, "javascript, html, css, react, node.js", 2, 1, 0),
            ("meera@university.edu", 9.4, "python, deep learning, pytorch, nlp, algorithms", 5, 5, 8)
        ]
        for dp in demo_profiles:
            uid = cursor.execute("SELECT id FROM users WHERE email = ?", (dp[0],)).fetchone()
            if uid:
                try:
                    cursor.execute("INSERT INTO student_profiles (user_id, cgpa, skills, projects, certifications, experience) VALUES (?, ?, ?, ?, ?, ?)",
                        (uid[0], dp[1], dp[2], f"{dp[3]} Projects", f"{dp[4]} Certifications", f"{dp[5]} Months"))
                except sqlite3.IntegrityError:
                    pass
        conn.commit()

    conn.close()

# Resume Parsing Logic
def parse_resume_text(text):
    text_lower = text.lower()
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else "unknown@university.edu"
    
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    name = "Ritvik Medam"
    if lines:
        for line in lines[:3]:
            if "@" not in line and "resume" not in line.lower() and len(line.split()) <= 4:
                name = line
                break
                
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
    
    project_keywords = ['project', 'mini-project', 'capstone', 'developed', 'implemented']
    projects_count = min(5, sum(1 for word in project_keywords if word in text_lower))
    if projects_count == 0:
        projects_count = 2
        
    cert_keywords = ['certification', 'certified', 'certificate', 'credential', 'license']
    certifications_count = min(5, sum(1 for word in cert_keywords if word in text_lower))
    
    experience_months = 0
    exp_matches = re.findall(r'(\d+)\s*(?:months?|yrs?|years?)\s*(?:of)?\s*(?:experience|internship)', text_lower)
    if exp_matches:
        try:
            experience_months = int(exp_matches[0])
            if experience_months > 12:
                experience_months = 12
        except ValueError:
            pass
            
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

def generate_resume_critique(profile):
    checklist = []
    formatting_score = 90
    if profile['experience_months'] == 0:
        formatting_score -= 10
        checklist.append({"task": "Expand internship/work experience logs to demonstrate industry exposure.", "completed": False})
    else:
        checklist.append({"task": "Professional experience section included.", "completed": True})
        
    academic_score = 80 if profile['cgpa'] < 8.0 else (90 if profile['cgpa'] < 9.0 else 98)
    if profile['cgpa'] < 8.5:
        checklist.append({"task": "Aim for a CGPA of 8.5+ to unlock Tier-1 company screening criteria.", "completed": False})
    else:
        checklist.append({"task": "Target academic grade score (>=8.5 CGPA) achieved.", "completed": True})
        
    cert_score = min(100, 60 + (profile['certifications_count'] * 20))
    if profile['certifications_count'] < 2:
        checklist.append({"task": "Complete at least 2 relevant Cloud, DevOps, or ML certifications (Coursera/Udemy/AWS).", "completed": False})
    else:
        checklist.append({"task": "Industry certifications quota fulfilled.", "completed": True})
        
    proj_score = min(100, 50 + (profile['projects_count'] * 20))
    if profile['projects_count'] < 3:
        checklist.append({"task": "Add a third tech stack project (incorporate database deployment parameters).", "completed": False})
    else:
        checklist.append({"task": "Strong technical project index (3+ projects).", "completed": True})
        
    has_cloud = any(sk in profile['skills'] for sk in ['aws', 'azure', 'gcp', 'docker', 'kubernetes'])
    if not has_cloud:
        checklist.append({"task": "Integrate virtualization or cloud tools (AWS, Docker) to boost cloud readiness.", "completed": False})
    else:
        checklist.append({"task": "Cloud-infrastructure and DevOps tools parsed.", "completed": True})
        
    overall = int((formatting_score + academic_score + cert_score + proj_score) / 4)
    scores = {
        "overall": overall,
        "formatting": formatting_score,
        "academic": int(academic_score),
        "certifications": cert_score,
        "projects": proj_score
    }
    return {"scores": scores, "checklist": checklist}

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

def compute_profile_analysis(student_profile):
    employability_score = 50.0
    placement_readiness = "Medium"
    
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            
            skills = student_profile.get('skills', [])
            core_skills_score = min(10, len(skills))
            features = np.array([[
                student_profile.get('cgpa', 7.5),
                student_profile.get('projects_count', 2),
                student_profile.get('certifications_count', 1),
                core_skills_score,
                student_profile.get('communication_score', 8.0),
                student_profile.get('experience_months', 0),
                student_profile.get('extracurricular_score', 7.5)
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
            
    conn = get_db_connection()
    internships = [dict(r) for r in conn.execute('SELECT * FROM internships').fetchall()]
    conn.close()
    
    recommendations = get_recommendations(student_profile.get('skills', []), internships)
    critique_report = generate_resume_critique(student_profile)
    
    return {
        'student_profile': student_profile,
        'employability_score': employability_score,
        'placement_readiness': placement_readiness,
        'recommendations': recommendations,
        'critique': critique_report
    }

# Base Route
@app.route('/')
def home():
    return render_template('index.html')

# ----------------- User Auth APIs -----------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')
    
    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            (name, email, password, role)
        )
        conn.commit()
        # Fetch newly created user ID
        user_id = cursor.lastrowid
        session['user_id'] = user_id
        session['role'] = role
        session['name'] = name
        session['email'] = email
        conn.close()
        return jsonify({'success': True, 'user': {'id': user_id, 'name': name, 'email': email, 'role': role}})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email address already exists'}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400
        
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password)).fetchone()
    conn.close()
    
    if not row:
        return jsonify({'error': 'Invalid email or password'}), 401
        
    session['user_id'] = row['id']
    session['role'] = row['role']
    session['name'] = row['name']
    session['email'] = row['email']
    
    return jsonify({'success': True, 'user': {'id': row['id'], 'name': row['name'], 'email': row['email'], 'role': row['role']}})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/auth/session', methods=['GET'])
def get_session():
    if 'user_id' in session:
        return jsonify({
            'logged_in': True,
            'user': {
                'id': session['user_id'],
                'name': session['name'],
                'email': session['email'],
                'role': session['role']
            }
        })
    return jsonify({'logged_in': False})

# ----------------- Student Profile Resume Builder APIs -----------------
@app.route('/api/student/profile', methods=['GET', 'POST'])
def handle_student_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
    
    user_id = session['user_id']
    
    if request.method == 'POST':
        data = request.get_json()
        cgpa = data.get('cgpa', 7.5)
        skills = data.get('skills', '')
        projects = data.get('projects', '')
        certifications = data.get('certifications', '')
        experience = data.get('experience', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Upsert profile record
        cursor.execute('''
            INSERT INTO student_profiles (user_id, cgpa, skills, projects, certifications, experience)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                cgpa = excluded.cgpa,
                skills = excluded.skills,
                projects = excluded.projects,
                certifications = excluded.certifications,
                experience = excluded.experience
        ''', (user_id, cgpa, skills, projects, certifications, experience))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Profile saved successfully!'})
    else:
        conn = get_db_connection()
        row = conn.execute('SELECT * FROM student_profiles WHERE user_id = ?', (user_id,)).fetchone()
        conn.close()
        
        if not row:
            return jsonify({'profile': None})
            
        return jsonify({
            'profile': {
                'cgpa': row['cgpa'],
                'skills': row['skills'],
                'projects': row['projects'],
                'certifications': row['certifications'],
                'experience': row['experience']
            }
        })

# Core Platform APIs
@app.route('/api/internships', methods=['GET'])
def get_internships():
    conn = get_db_connection()
    internships = conn.execute('SELECT * FROM internships').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in internships])

@app.route('/api/upload_resume', methods=['POST'])
def upload_resume():
    if 'user_id' not in session:
        return jsonify({'error': 'Please sign in to upload and save your resume.'}), 401
        
    user_id = session['user_id']
    user_name = session.get('name', 'Student')
    user_email = session.get('email', '')

    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['resume']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    original_filename = file.filename
    clean_name = secure_filename(original_filename) or "resume.pdf"
    
    # Isolate storage per user account
    user_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], f"user_{user_id}")
    os.makedirs(user_upload_dir, exist_ok=True)
    
    timestamp = int(time.time())
    saved_filename = f"{timestamp}_{clean_name}"
    file_path = os.path.join(user_upload_dir, saved_filename)
    file.save(file_path)
    file_size = os.path.getsize(file_path)
    
    text = ""
    if original_filename.lower().endswith('.pdf'):
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
                return jsonify({'error': f'Failed to read text: {e}'}), 500
                
    if not text.strip():
        try:
            os.remove(file_path)
        except Exception:
            pass
        return jsonify({'error': 'Could not extract readable text from resume. Please verify the file is not empty or try TXT format.'}), 400
        
    student_profile = parse_resume_text(text)
    if not student_profile.get('name') or student_profile['name'] in ['Candidate', 'Unknown']:
        student_profile['name'] = user_name
    if not student_profile.get('email') or 'unknown' in student_profile['email']:
        student_profile['email'] = user_email

    analysis = compute_profile_analysis(student_profile)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Mark previously active resumes for this user as inactive
    cursor.execute('UPDATE user_resumes SET is_active = 0 WHERE user_id = ?', (user_id,))
    
    # Insert new resume record
    cursor.execute('''
        INSERT INTO user_resumes (
            user_id, original_filename, saved_filename, file_path, file_size, raw_text,
            parsed_profile_json, employability_score, placement_readiness,
            critique_json, recommendations_json, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ''', (
        user_id, original_filename, saved_filename, file_path, file_size, text,
        json.dumps(student_profile), analysis['employability_score'], analysis['placement_readiness'],
        json.dumps(analysis['critique']), json.dumps(analysis['recommendations'])
    ))
    new_resume_id = cursor.lastrowid
    
    # Sync with student_profiles table
    cursor.execute('''
        INSERT INTO student_profiles (user_id, cgpa, skills, projects, certifications, experience)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            cgpa = excluded.cgpa,
            skills = excluded.skills,
            projects = excluded.projects,
            certifications = excluded.certifications,
            experience = excluded.experience
    ''', (
        user_id,
        student_profile['cgpa'],
        ", ".join(student_profile['skills']),
        f"{student_profile['projects_count']} Projects",
        f"{student_profile['certifications_count']} Certifications",
        f"{student_profile['experience_months']} Months"
    ))
    
    conn.commit()
    conn.close()
    
    insert_notification(
        user_email,
        f"Resume '{original_filename}' audited successfully. Extracted {analysis['cgpa']} CGPA and {len(analysis['skills'])} technical competencies with {analysis['employability_score']}% Employability Readiness.",
        icon="fa-file-circle-check",
        title="Resume Verified & Analyzed",
        category="resume",
        action_tab="placement-matching"
    )
    
    return jsonify({
        'success': True,
        'resume_id': new_resume_id,
        'original_filename': original_filename,
        'student_profile': student_profile,
        'employability_score': analysis['employability_score'],
        'placement_readiness': analysis['placement_readiness'],
        'recommendations': analysis['recommendations'],
        'critique': analysis['critique']
    })

@app.route('/api/student/resume/latest', methods=['GET'])
def get_latest_resume():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    
    # 1. Fetch active resume
    row = conn.execute('''
        SELECT * FROM user_resumes
        WHERE user_id = ? AND is_active = 1
        ORDER BY id DESC LIMIT 1
    ''', (user_id,)).fetchone()
    
    if not row:
        # Fallback to most recent resume if none marked active
        row = conn.execute('''
            SELECT * FROM user_resumes
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 1
        ''', (user_id,)).fetchone()
        
    all_resumes = conn.execute('''
        SELECT id, original_filename, employability_score, placement_readiness, is_active, uploaded_at
        FROM user_resumes
        WHERE user_id = ?
        ORDER BY id DESC
    ''', (user_id,)).fetchall()
    
    if not row:
        # Check if student_profiles already has legacy data (e.g. from seed)
        sp = conn.execute('SELECT * FROM student_profiles WHERE user_id = ?', (user_id,)).fetchone()
        if sp and sp['skills']:
            skills_list = [s.strip() for s in sp['skills'].split(',') if s.strip()]
            synth_profile = {
                'name': session.get('name', 'Student'),
                'email': session.get('email', ''),
                'phone': 'N/A',
                'education': 'Bachelor of Technology',
                'cgpa': float(sp['cgpa'] or 7.5),
                'skills': skills_list,
                'projects_count': int(str(sp['projects']).split()[0]) if sp['projects'] and str(sp['projects']).split()[0].isdigit() else 2,
                'certifications_count': int(str(sp['certifications']).split()[0]) if sp['certifications'] and str(sp['certifications']).split()[0].isdigit() else 1,
                'experience_months': int(str(sp['experience']).split()[0]) if sp['experience'] and str(sp['experience']).split()[0].isdigit() else 0,
                'communication_score': 8.0,
                'extracurricular_score': 7.5
            }
            analysis = compute_profile_analysis(synth_profile)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO user_resumes (
                    user_id, original_filename, saved_filename, file_path, file_size, raw_text,
                    parsed_profile_json, employability_score, placement_readiness,
                    critique_json, recommendations_json, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ''', (
                user_id, 'Primary Resume.pdf', 'primary_resume.pdf', '', 0, '',
                json.dumps(synth_profile), analysis['employability_score'], analysis['placement_readiness'],
                json.dumps(analysis['critique']), json.dumps(analysis['recommendations'])
            ))
            conn.commit()
            new_id = cursor.lastrowid
            conn.close()
            return jsonify({
                'has_resume': True,
                'analysis': {
                    'resume_id': new_id,
                    'original_filename': 'Primary Resume.pdf',
                    'student_profile': synth_profile,
                    'employability_score': analysis['employability_score'],
                    'placement_readiness': analysis['placement_readiness'],
                    'critique': analysis['critique'],
                    'recommendations': analysis['recommendations']
                },
                'resumes_list': [{
                    'id': new_id,
                    'original_filename': 'Primary Resume.pdf',
                    'employability_score': analysis['employability_score'],
                    'placement_readiness': analysis['placement_readiness'],
                    'is_active': 1,
                    'uploaded_at': 'Saved in Account'
                }]
            })
            
        conn.close()
        return jsonify({'has_resume': False, 'resumes_list': []})
        
    conn.close()
    
    parsed_profile = json.loads(row['parsed_profile_json']) if row['parsed_profile_json'] else {}
    critique = json.loads(row['critique_json']) if row['critique_json'] else {}
    recommendations = json.loads(row['recommendations_json']) if row['recommendations_json'] else []
    
    return jsonify({
        'has_resume': True,
        'analysis': {
            'resume_id': row['id'],
            'original_filename': row['original_filename'],
            'uploaded_at': row['uploaded_at'],
            'student_profile': parsed_profile,
            'employability_score': row['employability_score'],
            'placement_readiness': row['placement_readiness'],
            'critique': critique,
            'recommendations': recommendations
        },
        'resumes_list': [dict(r) for r in all_resumes]
    })

@app.route('/api/student/resumes', methods=['GET'])
def get_student_resumes():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    user_id = session['user_id']
    conn = get_db_connection()
    resumes = conn.execute('''
        SELECT id, original_filename, employability_score, placement_readiness, is_active, uploaded_at
        FROM user_resumes
        WHERE user_id = ?
        ORDER BY id DESC
    ''', (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in resumes])

@app.route('/api/student/resume/switch/<int:resume_id>', methods=['POST'])
def switch_active_resume(resume_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    target = conn.execute('SELECT * FROM user_resumes WHERE id = ? AND user_id = ?', (resume_id, user_id)).fetchone()
    if not target:
        conn.close()
        return jsonify({'error': 'Resume not found for this account'}), 404
        
    cursor = conn.cursor()
    cursor.execute('UPDATE user_resumes SET is_active = 0 WHERE user_id = ?', (user_id,))
    cursor.execute('UPDATE user_resumes SET is_active = 1 WHERE id = ?', (resume_id,))
    
    # Sync with student_profiles
    if target['parsed_profile_json']:
        p = json.loads(target['parsed_profile_json'])
        cursor.execute('''
            INSERT INTO student_profiles (user_id, cgpa, skills, projects, certifications, experience)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                cgpa = excluded.cgpa,
                skills = excluded.skills,
                projects = excluded.projects,
                certifications = excluded.certifications,
                experience = excluded.experience
        ''', (
            user_id,
            p.get('cgpa', 7.5),
            ", ".join(p.get('skills', [])),
            f"{p.get('projects_count', 2)} Projects",
            f"{p.get('certifications_count', 1)} Certifications",
            f"{p.get('experience_months', 0)} Months"
        ))
    conn.commit()
    
    all_resumes = conn.execute('''
        SELECT id, original_filename, employability_score, placement_readiness, is_active, uploaded_at
        FROM user_resumes
        WHERE user_id = ?
        ORDER BY id DESC
    ''', (user_id,)).fetchall()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': f"Active resume switched to '{target['original_filename']}'",
        'analysis': {
            'resume_id': target['id'],
            'original_filename': target['original_filename'],
            'uploaded_at': target['uploaded_at'],
            'student_profile': json.loads(target['parsed_profile_json']),
            'employability_score': target['employability_score'],
            'placement_readiness': target['placement_readiness'],
            'critique': json.loads(target['critique_json']),
            'recommendations': json.loads(target['recommendations_json'])
        },
        'resumes_list': [dict(r) for r in all_resumes]
    })

@app.route('/api/student/resume/download/<int:resume_id>', methods=['GET'])
def download_resume(resume_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user_id = session['user_id']
    role = session.get('role', 'student')
    
    conn = get_db_connection()
    if role in ['recruiter', 'university']:
        row = conn.execute('SELECT * FROM user_resumes WHERE id = ?', (resume_id,)).fetchone()
    else:
        row = conn.execute('SELECT * FROM user_resumes WHERE id = ? AND user_id = ?', (resume_id, user_id)).fetchone()
    conn.close()
    
    if not row or not row['file_path'] or not os.path.exists(row['file_path']):
        return jsonify({'error': 'Original resume file not found on disk.'}), 404
        
    return send_file(row['file_path'], as_attachment=True, download_name=row['original_filename'])

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
    internship = conn.execute('SELECT title, company FROM internships WHERE id = ?', (internship_id,)).fetchone()
    conn.close()
    
    co = internship['company'] if internship else 'Employer'
    role_name = internship['title'] if internship else 'Internship'
    insert_notification(
        email,
        f"Application submitted for '{role_name}' at {co}. Your {match_score}% match profile has been routed to the talent team.",
        icon="fa-paper-plane",
        title=f"Applied to {co}",
        category="application",
        action_tab="my-applications"
    )
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
    internship = cursor.execute('SELECT title, company FROM internships WHERE id = ?', (internship_id,)).fetchone()
    conn.commit()
    conn.close()

    co = internship['company'] if internship else 'Campus Recruiter'
    role_name = internship['title'] if internship else 'Opportunity'
    insert_notification(
        email,
        f"{co} Recruitment Team advanced your application for '{role_name}' to stage: {new_status}.",
        icon="fa-clipboard-check",
        title=f"Application Update: {new_status}",
        category="application",
        action_tab="my-applications"
    )
    return jsonify({'success': True, 'message': f'Status updated to {new_status}'})

@app.route('/api/employer_candidates', methods=['GET'])
def get_employer_candidates():
    conn = get_db_connection()
    query = '''
        SELECT a.student_name, a.student_email, a.match_score, a.status, a.applied_at, a.internship_id, a.interview_score, a.technical_score, a.communication_score, i.title as internship_title,
               (SELECT ur.id FROM user_resumes ur JOIN users u ON ur.user_id = u.id WHERE u.email = a.student_email AND ur.is_active = 1 ORDER BY ur.id DESC LIMIT 1) as active_resume_id,
               (SELECT ur.original_filename FROM user_resumes ur JOIN users u ON ur.user_id = u.id WHERE u.email = a.student_email AND ur.is_active = 1 ORDER BY ur.id DESC LIMIT 1) as active_resume_filename
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
    
    # 1. Tech score
    matched_keywords = []
    user_answer_lower = user_answer.lower()
    for kw in q_data['keywords']:
        if kw.replace('\\', '') in user_answer_lower:
            matched_keywords.append(kw)
            
    tech_score = int((len(matched_keywords) / len(q_data['keywords'])) * 100)
    tech_score = min(100, max(0, tech_score))
    
    # 2. Comm score
    filler_words = ["um", "uh", "like", "basically", "actually", "you know", "sort of"]
    detected_fillers = []
    for fw in filler_words:
        matches = len(re.findall(r'\b' + fw + r'\b', user_answer_lower))
        if matches > 0:
            detected_fillers.extend([fw] * matches)
            
    comm_score = 100
    comm_score -= len(detected_fillers) * 6
    if len(user_answer) < 50:
         comm_score -= 20
    comm_score = min(100, max(0, comm_score))
    
    calculated_score = int((tech_score * 0.7) + (comm_score * 0.3))
    
    # Dynamic Branching
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
        transcript_text = f"Q1: {questions[0]['question']}\nA1: {user_answer}\nGrades - Tech: {tech_score}%, Comm: {comm_score}%\nFiller phrases found: {len(detected_fillers)}"
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'INSERT INTO interviews (student_name, student_email, role, average_score, technical_score, communication_score, filler_words, transcript) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (student_name, student_email, role, float(calculated_score), float(tech_score), float(comm_score), ", ".join(list(set(detected_fillers))), transcript_text)
        )
        cursor.execute(
            'UPDATE applications SET interview_score = ?, technical_score = ?, communication_score = ? WHERE student_email = ? AND internship_id IN (SELECT id FROM internships WHERE title = ?)',
            (float(calculated_score), float(tech_score), float(comm_score), student_email, role)
        )
        conn.commit()
        conn.close()
        # Send notification to the student
        insert_notification(
            student_email,
            f"AI Evaluator completed technical assessment for '{role}'. Scored {calculated_score}% ({tech_score}/100 Technical Depth, {comm_score}/100 Delivery).",
            icon="fa-microphone",
            title="Mock Interview Evaluated",
            category="interview",
            action_tab="mock-interview"
        )
        
    return jsonify(response_data)

# Fetch Transcript for Recruiter modal view
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
        'student_email': row['student_email'],
        'role': row['role'],
        'average_score': row['average_score'],
        'technical_score': row['technical_score'],
        'communication_score': row['communication_score'],
        'filler_words': row['filler_words'] or "None",
        'transcript': row['transcript'],
        'completed_at': row['completed_at']
    })

# University Dashboard analytics
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

# ----------------- Student Applications Timeline -----------------
@app.route('/api/student/applications', methods=['GET'])
def get_student_applications():
    if 'user_id' not in session:
        return jsonify([]), 200
    email = session['email']
    conn = get_db_connection()
    rows = conn.execute('''
        SELECT a.id, a.student_name, a.match_score, a.status, a.applied_at,
               a.interview_score, i.title, i.company, i.location
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE a.student_email = ?
        ORDER BY a.applied_at DESC
    ''', (email,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

# ----------------- Interview History & Trends -----------------
@app.route('/api/interview/history', methods=['GET'])
def get_interview_history():
    if 'user_id' not in session:
        return jsonify([]), 200
    email = session['email']
    conn = get_db_connection()
    rows = conn.execute('''
        SELECT role, average_score, technical_score, communication_score, completed_at
        FROM interviews
        WHERE student_email = ?
        ORDER BY completed_at ASC
    ''', (email,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

# ----------------- Student Leaderboard -----------------
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    conn = get_db_connection()
    # Join users with student_profiles to calculate score
    rows = conn.execute('''
        SELECT u.name, u.email, sp.cgpa, sp.skills, sp.projects, sp.certifications, sp.experience
        FROM users u
        JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.role = 'student'
    ''').fetchall()
    
    leaderboard = []
    for r in rows:
        r_dict = dict(r)
        skills_count = len([s.strip() for s in (r_dict['skills'] or '').split(',') if s.strip()])
        
        # Parse projects/certs counts
        proj_count = 0
        try:
            proj_count = int(''.join(filter(str.isdigit, (r_dict['projects'] or '0')[:3])))
        except:
            pass
        cert_count = 0
        try:
            cert_count = int(''.join(filter(str.isdigit, (r_dict['certifications'] or '0')[:3])))
        except:
            pass
        exp_months = 0
        try:
            exp_months = int(''.join(filter(str.isdigit, (r_dict['experience'] or '0')[:3])))
        except:
            pass
        
        # Employability formula
        score = min(100, int(
            (r_dict['cgpa'] or 0) * 6 +
            min(skills_count, 8) * 3 +
            min(proj_count, 5) * 4 +
            min(cert_count, 5) * 3 +
            min(exp_months, 12) * 1
        ))
        
        # Badges
        badges = []
        if score >= 90:
            badges.append({'icon': 'fa-crown', 'label': 'Elite', 'color': '#ffd700'})
        if skills_count >= 6:
            badges.append({'icon': 'fa-code', 'label': 'Polyglot', 'color': '#00f2fe'})
        if cert_count >= 3:
            badges.append({'icon': 'fa-certificate', 'label': 'Certified Pro', 'color': '#9b51e0'})
        if (r_dict['cgpa'] or 0) >= 9.0:
            badges.append({'icon': 'fa-star', 'label': 'Scholar', 'color': '#00f5a0'})
        if exp_months >= 6:
            badges.append({'icon': 'fa-briefcase', 'label': 'Experienced', 'color': '#f4b41a'})
        
        # Check interview count
        interview_count = conn.execute('SELECT COUNT(*) FROM interviews WHERE student_email = ?', (r_dict['email'],)).fetchone()[0]
        if interview_count >= 1:
            badges.append({'icon': 'fa-headset', 'label': 'Interview Ready', 'color': '#ff007f'})
        
        leaderboard.append({
            'name': r_dict['name'],
            'email': r_dict['email'],
            'cgpa': r_dict['cgpa'],
            'skills_count': skills_count,
            'score': score,
            'badges': badges
        })
    
    conn.close()
    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    
    # Assign ranks
    for i, entry in enumerate(leaderboard):
        entry['rank'] = i + 1
    
    return jsonify(leaderboard)

# ----------------- Real-Time Notifications Engine -----------------
NOTIFICATION_SUBSCRIBERS = {}  # email -> list of queue.Queue()

def broadcast_notification(email, notif_payload):
    """Deliver real-time notification to active client SSE listeners."""
    subscribers = NOTIFICATION_SUBSCRIBERS.get(email, [])
    dead_subscribers = []
    for q in subscribers:
        try:
            q.put_nowait(notif_payload)
        except Exception:
            dead_subscribers.append(q)
    for dq in dead_subscribers:
        if dq in subscribers:
            subscribers.remove(dq)

def insert_notification(email, message, icon='fa-bell', title=None, category='system', action_tab=''):
    """Helper to insert a rich notification for a user and push in real-time."""
    if not title:
        msg_l = message.lower()
        if 'applied' in msg_l or 'application' in msg_l:
            title = 'Application Update'
            category = category or 'application'
            action_tab = action_tab or 'my-applications'
        elif 'challenge' in msg_l or 'code' in msg_l or 'solved' in msg_l:
            title = 'Coding Challenge Passed'
            category = category or 'coding'
            action_tab = action_tab or 'mock-coding'
        elif 'interview' in msg_l or 'graded' in msg_l or 'slot' in msg_l:
            title = 'Interview Update'
            category = category or 'interview'
            action_tab = action_tab or 'mock-interview'
        elif 'resume' in msg_l or 'ats' in msg_l:
            title = 'Resume & ATS Audit'
            category = category or 'resume'
            action_tab = action_tab or 'placement-matching'
        else:
            title = 'Campus Notification'

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO notifications (user_email, title, message, category, action_tab, icon)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (email, title, message, category, action_tab, icon))
        conn.commit()
        notif_id = cursor.lastrowid
        unread_count = conn.execute('SELECT COUNT(*) FROM notifications WHERE user_email = ? AND is_read = 0', (email,)).fetchone()[0]
        conn.close()

        payload = {
            'id': notif_id,
            'user_email': email,
            'title': title,
            'message': message,
            'category': category,
            'action_tab': action_tab,
            'icon': icon,
            'is_read': 0,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'unread_count': unread_count
        }
        broadcast_notification(email, payload)
        return notif_id
    except Exception as e:
        print(f"Notification insert error: {e}")
        return None

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    if 'user_id' not in session:
        return jsonify({'notifications': [], 'unread_count': 0}), 200
    email = session.get('email')
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC LIMIT 30', (email,)).fetchall()
    unread = conn.execute('SELECT COUNT(*) FROM notifications WHERE user_email = ? AND is_read = 0', (email,)).fetchone()[0]
    conn.close()

    notifs = []
    for r in rows:
        d = dict(r)
        if not d.get('title'):
            msg_l = d.get('message', '').lower()
            if 'applied' in msg_l or 'application' in msg_l:
                d['title'] = 'Application Update'
                d['category'] = d.get('category') or 'application'
                d['action_tab'] = d.get('action_tab') or 'my-applications'
            elif 'challenge' in msg_l or 'code' in msg_l or 'solved' in msg_l:
                d['title'] = 'Coding Challenge Passed'
                d['category'] = d.get('category') or 'coding'
                d['action_tab'] = d.get('action_tab') or 'mock-coding'
            elif 'interview' in msg_l or 'slot' in msg_l:
                d['title'] = 'Interview Update'
                d['category'] = d.get('category') or 'interview'
                d['action_tab'] = d.get('action_tab') or 'mock-interview'
            elif 'resume' in msg_l:
                d['title'] = 'Resume Verified'
                d['category'] = d.get('category') or 'resume'
                d['action_tab'] = d.get('action_tab') or 'placement-matching'
            else:
                d['title'] = 'Placement Update'
                d['category'] = d.get('category') or 'system'
        notifs.append(d)

    return jsonify({'notifications': notifs, 'unread_count': unread})

@app.route('/api/notifications/read', methods=['POST'])
def mark_notifications_read():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    email = session.get('email')
    conn = get_db_connection()
    conn.execute('UPDATE notifications SET is_read = 1 WHERE user_email = ?', (email,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/notifications/<int:notif_id>/read', methods=['POST'])
def mark_single_notification_read(notif_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    email = session.get('email')
    conn = get_db_connection()
    conn.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_email = ?', (notif_id, email))
    conn.commit()
    unread = conn.execute('SELECT COUNT(*) FROM notifications WHERE user_email = ? AND is_read = 0', (email,)).fetchone()[0]
    conn.close()
    return jsonify({'success': True, 'unread_count': unread})

@app.route('/api/notifications/stream')
def notifications_stream():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    email = session.get('email')
    if not email:
        return jsonify({'error': 'No email'}), 400

    def event_stream():
        q = queue.Queue(maxsize=30)
        if email not in NOTIFICATION_SUBSCRIBERS:
            NOTIFICATION_SUBSCRIBERS[email] = []
        NOTIFICATION_SUBSCRIBERS[email].append(q)
        yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'email': email})}\n\n"
        try:
            while True:
                try:
                    payload = q.get(timeout=20)
                    yield f"event: notification\ndata: {json.dumps(payload)}\n\n"
                except queue.Empty:
                    yield ": ping\n\n"
        except GeneratorExit:
            if email in NOTIFICATION_SUBSCRIBERS and q in NOTIFICATION_SUBSCRIBERS[email]:
                NOTIFICATION_SUBSCRIBERS[email].remove(q)

    return Response(event_stream(), mimetype="text/event-stream")

# ----------------- Company Profiles -----------------
COMPANY_DATA = {
    'Google': {'industry': 'Technology', 'culture': ['Innovation', 'Open Culture', 'AI-First'], 'size': '180,000+ employees', 'hq': 'Mountain View, CA'},
    'Microsoft': {'industry': 'Technology', 'culture': ['Growth Mindset', 'Inclusive', 'Cloud-First'], 'size': '220,000+ employees', 'hq': 'Redmond, WA'},
    'Meta': {'industry': 'Social Media / Tech', 'culture': ['Move Fast', 'Be Bold', 'Open'], 'size': '70,000+ employees', 'hq': 'Menlo Park, CA'},
    'AWS': {'industry': 'Cloud Computing', 'culture': ['Customer Obsession', 'Ownership', 'Invent & Simplify'], 'size': '100,000+ employees', 'hq': 'Seattle, WA'},
    'Netflix': {'industry': 'Entertainment / Tech', 'culture': ['Freedom & Responsibility', 'Context not Control'], 'size': '13,000+ employees', 'hq': 'Los Gatos, CA'},
    'OpenAI': {'industry': 'AI Research', 'culture': ['Safety-First', 'Research Excellence', 'Collaborative'], 'size': '3,000+ employees', 'hq': 'San Francisco, CA'},
    'Cisco': {'industry': 'Networking / Cybersecurity', 'culture': ['Inclusive Future', 'Innovation', 'Purpose-Driven'], 'size': '80,000+ employees', 'hq': 'San Jose, CA'},
    'Apple': {'industry': 'Consumer Electronics / Tech', 'culture': ['Design Excellence', 'Privacy-First', 'Innovation'], 'size': '160,000+ employees', 'hq': 'Cupertino, CA'}
}

@app.route('/api/companies', methods=['GET'])
def get_companies():
    conn = get_db_connection()
    internships = conn.execute('SELECT * FROM internships ORDER BY company').fetchall()
    conn.close()
    
    companies = {}
    for i in internships:
        i_dict = dict(i)
        company = i_dict['company']
        if company not in companies:
            meta = COMPANY_DATA.get(company, {'industry': 'Technology', 'culture': ['Innovation'], 'size': 'N/A', 'hq': 'N/A'})
            companies[company] = {
                'name': company,
                'industry': meta['industry'],
                'culture': meta['culture'],
                'size': meta['size'],
                'hq': meta['hq'],
                'internships': []
            }
        companies[company]['internships'].append({
            'id': i_dict['id'],
            'title': i_dict['title'],
            'required_skills': i_dict['required_skills'],
            'location': i_dict['location'],
            'duration': i_dict['duration'],
            'stipend': i_dict['stipend']
        })
    
    return jsonify(list(companies.values()))

# ================== NEW v3.0 PREMIUM SERVICES DATA & ENDPOINTS ==================

CAREER_ROADMAP_DATA = {
    "Software Engineer Intern": {
        "nodes": [
            {"id": "c1", "label": "Git & Version Control", "type": "fundamental", "status": "learned"},
            {"id": "c2", "label": "Data Structures & Algorithms", "type": "fundamental", "status": "learned"},
            {"id": "g1", "label": "Node.js & Express", "type": "gap", "status": "gap", "time": "2 weeks", "course": "Learn Node.js Complete Course (Codecademy)"},
            {"id": "g2", "label": "Relational Databases (MySQL/PostgreSQL)", "type": "gap", "status": "gap", "time": "1 week", "course": "SQL for Data Science (Coursera)"},
            {"id": "t1", "label": "System Design Basics", "type": "target", "status": "target"}
        ],
        "edges": [
            {"from": "c1", "to": "c2"},
            {"from": "c2", "to": "g1"},
            {"from": "g1", "to": "g2"},
            {"from": "g2", "to": "t1"}
        ]
    },
    "Machine Learning Intern": {
        "nodes": [
            {"id": "c1", "label": "Python Programming", "type": "fundamental", "status": "learned"},
            {"id": "c2", "label": "Pandas & NumPy", "type": "fundamental", "status": "learned"},
            {"id": "g1", "label": "Scikit-Learn (ML Models)", "type": "gap", "status": "gap", "time": "2 weeks", "course": "Applied Data Science with Python (Coursera)"},
            {"id": "g2", "label": "TensorFlow/PyTorch (Deep Learning)", "type": "gap", "status": "gap", "time": "3 weeks", "course": "Deep Learning Specialization by Andrew Ng (Coursera)"},
            {"id": "t1", "label": "MLOps & Model Deployment", "type": "target", "status": "target"}
        ],
        "edges": [
            {"from": "c1", "to": "c2"},
            {"from": "c2", "to": "g1"},
            {"from": "g1", "to": "g2"},
            {"from": "g2", "to": "t1"}
        ]
    },
    "Data Scientist Intern": {
        "nodes": [
            {"id": "c1", "label": "Python & SQL", "type": "fundamental", "status": "learned"},
            {"id": "c2", "label": "Exploratory Data Analysis", "type": "fundamental", "status": "learned"},
            {"id": "g1", "label": "Statistical Hypothesis Testing", "type": "gap", "status": "gap", "time": "1 week", "course": "Applied Data Science with Python (Coursera)"},
            {"id": "g2", "label": "Supervised & Unsupervised Learning", "type": "gap", "status": "gap", "time": "2 weeks", "course": "Machine Learning Specialization by Andrew Ng (Coursera)"},
            {"id": "t1", "label": "Data Visualization & Dashboards", "type": "target", "status": "target"}
        ],
        "edges": [
            {"from": "c1", "to": "c2"},
            {"from": "c2", "to": "g1"},
            {"from": "g1", "to": "g2"},
            {"from": "g2", "to": "t1"}
        ]
    },
    "Cloud Architect Intern": {
        "nodes": [
            {"id": "c1", "label": "Linux Commands", "type": "fundamental", "status": "learned"},
            {"id": "c2", "label": "Basic Networking (TCP/IP)", "type": "fundamental", "status": "learned"},
            {"id": "g1", "label": "AWS Cloud Foundations", "type": "gap", "status": "gap", "time": "2 weeks", "course": "AWS Certified Cloud Practitioner Training (AWS)"},
            {"id": "g2", "label": "Docker Containerization", "type": "gap", "status": "gap", "time": "1 week", "course": "Docker Technologies for DevOps (Udemy)"},
            {"id": "t1", "label": "Infrastructure as Code (Terraform)", "type": "target", "status": "target"}
        ],
        "edges": [
            {"from": "c1", "to": "c2"},
            {"from": "c2", "to": "g1"},
            {"from": "g1", "to": "g2"},
            {"from": "g2", "to": "t1"}
        ]
    },
    "Frontend Developer Intern": {
        "nodes": [
            {"id": "c1", "label": "HTML & CSS", "type": "fundamental", "status": "learned"},
            {"id": "c2", "label": "JavaScript ES6+", "type": "fundamental", "status": "learned"},
            {"id": "g1", "label": "React Framework Core", "type": "gap", "status": "gap", "time": "2 weeks", "course": "Modern React with Redux (Udemy)"},
            {"id": "g2", "label": "Figma Translation & Styling", "type": "gap", "status": "gap", "time": "1 week", "course": "Figma UI/UX Design Essentials (Udemy)"},
            {"id": "t1", "label": "State Management & Next.js", "type": "target", "status": "target"}
        ],
        "edges": [
            {"from": "c1", "to": "c2"},
            {"from": "c2", "to": "g1"},
            {"from": "g1", "to": "g2"},
            {"from": "g2", "to": "t1"}
        ]
    },
    "AI Research Intern": {
        "nodes": [
            {"id": "c1", "label": "Python & Linear Algebra", "type": "fundamental", "status": "learned"},
            {"id": "c2", "label": "Machine Learning Foundations", "type": "fundamental", "status": "learned"},
            {"id": "g1", "label": "PyTorch / Deep Learning", "type": "gap", "status": "gap", "time": "3 weeks", "course": "Deep Neural Networks with PyTorch (edX)"},
            {"id": "g2", "label": "Natural Language Processing (Transformers)", "type": "gap", "status": "gap", "time": "2 weeks", "course": "Deep Learning Specialization by Andrew Ng (Coursera)"},
            {"id": "t1", "label": "LLM Optimization & Fine-tuning", "type": "target", "status": "target"}
        ],
        "edges": [
            {"from": "c1", "to": "c2"},
            {"from": "c2", "to": "g1"},
            {"from": "g1", "to": "g2"},
            {"from": "g2", "to": "t1"}
        ]
    },
    "Cybersecurity Specialist Intern": {
        "nodes": [
            {"id": "c1", "label": "Computer Networks", "type": "fundamental", "status": "learned"},
            {"id": "c2", "label": "Linux Security Basics", "type": "fundamental", "status": "learned"},
            {"id": "g1", "label": "Vulnerability Assessment", "type": "gap", "status": "gap", "time": "2 weeks", "course": "Google Cybersecurity Professional Certificate (Coursera)"},
            {"id": "g2", "label": "Network Sniffing & Auditing", "type": "gap", "status": "gap", "time": "1 week", "course": "Google Cybersecurity Professional Certificate (Coursera)"},
            {"id": "t1", "label": "Penetration Testing (Kali Linux)", "type": "target", "status": "target"}
        ],
        "edges": [
            {"from": "c1", "to": "c2"},
            {"from": "c2", "to": "g1"},
            {"from": "g1", "to": "g2"},
            {"from": "g2", "to": "t1"}
        ]
    },
    "Product Management Intern": {
        "nodes": [
            {"id": "c1", "label": "Communication Skills", "type": "fundamental", "status": "learned"},
            {"id": "c2", "label": "Basic SQL Queries", "type": "fundamental", "status": "learned"},
            {"id": "g1", "label": "Agile & Scrum Methodologies", "type": "gap", "status": "gap", "time": "1 week", "course": "Product Management Intern Course (Coursera)"},
            {"id": "g2", "label": "Product Roadmapping & Wireframes", "type": "gap", "status": "gap", "time": "2 weeks", "course": "Google UX Design Professional Certificate (Coursera)"},
            {"id": "t1", "label": "Market Analysis & KPI Tracking", "type": "target", "status": "target"}
        ],
        "edges": [
            {"from": "c1", "to": "c2"},
            {"from": "c2", "to": "g1"},
            {"from": "g1", "to": "g2"},
            {"from": "g2", "to": "t1"}
        ]
    }
}

@app.route('/api/career-path', methods=['GET'])
def get_career_path():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    role = request.args.get('role', 'Software Engineer Intern')
    
    conn = get_db_connection()
    profile = conn.execute('SELECT * FROM student_profiles WHERE user_id = ?', (session['user_id'],)).fetchone()
    conn.close()
    
    student_skills = []
    if profile and profile['skills']:
        student_skills = [s.strip().lower() for s in profile['skills'].split(',') if s.strip()]
        
    roadmap = CAREER_ROADMAP_DATA.get(role, CAREER_ROADMAP_DATA['Software Engineer Intern'])
    
    # Dynamically update status based on student's actual skills
    updated_nodes = []
    for node in roadmap['nodes']:
        n = node.copy()
        if n['type'] == 'gap':
            # Check if student already has this skill (simple keyword match)
            skill_label = n['label'].lower()
            if any(s in skill_label for s in student_skills):
                n['status'] = 'learned'
                n['type'] = 'fundamental'
        updated_nodes.append(n)
        
    return jsonify({
        'nodes': updated_nodes,
        'edges': roadmap['edges']
    })

@app.route('/api/market-insights', methods=['GET'])
def get_market_insights():
    # Return mockup real-time market data
    market_data = {
        'trending_skills': [
            {'skill': 'Python', 'demand': 95, 'growth': '+12%'},
            {'skill': 'React', 'demand': 88, 'growth': '+8%'},
            {'skill': 'Docker', 'demand': 76, 'growth': '+15%'},
            {'skill': 'AWS', 'demand': 84, 'growth': '+18%'},
            {'skill': 'Machine Learning', 'demand': 90, 'growth': '+20%'},
            {'skill': 'SQL', 'demand': 82, 'growth': '+4%'},
            {'skill': 'Node.js', 'demand': 70, 'growth': '+6%'},
            {'skill': 'Kubernetes', 'demand': 65, 'growth': '+22%'}
        ],
        'salary_distribution': [
            {'role': 'Machine Learning Intern', 'min': 50000, 'avg': 65000, 'max': 85000},
            {'role': 'Data Scientist Intern', 'min': 45000, 'avg': 55000, 'max': 75000},
            {'role': 'Software Engineer Intern', 'min': 35000, 'avg': 48000, 'max': 65000},
            {'role': 'Cloud Architect Intern', 'min': 45000, 'avg': 58000, 'max': 75000},
            {'role': 'Frontend Developer Intern', 'min': 30000, 'avg': 42000, 'max': 55000}
        ],
        'industry_growth': [
            {'sector': 'AI & Research', 'growth': 35},
            {'sector': 'Cloud & Infra', 'growth': 22},
            {'sector': 'Web Development', 'growth': 12},
            {'sector': 'Cybersecurity', 'growth': 18},
            {'sector': 'Data & Analytics', 'growth': 28}
        ],
        'hiring_pulse': {
            'active_postings': 1420,
            'interviews_today': 48,
            'offers_released': 12,
            'success_rate': '84%'
        }
    }
    return jsonify(market_data)

@app.route('/api/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    role_title = data.get('role_title', 'Software Engineer Intern')
    company_name = data.get('company_name', 'Tech Corp')
    
    conn = get_db_connection()
    profile = conn.execute('SELECT * FROM student_profiles WHERE user_id = ?', (session['user_id'],)).fetchone()
    conn.close()
    
    cgpa = 8.0
    skills = "Python, SQL, JavaScript"
    experience = "Fresher"
    projects = "Placement Intel portal"
    
    if profile:
        cgpa = profile['cgpa'] or cgpa
        skills = profile['skills'] or skills
        experience = profile['experience'] or experience
        projects = profile['projects'] or projects
        
    student_name = session['name']
    student_email = session['email']
    
    # Generate structured text
    letter = f"""Dear Hiring Manager at {company_name},

I am writing to express my strong interest in the {role_title} position. As a Computer Science & Engineering student with a CGPA of {cgpa}, I am eager to apply my technical skill set to your engineering challenges.

During my studies, I have developed expertise in {skills}. My hands-on projects, including {projects}, allowed me to build end-to-end solutions, optimize performance, and collaborate on design structures. Furthermore, my background in {experience} has prepared me for the fast-paced environment at {company_name}.

I am particularly drawn to your organization's commitment to innovation and look forward to contributing my problem-solving abilities to your team. Thank you for your time and consideration.

Sincerely,
{student_name}
{student_email}"""

    return jsonify({
        'success': True,
        'cover_letter': letter
    })

@app.route('/api/peer-comparison', methods=['GET'])
def get_peer_comparison():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    conn = get_db_connection()
    # Fetch all students score
    all_profiles = conn.execute('''
        SELECT sp.cgpa, sp.skills, sp.projects, sp.certifications, sp.experience, u.id as user_id
        FROM student_profiles sp
        JOIN users u ON sp.user_id = u.id
        WHERE u.role = 'student'
    ''').fetchall()
    
    # Calculate scores
    scores = []
    user_score = 50
    user_metrics = {'cgpa': 7.5, 'skills': 3, 'projects': 2, 'certs': 1, 'experience': 0}
    
    for r in all_profiles:
        skills_count = len([s.strip() for s in (r['skills'] or '').split(',') if s.strip()])
        proj_count = 0
        try: proj_count = int(''.join(filter(str.isdigit, (r['projects'] or '0')[:3])))
        except: pass
        cert_count = 0
        try: cert_count = int(''.join(filter(str.isdigit, (r['certifications'] or '0')[:3])))
        except: pass
        exp_months = 0
        try: exp_months = int(''.join(filter(str.isdigit, (r['experience'] or '0')[:3])))
        except: pass
        
        score = min(100, int(
            (r['cgpa'] or 0) * 6 +
            min(skills_count, 8) * 3 +
            min(proj_count, 5) * 4 +
            min(cert_count, 5) * 3 +
            min(exp_months, 12) * 1
        ))
        scores.append(score)
        
        if r['user_id'] == session['user_id']:
            user_score = score
            user_metrics = {
                'cgpa': r['cgpa'] or 0.0,
                'skills': skills_count,
                'projects': proj_count,
                'certs': cert_count,
                'experience': exp_months
            }
            
    # Cohort averages
    if len(all_profiles) > 0:
        avg_cgpa = round(sum(r['cgpa'] or 0.0 for r in all_profiles) / len(all_profiles), 2)
        avg_skills = round(sum(len([s.strip() for s in (r['skills'] or '').split(',') if s.strip()]) for r in all_profiles) / len(all_profiles), 1)
        avg_projects = 2.5
        avg_certs = 1.8
        avg_exp = 3.5
    else:
        avg_cgpa, avg_skills, avg_projects, avg_certs, avg_exp = 7.6, 4.0, 2.5, 1.8, 3.5
        
    scores.sort()
    percentile = 50.0
    if len(scores) > 0:
        less_than_user = sum(1 for s in scores if s < user_score)
        percentile = round((less_than_user / len(scores)) * 100, 1)
        if percentile == 0: percentile = 10.0 # visual floor
        
    conn.close()
    
    return jsonify({
        'user_score': user_score,
        'percentile': percentile,
        'user_metrics': user_metrics,
        'cohort_averages': {
            'cgpa': avg_cgpa,
            'skills': avg_skills,
            'projects': avg_projects,
            'certs': avg_certs,
            'experience': avg_exp
        }
    })

@app.route('/api/interview/certificates', methods=['GET'])
def get_interview_certificates():
    if 'user_id' not in session:
        return jsonify([]), 200
        
    email = session['email']
    conn = get_db_connection()
    # Fetch all interviews for this student with average_score >= 70
    rows = conn.execute('''
        SELECT id, role, average_score, completed_at
        FROM interviews
        WHERE student_email = ? AND average_score >= 70
        ORDER BY completed_at DESC
    ''', (email,)).fetchall()
    conn.close()
    
    return jsonify([dict(r) for r in rows])

@app.route('/api/apply/bulk_update', methods=['POST'])
def bulk_update_applications():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid body'}), 400
        
    emails = data.get('emails', [])
    internship_ids = data.get('internship_ids', [])
    new_status = data.get('status')
    
    if not emails or not internship_ids or not new_status:
        return jsonify({'error': 'Missing emails, internship IDs or status'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for email, int_id in zip(emails, internship_ids):
        cursor.execute(
            'UPDATE applications SET status = ? WHERE student_email = ? AND internship_id = ?',
            (new_status, email, int_id)
        )
        internship = cursor.execute('SELECT title, company FROM internships WHERE id = ?', (int_id,)).fetchone()
        co = internship['company'] if internship else 'Employer'
        r_title = internship['title'] if internship else 'Role'
        insert_notification(
            email,
            f"{co} Recruitment Team advanced your application for '{r_title}' to stage: {new_status}.",
            icon="fa-clipboard-check",
            title=f"Application Update: {new_status}",
            category="application",
            action_tab="my-applications"
        )
        
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': f'Bulk updated {len(emails)} candidate statuses to {new_status}'})


# ================== NEW v3.1 PREMIUM SUBSYSTEMS ENDPOINTS ==================

@app.route('/api/chatbot/query', methods=['POST'])
def chatbot_query():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400
        
    query = data.get('query', '').strip().lower()
    
    # Matching rules
    reply = "I'm your AI placement coach. Try asking about 'resume tips', 'mock interviews', 'career roadmaps', or 'improving CGPA'!"
    
    if "resume" in query or "cv" in query:
        reply = "Resume Checklist:\n1. Keep it to a single page.\n2. Put technical skills at the top.\n3. Quantify project impacts (e.g. 'Improved efficiency by 24%').\n4. Select Classic Corporate or Creative themes in our Resume Builder tab to export styled formats!"
    elif "interview" in query or "practice" in query or "coach" in query:
        reply = "Interview Coach Guidelines:\n1. Choose your target internship role in the AI Interview Coach tab.\n2. Practice verbal questions, answer using the mic button.\n3. Make sure to minimize crutch/filler words like 'um', 'like', or 'actually' to secure clarity badges!"
    elif "roadmap" in query or "career" in query or "skills gap" in query:
        reply = "Our AI Career Advisor uses node flowchart visuals to trace skill gaps between your resume and the target internship requirements, curating learning links for you. Try out the 'Career Advisor' tab!"
    elif "cgpa" in query or "grades" in query:
        reply = "CGPA plays a heavy role in early recruiter screening indexes. Aim for >= 8.5 CGPA to unlock elite Tier-1 job lists, or complete 3+ cloud/DevOps certifications to compensate!"
    elif "hi" in query or "hello" in query or "welcome" in query:
        reply = "Hello! I am your PlacementIntel AI Advisor. How can I help you take your career prep to the next level today?"
    elif "jobs" in query or "salary" in query or "stipend" in query:
        reply = "We track placement trends! Software roles average ₹48k/mo, whereas AI/ML roles average ₹65k/mo stipends. Go to the 'Market Insights' tab to see salary curves!"
        
    return jsonify({
        'success': True,
        'reply': reply
    })

@app.route('/api/sandbox/run', methods=['POST'])
def sandbox_run():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    problem_id = data.get('problem_id', 'two_sum')
    code = data.get('code', '')
    
    # Restrict code size
    if len(code) > 2000:
        return jsonify({'success': False, 'output': 'Code limit exceeded.', 'passed': False})
        
    passed = False
    output = ""
    
    # We will simulate local exec safely
    loc = {}
    try:
        # Restricted execution context
        exec(code, {'__builtins__': {
            'range': range, 'len': len, 'print': lambda *args: None, 
            'int': int, 'str': str, 'list': list, 'dict': dict, 'set': set, 'tuple': tuple,
            'float': float, 'bool': bool, 'abs': abs, 'min': min, 'max': max, 'sum': sum,
            'enumerate': enumerate, 'zip': zip, 'reversed': reversed, 'sorted': sorted,
            'map': map, 'filter': filter, 'any': any, 'all': all, 'round': round
        }}, loc)
        
        if problem_id == 'two_sum':
            if 'two_sum' not in loc:
                output = "Error: Function 'two_sum(nums, target)' not found."
            else:
                f = loc['two_sum']
                test1 = f([2, 7, 11, 15], 9) == [0, 1] or f([2, 7, 11, 15], 9) == (0, 1)
                test2 = f([3, 2, 4], 6) == [1, 2] or f([3, 2, 4], 6) == (1, 2)
                test3 = f([3, 3], 6) == [0, 1] or f([3, 3], 6) == (0, 1)
                
                if test1 and test2 and test3:
                    passed = True
                    output = "All 3 test cases passed successfully!\nTest 1: two_sum([2,7,11,15], 9) -> [0,1] (Pass)\nTest 2: two_sum([3,2,4], 6) -> [1,2] (Pass)\nTest 3: two_sum([3,3], 6) -> [0,1] (Pass)"
                else:
                    output = f"Failed test cases.\nExample: two_sum([2,7,11,15], 9) returned {f([2,7,11,15], 9)}"
                    
        elif problem_id == 'fizzbuzz':
            if 'fizzbuzz' not in loc:
                output = "Error: Function 'fizzbuzz(n)' not found."
            else:
                f = loc['fizzbuzz']
                test1 = f(3) == ["1", "2", "Fizz"]
                test2 = f(5) == ["1", "2", "Fizz", "4", "Buzz"]
                test3 = f(15)[-1] == "FizzBuzz"
                
                if test1 and test2 and test3:
                    passed = True
                    output = "All 3 test cases passed successfully!\nTest 1: fizzbuzz(3) -> ['1','2','Fizz'] (Pass)\nTest 2: fizzbuzz(5) -> ['1','2','Fizz','4','Buzz'] (Pass)\nTest 3: fizzbuzz(15)[14] -> 'FizzBuzz' (Pass)"
                else:
                    output = f"Failed test cases.\nExample: fizzbuzz(5) returned {f(5)}"
                    
        elif problem_id == 'palindrome':
            if 'is_palindrome' not in loc:
                output = "Error: Function 'is_palindrome(s)' not found."
            else:
                f = loc['is_palindrome']
                test1 = f("A man, a plan, a canal: Panama") == True
                test2 = f("race a car") == False
                test3 = f(" ") == True
                
                if test1 and test2 and test3:
                    passed = True
                    output = "All 3 test cases passed successfully!\nTest 1: is_palindrome('A man, a plan, a canal: Panama') -> True (Pass)\nTest 2: is_palindrome('race a car') -> False (Pass)\nTest 3: is_palindrome(' ') -> True (Pass)"
                else:
                    output = f"Failed test cases.\nExample: is_palindrome('race a car') returned {f('race a car')}"

        elif problem_id == 'binary_search':
            if 'binary_search' not in loc:
                output = "Error: Function 'binary_search(nums, target)' not found."
            else:
                f = loc['binary_search']
                test1 = f([-1, 0, 3, 5, 9, 12], 9) == 4
                test2 = f([-1, 0, 3, 5, 9, 12], 2) == -1
                test3 = f([5], 5) == 0
                if test1 and test2 and test3:
                    passed = True
                    output = "All 3 test cases passed successfully!\nTest 1: binary_search([-1,0,3,5,9,12], 9) -> 4 (Pass)\nTest 2: binary_search([-1,0,3,5,9,12], 2) -> -1 (Pass)\nTest 3: binary_search([5], 5) -> 0 (Pass)"
                else:
                    output = f"Failed test cases.\nExample: binary_search([-1,0,3,5,9,12], 9) returned {f([-1,0,3,5,9,12], 9)}"

        elif problem_id == 'valid_parentheses':
            if 'is_valid' not in loc:
                output = "Error: Function 'is_valid(s)' not found."
            else:
                f = loc['is_valid']
                test1 = f("()[]{}") == True
                test2 = f("(]") == False
                test3 = f("([{}])") == True
                if test1 and test2 and test3:
                    passed = True
                    output = "All 3 test cases passed successfully!\nTest 1: is_valid('()[]{}') -> True (Pass)\nTest 2: is_valid('(]') -> False (Pass)\nTest 3: is_valid('([{}])') -> True (Pass)"
                else:
                    output = f"Failed test cases.\nExample: is_valid('(]') returned {f('(]')}"

        elif problem_id == 'max_subarray':
            if 'max_sub_array' not in loc:
                output = "Error: Function 'max_sub_array(nums)' not found."
            else:
                f = loc['max_sub_array']
                test1 = f([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6
                test2 = f([1]) == 1
                test3 = f([5, 4, -1, 7, 8]) == 23
                if test1 and test2 and test3:
                    passed = True
                    output = "All 3 test cases passed successfully!\nTest 1: max_sub_array([-2,1,-3,4,-1,2,1,-5,4]) -> 6 (Pass)\nTest 2: max_sub_array([1]) -> 1 (Pass)\nTest 3: max_sub_array([5,4,-1,7,8]) -> 23 (Pass)"
                else:
                    output = f"Failed test cases.\nExample: max_sub_array([5,4,-1,7,8]) returned {f([5,4,-1,7,8])}"
                    
    except Exception as e:
        output = f"Runtime Execution Error: {e}"
        
    if passed and session.get('role') == 'student':
        conn = get_db_connection()
        cursor = conn.cursor()
        profile = cursor.execute('SELECT * FROM student_profiles WHERE user_id = ?', (session['user_id'],)).fetchone()
        if profile:
            chal = CODING_CHALLENGES_CATALOG.get(problem_id, {})
            chal_title = chal.get('title', problem_id.replace('_', ' ').title())
            chal_tag = chal.get('tag', 'Algorithms')
            insert_notification(
                session['email'],
                f"Passed all test cases for {chal_title} ({chal_tag}). Earned +15 skill points towards your technical readiness index.",
                icon="fa-code",
                title="Coding Challenge Passed",
                category="coding",
                action_tab="mock-coding"
            )
        conn.commit()
        conn.close()
        
    return jsonify({
        'success': True,
        'output': output,
        'passed': passed
    })

@app.route('/api/scheduler/slots', methods=['GET', 'POST'])
def handle_scheduler_slots():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    role = session['role']
    conn = get_db_connection()
    
    if request.method == 'POST':
        if role != 'recruiter':
            conn.close()
            return jsonify({'error': 'Only recruiters can create interview slots'}), 403
            
        data = request.get_json()
        slot_date = data.get('slot_date')
        slot_time = data.get('slot_time')
        interviewer_name = data.get('interviewer_name')
        
        if not slot_date or not slot_time or not interviewer_name:
            conn.close()
            return jsonify({'error': 'Missing slot date, time or interviewer name'}), 400
            
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO interview_slots (recruiter_email, slot_date, slot_time, interviewer_name, status) VALUES (?, ?, ?, ?, ?)',
            (session['email'], slot_date, slot_time, interviewer_name, 'Available')
        )
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Interview slot posted successfully!'})
        
    else:
        if role == 'student':
            slots = conn.execute('SELECT * FROM interview_slots WHERE status = "Available" OR booked_by_student_email = ?', (session['email'],)).fetchall()
        else:
            slots = conn.execute('SELECT * FROM interview_slots WHERE recruiter_email = ?', (session['email'],)).fetchall()
            
        conn.close()
        return jsonify([dict(s) for s in slots])

@app.route('/api/scheduler/book', methods=['POST'])
def book_scheduler_slot():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    if session['role'] != 'student':
        return jsonify({'error': 'Only students can book interview slots'}), 403
        
    data = request.get_json()
    slot_id = data.get('slot_id')
    
    if not slot_id:
        return jsonify({'error': 'Missing slot ID'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    slot = cursor.execute('SELECT * FROM interview_slots WHERE id = ?', (slot_id,)).fetchone()
    if not slot:
        conn.close()
        return jsonify({'error': 'Slot not found'}), 404
        
    if slot['status'] != 'Available':
        conn.close()
        return jsonify({'error': 'Slot is already booked'}), 400
        
    cursor.execute(
        'UPDATE interview_slots SET booked_by_student_email = ?, status = ? WHERE id = ?',
        (session['email'], 'Booked', slot_id)
    )
    cursor.execute(
        'UPDATE applications SET status = ? WHERE student_email = ?',
        ('Interviewing', session['email'])
    )
    conn.commit()
    conn.close()
    
    formatted_date = slot['slot_date']
    try:
        from datetime import datetime
        d_parsed = datetime.strptime(slot['slot_date'], '%Y-%m-%d')
        formatted_date = d_parsed.strftime('%b %d, %Y')
    except Exception:
        pass

    insert_notification(
        session['email'],
        f"Technical assessment confirmed with {slot['interviewer_name']} on {formatted_date} at {slot['slot_time']}. Review company intelligence dossier in preparation.",
        icon="fa-calendar-check",
        title="Technical Interview Scheduled",
        category="interview",
        action_tab="mock-interview"
    )
    insert_notification(
        slot['recruiter_email'],
        f"Candidate {session.get('name', session['email'])} booked technical interview on {formatted_date} at {slot['slot_time']}.",
        icon="fa-calendar-check",
        title="Candidate Interview Booked",
        category="interview",
        action_tab="employer-panel"
    )
    
    return jsonify({'success': True, 'message': 'Interview slot booked successfully!'})

@app.route('/api/university/export', methods=['GET'])
def university_export_csv():
    if 'user_id' not in session or session['role'] != 'university':
        return jsonify({'error': 'Unauthorized'}), 401
        
    import io
    import csv
    from flask import Response
    
    conn = get_db_connection()
    
    students_query = '''
        SELECT u.name, u.email, sp.cgpa, sp.skills, sp.projects, sp.certifications, sp.experience
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.role = 'student'
    '''
    rows = conn.execute(students_query).fetchall()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['Student Name', 'Email Address', 'CGPA', 'Skills', 'Projects Count', 'Certifications Count', 'Experience Months', 'Employability Score'])
    
    for r in rows:
        r_dict = dict(r)
        skills_count = len([s.strip() for s in (r_dict['skills'] or '').split(',') if s.strip()])
        proj_count = 0
        try: proj_count = int(''.join(filter(str.isdigit, (r_dict['projects'] or '0')[:3])))
        except: pass
        cert_count = 0
        try: cert_count = int(''.join(filter(str.isdigit, (r_dict['certifications'] or '0')[:3])))
        except: pass
        exp_months = 0
        try: exp_months = int(''.join(filter(str.isdigit, (r_dict['experience'] or '0')[:3])))
        except: pass
        
        score = min(100, int(
            (r_dict['cgpa'] or 0) * 6 +
            min(skills_count, 8) * 3 +
            min(proj_count, 5) * 4 +
            min(cert_count, 5) * 3 +
            min(exp_months, 12) * 1
        ))
        
        writer.writerow([
            r_dict['name'],
            r_dict['email'],
            r_dict['cgpa'] or 'N/A',
            r_dict['skills'] or 'None',
            proj_count,
            cert_count,
            exp_months,
            f"{score}%"
        ])
        
    conn.close()
    
    response = Response(output.getvalue(), mimetype='text/csv')
    response.headers['Content-Disposition'] = 'attachment; filename=placement_cohort_report.csv'
    return response


# ==============================================================================
# ENHANCED MODULES: ATS SCANNER, RESUME TAILORING, COMPANY DOSSIERS & CERTIFICATES
# ==============================================================================

CODING_CHALLENGES_CATALOG = [
    {
        "id": "two_sum",
        "title": "Two Sum (Array Hash Map)",
        "difficulty": "Easy",
        "skill": "Data structures",
        "signature": "def two_sum(nums: list[int], target: int) -> list[int]:",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution.",
        "starter_code": "def two_sum(nums, target):\n    # Write your solution using a dictionary hash map for O(n) runtime\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            return [seen[diff], i]\n        seen[n] = i\n    return []\n"
    },
    {
        "id": "binary_search",
        "title": "Binary Search (O(log n) Lookup)",
        "difficulty": "Easy",
        "skill": "Algorithms",
        "signature": "def binary_search(nums: list[int], target: int) -> int:",
        "description": "Given an array of integers nums sorted in ascending order and a target value, return the index if target exists or -1 otherwise in O(log n) time.",
        "starter_code": "def binary_search(nums, target):\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n"
    },
    {
        "id": "valid_parentheses",
        "title": "Valid Parentheses (Stack)",
        "difficulty": "Medium",
        "skill": "Data structures",
        "signature": "def is_valid(s: str) -> bool:",
        "description": "Given a string s containing '()[]{}', determine if the bracket sequences are valid. Open brackets must be closed by the same type of brackets in the correct order.",
        "starter_code": "def is_valid(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack\n"
    },
    {
        "id": "max_subarray",
        "title": "Maximum Subarray (Kadane's Dynamic Programming)",
        "difficulty": "Medium",
        "skill": "Algorithms",
        "signature": "def max_sub_array(nums: list[int]) -> int:",
        "description": "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
        "starter_code": "def max_sub_array(nums):\n    max_sum = current_sum = nums[0]\n    for num in nums[1:]:\n        current_sum = max(num, current_sum + num)\n        max_sum = max(max_sum, current_sum)\n    return max_sum\n"
    },
    {
        "id": "palindrome",
        "title": "Valid Palindrome (String Two Pointers)",
        "difficulty": "Easy",
        "skill": "Python",
        "signature": "def is_palindrome(s: str) -> bool:",
        "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing non-alphanumeric characters, it reads the same forward and backward.",
        "starter_code": "def is_palindrome(s):\n    filtered = [c.lower() for c in s if c.isalnum()]\n    return filtered == filtered[::-1]\n"
    },
    {
        "id": "fizzbuzz",
        "title": "FizzBuzz (Modulo Control Flow)",
        "difficulty": "Easy",
        "skill": "Python",
        "signature": "def fizzbuzz(n: int) -> list[str]:",
        "description": "Given an integer n, return a string array answer where answer[i] is 'FizzBuzz' if i is divisible by 3 and 5, 'Fizz' if divisible by 3, 'Buzz' if divisible by 5, or str(i) otherwise.",
        "starter_code": "def fizzbuzz(n):\n    res = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            res.append('FizzBuzz')\n        elif i % 3 == 0:\n            res.append('Fizz')\n        elif i % 5 == 0:\n            res.append('Buzz')\n        else:\n            res.append(str(i))\n    return res\n"
    }
]

COMPANY_INTELLIGENCE = {
    "google": {
        "company": "Google",
        "tier": "Tier 1 Global Product",
        "stipend": "₹1,25,000 / month",
        "cutoff": "8.5+ CGPA",
        "key_skills": ["Data structures", "Algorithms", "C++", "Python", "Distributed systems"],
        "rounds": [
            {"round": "Online Assessment (OA)", "duration": "90 mins", "focus": "2 LeetCode Medium/Hard algorithmic questions + CS Core concepts"},
            {"round": "Technical Round 1", "duration": "45 mins", "focus": "Trees, Graphs, Recursion, Time & Space Complexity analysis"},
            {"round": "Technical Round 2", "duration": "45 mins", "focus": "Dynamic Programming, Memory Locality, System Architecture"},
            {"round": "Googlyness & Leadership", "duration": "30 mins", "focus": "Collaboration, Handling ambiguity, Inclusive teamwork"}
        ],
        "top_questions": [
            "Implement an LRU Cache with O(1) get and put operations.",
            "Find the median in a real-time stream of integers using two heaps.",
            "Explain how Google handles distributed consensus across nodes.",
            "Serialize and deserialize a N-ary tree.",
            "Optimize a SQL query and index design for a database with 100M rows."
        ],
        "pro_tip": "Always state edge cases (empty inputs, nulls, negative values) and analyze time/space complexities before typing a single line of code."
    },
    "microsoft": {
        "company": "Microsoft",
        "tier": "Tier 1 Global Product",
        "stipend": "₹1,00,000 / month",
        "cutoff": "8.0+ CGPA",
        "key_skills": ["C++", "C#", "Java", "OOP design", "Data structures", "Cloud basics"],
        "rounds": [
            {"round": "Codility Online Test", "duration": "60 mins", "focus": "3 coding questions focusing on arrays, strings, and hash sets"},
            {"round": "Technical Round 1", "duration": "45 mins", "focus": "Linked lists, Trees, OOP inheritance vs composition"},
            {"round": "Technical Round 2", "duration": "45 mins", "focus": "Low Level Design (LLD), concurrency, debugging scenarios"},
            {"round": "As-Appropriate (AA) Bar Raiser", "duration": "45 mins", "focus": "Growth mindset, technical depth, project architecture"}
        ],
        "top_questions": [
            "Detect and remove loop in a singly linked list.",
            "Implement an autocomplete search feature using a Trie data structure.",
            "Explain the difference between synchronous and asynchronous microservices.",
            "Design an in-memory Parking Lot system following SOLID principles.",
            "Find the lowest common ancestor (LCA) in a binary search tree."
        ],
        "pro_tip": "Microsoft values clean Object-Oriented Design. Use design patterns (Factory, Strategy, Observer) and write self-documenting code."
    },
    "amazon": {
        "company": "Amazon",
        "tier": "Tier 1 Global Tech",
        "stipend": "₹85,000 / month",
        "cutoff": "7.5+ CGPA",
        "key_skills": ["Java", "Python", "AWS", "Algorithms", "System scalability"],
        "rounds": [
            {"round": "Online Assessment (OA)", "duration": "90 mins", "focus": "2 coding problems + Work Simulation Assessment"},
            {"round": "Technical Round 1", "duration": "60 mins", "focus": "Hashmaps, Priority Queues, Binary Trees + 2 Leadership Principles"},
            {"round": "Technical Round 2", "duration": "60 mins", "focus": "System Design / Scalability + 2 Leadership Principles"},
            {"round": "Bar Raiser Round", "duration": "60 mins", "focus": "Deep architectural critique + Customer Obsession scenarios"}
        ],
        "top_questions": [
            "Top K Frequent Elements in an array using Min-Heap.",
            "Course Schedule II (Topological Sort on Directed Acyclic Graph).",
            "Trapping Rain Water problem using Two Pointer approach.",
            "Design a Key-Value Cache with eventual consistency and TTL expiration.",
            "Tell me about a time you made a decision without complete data (Bias for Action)."
        ],
        "pro_tip": "Every answer must be structured strictly in STAR format (Situation, Task, Action, Result) mapped directly to Amazon's 16 Leadership Principles."
    },
    "cisco": {
        "company": "Cisco",
        "tier": "Tier 1 Enterprise Networking",
        "stipend": "₹75,000 / month",
        "cutoff": "8.0+ CGPA",
        "key_skills": ["Networking", "TCP/IP", "C++", "Python", "Linux kernel", "Socket programming"],
        "rounds": [
            {"round": "Aptitude + Technical OA", "duration": "60 mins", "focus": "Aptitude, Networking MCQs, 2 coding problems"},
            {"round": "Technical Round 1", "duration": "45 mins", "focus": "TCP 3-way handshake, OSI layers, socket APIs in C/Python"},
            {"round": "Technical Round 2", "duration": "45 mins", "focus": "Operating Systems, paging, concurrency, network packet routing"},
            {"round": "Managerial & HR", "duration": "30 mins", "focus": "Culture fit, communication, passion for networking infrastructure"}
        ],
        "top_questions": [
            "Explain TCP 3-way handshake and how SYN flood attacks are mitigated.",
            "Implement a CIDR subnet calculator and explain IP routing tables.",
            "Difference between Process and Thread; explain virtual memory paging.",
            "Reverse words in a given sentence in-place without auxiliary space.",
            "Explain the exact packet flow when you type 'google.com' in a browser."
        ],
        "pro_tip": "Know the OSI model and TCP/IP stack inside out. Be ready to explain how switches, routers, and firewalls handle packet headers."
    },
    "meta": {
        "company": "Meta",
        "tier": "Tier 1 Global Product",
        "stipend": "₹1,30,000 / month",
        "cutoff": "8.5+ CGPA",
        "key_skills": ["Python", "C++", "React", "Distributed systems", "Algorithms"],
        "rounds": [
            {"round": "Technical Screening", "duration": "45 mins", "focus": "2 coding problems under strict time limit (20 mins each)"},
            {"round": "Onsite Coding 1", "duration": "45 mins", "focus": "Graph traversals (BFS/DFS), Dynamic Programming"},
            {"round": "Onsite Coding 2", "duration": "45 mins", "focus": "String/Array algorithms, Binary Search variations"},
            {"round": "Behavioral Round", "duration": "45 mins", "focus": "Ownership, conflict resolution, technical trade-offs"}
        ],
        "top_questions": [
            "Word Break II using Dynamic Programming and Memoization.",
            "Lowest Common Ancestor in a Binary Tree with parent pointers.",
            "Design a real-time newsfeed ranking algorithm.",
            "Merge K Sorted Lists using Min-Heap.",
            "Find minimum window substring containing all characters."
        ],
        "pro_tip": "Meta values coding speed. You are expected to solve 2 medium/hard questions in a 45-minute call with working, clean code."
    },
    "infosys": {
        "company": "Infosys",
        "tier": "Global IT Services & Consulting",
        "stipend": "₹35,000 - ₹50,000 / month",
        "cutoff": "6.5+ CGPA",
        "key_skills": ["Java", "SQL", "Python", "Web development", "Communication"],
        "rounds": [
            {"round": "HackWithInfy / InfyTQ Exam", "duration": "90 mins", "focus": "Core DSA, DBMS, OOP MCQs + 2 coding questions"},
            {"round": "Technical Interview", "duration": "30 mins", "focus": "Core Java, SQL queries, Final Year Capstone Project review"},
            {"round": "HR Interview", "duration": "20 mins", "focus": "Communication, adaptability, relocation willingness"}
        ],
        "top_questions": [
            "Explain OOP pillars with real-world examples.",
            "Write a SQL query to find the second highest salary without using LIMIT.",
            "Difference between ArrayList and LinkedList in Java.",
            "Explain database normalization (1NF, 2NF, 3NF).",
            "What was your individual contribution to your academic project?"
        ],
        "pro_tip": "Speak clearly and confidently. Thoroughly understand every project and technology written on your resume."
    }
}

@app.route('/api/sandbox/challenges', methods=['GET'])
def get_sandbox_challenges():
    return jsonify({
        'success': True,
        'challenges': CODING_CHALLENGES_CATALOG
    })

@app.route('/api/company-cheat-sheet/<company_name>', methods=['GET'])
def get_company_cheat_sheet(company_name):
    c_key = company_name.strip().lower()
    for key, data in COMPANY_INTELLIGENCE.items():
        if key in c_key or c_key in key:
            return jsonify({'success': True, 'dossier': data})
    
    # Generic fallback dossier
    return jsonify({
        'success': True,
        'dossier': {
            'company': company_name,
            'tier': 'Corporate Technology Hiring',
            'stipend': '₹40,000 - ₹75,000 / month',
            'cutoff': '7.0+ CGPA',
            'key_skills': ['Data structures', 'Algorithms', 'SQL', 'Python', 'Problem solving'],
            'rounds': [
                {'round': 'Online Coding Assessment', 'duration': '60-90 mins', 'focus': '2-3 algorithmic problems + CS fundamentals'},
                {'round': 'Technical Interview 1', 'duration': '45 mins', 'focus': 'Data structures, Projects, Core subject fundamentals'},
                {'round': 'Technical Interview 2', 'duration': '45 mins', 'focus': 'Problem solving, SQL queries, System scenarios'},
                {'round': 'HR & Behavioral', 'duration': '30 mins', 'focus': 'Communication skills, culture fit, situational judgment'}
            ],
            'top_questions': [
                'Reverse a linked list iteratively and recursively.',
                'Write an optimized SQL query involving JOINs and GROUP BY.',
                'Explain how you handled a technical roadblock in your college project.',
                'Explain how hash collisions are resolved in a hash table.',
                'Describe the difference between process and thread concurrency.'
            ],
            'pro_tip': 'Review your resume thoroughly, explain your thought process out loud, and test your code with boundary cases.'
        }
    })

@app.route('/api/ats-scan', methods=['GET', 'POST'])
def ats_scanner():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    profile = cursor.execute('SELECT * FROM student_profiles WHERE user_id = ?', (session['user_id'],)).fetchone()
    conn.close()

    if not profile:
        return jsonify({'success': False, 'error': 'No profile found. Please upload a resume first.'}), 400

    profile_dict = dict(profile)
    text = (profile_dict.get('parsed_text') or '')
    email = profile_dict.get('email') or session.get('email') or ''
    cgpa = profile_dict.get('cgpa') or 0.0
    skills_str = profile_dict.get('skills') or ''

    # Evaluate ATS Breakdown
    # 1. Contact & Header (20 pts)
    contact_score = 10
    if email and '@' in email: contact_score += 5
    if re.search(r'github\.com|linkedin\.com', text, re.I): contact_score += 5

    # 2. Action Verbs (25 pts)
    ACTION_VERBS = [
        'architected', 'engineered', 'developed', 'deployed', 'implemented', 'optimized',
        'spearheaded', 'refactored', 'automated', 'scaled', 'integrated', 'designed',
        'accelerated', 'orchestrated', 'built', 'analyzed', 'configured', 'transformed',
        'reduced', 'increased', 'streamlined', 'modeled', 'trained', 'evaluated'
    ]
    found_verbs = [v for v in ACTION_VERBS if re.search(rf'\b{v}\b', text, re.I)]
    action_verb_score = min(25, max(12, len(found_verbs) * 4))

    # 3. Quantified Metrics (20 pts)
    quant_matches = re.findall(r'\b\d+%\b|\b\d+x\b|\b\d+\s*(?:ms|users|requests|records|k|m)\b', text, re.I)
    quant_score = min(20, max(8, len(quant_matches) * 5))

    # 4. Standard Section Structure (20 pts)
    structure_score = 10
    sections_found = []
    for s_name in ['education', 'skills', 'projects', 'experience', 'certifications']:
        if re.search(rf'\b{s_name}\b', text, re.I):
            sections_found.append(s_name.capitalize())
    structure_score += min(10, len(sections_found) * 2)

    # 5. Technical Keyword Density (15 pts)
    skills_list = [s.strip() for s in skills_str.split(',') if s.strip()]
    keyword_score = min(15, max(8, len(skills_list) * 2))

    total_ats = min(100, contact_score + action_verb_score + quant_score + structure_score + keyword_score)

    strengths = []
    improvements = []
    
    if contact_score >= 18:
        strengths.append("Clean contact information and professional profile links detected.")
    else:
        improvements.append("Add clear LinkedIn and GitHub profile links in your resume header.")

    if len(found_verbs) >= 4:
        strengths.append(f"Strong active voice: Identified {len(found_verbs)} high-impact action verbs ({', '.join(found_verbs[:3])}).")
    else:
        improvements.append("Start each project bullet point with strong action verbs (e.g. 'Architected', 'Optimized', 'Deployed').")

    if quant_score >= 15:
        strengths.append("High metric density: Resume includes quantified results and measurable business impact.")
    else:
        improvements.append("Quantify your project outcomes (e.g., 'Reduced query latency by 35%', 'Scaled to 1,000+ users').")

    if len(skills_list) >= 5:
        strengths.append(f"ATS keyword count is healthy: {len(skills_list)} industry technical skills parsed.")
    else:
        improvements.append("Incorporate more industry-standard keywords like Docker, Cloud (AWS), and CI/CD.")

    bullet_enhancements = [
        {
            "original": "Worked on a machine learning project using python to predict house prices.",
            "enhanced": "Engineered an end-to-end predictive ML pipeline in Python using Random Forest; achieved 92.4% R² accuracy and reduced latency by 40%."
        },
        {
            "original": "Built a website in React and Node.js for college events.",
            "enhanced": "Architected a full-stack event portal in React and Express.js with JWT authentication; supported 2,500+ student registrations without downtime."
        }
    ]

    insert_notification(
        session['email'],
        f"ATS scan completed: {total_ats}/100 score ({len(found_verbs)} action verbs, {len(sections_found)} standard sections). Actionable optimizations generated.",
        icon="fa-file-shield",
        title="ATS Compatibility Scan",
        category="resume",
        action_tab="placement-matching"
    )

    return jsonify({
        'success': True,
        'ats_score': total_ats,
        'overall_score': total_ats,
        'category_scores': {
            'contact_info': contact_score * 5,
            'action_verbs': int(action_verb_score * 4),
            'quantified_metrics': int(quant_score * 5),
            'structure': int(structure_score * 5),
            'keyword_density': int(keyword_score * 6.6)
        },
        'metrics': {
            'contact_info': contact_score * 5,
            'action_verbs': int(action_verb_score * 4),
            'quantified_impact': int(quant_score * 5),
            'structure': int(structure_score * 5),
            'keyword_density': int(keyword_score * 6.6)
        },
        'strengths': strengths,
        'improvements': improvements,
        'detected_action_verbs': found_verbs,
        'bullet_enhancements': bullet_enhancements,
        'bullet_upgrades': [
            {
                "original": b["original"],
                "upgraded": b["enhanced"],
                "impact": "Quantified impact + Action Verb"
            } for b in bullet_enhancements
        ],
        'sections_detected': sections_found
    })

@app.route('/api/tailor-resume', methods=['POST'])
def tailor_resume():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    company = data.get('company', 'Target Company')
    role = data.get('role', 'Software Engineer Intern')
    required_skills_str = data.get('required_skills', 'Python, SQL, Algorithms')

    conn = get_db_connection()
    cursor = conn.cursor()
    profile = cursor.execute('SELECT * FROM student_profiles WHERE user_id = ?', (session['user_id'],)).fetchone()
    conn.close()

    skills = [s.strip() for s in (profile['skills'] if profile else '').split(',') if s.strip()]
    cgpa = profile['cgpa'] if profile else 8.0

    tailored_summary = (
        f"Goal-oriented Computer Science undergraduate (CGPA: {cgpa}) passionate about engineering scalable solutions "
        f"for {company}. Demonstrates strong core foundation in {', '.join(skills[:3]) or 'software engineering'} with proven "
        f"hands-on project experience aligned with {role} responsibilities. Eager to contribute high-impact code and drive performance optimization."
    )

    req_skills = [s.strip() for s in required_skills_str.split(',') if s.strip()]
    tailored_bullets = [
        f"Designed and deployed modular services adhering to {company}'s focus on {req_skills[0] if req_skills else 'reliable software architecture'}.",
        f"Optimized performance and data throughput utilizing {req_skills[1] if len(req_skills) > 1 else 'clean algorithmic patterns'}, improving system responsiveness by 30%."
    ]

    insert_notification(
        session['email'],
        f"Customized summary & targeted experience bullets generated for '{role}' at {company}.",
        icon="fa-wand-magic-sparkles",
        title=f"Tailored Resume: {company}",
        category="resume",
        action_tab="placement-matching"
    )

    return jsonify({
        'success': True,
        'company': company,
        'role': role,
        'target_role': role,
        'tailored_summary': tailored_summary,
        'highlight_skills': req_skills[:5],
        'top_skills': req_skills[:5],
        'tailored_bullets': tailored_bullets,
        'featured_bullets': tailored_bullets
    })

@app.route('/api/certificate/data', methods=['GET'])
def get_certificate_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    profile = cursor.execute('SELECT * FROM student_profiles WHERE user_id = ?', (session['user_id'],)).fetchone()
    user = cursor.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    conn.close()

    name = session.get('name') or (user['name'] if user else 'Ritvik Medam')
    email = session.get('email', 'student@rvu.edu.in')
    cgpa = profile['cgpa'] if profile and 'cgpa' in profile.keys() else 8.75
    skills_raw = profile['skills'] if profile and 'skills' in profile.keys() else 'Python, Machine Learning, Data Structures, Algorithms, SQL, Git'
    skills = [s.strip().title() for s in (skills_raw or '').split(',') if s.strip()]

    # Generate unique verifiable credential ID
    cred_seed = f"{email}-{cgpa}-{name}-2026"
    hash_id = hashlib.sha256(cred_seed.encode()).hexdigest()[:10].upper()
    cred_id = f"RV-INTEL-2026-{hash_id}"
    tier_level = 'Tier-1 Highly Employable' if cgpa >= 8.0 else 'Placement Certified'
    issued_date = datetime.now().strftime('%B %d, %Y')

    return jsonify({
        'success': True,
        'student_name': name,
        'tier_level': tier_level,
        'cgpa': cgpa,
        'skills': skills[:6] if skills else ['Python', 'Data Structures', 'Machine Learning'],
        'issued_date': issued_date,
        'credential_id': cred_id,
        'certificate': {
            'credential_id': cred_id,
            'recipient_name': name,
            'recipient_email': email,
            'cgpa': cgpa,
            'readiness_tier': tier_level,
            'verified_competencies': skills[:6] if skills else ['Python', 'Data Structures'],
            'issue_date': issued_date,
            'issuing_authority': 'PlacementIntel Center of Career & Employability Systems',
            'institution': 'RV University Placement & Corporate Relations Cell',
            'verification_url': f"http://127.0.0.1:5050/verify/{cred_id}"
        }
    })


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
