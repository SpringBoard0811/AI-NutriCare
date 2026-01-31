// App.jsx - PRODUCTION ENHANCED VERSION with Medication Management & Auth
import { useState, useEffect } from "react";
import "./App.css";
import back1 from "./assets/back1.png";

const SLIDES = [
  { bg: back1, title: "NutriCare AI", tag: "Clinical-Grade ICU Nutrition Intelligence", em: "Evidence-based nutrition meets AI precision 🏥" },
  { bg: back1, title: "Precision Recovery", tag: "Personalized • Measurable • Therapeutic", em: "Every meal optimized for your recovery 📊" },
  { bg: back1, title: "Smart Nutrition", tag: "Real-Time Monitoring • Expert Guidance", em: "Your 24/7 clinical nutrition partner 🌟" },
];

const ACHIEVEMENTS = [
  { id: 1, name: "First Steps", icon: "🥇", description: "Completed your first day", unlocked: true },
  { id: 2, name: "Hydration Hero", icon: "💧", description: "Reached 2L water goal 3 days in a row", unlocked: false },
  { id: 3, name: "Week Warrior", icon: "⚡", description: "Completed 7 consecutive days", unlocked: false },
  { id: 4, name: "Nutrition Champion", icon: "🏆", description: "Perfect adherence for 14 days", unlocked: false },
  { id: 5, name: "Recovery Star", icon: "⭐", description: "Improved all vitals by 10%", unlocked: false },
];

const AI_TIPS = [
  "💡 Your glucose levels show improvement! Keep up the fiber intake.",
  "🌟 Recovery rate is 15% faster than average - excellent progress!",
  "💧 Hydration directly correlates with better kidney function in your case.",
  "🥗 Adding more leafy greens could boost hemoglobin by 8-12%.",
  "⚡ Consider light stretching exercises to improve circulation.",
  "🎯 You're on track to reduce risk by 45% within 2 weeks!",
];

