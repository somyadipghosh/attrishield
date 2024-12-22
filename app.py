from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
from supabase import create_client
import os
import tensorflow as tf
from fastapi.responses import JSONResponse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import twilio.rest
from datetime import datetime, timedelta
from ml_model import AttritionPredictor
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL") or "https://mzqszvgqnbwovjnuyvdj.supabase.co"
supabase_key = os.getenv("SUPABASE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cXN6dmdxbmJ3b3ZqbnV5dmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MDU0MjMsImV4cCI6MjA1MDI4MTQyM30.vQabIT7siTiFHbJD0bdMWYor2h7neDCuH4eerpflfSs"

supabase = create_client(
    supabase_url,
    supabase_key
)

# Set default model path
MODEL_PATH = os.getenv('MODEL_PATH') or os.path.join(os.path.dirname(__file__), 'models')

# Load all models with error handling
try:
    models = {
        'random_forest': joblib.load(os.path.join(MODEL_PATH, 'best_random_forest_model.pkl')),
        'xgboost': joblib.load(os.path.join(MODEL_PATH, 'best_xgboost_model.pkl')),
        'ensemble': joblib.load(os.path.join(MODEL_PATH, 'ensemble_model.pkl')),
        'nn_simple': tf.keras.models.load_model(os.path.join(MODEL_PATH, 'customer_attrition_model.h5')),
        'nn_advanced': tf.keras.models.load_model(os.path.join(MODEL_PATH, 'customer_attrition_nn_model.h5'))
    }
except Exception as e:
    print(f"Error loading models: {str(e)}")
    models = {}

# Load ML model
try:
    model = joblib.load('models/attrition_model.pkl')
    scaler = joblib.load('models/scaler.pkl')
    predictor = AttritionPredictor()
    predictor.model = model
    predictor.scaler = scaler
except Exception as e:
    print(f"Error loading ML model: {str(e)}")
    predictor = None

# Initialize communication clients with error handling
try:
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = os.getenv('SMTP_PORT')
    if smtp_server and smtp_port:
        email_client = smtplib.SMTP(smtp_server, smtp_port)
        email_client.connect()
        email_client.starttls()
        email_client.login(os.getenv('SMTP_USER'), os.getenv('SMTP_PASSWORD'))
    else:
        print("Email configuration not found, email notifications will be disabled")
        email_client = None
except Exception as e:
    print(f"Error initializing email client: {str(e)}")
    email_client = None

try:
    if all([os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN')]):
        twilio_client = twilio.rest.Client(
            os.getenv('TWILIO_ACCOUNT_SID'),
            os.getenv('TWILIO_AUTH_TOKEN')
        )
    else:
        print("Twilio configuration not found, SMS notifications will be disabled")
        twilio_client = None
except Exception as e:
    print(f"Error initializing Twilio client: {str(e)}")
    twilio_client = None


# Download required NLTK data
try:
    nltk.download('vader_lexicon', quiet=True)
    sentiment_analyzer = SentimentIntensityAnalyzer()
except Exception as e:
    print(f"Error initializing sentiment analyzer: {str(e)}")
    sentiment_analyzer = None

# Communication templates
EMAIL_TEMPLATES = {
    'high_risk': {
        'subject': 'Important: Your Home Security System Review',
        'body': """
        Dear {customer_name},
        
        We noticed some changes in your home security system usage and would like to ensure 
        everything is working optimally for you. Our records show:
        
        - Last system check: {last_check_date}
        - Recent activity level: {activity_level}
        
        We'd love to schedule a free system review to:
        - Ensure all components are working perfectly
        - Update you on new security features
        - Address any questions or concerns
        
        Click here to schedule your review: {booking_link}
        
        Best regards,
        Your Security Team
        """
    },
    'medium_risk': {
        'subject': 'Your Security System Update',
        'body': """
        Hi {customer_name},
        
        Just checking in to make sure you're getting the most from your security system.
        Would you be interested in learning about some new features we've added recently?
        
        Schedule a quick chat here: {booking_link}
        
        Best regards,
        Your Security Team
        """
    }
}

def get_ensemble_prediction(features):
    predictions = {
        'rf_pred': models['random_forest'].predict_proba([features])[0][1],
        'xgb_pred': models['xgboost'].predict_proba([features])[0][1],
        'ensemble_pred': models['ensemble'].predict_proba([features])[0][1],
        'nn_pred': float(models['nn_simple'].predict([features])[0][0]),
        'nn_adv_pred': float(models['nn_advanced'].predict([features])[0][0])
    }
    
    # Weighted average of all predictions
    weights = {
        'rf_pred': 0.2,
        'xgb_pred': 0.2,
        'ensemble_pred': 0.3,
        'nn_pred': 0.15,
        'nn_adv_pred': 0.15
    }
    
    final_prediction = sum(pred * weights[key] for key, pred in predictions.items())
    return final_prediction, predictions

def analyze_sentiment(text):
    if not sentiment_analyzer:
        return {"compound": 0, "positive": 0, "negative": 0, "neutral": 0}
    
    scores = sentiment_analyzer.polarity_scores(text)
    return scores

@app.post("/analyze/sentiment")
async def analyze_customer_sentiment(customer_id: int):
    try:
        # Fetch customer feedback and support tickets
        data = supabase.table("customer_feedback").select("*").eq("customer_id", customer_id).execute()
        tickets = supabase.table("support_tickets").select("*").eq("customer_id", customer_id).execute()
        
        # Combine all text for analysis
        feedback_text = " ".join([item.get('feedback_text', '') for item in data.data])
        ticket_text = " ".join([item.get('description', '') for item in tickets.data])
        combined_text = feedback_text + " " + ticket_text
        
        sentiment_scores = analyze_sentiment(combined_text)
        
        # Update customer data with sentiment scores
        supabase.table("customer_data").update({
            "sentiment_score": sentiment_scores['compound'],
            "last_sentiment_analysis": datetime.now().isoformat()
        }).eq("id", customer_id).execute()
        
        return {
            "customer_id": customer_id,
            "sentiment_analysis": sentiment_scores,
            "analyzed_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/attrition/{customer_id}")
async def predict_attrition(customer_id: int):
    try:
        # Fetch customer data from Supabase
        data = supabase.table("customer_data").select("*").eq("id", customer_id).execute()
        
        if not data.data:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        customer = data.data[0]
        
        # Add sentiment analysis
        sentiment_data = await analyze_customer_sentiment(customer_id)
        customer["sentiment_score"] = sentiment_data["sentiment_analysis"]["compound"]
        
        # Extract features
        features = [
            customer["usage_frequency"],
            customer["last_interaction_days"],
            customer["support_tickets_count"],
            customer["system_health_score"],
            customer.get("payment_delays", 0),
            customer.get("app_usage_time", 0),
            customer.get("sentiment_score", 0)  # Add sentiment score
        ]
        
        # Get prediction
        result = predictor.predict(features)
        
        return {
            "customer_id": customer_id,
            "attrition_probability": result['probability'],
            "risk_level": result['risk_level'],
            "feature_importance": result['feature_importance'],
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/attrition/batch")
async def predict_attrition_batch():
    try:
        # Fetch all active customers from Supabase
        data = supabase.table("customer_data").select("*").eq("status", "active").execute()
        
        predictions = []
        for customer in data.data:
            features = prepare_features(customer)
            final_prediction, _ = get_ensemble_prediction(features)
            predictions.append({
                "customer_id": customer["id"],
                "attrition_probability": float(final_prediction),
                "risk_level": "High" if final_prediction > 0.7 else "Medium" if final_prediction > 0.4 else "Low"
            })
        
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/communications/send-notification")
async def send_notification(customer_id: int, notification_type: str):
    try:
        # Fetch customer data
        customer = supabase.table("customer_data").select("*").eq("id", customer_id).single().execute()
        
        if not customer.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get prediction and risk level
        features = prepare_features(customer.data)
        final_prediction, _ = get_ensemble_prediction(features)
        risk_level = "High" if final_prediction > 0.7 else "Medium" if final_prediction > 0.4 else "Low"
        
        # Send appropriate communication
        if notification_type == "email":
            await send_risk_email(customer.data, risk_level)
        elif notification_type == "sms":
            await send_risk_sms(customer.data, risk_level)
        
        # Log communication
        supabase.table("communication_log").insert({
            "customer_id": customer_id,
            "type": notification_type,
            "risk_level": risk_level,
            "sent_at": datetime.now().isoformat(),
            "success": True
        }).execute()
        
        return JSONResponse(content={"status": "success"}, status_code=200)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def send_risk_email(customer, risk_level):
    if not email_client:
        print("Email client not configured, skipping email notification")
        return
        
    template = EMAIL_TEMPLATES['high_risk'] if risk_level == 'High' else EMAIL_TEMPLATES['medium_risk']
    
    msg = MIMEMultipart()
    msg['From'] = os.getenv('SMTP_USER')
    msg['To'] = customer['email']
    msg['Subject'] = template['subject']
    
    body = template['body'].format(
        customer_name=customer['name'],
        last_check_date=customer['last_check_date'],
        activity_level=customer['activity_level'],
        booking_link=f"https://your-domain.com/booking/{customer['id']}"
    )
    
    msg.attach(MIMEText(body, 'plain'))
    email_client.send_message(msg)

async def send_risk_sms(customer, risk_level):
    if not twilio_client:
        print("Twilio client not configured, skipping SMS notification")
        return
        
    message = (
        "Important: Your security system needs attention. "
        f"Click here to schedule a review: https://your-domain.com/booking/{customer['id']}"
    ) if risk_level == 'High' else (
        "Quick check-in: How's your security system working? "
        f"We're here to help: https://your-domain.com/booking/{customer['id']}"
    )
    
    twilio_client.messages.create(
        body=message,
        from_=os.getenv('TWILIO_PHONE'),
        to=customer['phone']
    )

def prepare_features(customer_data):
    # Transform your customer data into model features
    # Modify according to your model's requirements
    return [
        customer_data["usage_frequency"],
        customer_data["last_interaction"],
        customer_data["support_tickets"],
        customer_data["system_health"]
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)