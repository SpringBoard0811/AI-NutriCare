# AI-ML Based Personalized Diet Plan Generator  
## Milestone-1: ICU Data Understanding & Preprocessing

### Objective
This milestone focuses on transforming raw ICU clinical data into **model-ready structured datasets** suitable for traditional ML and deep learning (LSTM) models.  
All preprocessing, feature engineering, and temporal alignment are performed using real-world ICU time-series data.

---

## Data Sources Used
The following MIMIC-IV tables were used:

- **Patients** – demographics (age, gender)
- **Admissions** – admission context & mortality
- **ICU Stays** – ICU timelines and length of stay
- **Chart Events** – vital signs (time-series)
- **Lab Events** – laboratory investigations
- **Input Events** – medications & IV fluids
- **Output Events** – urine output
- **Prescriptions** – drug orders
- **OMR** – BMI, height, weight, smoking, alcohol

All datasets are aligned using:
- `subject_id` (patient)
- `hadm_id` (hospital admission)
- `stay_id` (ICU stay)

---

## Key Notebooks
| Notebook | Description |
|--------|------------|
| admissions.ipynb | Admission types, LOS, mortality analysis |
| patients.ipynb | Age, gender, demographic analysis |
| chartevents.ipynb | ICU vitals extraction & visualization |
| labevents.ipynb | Lab trends & abnormality detection |
| inputevents.ipynb | Medications & IV input analysis |
| preprocessing.ipynb | Full preprocessing & dataset creation |

---

## Processing Steps Performed

### 1️⃣ Data Selection & Filtering
- Selected valid ICU stays (LOS > 0 and ≤ 30 days)
- Removed invalid or clinically impossible values
- Ensured one-to-one ICU stay (`stay_id`) consistency

### 2️⃣ Time-Series Alignment
- Converted irregular clinical events into **hourly time bins**
- Resampled ICU vitals to **1-hour resolution**
- Forward-fill & backward-fill used to preserve temporal continuity

### 3️⃣ Vital Sign Processing
Vitals extracted and cleaned:
- Heart Rate
- Systolic / Diastolic BP
- MAP
- Respiratory Rate
- Temperature
- SpO₂
- GCS

Clinical clipping applied to remove impossible readings.

---

### 4️⃣ Laboratory Feature Engineering
Key labs extracted and summarized:
- Glucose
- Creatinine
- BUN
- Sodium
- Potassium
- Hemoglobin
- WBC
- Lactate
- pH
- Cholesterol (Total, HDL, LDL)

For each lab:
- Mean
- Min
- Max  
Computed per ICU stay.

---

### 5️⃣ Medication & Treatment Encoding
Medications mapped into clinical classes:
- Antibiotics
- Insulin
- Vasopressors
- Sedatives
- Steroids

Generated:
- Binary exposure flags
- Total administered amounts

---

### 6️⃣ Fluid Balance Computation
- Total fluid input (IVs & medications)
- Total urine output
- Hourly urine resampling
- Low urine output flag (< 30 mL/hr)

---

### 7️⃣ Demographic Integration
Added static patient features:
- Age (clipped 18–90)
- Gender (binary encoded)
- BMI
- Smoking & alcohol status

Repeated across time steps for LSTM compatibility.

---

### 8️⃣ Dataset Assembly

#### 🔹 Static Dataset (Traditional ML)
**`master_static.csv`**
- One row per ICU stay
- ~80 engineered features
- Includes mortality & long-stay label

#### 🔹 Time-Series Dataset (Deep Learning)
**`final_lstm_data.csv`**
- Hourly ICU time-series
- Static features attached to each timestep
- Shape ≈ `(hours × features)`

---

## Final Outputs
Saved in `Data/Processed/`:

- `master_static.csv` → ML-ready tabular dataset
- `final_lstm_data.csv` → LSTM-ready time-series dataset

---

## ✅ Outcome of Milestone-1
✔ Raw ICU data converted into structured datasets  
✔ Temporal consistency ensured  
✔ Feature engineering completed  
✔ Ready for predictive modeling (Milestone-2)

---

## Next Milestone
**Milestone-2:**  
- long-stay prediction  


