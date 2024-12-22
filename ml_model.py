import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

class AttritionPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        
    def train(self, data_path):
        # Load data
        df = pd.read_csv(data_path)
        
        # Feature engineering
        features = [
            'usage_frequency',
            'last_interaction_days',
            'support_tickets_count',
            'system_health_score',
            'payment_delays',
            'app_usage_time'
        ]
        
        X = df[features]
        y = df['churned']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        
        # Save model and scaler
        joblib.dump(self.model, 'models/attrition_model.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
    
    def predict(self, features):
        features_scaled = self.scaler.transform([features])
        probability = self.model.predict_proba(features_scaled)[0][1]
        
        # Get feature importance
        importance = dict(zip(
            self.model.feature_names_in_,
            self.model.feature_importances_
        ))
        
        return {
            'probability': float(probability),
            'risk_level': 'High' if probability > 0.7 else 'Medium' if probability > 0.4 else 'Low',
            'feature_importance': importance
        }
