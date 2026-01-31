# app/main.py - ENHANCED PRODUCTION VERSION
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uvicorn
from pathlib import Path
import shutil
import os
import re
import json
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
import joblib
import pdfplumber
from pdf2image import convert_from_path
import pytesseract
import camelot.io as camelot
from datetime import datetime
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware

# PDF Generation Libraries
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from io import BytesIO

# ────────────────────────────────────────────────
# CONFIG & GLOBALS
# ────────────────────────────────────────────────

app = FastAPI(title="AI Nutricare - Advanced ICU Prediction & Diet API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model & scaler
try:
    MODEL = load_model("models/icu_lstm_model.keras")
    SCALER = joblib.load("models/lstm_scaler.pkl")
    print("✅ Model and scaler loaded")
except Exception as e:
    print(f"⚠️ Model loading failed: {e}")
    MODEL = None
    SCALER = None

import os

GROQ_CLIENT = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY")
)


GROQ_MODEL = "llama-3.1-8b-instant"

DEFAULTS = {
    "HR": 75, "MAP": 80, "Resp_Rate": 16, "Temp": 36.8, "SpO2": 97,
    "gcs": 15, "mean_glucose": 110, "mean_creatinine": 1.0, "mean_bun": 15,
    "mean_sodium": 140, "mean_potassium": 4.2, "mean_hemoglobin": 13,
    "mean_wbc": 7, "mean_lactate": 1.5, "mean_ph": 7.4,
    "mean_cholesterol_total": 180, "total_fluids": 100, "age": 60,
    "vasopressor_x": 0, "sedative_x": 0, "antibiotic_x": 0,
    "insulin_x": 0, "mean_hourly_urine": 60
}

VITAL_PATTERNS = {
    "Glucose": [r"glucose.*?([\d]+\.?\d*)", r"blood sugar.*?([\d]+\.?\d*)", r"\bfbs\b.*?([\d]+\.?\d*)"],
    "Creatinine": [r"creatinine.*?([\d]+\.?\d*)"],
    "Hemoglobin": [r"hemoglobin.*?([\d]+\.?\d*)", r"\bhb\b.*?([\d]+\.?\d*)"],
    "Sodium": [r"sodium.*?([\d]+\.?\d*)"],
    "Potassium": [r"potassium.*?([\d]+\.?\d*)"],
    "WBC": [r"\bwbc\b.*?([\d]+\.?\d*)"],
    "Cholesterol": [r"cholesterol.*?([\d]+\.?\d*)"],
    "Lactate": [r"lactate.*?([\d]+\.?\d*)"],
    "pH": [r"\bph\b.*?([\d]+\.?\d*)"]
}

VITAL_RULEBOOK = {
    "Glucose": {
        "high": {
            "threshold": 140,
            "status": "Hyperglycemia",
            "interpretation": "Elevated blood glucose levels may indicate poor glycemic control",
            "diet_constraints": ["low_sugar"],
            "objectives": ["Control blood glucose levels"]
        }
    },
    "Creatinine": {
        "high": {
            "threshold": 1.5,
            "status": "Renal impairment",
            "interpretation": "Elevated creatinine suggests reduced kidney function",
            "diet_constraints": ["renal", "low_protein", "low_sodium"],
            "objectives": ["Reduce kidney workload"]
        }
    },
    "Hemoglobin": {
        "low": {
            "threshold": 11,
            "status": "Anemia",
            "interpretation": "Low hemoglobin indicates anemia requiring nutritional support",
            "diet_constraints": ["iron_rich"],
            "objectives": ["Improve hemoglobin levels"]
        }
    },
    "Sodium": {
        "high": {
            "threshold": 145,
            "status": "Hypernatremia",
            "interpretation": "Elevated sodium levels require fluid management",
            "diet_constraints": ["low_sodium"],
            "objectives": ["Maintain electrolyte balance"]
        }
    },
    "Potassium": {
        "high": {
            "threshold": 5.0,
            "status": "Hyperkalemia",
            "interpretation": "High potassium can cause cardiac complications",
            "diet_constraints": ["low_potassium"],
            "objectives": ["Prevent cardiac complications"]
        }
    },
    "pH": {
        "low": {
            "threshold": 7.2,
            "status": "Acidosis",
            "interpretation": "Low blood pH indicates metabolic acidosis",
            "diet_constraints": ["soft_diet"],
            "objectives": ["Support acid-base balance"]
        }
    },
    "Cholesterol": {
        "high": {
            "threshold": 200,
            "status": "Hyperlipidemia",
            "interpretation": "Elevated cholesterol increases cardiovascular risk",
            "diet_constraints": ["low_fat", "cardiac"],
            "objectives": ["Maintain cardiovascular health"]
        }
    }
}