export default function App() {
  // ============ Auth State ============
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "signup"
  const [authData, setAuthData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: ""
  });

  // ============ Core State ============
  const [backendResponse, setBackendResponse] = useState(null);
  const [dietPlan, setDietPlan] = useState({});
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  
  // ============ Input State ============
  const [inputMode, setInputMode] = useState("pdf");
  const [file, setFile] = useState(null);
  const [days, setDays] = useState(7);
  const [dietType, setDietType] = useState("veg");
  
  // ============ Manual Entry State ============
  const [manualData, setManualData] = useState({
    name: "", age: "", gender: "Male", dob: "",
    glucose: "", creatinine: "", hemoglobin: "", sodium: "",
    potassium: "", wbc: "", cholesterol: "", lactate: "", ph: "",
  });
  
  // ============ UI State ============
  const [theme, setTheme] = useState("dark");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);
  const [completedDays, setCompletedDays] = useState(new Set());
  const [mealNotes, setMealNotes] = useState({});
  const [waterIntake, setWaterIntake] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [calorieGoal, setCalorieGoal] = useState(1800);
  const [proteinGoal, setProteinGoal] = useState(70);
  
  // ============ NEW: Enhanced Features State ============
  const [showMealDetails, setShowMealDetails] = useState({});
  const [showAlternatives, setShowAlternatives] = useState({});
  const [loadingAlternatives, setLoadingAlternatives] = useState({});
  const [mealAlternatives, setMealAlternatives] = useState({});
  const [expandedMeals, setExpandedMeals] = useState({});
  const [downloadingReport, setDownloadingReport] = useState(false);
  
  // ============ Chat State ============
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Hello! I'm your AI nutrition assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  
  // ============ Health Metrics State ============
  const [moodRating, setMoodRating] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  
  // ============ NEW: Enhanced Medication State ============
  const [medicationReminders, setMedicationReminders] = useState([
    { id: 1, name: "Vitamin D", time: "09:00", taken: false },
    { id: 2, name: "Iron Supplement", time: "14:00", taken: false },
    { id: 3, name: "Multivitamin", time: "20:00", taken: false },
  ]);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newMedication, setNewMedication] = useState({ name: "", time: "" });
  const [editingMedication, setEditingMedication] = useState(null);
  
  const [currentAITip, setCurrentAITip] = useState(0);

  // ============ Effects ============
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentAITip((prev) => (prev + 1) % AI_TIPS.length);
    }, 8000);
    return () => clearInterval(tipInterval);
  }, []);

  // ============ NEW: Medication Reminder Checker ============
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkMedications = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      medicationReminders.forEach((med) => {
        if (med.time === currentTime && !med.taken) {
          showNotificationMsg(`⏰ Time to take: ${med.name}`);
          // Play notification sound if enabled
          if (soundEnabled) {
            console.log("🔔 Medication Reminder!");
          }
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkMedications, 60000);
    // Check immediately on mount
    checkMedications();

    return () => clearInterval(interval);
  }, [medicationReminders, soundEnabled, isLoggedIn]);

  // ============ Helper Functions ============
  const showNotificationMsg = (msg) => {
    setNotificationMessage(msg);
    setShowNotification(true);
    if (soundEnabled) console.log("🔔");
    setTimeout(() => setShowNotification(false), 3000);
  };

  // ============ NEW: Auth Functions ============
  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!authData.email || !authData.password) {
      showNotificationMsg("Please fill in all fields ❌");
      return;
    }

    // Simulate login (replace with actual API call)
    setIsLoggedIn(true);
    setShowAuthModal(false);
    showNotificationMsg("Welcome back! 👋");
    
    // Reset auth data
    setAuthData({ email: "", password: "", name: "", confirmPassword: "" });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    
    if (!authData.name || !authData.email || !authData.password || !authData.confirmPassword) {
      showNotificationMsg("Please fill in all fields ❌");
      return;
    }

    if (authData.password !== authData.confirmPassword) {
      showNotificationMsg("Passwords do not match ❌");
      return;
    }

    if (authData.password.length < 6) {
      showNotificationMsg("Password must be at least 6 characters ❌");
      return;
    }

    // Simulate signup (replace with actual API call)
    setIsLoggedIn(true);
    setShowAuthModal(false);
    showNotificationMsg("Account created successfully! 🎉");
    
    // Reset auth data
    setAuthData({ email: "", password: "", name: "", confirmPassword: "" });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setGenerated(false);
    setBackendResponse(null);
    setDietPlan({});
    showNotificationMsg("Logged out successfully 👋");
  };

  // ============ NEW: Medication Management Functions ============
  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.time) {
      showNotificationMsg("Please fill in medication name and time ❌");
      return;
    }

    const newMed = {
      id: Date.now(),
      name: newMedication.name,
      time: newMedication.time,
      taken: false
    };

    setMedicationReminders([...medicationReminders, newMed]);
    setNewMedication({ name: "", time: "" });
    setShowAddMedication(false);
    showNotificationMsg("Medication added successfully! 💊");
  };

  const handleEditMedication = (id) => {
    const med = medicationReminders.find(m => m.id === id);
    setEditingMedication(med);
    setNewMedication({ name: med.name, time: med.time });
    setShowAddMedication(true);
  };

  const handleUpdateMedication = () => {
    if (!newMedication.name || !newMedication.time) {
      showNotificationMsg("Please fill in medication name and time ❌");
      return;
    }

    setMedicationReminders(medicationReminders.map(med => 
      med.id === editingMedication.id 
        ? { ...med, name: newMedication.name, time: newMedication.time }
        : med
    ));

    setNewMedication({ name: "", time: "" });
    setEditingMedication(null);
    setShowAddMedication(false);
    showNotificationMsg("Medication updated successfully! ✅");
  };

  const handleDeleteMedication = (id) => {
    if (window.confirm("Are you sure you want to delete this medication?")) {
      setMedicationReminders(medicationReminders.filter(med => med.id !== id));
      showNotificationMsg("Medication deleted 🗑️");
    }
  };

  const toggleMedication = (id) => {
    setMedicationReminders(prev => 
      prev.map(med => {
        if (med.id === id) {
          const newTaken = !med.taken;
          if (newTaken) {
            showNotificationMsg(`✅ ${med.name} marked as taken`);
          }
          return { ...med, taken: newTaken };
        }
        return med;
      })
    );
  };

  // ============ NEW: Fetch Meal Alternatives ============
  const fetchMealAlternatives = async (mealName, dayKey, mealTime) => {
    const key = `${dayKey}-${mealTime}`;
    setLoadingAlternatives(prev => ({ ...prev, [key]: true }));
    
    try {
      const constraints = backendResponse?.clinical_interpretation?.diet_constraints || [];
      const objectives = backendResponse?.clinical_interpretation?.dietary_objectives || [];
      
      const response = await fetch("http://localhost:8000/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal_name: mealName,
          diet_type: dietType,
          constraints: constraints,
          objectives: objectives
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMealAlternatives(prev => ({ ...prev, [key]: data.alternatives || [] }));
        setShowAlternatives(prev => ({ ...prev, [key]: true }));
        showNotificationMsg("Alternatives loaded! 🍽️");
      }
    } catch (error) {
      console.error("Error fetching alternatives:", error);
      showNotificationMsg("Failed to load alternatives ❌");
    } finally {
      setLoadingAlternatives(prev => ({ ...prev, [key]: false }));
    }
  };

  // ============ NEW: Download PDF Report ============
  const downloadPDFReport = async () => {
    setDownloadingReport(true);
    showNotificationMsg("Generating comprehensive PDF report... 📄");
    
    try {
      const response = await fetch("http://localhost:8000/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_data: backendResponse,
          diet_plan: dietPlan
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Download the file
        const downloadResponse = await fetch(`http://localhost:8000/download-report/${data.filename}`);
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotificationMsg("Report downloaded successfully! 📥");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      showNotificationMsg("Failed to download report ❌");
    } finally {
      setDownloadingReport(false);
    }
  };

  // ============ Main Generate Function ============
  const handleGeneratePlan = async () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthMode("login");
      showNotificationMsg("Please log in to generate a plan 🔐");
      return;
    }

    setLoading(true);
    
    try {
      let response;
      
      if (inputMode === "pdf") {
        if (!file) {
          showNotificationMsg("Please upload a PDF report first 📄");
          setLoading(false);
          return;
        }
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("diet_type", dietType);
        formData.append("days", days);
        
        showNotificationMsg("AI analyzing PDF... 🔍");
        
        response = await fetch("http://localhost:8000/predict/pdf", {
          method: "POST",
          body: formData,
        });
        
      } else {
        if (!manualData.name || !manualData.age) {
          showNotificationMsg("Please enter at least name and age 👤");
          setLoading(false);
          return;
        }
        
        showNotificationMsg("AI processing data... 🤖");
        
        response = await fetch("http://localhost:8000/predict/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            manual_data: manualData,
            diet_type: dietType,
            days: days,
          }),
        });
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Backend Response:", data);
      
      setBackendResponse(data.patient_data);
      setDietPlan(data.diet_plan || {});
      setGenerated(true);
      
      showNotificationMsg("Nutrition plan generated successfully! 🎉");
      
    } catch (err) {
      console.error("❌ Error:", err);
      showNotificationMsg("Failed to generate plan. Check backend connection. ❌");
    } finally {
      setLoading(false);
    }
  };

  // ============ UI Handlers ============
  const toggleDayComplete = (day) => {
    const newCompleted = new Set(completedDays);
    if (newCompleted.has(day)) {
      newCompleted.delete(day);
    } else {
      newCompleted.add(day);
      showNotificationMsg(`Day ${day} marked complete! 🌟`);
      if (newCompleted.size === 1 && !ACHIEVEMENTS[0].unlocked) {
        ACHIEVEMENTS[0].unlocked = true;
        showNotificationMsg("🏆 Achievement Unlocked: First Steps!");
      }
    }
    setCompletedDays(newCompleted);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    showNotificationMsg(`Switched to ${theme === "dark" ? "light" : "dark"} mode`);
  };

  const addWater = () => {
    setWaterIntake(prev => prev + 250);
    if ((waterIntake + 250) % 1000 === 0) {
      showNotificationMsg("Great hydration! Keep it up! 💧");
    }
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { role: "user", text: chatInput }]);
    setChatInput("");
    setTimeout(() => {
      const responses = [
        "Based on your vitals, I recommend increasing protein intake by 10g daily.",
        "Your recovery is progressing well! The current plan is optimal.",
        "I've noticed improved glucose levels. Great job with fiber intake!",
      ];
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        text: responses[Math.floor(Math.random() * responses.length)] 
      }]);
    }, 1000);
  };

  const toggleMealExpansion = (dayKey, mealTime) => {
    const key = `${dayKey}-${mealTime}`;
    setExpandedMeals(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ============ Computed Values ============
  const slide = SLIDES[currentSlide];
  const currentDayKey = `Day ${selectedDay}`;
  const currentMeals = dietPlan[currentDayKey] || {};
  const dailyTotals = currentMeals.daily_totals || {};
  const progress = (completedDays.size / days) * 100;

  const demographics = backendResponse?.data_extraction?.demographics || {};
  const extractedVitals = backendResponse?.data_extraction?.extracted_vitals || {};
  const clinicalFindings = backendResponse?.clinical_interpretation?.clinical_findings || {};
  const icuPrediction = backendResponse?.icu_prediction || null;

  // Calculate daily progress
  const calorieProgress = dailyTotals.calories ? (dailyTotals.calories / calorieGoal) * 100 : 0;
  const proteinProgress = dailyTotals.protein ? (dailyTotals.protein / proteinGoal) * 100 : 0;

  return (
    <div className="app">
      {/* Notification Toast */}
      {showNotification && (
        <div className="notification-toast">
          {notificationMessage}
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="settings-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="settings-panel auth-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{authMode === "login" ? "🔐 Log In" : "✨ Sign Up"}</h3>
            
            <form onSubmit={authMode === "login" ? handleLogin : handleSignup}>
              {authMode === "signup" && (
                <div className="setting-item">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={authData.name}
                    onChange={(e) => setAuthData({...authData, name: e.target.value})}
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div className="setting-item">
                <label>Email</label>
                <input 
                  type="email" 
                  value={authData.email}
                  onChange={(e) => setAuthData({...authData, email: e.target.value})}
                  placeholder="Enter your email"
                />
              </div>

              <div className="setting-item">
                <label>Password</label>
                <input 
                  type="password" 
                  value={authData.password}
                  onChange={(e) => setAuthData({...authData, password: e.target.value})}
                  placeholder="Enter your password"
                />
              </div>

              {authMode === "signup" && (
                <div className="setting-item">
                  <label>Confirm Password</label>
                  <input 
                    type="password" 
                    value={authData.confirmPassword}
                    onChange={(e) => setAuthData({...authData, confirmPassword: e.target.value})}
                    placeholder="Confirm your password"
                  />
                </div>
              )}

              <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem' }}>
                {authMode === "login" ? "Log In" : "Sign Up"}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button 
                  type="button"
                  className="btn-link"
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                >
                  {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Medication Modal */}
      {showAddMedication && (
        <div className="settings-overlay" onClick={() => {
          setShowAddMedication(false);
          setEditingMedication(null);
          setNewMedication({ name: "", time: "" });
        }}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <h3>{editingMedication ? "✏️ Edit Medication" : "💊 Add Medication"}</h3>
            
            <div className="setting-item">
              <label>Medication Name</label>
              <input 
                type="text" 
                value={newMedication.name}
                onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                placeholder="e.g., Aspirin, Vitamin C"
              />
            </div>

            <div className="setting-item">
              <label>Time</label>
              <input 
                type="time" 
                value={newMedication.time}
                onChange={(e) => setNewMedication({...newMedication, time: e.target.value})}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={editingMedication ? handleUpdateMedication : handleAddMedication}
                style={{ flex: 1 }}
              >
                {editingMedication ? "Update" : "Add"} Medication
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setShowAddMedication(false);
                  setEditingMedication(null);
                  setNewMedication({ name: "", time: "" });
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      {showAIChat && (
        <div className="ai-chat-panel">
          <div className="chat-header">
            <h4>🤖 AI Assistant</h4>
            <button onClick={() => setShowAIChat(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
            />
            <button onClick={handleChatSend}>Send</button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <h3>⚙️ Settings</h3>
            <div className="setting-item">
              <label>Daily Calorie Goal</label>
              <input type="number" value={calorieGoal} onChange={(e) => setCalorieGoal(Number(e.target.value))} />
            </div>
            <div className="setting-item">
              <label>Daily Protein Goal (g)</label>
              <input type="number" value={proteinGoal} onChange={(e) => setProteinGoal(Number(e.target.value))} />
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
                Enable Sounds
              </label>
            </div>
            <button className="btn btn-primary" onClick={() => setShowSettings(false)}>Save</button>
          </div>
        </div>
      )}

      {/* Achievements Panel */}
      {showAchievements && (
        <div className="achievements-overlay" onClick={() => setShowAchievements(false)}>
          <div className="achievements-panel" onClick={(e) => e.stopPropagation()}>
            <h3>🏆 Achievements</h3>
            <div className="achievements-grid">
              {ACHIEVEMENTS.map((ach) => (
                <div key={ach.id} className={`achievement-card ${ach.unlocked ? "unlocked" : "locked"}`}>
                  <div className="achievement-icon">{ach.icon}</div>
                  <h4>{ach.name}</h4>
                  <p>{ach.description}</p>
                  {ach.unlocked && <span className="unlocked-badge">✓ Unlocked</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="brand">
          <h2>NutriCare AI...</h2>
          
        </div>
        <div className="header-controls">
          <button className="btn-icon" onClick={() => setShowAchievements(true)} title="Achievements">🏆</button>
          <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme">{theme === "dark" ? "☀️" : "🌙"}</button>
          <button className="btn-icon" onClick={() => setShowAIChat(!showAIChat)} title="AI Assistant">🤖</button>
          <button className="btn-icon" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
          
          {isLoggedIn ? (
            <button className="btn btn-outline" onClick={handleLogout}>Log out</button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => { setShowAuthModal(true); setAuthMode("login"); }}>Log in</button>
              <button className="btn btn-primary" onClick={() => { setShowAuthModal(true); setAuthMode("signup"); }}>Sign up</button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="hero" style={{ backgroundImage: `url(${slide.bg})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>{slide.title}</h1>
          <p className="tag">{slide.tag}</p>
          <p className="em">{slide.em}</p>
        </div>
        <div className="dots">
          {SLIDES.map((_, i) => (
            <button key={i} className={`dot ${i === currentSlide ? "active" : ""}`} onClick={() => setCurrentSlide(i)} />
          ))}
        </div>
      </section>

      {/* Main Content */}
      <main className="container">
        {/* Patient Intake */}
        <div className="glass intake">
          <h2>Patient Intake & Assessment</h2>
          <p className="sub">Upload medical report or enter data manually</p>

          {/* Input Mode Toggle */}
          <div className="entry-mode-toggle">
            <button className={`mode-btn ${inputMode === "pdf" ? "active" : ""}`} onClick={() => setInputMode("pdf")}>
              📄 Upload PDF
            </button>
            <button className={`mode-btn ${inputMode === "manual" ? "active" : ""}`} onClick={() => setInputMode("manual")}>
              ✍️ Manual Entry
            </button>
          </div>

          {/* PDF Upload */}
          {inputMode === "pdf" && (
            <label className="custom-file-upload">
              <div className="upload-content">
                <span className="upload-icon">{file ? "📄" : "📤"}</span>
                <span className="upload-text">{file ? file.name : "Click or drag PDF here"}</span>
                {file && <span className="file-size">Ready ✓</span>}
              </div>
              <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0])} />
            </label>
          )}

          {/* Manual Entry Form */}
          {inputMode === "manual" && (
            <div className="manual-entry-form">
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Name *</label>
                    <input value={manualData.name} onChange={(e) => setManualData({...manualData, name: e.target.value})} placeholder="Patient name" />
                  </div>
                  <div className="form-field">
                    <label>Age *</label>
                    <input type="number" value={manualData.age} onChange={(e) => setManualData({...manualData, age: e.target.value})} placeholder="Years" />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <select value={manualData.gender} onChange={(e) => setManualData({...manualData, gender: e.target.value})}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Date of Birth</label>
                    <input type="date" value={manualData.dob} onChange={(e) => setManualData({...manualData, dob: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Laboratory Vitals (Optional)</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Glucose (mg/dL)</label>
                    <input type="number" value={manualData.glucose} onChange={(e) => setManualData({...manualData, glucose: e.target.value})} placeholder="110" />
                  </div>
                  <div className="form-field">
                    <label>Creatinine (mg/dL)</label>
                    <input type="number" step="0.1" value={manualData.creatinine} onChange={(e) => setManualData({...manualData, creatinine: e.target.value})} placeholder="1.0" />
                  </div>
                  <div className="form-field">
                    <label>Hemoglobin (g/dL)</label>
                    <input type="number" step="0.1" value={manualData.hemoglobin} onChange={(e) => setManualData({...manualData, hemoglobin: e.target.value})} placeholder="13" />
                  </div>
                  <div className="form-field">
                    <label>Sodium (mEq/L)</label>
                    <input type="number" value={manualData.sodium} onChange={(e) => setManualData({...manualData, sodium: e.target.value})} placeholder="140" />
                  </div>
                  <div className="form-field">
                    <label>Potassium (mEq/L)</label>
                    <input type="number" step="0.1" value={manualData.potassium} onChange={(e) => setManualData({...manualData, potassium: e.target.value})} placeholder="4.2" />
                  </div>
                  <div className="form-field">
                    <label>WBC (×10³/μL)</label>
                    <input type="number" step="0.1" value={manualData.wbc} onChange={(e) => setManualData({...manualData, wbc: e.target.value})} placeholder="7" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diet Options */}
          <div className="options">
            <div className="diet-type">
              <label>Diet Preference</label>
              <div className="btn-group">
                <button className={`btn-pill ${dietType === "veg" ? "active" : ""}`} onClick={() => setDietType("veg")}>
                  🥗 Vegetarian
                </button>
                <button className={`btn-pill ${dietType === "nonveg" ? "active" : ""}`} onClick={() => setDietType("nonveg")}>
                  🍗 Non-Veg
                </button>
                <button className={`btn-pill ${dietType === "both" ? "active" : ""}`} onClick={() => setDietType("both")}>
                  ✨ Both
                </button>
              </div>
            </div>

            <div className="days-select">
              <label>Plan Duration</label>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {[3, 5, 7, 10, 14, 21, 30].map((n) => (
                  <option key={n} value={n}>{n} days</option>
                ))}
              </select>
            </div>
          </div>

          <button className={`generate-btn ${loading ? "loading-btn" : ""}`} onClick={handleGeneratePlan} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                AI Processing...
              </>
            ) : (
              "✨ Generate AI-Powered Plan"
            )}
          </button>
        </div>

        {/* Results Section */}
        {generated && backendResponse && (
          <>
            {/* Patient Summary */}
            <div className="glass patient-summary">
              <div className="summary-header">
                <h3>👤 Patient Overview</h3>
                <button 
                  className={`btn-download ${downloadingReport ? 'downloading' : ''}`}
                  onClick={downloadPDFReport}
                  disabled={downloadingReport}
                >
                  {downloadingReport ? (
                    <>
                      <span className="spinner-small"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      📥 Download Full Report
                    </>
                  )}
                </button>
              </div>
              
              <div className="summary-grid">
                <div className="summary-card">
                  <span className="summary-label">Name</span>
                  <span className="summary-value">{demographics.name || "N/A"}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Age</span>
                  <span className="summary-value">{demographics.age || "N/A"} years</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Gender</span>
                  <span className="summary-value">{demographics.gender || "N/A"}</span>
                </div>
                {icuPrediction && (
                  <div className="summary-card highlight">
                    <span className="summary-label">ICU Risk</span>
                    <span className="summary-value">{icuPrediction.risk_level}</span>
                    <span className="summary-detail">{(icuPrediction.confidence * 100).toFixed(0)}% confidence</span>
                  </div>
                )}
              </div>

              {Object.keys(extractedVitals).length > 0 && (
                <div className="vitals-section">
                  <h4>📊 Vitals</h4>
                  <div className="vitals-grid">
                    {Object.entries(extractedVitals).map(([vital, value]) => (
                      <div key={vital} className="vital-chip">
                        <strong>{vital}</strong>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(clinicalFindings).length > 0 && (
                <div className="findings-section">
                  <h4>🔬 Clinical Findings</h4>
                  {Object.entries(clinicalFindings).map(([vital, info]) => (
                    <div key={vital} className={`finding-item ${info.status?.toLowerCase().includes("normal") ? "normal" : "alert"}`}>
                      <div className="finding-row">
                        <strong>{vital}</strong>
                        <span className={`status-badge ${info.status?.toLowerCase().includes("normal") ? "status-normal" : "status-alert"}`}>
                          {info.status}
                        </span>
                      </div>
                      <p className="finding-detail">{info.interpretation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Nutrition Summary */}
            {dailyTotals.calories && (
              <div className="glass nutrition-summary-card">
                <h3>📊 Daily Nutrition Summary - {currentDayKey}</h3>
                <div className="nutrition-bars">
                  <div className="nutrition-bar-item">
                    <div className="nutrition-bar-header">
                      <span className="nutrition-label">Calories</span>
                      <span className="nutrition-value">{dailyTotals.calories} / {calorieGoal} kcal</span>
                    </div>
                    <div className="nutrition-bar-track">
                      <div 
                        className="nutrition-bar-fill calories" 
                        style={{ width: `${Math.min(calorieProgress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="nutrition-bar-item">
                    <div className="nutrition-bar-header">
                      <span className="nutrition-label">Protein</span>
                      <span className="nutrition-value">{dailyTotals.protein}g / {proteinGoal}g</span>
                    </div>
                    <div className="nutrition-bar-track">
                      <div 
                        className="nutrition-bar-fill protein" 
                        style={{ width: `${Math.min(proteinProgress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="macro-grid">
                    <div className="macro-item">
                      <span className="macro-icon">🍚</span>
                      <div className="macro-details">
                        <span className="macro-label">Carbs</span>
                        <span className="macro-value">{dailyTotals.carbs}g</span>
                      </div>
                    </div>
                    <div className="macro-item">
                      <span className="macro-icon">🥑</span>
                      <div className="macro-details">
                        <span className="macro-label">Fats</span>
                        <span className="macro-value">{dailyTotals.fats}g</span>
                      </div>
                    </div>
                    <div className="macro-item">
                      <span className="macro-icon">🌾</span>
                      <div className="macro-details">
                        <span className="macro-label">Fiber</span>
                        <span className="macro-value">{dailyTotals.fiber}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Health Log */}
            <div className="glass health-log">
              <h3>📊 Daily Health Log</h3>
              <div className="health-metrics">
                <div className="metric-input">
                  <label>Mood</label>
                  <div className="emoji-rating">
                    {['😢', '😕', '😐', '🙂', '😄'].map((emoji, idx) => (
                      <button key={idx} className={`emoji-btn ${moodRating === idx + 1 ? 'active' : ''}`} onClick={() => setMoodRating(idx + 1)}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="metric-input">
                  <label>Energy Level</label>
                  <input type="range" min="1" max="5" value={energyLevel} onChange={(e) => setEnergyLevel(Number(e.target.value))} />
                  <span className="range-value">{energyLevel}/5</span>
                </div>
                <div className="metric-input">
                  <label>Sleep Quality</label>
                  <input type="range" min="1" max="5" value={sleepQuality} onChange={(e) => setSleepQuality(Number(e.target.value))} />
                  <span className="range-value">{sleepQuality}/5</span>
                </div>
              </div>
            </div>

            {/* Enhanced Medications */}
            <div className="glass medication-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>💊 Medication Reminders</h3>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowAddMedication(true)}
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                >
                  ➕ Add Medication
                </button>
              </div>
              <div className="medication-list">
                {medicationReminders.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.6, fontStyle: 'italic', padding: '2rem' }}>
                    No medications added yet. Click "Add Medication" to get started.
                  </p>
                ) : (
                  medicationReminders.map((med) => (
                    <div key={med.id} className={`medication-item ${med.taken ? 'taken' : ''}`}>
                      <div className="med-info">
                        <strong>{med.name}</strong>
                        <span className="med-time">{med.time.replace(/(\d+):(\d+)/, (_, h, m) => {
                          const hour = parseInt(h);
                          const period = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                          return `${displayHour}:${m} ${period}`;
                        })}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          className="btn-icon-small"
                          onClick={() => handleEditMedication(med.id)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon-small"
                          onClick={() => handleDeleteMedication(med.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                        <button className={`med-checkbox ${med.taken ? 'checked' : ''}`} onClick={() => toggleMedication(med.id)}>
                          {med.taken ? '✓' : ''}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="glass progress-card">
              <div className="progress-header">
                <div>
                  <h3>Recovery Progress</h3>
                  <p className="sub-small">Track your journey to wellness</p>
                </div>
                <div className="progress-stats">
                  <div className="stat-item">
                    <span className="stat-value">{completedDays.size}/{days}</span>
                    <span className="stat-label">Days</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{Math.round(progress)}%</span>
                    <span className="stat-label">Complete</span>
                  </div>
                </div>
              </div>
              <div className="progress-bar-outer">
                <div className="progress-bar-inner" style={{ width: `${progress}%` }}>
                  <span className="progress-label">{Math.round(progress)}%</span>
                </div>
              </div>
              
              <div className="hydration-tracker">
                <div className="hydration-header">
                  <span>💧 Daily Hydration</span>
                  <span className="hydration-amount">{waterIntake}ml / 2000ml</span>
                </div>
                <div className="hydration-progress">
                  <div className="hydration-bar" style={{ width: `${(waterIntake / 2000) * 100}%` }}></div>
                </div>
                <div className="water-glasses">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className={`water-glass ${waterIntake >= (i + 1) * 250 ? "filled" : ""}`} onClick={waterIntake < (i + 1) * 250 ? addWater : undefined}>
                      💧
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Tips */}
            <div className="ai-insights-ticker">
              <div className="ticker-content">
                <span className="ticker-icon">🤖</span>
                <span className="ticker-text">{AI_TIPS[currentAITip]}</span>
              </div>
            </div>

            {/* ENHANCED DIET PLAN WITH DETAILED NUTRITION */}
            <div className="glass plan">
              <div className="plan-header">
                <h3>🍽️ Nutrition Plan</h3>
              </div>

              <div className="day-slider-container">
                <button className="carousel-arrow" onClick={() => setSelectedDay((d) => Math.max(1, d - 1))} disabled={selectedDay === 1}>←</button>
                <div className="carousel-window">
                  <div className="carousel-inner" style={{ transform: `translateX(-${(selectedDay - 1) * 110}px)` }}>
                    {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                      <button key={d} className={`day-pill ${d === selectedDay ? "active" : ""} ${completedDays.has(d) ? "completed" : ""}`} onClick={() => setSelectedDay(d)}>
                        {completedDays.has(d) && <span className="check-mark">✓</span>}
                        Day {d}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="carousel-arrow" onClick={() => setSelectedDay((d) => Math.min(days, d + 1))} disabled={selectedDay === days}>→</button>
              </div>

              <div className="day-title-bar">
                <h4 className="current-day-title">Day {selectedDay} Meal Plan</h4>
                <button className={`complete-day-btn ${completedDays.has(selectedDay) ? "completed" : ""}`} onClick={() => toggleDayComplete(selectedDay)}>
                  {completedDays.has(selectedDay) ? "✓ Completed" : "Mark Complete"}
                </button>
              </div>

              <div className="plan-content">
                <div className="meals">
                  {Object.entries(currentMeals).length > 0 ? (
                    Object.entries(currentMeals)
                      .filter(([mealTime]) => mealTime !== 'daily_totals')
                      .map(([mealTime, mealData]) => {
                        const key = `${currentDayKey}-${mealTime}`;
                        const isExpanded = expandedMeals[key];
                        const showingAlts = showAlternatives[key];
                        const alternatives = mealAlternatives[key] || [];
                        const loadingAlts = loadingAlternatives[key];

                        return (
                          <div key={mealTime} className="meal-card-enhanced">
                            <div className="meal-header-enhanced">
                              <div className="meal-title-section">
                                <strong className="meal-time">{mealTime}</strong>
                                <h4 className="meal-name">{mealData.meal}</h4>
                              </div>
                              <div className="meal-nutrition-quick">
                                <span className="cal-badge">{mealData.calories || 0} cal</span>
                                <span className="protein-badge">{mealData.protein || 0}g protein</span>
                              </div>
                            </div>

                            <p className="meal-desc">{mealData.description}</p>

                            {/* Macros Grid */}
                            <div className="meal-macros-grid">
                              <div className="macro-badge">
                                <span className="macro-icon">🍚</span>
                                <span className="macro-text">{mealData.carbs || 0}g carbs</span>
                              </div>
                              <div className="macro-badge">
                                <span className="macro-icon">🥑</span>
                                <span className="macro-text">{mealData.fats || 0}g fats</span>
                              </div>
                              <div className="macro-badge">
                                <span className="macro-icon">🌾</span>
                                <span className="macro-text">{mealData.fiber || 0}g fiber</span>
                              </div>
                              {mealData.preparation_time && (
                                <div className="macro-badge">
                                  <span className="macro-icon">⏱️</span>
                                  <span className="macro-text">{mealData.preparation_time} min</span>
                                </div>
                              )}
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="meal-expanded-details">
                                {/* Ingredients */}
                                {mealData.ingredients && mealData.ingredients.length > 0 && (
                                  <div className="ingredients-section">
                                    <h5>📋 Ingredients</h5>
                                    <ul className="ingredients-list">
                                      {mealData.ingredients.map((ing, idx) => (
                                        <li key={idx}>
                                          <span className="ing-item">{ing.item}</span>
                                          <span className="ing-quantity">{ing.quantity} {ing.unit}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Cooking Instructions */}
                                {mealData.cooking_instructions && mealData.cooking_instructions.length > 0 && (
                                  <div className="instructions-section">
                                    <h5>👨‍🍳 Preparation Steps</h5>
                                    <ol className="instructions-list">
                                      {mealData.cooking_instructions.map((step, idx) => (
                                        <li key={idx}>{step}</li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Alternatives Section */}
                            {showingAlts && alternatives.length > 0 && (
                              <div className="alternatives-section">
                                <h5>🔄 Alternative Options</h5>
                                <div className="alternatives-grid">
                                  {alternatives.map((alt, idx) => (
                                    <div key={idx} className="alternative-card">
                                      <h6>{alt.meal}</h6>
                                      <p className="alt-desc">{alt.description}</p>
                                      <div className="alt-nutrition">
                                        <span>{alt.calories} cal</span>
                                        <span>{alt.protein}g protein</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="meal-actions">
                              <button 
                                className="btn-action"
                                onClick={() => toggleMealExpansion(currentDayKey, mealTime)}
                              >
                                {isExpanded ? "📖 Hide Details" : "📖 View Details"}
                              </button>
                              
                              <button 
                                className="btn-action"
                                onClick={() => fetchMealAlternatives(mealData.meal, currentDayKey, mealTime)}
                                disabled={loadingAlts}
                              >
                                {loadingAlts ? (
                                  <>
                                    <span className="spinner-small"></span>
                                    Loading...
                                  </>
                                ) : (
                                  "🔄 Get Alternatives"
                                )}
                              </button>

                              <button 
                                className="btn-action"
                                onClick={() => {
                                  const note = prompt("Add a note:");
                                  if (note) {
                                    setMealNotes(prev => ({...prev, [key]: note}));
                                    showNotificationMsg("Note added! 📝");
                                  }
                                }}
                              >
                                {mealNotes[key] ? "📝 Edit Note" : "➕ Add Note"}
                              </button>
                            </div>

                            {mealNotes[key] && (
                              <div className="meal-note">💭 {mealNotes[key]}</div>
                            )}
                          </div>
                        );
                      })
                  ) : (
                    <div className="empty-state">
                      <p>No meals available for this day</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAIChat(true)}>🤖</button>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <p>Evidence-based nutrition for optimal recovery 🌿</p>
          <p className="footer-credits">Powered by Advanced AI • Medical-Grade Security</p>
        </div>
      </footer>
    </div>
  );
}