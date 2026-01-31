# ICU-Aware Diet Planning using NLP, LSTM & LLMs

## Objective
This module converts **unstructured clinical information** (doctor notes and PDF reports) into a **personalized, multi-day ICU diet plan** by combining:
- NLP-based rule extraction
- LSTM-based ICU risk prediction
- Clinical rule engines
- Large Language Models (LLMs)

The goal is to provide **clinically safe, explainable, and patient-specific nutrition planning** for ICU recovery.

---

## End-to-End Pipeline Overview
1. **Doctor Notes → NLP**
   - Extract diet constraints (diabetes, renal, low sodium, soft diet, etc.)
2. **Clinical PDF Processing**
   - Extract vitals from tables & text (OCR fallback supported)
3. **ICU Risk Prediction**
   - Use pre-trained LSTM to predict long vs short ICU stay
4. **Clinical Rule Engine**
   - Interpret vitals using a medical rulebook
   - Generate dietary objectives & constraints
5. **LLM-Based Diet Generation**
   - Generate Indian, ICU-safe, day-wise meal plans
6. **Structured Outputs**
   - JSON for ML/LLM interoperability
   - Ready for PDF or UI integration

---

## Key Components

### 1️⃣ NLP Constraint Extraction
- Parses doctor notes to infer diet rules:
  - Diabetes
  - Renal
  - Low sodium / potassium
  - Cardiac
  - Soft or liquid diet
- Rule-based for safety and determinism

---

### 2️⃣ PDF Intelligence Layer
- Supports:
  - Embedded text PDFs
  - Scanned PDFs (OCR)
- Extracts:
  - Labs (glucose, creatinine, electrolytes, etc.)
  - Demographics (age)
- Merges table + text extraction for robustness

---

### 3️⃣ ICU Risk Prediction (LSTM)
- Uses pre-trained LSTM model
- Input: 24-hour replicated clinical feature sequence
- Output:
  - Probability of long ICU stay
  - Risk level (High / Low)
- Leakage-free scaling and inference

---

### 4️⃣ Clinical Rule Engine
- Interprets vitals using a predefined medical rulebook
- Produces:
  - Clinical findings
  - Diet constraints
  - Dietary objectives
- Ensures explainability and medical safety

---

### 5️⃣ LLM-Based Diet Plan Generator
- Model: `google/gemma-2-9b-it`
- Generates:
  - Indian meal plans only
  - Renal-safe, diabetic-safe, low sodium
  - Veg / Non-veg options
- Output:
  - Day-wise JSON (Breakfast → Dinner)
  - Supports 5–7 day recovery plans

---

## Outputs
- `Final_Patient_Report.json`  
  → Unified clinical + ML + diet reasoning
- `Day_Wise_Diet_Plan.json`  
  → Structured multi-day diet plan
- Optional:
  - PDF generation
  - UI / API consumption

---

## Safety & Design Principles
- Raw ICU data not stored or shared
- Input validation & physiological bounds enforced
- Defaults used only when data is missing (tracked explicitly)
- Rule-based logic preferred over blind generation

---

## Use Cases
- ICU recovery nutrition planning
- Clinical decision support systems
- AI-assisted dietitian tools
- Healthcare ML + LLM research projects

---

## Summary
This module demonstrates a **real-world healthcare AI system** that bridges:
- Structured ML predictions
- Unstructured clinical text
- Deterministic medical rules
- Generative AI outputs

Designed for **safety, explainability, and extensibility**.

# Milestone-3: ICU-Aware Diet Planning using NLP, LSTM & LLMs

## 🔹 Objective

The objective of Milestone-3 is to convert unstructured clinical information (doctor notes and PDF medical reports) into a personalized, multi-day ICU diet plan by integrating:

- NLP-based constraint extraction  
- LSTM-based ICU risk prediction  
- Deterministic clinical rule engines  
- Large Language Models (LLMs)  

This milestone focuses on delivering clinically safe, explainable, and patient-specific nutrition planning to support ICU recovery.

---

## 🔹 End-to-End Pipeline Overview

### 1. Doctor Notes → NLP
- Parses unstructured doctor notes
- Extracts dietary constraints such as:
  - Diabetes
  - Renal conditions
  - Low sodium / low potassium
  - Cardiac restrictions
  - Soft or liquid diet requirements
- Rule-based extraction ensures safety and determinism

---

### 2. Clinical PDF Intelligence
Supports multiple clinical document formats:

- Embedded-text PDFs  
- Scanned PDFs (OCR fallback supported)  

Extracts:
- Vitals  
- Laboratory values (glucose, creatinine, electrolytes, etc.)  
- Demographic indicators (e.g., age)  

Merges table-based and text-based extraction for robustness.

---

### 3. ICU Risk Prediction (LSTM)
- Uses a pre-trained LSTM model from Milestone-2
- Input:
  - Replicated 24-hour ICU clinical feature sequence
- Output:
  - Probability of long ICU stay
  - Risk category (High / Low)
- Inference uses leakage-free scaling and validated physiological bounds

---

### 4. Clinical Rule Engine
- Interprets vitals and lab values using a predefined medical rulebook
- Generates:
  - Clinical findings
  - Diet constraints
  - Dietary objectives
- Ensures medical safety, transparency, and explainability

---

### 5. LLM-Based Diet Plan Generator
- Model used: `google/gemma-2-9b-it`
- Generates:
  - Indian ICU-safe meal plans
  - Renal-safe, diabetic-safe, and low-sodium diets
  - Vegetarian and non-vegetarian options
- Output format:
  - Structured day-wise JSON
  - Meals from Breakfast → Dinner
- Supports 5–7 day ICU recovery plans

---

## 🔹 Outputs

### Primary Outputs
- `Final_Patient_Report.json`  
  → Unified clinical reasoning combining ICU data, ML predictions, and diet logic

- `Day_Wise_Diet_Plan.json`  
  → Structured multi-day ICU diet plan

### Optional Outputs
- PDF report generation  
- UI / API-ready structured responses

---

## 🔹 Safety & Design Principles

- Raw ICU data is never stored or shared  
- Strict physiological bounds validation on all inputs  
- Defaults are used only when data is missing and are explicitly tracked  
- Rule-based logic preferred over blind generation  
- Explainability enforced at every stage of the pipeline  

---

## 🔹 Use Cases

- ICU recovery nutrition planning  
- Clinical decision support systems  
- AI-assisted dietitian tools  
- Healthcare ML + LLM research projects  

---

## 🔹 Summary

Milestone-3 demonstrates a real-world healthcare AI system that bridges:

- Structured ICU time-series ML predictions  
- Unstructured clinical text and PDFs  
- Deterministic medical rule engines  
- Generative AI using LLMs  

The system is designed with safety, explainability, and extensibility at its core, making it suitable for both clinical research and real-world deployment.