# ────────────────────────────────────────────────
# PYDANTIC MODELS
# ────────────────────────────────────────────────

class ManualDataInput(BaseModel):
    manual_data: Dict[str, Any]
    diet_type: str = "veg"
    days: int = 7

class AlternativesRequest(BaseModel):
    meal_name: str
    diet_type: str
    constraints: List[str]
    objectives: List[str]

# ────────────────────────────────────────────────
# PDF EXTRACTION FUNCTIONS (unchanged)
# ────────────────────────────────────────────────

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

def extract_text_from_scanned_pdf(pdf_path):
    images = convert_from_path(pdf_path)
    text = ""
    for img in images:
        text += pytesseract.image_to_string(img)
    return text.strip()

def extract_text_safely(pdf_path):
    text = extract_text_from_pdf(pdf_path)
    if not text:
        print("⚠️ No embedded text → OCR")
        text = extract_text_from_scanned_pdf(pdf_path)
    return text

def extract_vitals_from_text(text):
    extracted = {}
    for vital, patterns in VITAL_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    extracted[vital] = float(match.group(1))
                    break
                except:
                    pass
    return extracted

def extract_vitals_from_tables(pdf_path):
    extracted = {}
    try:
        tables = camelot.read_pdf(pdf_path, pages="all")
        for table in tables:
            df = table.df
            if len(df) == 0:
                continue
            df.columns = df.iloc[0]
            df = df[1:]
            for _, row in df.iterrows():
                try:
                    test = str(row.iloc[0]).lower()
                    value = str(row.iloc[1])
                    
                    if "sodium" in test:
                        extracted["Sodium"] = float(re.findall(r"[\d.]+", value)[0])
                    elif "potassium" in test:
                        extracted["Potassium"] = float(re.findall(r"[\d.]+", value)[0])
                    elif "glucose" in test:
                        extracted["Glucose"] = float(re.findall(r"[\d.]+", value)[0])
                    elif "hemoglobin" in test or "hb" in test:
                        extracted["Hemoglobin"] = float(re.findall(r"[\d.]+", value)[0])
                    elif "creatinine" in test:
                        extracted["Creatinine"] = float(re.findall(r"[\d.]+", value)[0])
                    elif "lactate" in test:
                        extracted["Lactate"] = float(re.findall(r"[\d.]+", value)[0])
                    elif "ph" in test:
                        extracted["pH"] = float(re.findall(r"[\d.]+", value)[0])
                    elif "wbc" in test:
                        extracted["WBC"] = float(re.findall(r"[\d.]+", value)[0])
                    elif "cholesterol" in test:
                        extracted["Cholesterol"] = float(re.findall(r"[\d.]+", value)[0])
                    elif "bun" in test:
                        extracted["BUN"] = float(re.findall(r"[\d.]+", value)[0])
                except:
                    continue
    except Exception as e:
        print(f"Table extraction error: {e}")
    return extracted

def merge_extractions(table_vitals, text_vitals):
    final = {}
    for vital in set(table_vitals) | set(text_vitals):
        final[vital] = table_vitals.get(vital, text_vitals.get(vital))
    return final

