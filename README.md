# Customer Attrition Prediction API

A FastAPI-based application for predicting customer attrition using ensemble machine learning models.

## Prerequisites

- Python 3.8+
- pip (Python package installer)
- Virtual environment

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd icdmaiproject
```

2. Create and activate a virtual environment:

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**Linux/Mac:**
```bash
python -m venv .venv
source .venv/bin/activate
```

3. Install required packages:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the backend directory with:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
MODEL_PATH=path/to/your/models
```

## Running the Application

1. Navigate to the backend directory:
```bash
cd backend
```

2. Start the FastAPI server:
```bash
uvicorn app:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

- GET `/predict/attrition/{customer_id}`: Predict attrition for a specific customer
- GET `/predict/attrition/batch`: Batch prediction for all active customers

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc`
