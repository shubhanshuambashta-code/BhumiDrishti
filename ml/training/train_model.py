import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def generate_synthetic_data(n_samples=500):
    np.random.seed(42)
    data = {
        'ownership_risk': np.random.uniform(0, 10, n_samples),
        'legal_risk': np.random.uniform(0, 10, n_samples),
        'compensation_risk': np.random.uniform(0, 10, n_samples),
        'environmental_risk': np.random.uniform(0, 10, n_samples),
        'social_risk': np.random.uniform(0, 10, n_samples),
        'delay_risk': np.random.uniform(0, 10, n_samples),
        'land_type': np.random.choice(['agricultural', 'residential', 'commercial', 'forest', 'industrial'], n_samples),
        'acquisition_status': np.random.choice(['not_started', 'in_progress', 'completed', 'disputed'], n_samples),
        'area_hectares': np.random.uniform(0.1, 100, n_samples)
    }
    df = pd.DataFrame(data)
    
    # Calculate risk score
    df['risk_score'] = (
        df['ownership_risk'] * 2 +
        df['legal_risk'] * 2.5 +
        df['compensation_risk'] * 2 +
        df['environmental_risk'] * 1.5 +
        df['social_risk'] * 1 +
        df['delay_risk'] * 1
    )
    
    # Calculate risk level
    conditions = [
        (df['risk_score'] < 30),
        (df['risk_score'] >= 30) & (df['risk_score'] < 60),
        (df['risk_score'] >= 60) & (df['risk_score'] < 80),
        (df['risk_score'] >= 80)
    ]
    choices = ['Low', 'Medium', 'High', 'Critical']
    df['risk_level'] = np.select(conditions, choices, default='Medium')
    
    return df

def train():
    print("NOTE: This model is trained on SYNTHETIC DEMONSTRATION DATA. Results do not reflect real-world accuracy.")
    
    # Data generation
    df = generate_synthetic_data()
    
    # Features
    feature_cols = ['ownership_risk', 'legal_risk', 'compensation_risk', 'environmental_risk', 
                    'social_risk', 'delay_risk', 'land_type', 'acquisition_status', 'area_hectares']
    X = df[feature_cols].copy()
    
    # Encoding
    encoders = {}
    for col in ['land_type', 'acquisition_status']:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le
        
    y_cls = df['risk_level']
    y_reg = df['risk_score']
    
    # Split
    X_train, X_test, y_cls_train, y_cls_test, y_reg_train, y_reg_test = train_test_split(
        X, y_cls, y_reg, test_size=0.2, random_state=42
    )
    
    # Model
    clf_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('rf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    clf_pipeline.fit(X_train, y_cls_train)
    
    reg_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('rf', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    reg_pipeline.fit(X_train, y_reg_train)
    
    # Eval
    y_pred = clf_pipeline.predict(X_test)
    metrics = {
        'accuracy': accuracy_score(y_cls_test, y_pred),
        'precision': precision_score(y_cls_test, y_pred, average='macro', zero_division=0),
        'recall': recall_score(y_cls_test, y_pred, average='macro', zero_division=0),
        'f1': f1_score(y_cls_test, y_pred, average='macro', zero_division=0),
        'confusion_matrix': confusion_matrix(y_cls_test, y_pred).tolist(),
        'feature_importances': clf_pipeline.named_steps['rf'].feature_importances_.tolist()
    }
    
    print(json.dumps(metrics, indent=2))
    
    # Save
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'models'), exist_ok=True)
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    
    joblib.dump(clf_pipeline, os.path.join(models_dir, 'risk_classifier.pkl'))
    joblib.dump(reg_pipeline, os.path.join(models_dir, 'risk_regressor.pkl'))
    joblib.dump(encoders, os.path.join(models_dir, 'label_encoder.pkl'))
    
    with open(os.path.join(models_dir, 'metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=2)

if __name__ == "__main__":
    train()