def extract_demographics(text, table_vitals=None):
    demographics = {}
    clean_text = re.sub(r"\s+", " ", text)
    
    # Name extraction
    name_patterns = [
        r"patient name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        r"name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
    ]
    for pattern in name_patterns:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            demographics["name"] = match.group(1).strip()
            break
    
    # Age extraction
    age_patterns = [
        r"sex\s*/\s*age\s*[:\-]?\s*(male|female)?\s*/?\s*(\d{1,3})\s*y",
        r"(male|female)\s*/\s*(\d{1,3})\s*y",
        r"age\s*[:\-]?\s*(\d{1,3})",
        r"(\d{1,3})\s*[- ]?year[s]?\s*old",
        r"(\d{1,3})\s*(years|yrs|year|y)\b"
    ]

    for pattern in age_patterns:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            age = int(match.groups()[-1])
            if 0 < age < 120:
                demographics["age"] = age
                return demographics

    if table_vitals and "age" in table_vitals:
        age = int(table_vitals["age"])
        if 0 < age < 120:
            demographics["age"] = age

    if "dob" in demographics and "age" not in demographics:
        dob = datetime.strptime(demographics["dob"], "%Y-%m-%d")
        today = datetime.today()
        demographics["age"] = today.year - dob.year - (
            (today.month, today.day) < (dob.month, dob.day)
        )
    
    # DOB extraction
    dob_patterns = [
        r"(?:dob|date of birth)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
        r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
    ]
    for pattern in dob_patterns:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            demographics["dob"] = match.group(1)
            break
    
    # Gender extraction
    if re.search(r"\bmale\b", clean_text, re.IGNORECASE) and not re.search(r"\bfemale\b", clean_text, re.IGNORECASE):
        demographics["gender"] = "Male"
    elif re.search(r"\bfemale\b", clean_text, re.IGNORECASE):
        demographics["gender"] = "Female"
    
    return demographics

def build_patient_row(pdf_vitals, demographics):
    row = {}
    row["Glucose"] = pdf_vitals.get("Glucose", DEFAULTS["mean_glucose"])
    row["Creatinine"] = pdf_vitals.get("Creatinine", DEFAULTS["mean_creatinine"])
    row["Lactate"] = pdf_vitals.get("Lactate", DEFAULTS["mean_lactate"])
    row["pH"] = pdf_vitals.get("pH", DEFAULTS["mean_ph"])
    row["Hemoglobin"] = pdf_vitals.get("Hemoglobin", DEFAULTS["mean_hemoglobin"])
    row["WBC"] = pdf_vitals.get("WBC", DEFAULTS["mean_wbc"])
    row["Sodium"] = pdf_vitals.get("Sodium", DEFAULTS["mean_sodium"])
    row["Potassium"] = pdf_vitals.get("Potassium", DEFAULTS["mean_potassium"])
    row["Cholesterol"] = pdf_vitals.get("Cholesterol", DEFAULTS["mean_cholesterol_total"])
    row["HR"] = DEFAULTS["HR"]
    row["MAP"] = DEFAULTS["MAP"]
    row["Resp_Rate"] = DEFAULTS["Resp_Rate"]
    row["Temp"] = DEFAULTS["Temp"]
    row["SpO2"] = DEFAULTS["SpO2"]
    row["Fluids"] = DEFAULTS["total_fluids"]
    row["Insulin"] = DEFAULTS["insulin_x"]
    row["Vasopressors"] = DEFAULTS["vasopressor_x"]
    row["Sedatives"] = DEFAULTS["sedative_x"]
    return row

