import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

def generate_synthetic_data(num_samples=1200):
    np.random.seed(42)
    
    # Generate feature distributions
    cgpa = np.random.uniform(5.5, 10.0, num_samples)
    projects_count = np.random.randint(0, 6, num_samples)
    certifications_count = np.random.randint(0, 6, num_samples)
    core_skills_score = np.random.randint(2, 11, num_samples) # Score representing count of core skills
    communication_score = np.random.randint(1, 6, num_samples) # Scale 1 to 5
    experience_months = np.random.randint(0, 13, num_samples) # 0 to 12 months of experience
    extracurricular_score = np.random.randint(1, 6, num_samples) # Scale 1 to 5
    
    # Calculate probability of placement readiness (Employability)
    # Weights sum to 1.0
    prob = (
        0.25 * ((cgpa - 5.5) / 4.5) +  # Academic performance weight
        0.20 * (projects_count / 5.0) +  # Project experience weight
        0.15 * (certifications_count / 5.0) +  # Certifications weight
        0.15 * (core_skills_score / 10.0) +  # Core skills weight
        0.15 * (communication_score / 5.0) +  # Communication skills weight
        0.10 * (experience_months / 12.0)    # Work experience weight
    )
    
    # Add random noise
    noise = np.random.normal(0, 0.05, num_samples)
    prob_with_noise = np.clip(prob + noise, 0, 1)
    
    # Classification: Employable (1) if readiness score >= 0.50, else (0)
    employable = (prob_with_noise >= 0.50).astype(int)
    
    # Compile into a DataFrame
    df = pd.DataFrame({
        'cgpa': cgpa,
        'projects_count': projects_count,
        'certifications_count': certifications_count,
        'core_skills_score': core_skills_score,
        'communication_score': communication_score,
        'experience_months': experience_months,
        'extracurricular_score': extracurricular_score,
        'employable': employable
    })
    
    return df

def train_and_save_model():
    print("Generating synthetic student profile data...")
    df = generate_synthetic_data()
    
    # Split features and target
    X = df.drop(columns=['employable'])
    y = df['employable']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=8)
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy on Test Set: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Ensure models directory exists
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'employability_model.pkl')
    
    # Save the model
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Model successfully saved to {model_path}")

if __name__ == '__main__':
    train_and_save_model()
