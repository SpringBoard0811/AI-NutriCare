# AI-NutriCare  
## AI/ML-Based Personalized Diet Plan Generator from ICU Time-Series Data

AI-NutriCare is an **AI/ML-driven healthcare analytics system** that analyzes **ICU patient time-series data** and generates **clinically informed diet recommendations**.  
Unlike generic diet suggestion systems, AI-NutriCare leverages **vitals, lab values, medications, and temporal patterns** to understand patient severity and support **personalized nutrition planning**.

This repository documents the implementation **up to Milestone-2**, with a primary focus on **time-series modeling using LSTM networks** for ICU outcome prediction.

---

## Problem Statement

ICU patients generate massive amounts of clinical data, including vitals, lab tests, medications, and physiological outputs. However:

- Raw medical reports are difficult to interpret  
- Static threshold-based rules ignore temporal trends  
- Generic diet plans fail to consider disease severity  

AI-NutriCare addresses these challenges by:

- Learning **24-hour ICU time-series patterns**
- Predicting **patient severity** (long vs short ICU stay)
- Using predictions to drive **nutrition and care planning**

---

## Dataset Used

**MIMIC-IV Clinical Database (Demo Version)**  
🔗 https://www.kaggle.com/datasets/montassarba/mimic-iv-clinical-database-demo-2-2

### Core Tables Utilized
- **chartevents** – ICU vitals (HR, BP, SpO₂, RR, GCS)
- **labevents** – Laboratory values (creatinine, glucose, electrolytes)
- **inputevents** – Medications and IV fluids
- **outputevents** – Urine output
- **patients, admissions, icustays** – Demographics and outcomes

---

## Repository Structure

```text
AI-NutriCare/
│
├── Data/
│   ├── Raw/                  # Original MIMIC-IV CSV files
│   └── Processed/            # Cleaned & merged datasets
│
├── Milestone_1/
│   ├── Data Collection & Preprocessing.ipynb
│   └── README.md
│
├── Milestone_2/
│   ├── ICU_LSTM_Model.ipynb        # Main LSTM notebook
│   ├── ICU_LSTM_Test_Results.pdf   # Test case evaluation
│   └── README.md
│
├── models/
│   ├── icu_lstm_model.keras
│   └── lstm_scaler.pkl
│
└── README.md
```
## Milestone-1: Data Collection & Preprocessing

### 🔹 Objective
Ingest, clean, and harmonize **multi-source ICU data** into a **fixed-length (24-hour) multivariate time-series format** suitable for ML/DL modeling.

### 🔹 Key Steps
- Merged multiple clinical tables using `stay_id`
- Enforced strict time-based filtering to eliminate **data leakage**
- Handled missing values using forward and backward filling
- Performed extensive EDA (distributions, correlations, outliers)
- Generated the final dataset: `final_lstm_data.csv`

##  Milestone-2: Machine Learning–Based Health Analysis

### 🔹 Objective
Train a **leakage-free LSTM model** to predict whether a patient will experience a **long ICU stay**, which serves as a proxy for **clinical severity**.

### 🔹 Key Steps
- Constructed 24-hour ICU sequences for each patient stay
- Applied proper train/validation/test splitting with stratification
- Scaled features using training-only statistics
- Trained an **LSTM (Long Short-Term Memory)** network to capture temporal patterns
- Handled class imbalance using class-weighted training
- Evaluated performance using:
  - Accuracy
  - Confusion Matrix
- Implemented **clinical input validation rules** to reject unsafe or unrealistic inputs
- Generated severity-aware outputs used for **diet recommendation logic**
- Exported final test evaluations to **PDF format**
---