def build_lstm_sequence(patient_features, demographics):
    feature_vector = np.array([
        patient_features.get("HR"), patient_features.get("Resp_Rate"), patient_features.get("Temp"),
        patient_features.get("SpO2"), DEFAULTS["gcs"], patient_features.get("Glucose"),
        patient_features.get("Creatinine"), DEFAULTS["mean_bun"], patient_features.get("Sodium"),
        patient_features.get("Potassium"), patient_features.get("Hemoglobin"), patient_features.get("WBC"),
        patient_features.get("Lactate"), patient_features.get("pH"), patient_features.get("Cholesterol"),
        DEFAULTS["total_fluids"], demographics.get("age", DEFAULTS["age"]),
        DEFAULTS["vasopressor_x"], DEFAULTS["sedative_x"], DEFAULTS["antibiotic_x"],
        patient_features.get("Insulin"), DEFAULTS["mean_hourly_urine"]
    ])
    return np.tile(feature_vector, (24, 1))

def predict_patient(seq, threshold=0.5):
    if MODEL is None or SCALER is None:
        return 0.5, "Unknown"
    seq_flat = seq.reshape(-1, seq.shape[1])
    seq_scaled = SCALER.transform(seq_flat).reshape(1, 24, -1)
    prob = float(MODEL.predict(seq_scaled, verbose=0)[0][0])
    pred = "Long Stay" if prob >= threshold else "Short Stay"
    return prob, pred

def interpret_vitals_dynamically(extracted_vitals):
    clinical_findings = {}
    diet_constraints = set()
    dietary_objectives = set()
    notes_for_llm = ["Diet should avoid fried, spicy, and metabolically stressful foods"]
    
    for vital, value in extracted_vitals.items():
        if vital not in VITAL_RULEBOOK:
            continue
        
        rules = VITAL_RULEBOOK[vital]
        matched = False
        
        for rule_type, rule in rules.items():
            if (rule_type == "high" and value >= rule["threshold"]) or \
               (rule_type == "low" and value < rule["threshold"]):
                clinical_findings[vital] = {
                    "value": value,
                    "status": rule["status"],
                    "interpretation": rule["interpretation"]
                }
                diet_constraints.update(rule["diet_constraints"])
                dietary_objectives.update(rule["objectives"])
                matched = True
                break
        
        if not matched:
            clinical_findings[vital] = {
                "value": value,
                "status": "Normal",
                "interpretation": f"{vital} is within normal range"
            }
    
    return clinical_findings, sorted(list(diet_constraints)), sorted(list(dietary_objectives)), notes_for_llm

def interpret_icu_prediction(prediction, probability):
    if prediction == "Long Stay":
        return {
            "prediction": prediction,
            "risk_level": "High",
            "confidence": probability,
            "clinical_meaning": "Patient shows signs requiring extended ICU monitoring and care"
        }
    return {
        "prediction": prediction,
        "risk_level": "Low",
        "confidence": probability,
        "clinical_meaning": "Patient shows favorable recovery indicators"
    }

def process_pdf_to_json(pdf_path, patient_id=1):
    text = extract_text_safely(pdf_path)
    table_vitals = extract_vitals_from_tables(pdf_path)
    text_vitals = extract_vitals_from_text(text)
    extracted_vitals = merge_extractions(table_vitals, text_vitals)
    demographics = extract_demographics(text, table_vitals)
    patient_row = build_patient_row(extracted_vitals, demographics)
    seq = build_lstm_sequence(patient_row, demographics)
    probability, prediction = predict_patient(seq)
    clinical_findings, diet_constraints, objectives, notes = interpret_vitals_dynamically(extracted_vitals)
    icu_summary = interpret_icu_prediction(prediction, probability)
    
    return {
        "patient_id": patient_id,
        "data_extraction": {
            "extracted_vitals": extracted_vitals,
            "demographics": demographics,
        },
        "icu_prediction": icu_summary,
        "clinical_interpretation": {
            "clinical_findings": clinical_findings,
            "diet_constraints": diet_constraints,
            "dietary_objectives": objectives,
            "notes_for_llm": notes
        }
    }

# ────────────────────────────────────────────────
# MANUAL DATA PROCESSING
# ────────────────────────────────────────────────

