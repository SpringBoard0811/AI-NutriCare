// src/types.ts

export type MealItem = {
    item: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    tags?: string[];
    // New fields for the modal
    ingredients?: string[];
    origin?: string;
};

export type DayPlan = {
    breakfast: MealItem[];
    lunch: MealItem[];
    dinner: MealItem[];
    snacks: MealItem[];
};

export type WeekPlan = {
    day1: DayPlan;
    day2: DayPlan;
    day3: DayPlan;
    day4: DayPlan;
    day5: DayPlan;
    day6: DayPlan;
    day7: DayPlan;
};

export type TotalNutrition = {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
};

export type ClinicalInfo = {
    patient_metrics: {
        mortality_risk: number;
        glucose: number;
        creatinine: number;
    };
    conditions: string[];
    avoid: string[];
    recommend: string[];
    summary: string;
};

export type PlanDietResponse = {
    clinical: ClinicalInfo;
    diet: {
        week_plan: WeekPlan;
        total_nutrition: TotalNutrition;
        medical_reasoning: string;
    };
};

// Dietary Preferences Types
export type DietType = 'vegetarian' | 'non-vegetarian' | 'both';
export type RegionType = 'North' | 'South' | 'East' | 'West' | 'North East' | null;

export type DietaryPreferences = {
    diet_type: DietType;
    region: RegionType;
};

export type ManualEntryData = {
    glucose: number;
    creatinine: number;
    urea_bun: number;
    sodium: number;
    potassium: number;
    cholesterol: number;
    age?: number;
    gender?: string;
    hemoglobin?: number;
    hba1c?: number;
    preferences: DietaryPreferences;
};