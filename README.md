# AI-Driven Placement & Interview Intelligence Platform

An end-to-end AI-powered portal designed to optimize university placement drives and recruitment pipelines. The system parses resumes using NLP, predicts student employability scores using a Random Forest classifier, recommends matching internships via TF-IDF & Cosine Similarity, and features an interactive technical mock interview coach terminal with speech recognition and verbal filler-word analytics.

---

## 🚀 Key Features

* **🤖 AI Mock Interview Practice Simulator**: An interactive technical coding terminal matching the targeted internship roles. Features:
  * **Text-to-Speech (TTS)**: narrating questions aloud using Web Speech API synthesis (Samantha/Google voices).
  * **Speech-to-Text (STT)**: streaming verbal answers in real-time.
  * **Evaluation Dashboard**: detailed tech accuracy index (concept check) and delivery clarity score (deducting marks for verbal crutches like *um, like, basically, actually*).
  * **Split Progression**: Next Question progress locks allowing students to review scores before continuing.
* **📝 AI Resume Scorer & Critique**: Automatically scores resumes (Formatting, Certifications, and Projects) and returns a checklist of recommendations.
* **💼 Recruiter ATS Pipeline**: Displays all applications ranked by AI match score, links recruiter desks with students' mock technical grades, and supports updating candidates' recruitment stages (Screening, Interviewing, Offered).
* **📈 University Analytics Director**: Displays placement readiness distributions and graphs regression curves projecting current vs. forecasted placement ratios based on curriculum revisions.

---

## 🛠️ Tech Stack
* **Backend**: Python 3.x, Flask
* **Machine Learning**: Scikit-Learn (Random Forest Classifier), Pandas, NumPy
* **Natural Language Processing (NLP)**: TF-IDF Vectorizer, Cosine Similarity (Scikit-Learn), PyPDF2/pypdf (resume parser)
* **Frontend**: HTML5 (Semantic Structure), CSS3 (Glassmorphism & animations), JavaScript (AJAX & Web Speech APIs), Chart.js (Dashboard visualizations)
* **Database**: SQLite3 (relational schema)

---

## 💻 Setup & Local Run

1. **Clone & Open Workspace**:
   ```bash
   cd Internship_cie
   ```
2. **Install Dependencies**:
   ```bash
   pip3 install -r requirements.txt
   ```
3. **Train Employability Classifier Model**:
   ```bash
   python3 models/train_models.py
   ```
4. **Launch the Flask Server**:
   ```bash
   python3 app.py
   ```
5. **Open Browser**:
   Navigate to [http://127.0.0.1:5050](http://127.0.0.1:5050)