def process_manual_data(manual_data: Dict[str, Any]):
    """Process manually entered patient data"""
    
    demographics = {
        "name": manual_data.get("name", ""),
        "age": int(manual_data.get("age", 60)) if manual_data.get("age") else 60,
        "gender": manual_data.get("gender", ""),
        "dob": manual_data.get("dob", ""),
    }
    
    extracted_vitals = {}
    vital_mapping = {
        "glucose": "Glucose",
        "creatinine": "Creatinine",
        "hemoglobin": "Hemoglobin",
        "sodium": "Sodium",
        "potassium": "Potassium",
        "wbc": "WBC",
        "cholesterol": "Cholesterol",
        "lactate": "Lactate",
        "ph": "pH",
    }
    
    for manual_key, vital_key in vital_mapping.items():
        value = manual_data.get(manual_key)
        if value:
            try:
                extracted_vitals[vital_key] = float(value)
            except:
                pass
    
    patient_row = build_patient_row(extracted_vitals, demographics)
    seq = build_lstm_sequence(patient_row, demographics)
    probability, prediction = predict_patient(seq)
    
    clinical_findings, diet_constraints, objectives, notes = interpret_vitals_dynamically(extracted_vitals)
    icu_summary = interpret_icu_prediction(prediction, probability)
    
    return {
        "patient_id": 1,
        "data_extraction": {
            "extracted_vitals": extracted_vitals,
            "demographics": demographics,
        },
        "icu_prediction": icu_summary,
        "clinical_interpretation": {
            "clinical_findings": clinical_findings,
            "diet_constraints": diet_constraints,
            "dietary_objectives": objectives,
            "notes_for_llm": notes
        }
    }

# ────────────────────────────────────────────────
# ENHANCED DIET GENERATION WITH NUTRITION DATA
# ────────────────────────────────────────────────

def prepare_llm_context(final_patient_json, diet_type, days=5):
    return {
        "age": final_patient_json["data_extraction"]["demographics"].get("age"),
        "icu_risk": final_patient_json["icu_prediction"]["risk_level"],
        "diet_constraints": final_patient_json["clinical_interpretation"]["diet_constraints"],
        "dietary_objectives": final_patient_json["clinical_interpretation"]["dietary_objectives"],
        "notes_for_llm": final_patient_json["clinical_interpretation"]["notes_for_llm"],
        "diet_type": diet_type,
        "days": days
    }

def ask_groq(messages, max_tokens=700, temperature=0.25):
    try:
        response = GROQ_CLIENT.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=0.92,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content.strip()
        return content
    except Exception as e:
        print(f"Groq error: {e}")
        return None

def generate_single_day_diet(llm_context, day_number):
    """Generate diet with detailed nutrition info and measurements"""
    prompt = f"""
You are a senior Indian clinical dietitian and nutrition expert.
Respond with **ONLY valid JSON** — no explanations, no Markdown, no ```json, no extra text.

Patient: Age {llm_context['age'] or 'unknown'}, ICU Risk: {llm_context['icu_risk']}, Diet: {llm_context['diet_type']}
Constraints: {', '.join(llm_context['diet_constraints'])}
Objectives: {', '.join(llm_context['dietary_objectives'])}
Notes: {llm_context['notes_for_llm']}

Generate Day {day_number} Indian diet plan with COMPLETE NUTRITION DETAILS.

For each meal, provide:
1. meal: Dish name
2. description: Brief 1-line description
3. ingredients: Array of objects with "item", "quantity", "unit" (e.g. {{"item": "Rice", "quantity": "1", "unit": "cup"}})
4. calories: Total calories (number)
5. protein: Protein in grams (number)
6. carbs: Carbohydrates in grams (number)
7. fats: Fats in grams (number)
8. fiber: Fiber in grams (number)
9. preparation_time: Time in minutes (number)
10. cooking_instructions: Array of step-by-step instructions
11. alternatives: Array of 2-3 alternative meal names that meet same constraints

Meals: Breakfast, Mid-morning Snack, Lunch, Evening Snack, Dinner

Output exactly:
{{
  "Day {day_number}": {{
    "Breakfast": {{
      "meal": "name",
      "description": "...",
      "ingredients": [{{"item": "...", "quantity": "...", "unit": "..."}}],
      "calories": 350,
      "protein": 12,
      "carbs": 45,
      "fats": 8,
      "fiber": 5,
      "preparation_time": 15,
      "cooking_instructions": ["Step 1", "Step 2"],
      "alternatives": ["Alt meal 1", "Alt meal 2"]
    }},
    "Mid-morning Snack": {{"meal": "...", ...}},
    "Lunch": {{"meal": "...", ...}},
    "Evening Snack": {{"meal": "...", ...}},
    "Dinner": {{"meal": "...", ...}}
  }},
  "daily_totals": {{
    "calories": 1800,
    "protein": 65,
    "carbs": 225,
    "fats": 55,
    "fiber": 30
  }}
}}
""".strip()

    messages = [{"role": "user", "content": prompt}]
    raw = ask_groq(messages, max_tokens=2500, temperature=0.2)
    if not raw:
        return None

    cleaned = re.sub(r'^```json\s*|\s*```$', '', raw.strip())
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"JSON error Day {day_number}: {e}")
        return None

