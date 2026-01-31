# ICU Long-Stay Prediction & Model Testing
## Objective
This milestone implements a deep learning pipeline to predict **long ICU stays** using **24-hour time-series clinical data** and an **LSTM model**.  
Based on the predicted ICU risk, a **personalized meal-wise diet plan** is generated and exported as a PDF.

---

## What This Module Does
- Builds LSTM-ready sequences from ICU time-series data
- Trains a leakage-free LSTM model for long-stay prediction
- Validates clinical inputs and handles unsafe values
- Predicts ICU risk (short vs long stay)
- Generates a personalized diet plan (veg / non-veg)
- Exports results as a patient-level PDF report

---

## Input Data
- **File:** `final_lstm_data.csv`
- **Granularity:** Hourly ICU measurements
- **Sequence length:** 24 hours
- **Target:** `long_stay` (0 = short, 1 = long)

Raw ICU data is excluded due to privacy constraints.

---

## Model Summary
- Model: LSTM (2 layers)
- Input shape: `(24, features)`
- Loss: Binary Crossentropy
- Optimizer: Adam
- Class imbalance handled using class weights
- Early stopping applied

---

## Outputs
- `models/icu_lstm_model.keras` – trained model
- `models/lstm_scaler.pkl` – feature scaler
- `Patient_XXX_DietPlan.pdf` – personalized diet report

---

## How to Run
1. Ensure processed data is available:
   ```bash
   Data/Processed/final_lstm_data.csv
## ## 🚀 Next Milestone
**Milestone-3:**  
- Diet Plane  

