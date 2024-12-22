from ml_model import AttritionPredictor
import os

def main():
    # Create models directory if it doesn't exist
    if not os.path.exists('models'):
        os.makedirs('models')
    
    # Initialize and train model
    predictor = AttritionPredictor()
    predictor.train('data/customer_data.csv')
    print("Model trained and saved successfully!")

if __name__ == "__main__":
    main()