def generate_full_diet_plan(llm_context):
    full_plan = {}
    for day in range(1, llm_context["days"] + 1):
        print(f"Generating Day {day} with nutrition data...")
        plan = generate_single_day_diet(llm_context, day)
        if plan:
            full_plan.update(plan)
    return full_plan

def generate_meal_alternatives(meal_name: str, diet_type: str, constraints: List[str], objectives: List[str]):
    """Generate 3-5 alternative meals with full nutrition data"""
    prompt = f"""
You are a clinical dietitian. Generate 3-5 ALTERNATIVE Indian meals to replace: "{meal_name}"

Requirements:
- Diet type: {diet_type}
- Must meet constraints: {', '.join(constraints)}
- Support objectives: {', '.join(objectives)}
- Similar calorie/macro profile to original
- Different ingredients/preparation

Output ONLY valid JSON:
{{
  "alternatives": [
    {{
      "meal": "Alternative name",
      "description": "Brief description",
      "ingredients": [{{"item": "ingredient", "quantity": "1", "unit": "cup"}}],
      "calories": 350,
      "protein": 12,
      "carbs": 45,
      "fats": 8,
      "fiber": 5,
      "preparation_time": 15,
      "cooking_instructions": ["Step 1", "Step 2"]
    }}
  ]
}}
""".strip()

    messages = [{"role": "user", "content": prompt}]
    raw = ask_groq(messages, max_tokens=2000, temperature=0.3)
    if not raw:
        return {"alternatives": []}

    cleaned = re.sub(r'^```json\s*|\s*```$', '', raw.strip())
    try:
        return json.loads(cleaned)
    except:
        return {"alternatives": []}

# ────────────────────────────────────────────────
# PDF REPORT GENERATION
# ────────────────────────────────────────────────

def generate_comprehensive_pdf_report(patient_data, diet_plan, filename="nutrition_report.pdf"):
    """Generate a comprehensive PDF report with all patient data and diet plan"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2C3E50'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#34495E'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=colors.HexColor('#5D6D7E'),
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )
    
    # Title
    story.append(Paragraph("AI NutriCare - Comprehensive Nutrition Report", title_style))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Patient Information Section
    story.append(Paragraph("Patient Information", heading_style))
    demographics = patient_data.get("data_extraction", {}).get("demographics", {})
    
    patient_info_data = [
        ["Name:", demographics.get("name", "N/A")],
        ["Age:", f"{demographics.get('age', 'N/A')} years"],
        ["Gender:", demographics.get("gender", "N/A")],
        ["Date of Birth:", demographics.get("dob", "N/A")],
    ]
    
    patient_table = Table(patient_info_data, colWidths=[2*inch, 4*inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ECF0F1')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 20))
    
    # ICU Prediction Section
    story.append(Paragraph("ICU Risk Assessment", heading_style))
    icu_pred = patient_data.get("icu_prediction", {})
    
    risk_data = [
        ["Prediction:", icu_pred.get("prediction", "N/A")],
        ["Risk Level:", icu_pred.get("risk_level", "N/A")],
        ["Confidence:", f"{(icu_pred.get('confidence', 0) * 100):.1f}%"],
        ["Clinical Meaning:", icu_pred.get("clinical_meaning", "N/A")],
    ]
    
    risk_table = Table(risk_data, colWidths=[2*inch, 4*inch])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#FADBD8')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 20))
    
    # Vital Signs Section
    extracted_vitals = patient_data.get("data_extraction", {}).get("extracted_vitals", {})
    if extracted_vitals:
        story.append(Paragraph("Laboratory Values", heading_style))
        
        vitals_data = [["Parameter", "Value", "Status"]]
        clinical_findings = patient_data.get("clinical_interpretation", {}).get("clinical_findings", {})
        
        for vital, value in extracted_vitals.items():
            status = clinical_findings.get(vital, {}).get("status", "Normal")
            vitals_data.append([vital, str(value), status])
        
        vitals_table = Table(vitals_data, colWidths=[2*inch, 2*inch, 2*inch])
        vitals_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#5DADE2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(vitals_table)
        story.append(Spacer(1, 20))
    
    # Clinical Findings
    if clinical_findings:
        story.append(Paragraph("Clinical Findings & Interpretations", heading_style))
        for vital, finding in clinical_findings.items():
            story.append(Paragraph(f"<b>{vital}:</b> {finding.get('interpretation', '')}", styles['Normal']))
            story.append(Spacer(1, 6))
        story.append(Spacer(1, 15))
    
    # Diet Plan Section
    story.append(PageBreak())
    story.append(Paragraph("Personalized Nutrition Plan", heading_style))
    
    for day_key, day_data in diet_plan.items():
        if day_key.startswith("Day"):
            story.append(Paragraph(day_key, subheading_style))
            
            # Daily totals if available
            if "daily_totals" in day_data:
                totals = day_data["daily_totals"]
                totals_text = f"Daily Totals: {totals.get('calories', 0)} cal | Protein: {totals.get('protein', 0)}g | Carbs: {totals.get('carbs', 0)}g | Fats: {totals.get('fats', 0)}g | Fiber: {totals.get('fiber', 0)}g"
                story.append(Paragraph(totals_text, styles['Italic']))
                story.append(Spacer(1, 10))
            
            for meal_time, meal_data in day_data.items():
                if meal_time == "daily_totals":
                    continue
                    
                if isinstance(meal_data, dict):
                    # Meal header
                    story.append(Paragraph(f"<b>{meal_time}: {meal_data.get('meal', 'N/A')}</b>", styles['Normal']))
                    story.append(Paragraph(meal_data.get('description', ''), styles['Normal']))
                    
                    # Nutrition info
                    nutrition_text = f"Calories: {meal_data.get('calories', 0)} | Protein: {meal_data.get('protein', 0)}g | Carbs: {meal_data.get('carbs', 0)}g | Fats: {meal_data.get('fats', 0)}g"
                    story.append(Paragraph(nutrition_text, styles['Italic']))
                    
                    # Ingredients
                    if 'ingredients' in meal_data and meal_data['ingredients']:
                        ingredients_text = "<b>Ingredients:</b> "
                        ingredient_list = []
                        for ing in meal_data['ingredients']:
                            if isinstance(ing, dict):
                                ingredient_list.append(f"{ing.get('item', '')} ({ing.get('quantity', '')} {ing.get('unit', '')})")
                        ingredients_text += ", ".join(ingredient_list)
                        story.append(Paragraph(ingredients_text, styles['Normal']))
                    
                    # Cooking instructions
                    if 'cooking_instructions' in meal_data and meal_data['cooking_instructions']:
                        story.append(Paragraph("<b>Preparation:</b>", styles['Normal']))
                        for idx, instruction in enumerate(meal_data['cooking_instructions'], 1):
                            story.append(Paragraph(f"{idx}. {instruction}", styles['Normal']))
                    
                    story.append(Spacer(1, 12))
            
            story.append(Spacer(1, 15))
    
    # Footer
    story.append(PageBreak())
    story.append(Paragraph("Important Notes", heading_style))
    story.append(Paragraph("• This nutrition plan is generated based on your medical data and dietary requirements.", styles['Normal']))
    story.append(Paragraph("• Please consult with your healthcare provider before making any dietary changes.", styles['Normal']))
    story.append(Paragraph("• Stay hydrated by drinking 8-10 glasses of water daily.", styles['Normal']))
    story.append(Paragraph("• Report any adverse reactions or concerns to your medical team immediately.", styles['Normal']))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("Generated by AI NutriCare System", styles['Italic']))
    story.append(Paragraph("Powered by Advanced AI & Clinical Nutrition Science", styles['Italic']))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    # Save to file
    output_path = Path("/mnt/user-data/outputs") / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(buffer.getvalue())
    
    return str(output_path)

# ────────────────────────────────────────────────
# API ENDPOINTS
# ────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "endpoints": ["/predict/pdf", "/predict/manual", "/alternatives", "/download-report"]
    }

@app.post("/predict/pdf")
async def predict_pdf(
    file: UploadFile = File(...),
    diet_type: str = Form("veg"),
    days: int = Form(7, ge=1, le=30)
):
    """PDF upload endpoint - extracts data and generates enhanced diet plan"""
    if MODEL is None or SCALER is None:
        raise HTTPException(500, "Model not loaded")

    try:
        temp_dir = Path("temp_uploads")
        temp_dir.mkdir(exist_ok=True)
        pdf_path = temp_dir / file.filename

        with pdf_path.open("wb") as f:
            shutil.copyfileobj(file.file, f)

        patient_json = process_pdf_to_json(str(pdf_path))
        context = prepare_llm_context(patient_json, diet_type, days)
        diet_plan = generate_full_diet_plan(context)

        result = {
            "patient_data": patient_json,
            "diet_plan": diet_plan,
            "diet_type": diet_type,
            "days": days
        }

        pdf_path.unlink(missing_ok=True)
        return result

    except Exception as e:
        if 'pdf_path' in locals():
            pdf_path.unlink(missing_ok=True)
        raise HTTPException(500, str(e))

@app.post("/predict/manual")
async def predict_manual(data: ManualDataInput):
    """Manual entry endpoint - processes manual data and generates enhanced diet plan"""
    if MODEL is None or SCALER is None:
        raise HTTPException(500, "Model not loaded")

    try:
        patient_json = process_manual_data(data.manual_data)
        context = prepare_llm_context(patient_json, data.diet_type, data.days)
        diet_plan = generate_full_diet_plan(context)

        result = {
            "patient_data": patient_json,
            "diet_plan": diet_plan,
            "diet_type": data.diet_type,
            "days": data.days
        }

        return result

    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/alternatives")
async def get_meal_alternatives(request: AlternativesRequest):
    """Get alternative meals for a specific dish"""
    try:
        alternatives = generate_meal_alternatives(
            request.meal_name,
            request.diet_type,
            request.constraints,
            request.objectives
        )
        return alternatives
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/generate-report")
async def generate_report(patient_data: dict, diet_plan: dict):
    """Generate comprehensive PDF report"""
    try:
        filename = f"nutrition_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        pdf_path = generate_comprehensive_pdf_report(patient_data, diet_plan, filename)
        
        return {
            "success": True,
            "filename": filename,
            "message": "Report generated successfully"
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/download-report/{filename}")
async def download_report(filename: str):
    """Download generated PDF report"""
    file_path = Path("/mnt/user-data/outputs") / filename
    
    if not file_path.exists():
        raise HTTPException(404, "Report not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/pdf"
    )
