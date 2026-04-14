import { useEffect, useMemo, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner']
const FILTERS = ['All', 'Vegetarian', 'Vegan', 'High Protein', 'Low Carb']

// Replaced placeholder local images with high-quality real food photography from Unsplash
const MEAL_DB = [
  { id: 1, name: 'Avocado Toast', emoji: '🥑', cal: 320, carbs: 38, protein: 9, fat: 16, category: 'Vegetarian', cuisine: 'Western', defaultType: 'Breakfast', prepTime: '10 min', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500&h=500&fit=crop', ingredients: [{ name: 'Bread', qty: 2, unit: 'slices', cat: 'Grains', icon: '🍞' }, { name: 'Avocado', qty: 1, unit: 'pc', cat: 'Vegetables', icon: '🥑' }], instructions: ['Toast the bread until golden brown.', 'Mash the avocado with a fork.', 'Spread the mashed avocado over the toasted bread and season with salt.'] },
  { id: 2, name: 'Greek Yogurt Bowl', emoji: '🫙', cal: 280, carbs: 32, protein: 18, fat: 8, category: 'Vegetarian', cuisine: 'Mediterranean', defaultType: 'Breakfast', prepTime: '5 min', image: 'https://images.unsplash.com/photo-1517093763785-520c483988fb?w=500&h=500&fit=crop', ingredients: [{ name: 'Greek yogurt', qty: 200, unit: 'g', cat: 'Dairy', icon: '🥛' }, { name: 'Berries', qty: 80, unit: 'g', cat: 'Others', icon: '🍓' }], instructions: ['Scoop greek yogurt into a bowl.', 'Wash and dry the berries.', 'Top the yogurt with berries and drizzle with honey if desired.'] },
  { id: 3, name: 'Chicken Rice Bowl', emoji: '🍚', cal: 520, carbs: 58, protein: 38, fat: 12, category: 'High Protein', cuisine: 'Asian', defaultType: 'Lunch', prepTime: '20 min', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop', ingredients: [{ name: 'Chicken breast', qty: 150, unit: 'g', cat: 'Others', icon: '🍗' }, { name: 'Rice', qty: 100, unit: 'g', cat: 'Grains', icon: '🍚' }, { name: 'Broccoli', qty: 100, unit: 'g', cat: 'Vegetables', icon: '🥦' }], instructions: ['Cook the rice according to package instructions.', 'Grill or pan-fry the chicken breast.', 'Steam the broccoli.', 'Assemble the bowl and add your favorite sauce.'] },
  { id: 4, name: 'Veggie Wrap', emoji: '🌯', cal: 420, carbs: 52, protein: 14, fat: 16, category: 'Vegetarian', cuisine: 'Mexican', defaultType: 'Lunch', prepTime: '10 min', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&h=500&fit=crop', ingredients: [{ name: 'Tortilla', qty: 2, unit: 'pc', cat: 'Grains', icon: '🌮' }, { name: 'Bell pepper', qty: 1, unit: 'pc', cat: 'Vegetables', icon: '🫑' }], instructions: ['Slice the bell pepper.', 'Lay out the tortilla and spread hummus or sauce.', 'Add the veggies and wrap tightly.'] },
  { id: 5, name: 'Salmon & Veggies', emoji: '🐟', cal: 560, carbs: 20, protein: 44, fat: 28, category: 'High Protein', cuisine: 'Nordic', defaultType: 'Dinner', prepTime: '25 min', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&h=500&fit=crop', ingredients: [{ name: 'Salmon fillet', qty: 200, unit: 'g', cat: 'Others', icon: '🐟' }, { name: 'Spinach', qty: 100, unit: 'g', cat: 'Vegetables', icon: '🥬' }], instructions: ['Preheat oven to 400°F (200°C).', 'Season the salmon and place on a baking sheet.', 'Roast for 12-15 minutes.', 'Sauté spinach lightly and serve alongside the salmon.'] },
  { id: 6, name: 'Lentil Soup', emoji: '🍲', cal: 340, carbs: 48, protein: 20, fat: 6, category: 'Vegan', cuisine: 'Indian', defaultType: 'Dinner', prepTime: '35 min', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&h=500&fit=crop', ingredients: [{ name: 'Red lentils', qty: 150, unit: 'g', cat: 'Grains', icon: '🫘' }, { name: 'Onion', qty: 1, unit: 'pc', cat: 'Vegetables', icon: '🧅' }, { name: 'Spices', qty: 1, unit: 'tbsp', cat: 'Spices', icon: '🌶️' }], instructions: ['Dice the onion and sauté until translucent.', 'Rinse the lentils and add to the pot with broth and spices.', 'Simmer for 25-30 minutes until lentils are tender.'] },
  { id: 7, name: 'Overnight Oats', emoji: '🥣', cal: 380, carbs: 58, protein: 14, fat: 9, category: 'Vegan', cuisine: 'Western', defaultType: 'Breakfast', prepTime: '5 min', image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&h=500&fit=crop', ingredients: [{ name: 'Oats', qty: 80, unit: 'g', cat: 'Grains', icon: '🌾' }, { name: 'Oat milk', qty: 200, unit: 'ml', cat: 'Dairy', icon: '🥛' }], instructions: ['Mix oats and oat milk in a jar.', 'Add desired toppings like cinnamon or maple syrup.', 'Refrigerate overnight and enjoy cold in the morning.'] },
  { id: 8, name: 'Beef Stir Fry', emoji: '🥩', cal: 580, carbs: 28, protein: 42, fat: 30, category: 'High Protein', cuisine: 'Asian', defaultType: 'Dinner', prepTime: '20 min', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=500&fit=crop', ingredients: [{ name: 'Beef strips', qty: 180, unit: 'g', cat: 'Others', icon: '🥩' }, { name: 'Mixed vegetables', qty: 200, unit: 'g', cat: 'Vegetables', icon: '🥗' }, { name: 'Soy sauce', qty: 2, unit: 'tbsp', cat: 'Spices', icon: '🏺' }], instructions: ['Marinate the beef strips briefly in soy sauce.', 'Stir-fry the vegetables in a hot wok.', 'Add the beef and stir-fry until cooked through.', 'Serve immediately.'] },
]

const storage = {
  plan: 'mp_react_plan',
  checked: 'mp_react_checked',
  serving: 'mp_react_serving',
  pantry: 'mp_react_pantry',
  aiMeals: 'mp_react_ai_meals'
}

const fmtQty = (qty, unit) => `${Number.isInteger(qty) ? qty : qty.toFixed(1)} ${unit}`

function App() {
  const [view, setView] = useState('planner')
  
  // Storage State
  const [plan, setPlan] = useState(() => JSON.parse(localStorage.getItem(storage.plan) || '{}'))
  const [checked, setChecked] = useState(() => JSON.parse(localStorage.getItem(storage.checked) || '{}'))
  const [servingSize, setServingSize] = useState(() => Number(localStorage.getItem(storage.serving) || 2))
  const [pantry, setPantry] = useState(() => JSON.parse(localStorage.getItem(storage.pantry) || '{}'))
  const [generatedMeals, setGeneratedMeals] = useState(() => JSON.parse(localStorage.getItem(storage.aiMeals) || '[]'))
  
  // UI State
  const [openSlot, setOpenSlot] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Recipe Page State
  const [recDay, setRecDay] = useState('Mon')
  const [recType, setRecType] = useState('Breakfast')
  const [recSearch, setRecSearch] = useState('')
  const [recFilter, setRecFilter] = useState('All')

  // AI State
  const [ingredientHint, setIngredientHint] = useState('')
  const [cuisineHint, setCuisineHint] = useState('')

  const allMeals = useMemo(() => [...MEAL_DB, ...generatedMeals], [generatedMeals])
  const mealById = (id) => allMeals.find((m) => String(m.id) === String(id))

  useEffect(() => localStorage.setItem(storage.plan, JSON.stringify(plan)), [plan])
  useEffect(() => localStorage.setItem(storage.checked, JSON.stringify(checked)), [checked])
  useEffect(() => localStorage.setItem(storage.serving, String(servingSize)), [servingSize])
  useEffect(() => localStorage.setItem(storage.pantry, JSON.stringify(pantry)), [pantry])
  useEffect(() => localStorage.setItem(storage.aiMeals, JSON.stringify(generatedMeals)), [generatedMeals])

  const handleAIGenerate = async () => {
    if (!ingredientHint.trim()) return;
    setIsGenerating(true);
    try {
      const genAI = new GoogleGenerativeAI('AIzaSyCF-4rafBy3QnvOL3i9oXs1mbpK8Xxo_yU');
      const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" }
      });
      
      const prompt = `Generate exactly 3 delicious, realistic meal recipes based on these ingredients: \`${ingredientHint}\`. 
      The cuisine style should be: \`${cuisineHint || 'Any'}\`.
      They should sound like premium restaurant meals.
      Return ONLY a raw JSON array matching this exact structure:
      [
        {
          "id": 12345,
          "name": "Recipe Name",
          "emoji": "🍳",
          "cal": 450,
          "carbs": 40,
          "protein": 25,
          "fat": 15,
          "category": "High Protein", 
          "cuisine": "Mexican", 
          "defaultType": "Dinner", 
          "prepTime": "20 min", 
          "ingredients": [
            { "name": "Ingredient 1", "qty": 200, "unit": "g", "cat": "Others", "icon": "🍅" }
          ],
          "instructions": [
            "Step 1 description."
          ]
        }
      ]
      * Notes: 'cat' for ingredients must be exactly one of: Vegetables, Dairy, Grains, Spices, Others.
      'category' for recipe must be one of: High Protein, Vegetarian, Vegan, Low Carb, or Regular.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      let generatedArray = JSON.parse(text);
      
      // Append generated realistic images via Pollinations AI
      const mappedMeals = generatedArray.map(meal => ({
        ...meal,
        id: Math.floor(Math.random() * 9000000) + 1000000,
        // using pollinations to get an incredibly realistic image of exactly this food
        image: `https://image.pollinations.ai/prompt/${encodeURIComponent(meal.name + ' delicious premium professional food photography')}?width=500&height=500&nologo=true`
      }));

      setGeneratedMeals(prev => [...mappedMeals, ...prev]);
      setIngredientHint(''); // Clear input
      
      // If we are currently browsing a slot to pick something, keep it open so they see the new generated items there as well.
      // But we will also navigate to planner to show them.
      setView('planner');

    } catch (err) {
      console.error('Error generating AI meals:', err);
      alert("Failed to generate recipes. Please try again or refine your prompt.");
    } finally {
      setIsGenerating(false);
    }
}

  const totalMeals = Object.values(plan).length
  const weeklyCalories = Object.values(plan).reduce((sum, id) => sum + (mealById(id)?.cal || 0), 0)

  const grocery = useMemo(() => {
    const map = {}
    Object.values(plan).forEach((id) => {
      const meal = mealById(id)
      if (!meal) return
      meal.ingredients.forEach((ing) => {
        const key = ing.name.toLowerCase()
        if (!map[key]) map[key] = { ...ing, key, qty: 0, count: 0 }
        map[key].qty += ing.qty * servingSize
        map[key].count += 1
      })
    })
    return Object.values(map)
  }, [plan, servingSize, allMeals])

  const groceryByCat = useMemo(() => {
    return grocery.reduce((acc, item) => {
      if (!acc[item.cat]) acc[item.cat] = []
      acc[item.cat].push(item)
      return acc
    }, {})
  }, [grocery])

  const visiblePlannerMeals = useMemo(() => {
    return allMeals.filter((m) => {
      if (filter !== 'All' && m.category !== filter) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      return m.name.toLowerCase().includes(q) || m.cuisine.toLowerCase().includes(q) || m.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
    })
  }, [allMeals, filter, search])

  const visibleRecipes = useMemo(() => {
    return allMeals.filter((m) => {
      if (m.defaultType !== recType) return false;
      if (recFilter !== 'All' && m.category !== recFilter) return false
      const q = recSearch.trim().toLowerCase()
      if (!q) return true
      return m.name.toLowerCase().includes(q) || m.cuisine.toLowerCase().includes(q) || m.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
    })
  }, [allMeals, recType, recSearch, recFilter])


  const toggleMeal = (slot, mealId) => setPlan((p) => ({ ...p, [slot]: mealId }))
  const removeMeal = (slot) => setPlan((p) => { const next = { ...p }; delete next[slot]; return next })

  const dayCalories = DAYS.map((_, di) => MEAL_TYPES.reduce((sum, __, ti) => sum + (mealById(plan[`${di}-${ti}`])?.cal || 0), 0))

  const currentSlotStr = `${DAYS.indexOf(recDay)}-${MEAL_TYPES.indexOf(recType)}`
  const plannedMealId = plan[currentSlotStr]
  const plannedMeal = mealById(plannedMealId)

  const handleAddToPlannerFromRecipe = (mealId) => {
      toggleMeal(currentSlotStr, mealId);
  }

  const handleRemoveFromPlannerRecipe = () => {
      removeMeal(currentSlotStr)
  }

  return (
    <div className="app">
      <nav className="nav">
        <h1><span className="brand-script">Fetch</span><span>Feast</span></h1>
        <div className="tabs">
          {[
            { id: 'planner', label: 'Planner' },
            { id: 'grocery', label: 'Grocery' },
            { id: 'nutrition', label: 'Nutrition' },
            { id: 'recipes', label: 'Recipes' }
          ].map((v) => (
            <button key={v.id} className={view === v.id ? 'active' : ''} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 📅 PLANNER VIEW */}
      {view === 'planner' && (
        <section className="view-animate planner-view">
          <header className="hero-premium">
            <div className="hero-content-box">
              <h2>Plan Smarter, Eat Better</h2>
              <p>Design your perfect week with curated, delicious meals.</p>
              <div className="hero-stats-row">
                <span className="hero-stat-pill">✨ {totalMeals} meals planned</span>
                <span className="hero-stat-pill">🔥 {weeklyCalories} kcal total</span>
              </div>
            </div>
          </header>

          <div className="panel premium-card">
            <div className="toolbar">
              <div className="serving-selector">
                <label>Serving size:</label>
                <select value={servingSize} onChange={(e) => setServingSize(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} people</option>)}
                </select>
              </div>
              <button className="btn btn-secondary shadow-hover" onClick={() => setPlan({})}>Clear week</button>
            </div>
            
            <div className="week-grid">
              {DAYS.map((day, di) => (
                <div className="day-col" key={day}>
                  <div className="day-head">{day}</div>
                  <div className="day-slots">
                    {MEAL_TYPES.map((type, ti) => {
                      const slot = `${di}-${ti}`
                      const meal = mealById(plan[slot])
                      return (
                        <div className="slot" key={slot} onClick={() => setOpenSlot(slot)}>
                          <span className="slot-type">{type}</span>
                          {meal ? (
                            <div className="slot-content">
                              <img src={meal.image} alt="" className="slot-img"/>
                              <div className="slot-text">
                                <strong>{meal.name}</strong>
                                <small>{meal.cal} kcal</small>
                              </div>
                              <button className="slot-remove" onClick={(e) => { e.stopPropagation(); removeMeal(slot) }}>×</button>
                            </div>
                          ) : (
                            <div className="slot-empty">+ Add Meal</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Generator below planner grid */}
          <div className="ai-planner-container">
            <div className="ai-planner-header">
              <h3>✨ AI Recipe Generator</h3>
              <p>Tell us what you have, and we'll craft the perfect meal.</p>
            </div>
            <div className="ai-planner-inputs-wrapper">
              <div className="ai-input-box">
                <label>Ingredients</label>
                <input 
                  value={ingredientHint} 
                  onChange={(e) => setIngredientHint(e.target.value)} 
                  placeholder="e.g. Tomato, Chicken, Rice" 
                />
              </div>
              <div className="ai-input-box">
                <label>Cuisine</label>
                <select value={cuisineHint} onChange={(e) => setCuisineHint(e.target.value)}>
                    <option value="">Any Style</option>
                    <option value="Italian">Italian</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Asian">Asian</option>
                    <option value="Indian">Indian</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="American">American</option>
                </select>
              </div>
              <button className="btn-generate" onClick={handleAIGenerate} disabled={isGenerating}>
                {isGenerating ? "GENERATING..." : "GENERATE"}
              </button>
            </div>

            {generatedMeals.length > 0 && (
              <div className="ai-results-grid">
                 {/* Display 3 most recent generated meals with beautiful full-style cards directly beneath generator! */}
                 <h3 className="section-heading" style={{marginTop: '2rem'}}>Recently Generated</h3>
                 <div className="recipes-grid">
                  {generatedMeals.slice(0, 3).map(recipe => (
                    <div key={recipe.id} className="recipe-card" onClick={() => setOpenSlot('0-0')}> {/* We can just click to use it... but we'd need to pick a slot. Simple fix: click opens generic slot picker for planner... Or just let it navigate to recipes page */}
                      <div className="recipe-img-box">
                        <img src={recipe.image} alt={recipe.name} className="floating-food" />
                      </div>
                      <div className="recipe-info">
                        <div className="recipe-header">
                            <h3>{recipe.name}</h3>
                            <span className="recipe-tag">{recipe.category}</span>
                        </div>
                        <div className="recipe-meta">
                          <span>🔥 {recipe.cal} kcal</span>
                          <span>⏱️ {recipe.prepTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 📖 RECIPES VIEW */}
      {view === 'recipes' && (
        <section className="view-animate recipes-view">
          <div className="recipe-hero-copy">
              <h2>My Recipes</h2>
              <p>View your scheduled meals or browse for new inspiration.</p>
          </div>

          <div className="day-selector">
            {DAYS.map(day => (
              <button 
                key={day} 
                className={`day-tab ${recDay === day ? 'active' : ''}`}
                onClick={() => setRecDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="meal-category-tabs">
            {MEAL_TYPES.map(type => (
              <button 
                key={type} 
                className={`meal-tab ${recType === type ? 'active' : ''}`}
                onClick={() => setRecType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {plannedMeal ? (
             <div className="planned-meal-container">
                <div className="planned-badge">★ Scheduled for {recDay} {recType}</div>
                <div className="recipe-large-card premium-card">
                  <div className="rlc-header">
                      <img src={plannedMeal.image} alt={plannedMeal.name} className="rlc-img"/>
                      <div className="rlc-title-box">
                          <span className="rm-tag">{plannedMeal.category}</span>
                          <h2 className="recipe-h2-title">{plannedMeal.name}</h2>
                          <div className="rm-meta">
                              <span>🔥 {plannedMeal.cal} kcal</span>
                              <span>⏱️ {plannedMeal.prepTime}</span>
                              <span>🍽️ {plannedMeal.cuisine}</span>
                          </div>
                      </div>
                  </div>
                  <div className="rlc-body">
                      <div className="rm-section">
                          <h3>Ingredients (for {servingSize})</h3>
                          <ul className="rm-ingredients">
                              {plannedMeal.ingredients.map((ing, idx) => (
                                  <li key={idx}>
                                      <span className="ing-icon">{ing.icon}</span> 
                                      <span className="ing-name">{ing.name}</span>
                                      <span className="ing-qty">{ing.qty * servingSize} {ing.unit}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                      <div className="rm-section">
                          <h3>Instructions</h3>
                          <ol className="rm-instructions">
                              {plannedMeal.instructions.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                              ))}
                          </ol>
                      </div>
                  </div>
                  <div className="rlc-footer">
                      <button className="btn btn-secondary shadow-hover" onClick={handleRemoveFromPlannerRecipe}>Remove from Planner</button>
                  </div>
                </div>
             </div>
          ) : (
             <div className="browse-recipes-container">
                <div className="filters-row">
                  <input value={recSearch} onChange={(e) => setRecSearch(e.target.value)} placeholder="Search recipes..." className="recipe-search" />
                  <select value={recFilter} onChange={(e) => setRecFilter(e.target.value)} className="recipe-filter">
                    {FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="recipes-grid">
                  {visibleRecipes.map(recipe => (
                    <div key={recipe.id} className="recipe-card" onClick={() => handleAddToPlannerFromRecipe(recipe.id)}>
                      <div className="recipe-img-box">
                        <img src={recipe.image} alt={recipe.name} className="floating-food" />
                      </div>
                      <div className="recipe-info">
                        <div className="recipe-header">
                            <h3>{recipe.name}</h3>
                            <span className="recipe-tag">{recipe.category}</span>
                        </div>
                        <div className="recipe-meta">
                          <span>🔥 {recipe.cal} kcal</span>
                          <span>⏱️ {recipe.prepTime}</span>
                        </div>
                        <div className="card-add-overlay">
                            <span>+ Schedule for {recDay}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {visibleRecipes.length === 0 && (
                      <div className="empty-state">
                          <div className="empty-illustration">🔍</div>
                          <h3>No recipes found</h3>
                          <p>Try adjusting your search or filters.</p>
                      </div>
                  )}
                </div>
             </div>
          )}
        </section>
      )}

      {/* 🛒 GROCERY VIEW */}
      {view === 'grocery' && (
        <section className="view-animate grocery-view">
            <div className="recipe-hero-copy">
              <h2>Smart Grocery List</h2>
              <p>Automatically generated from your planned meals.</p>
            </div>

            {Object.keys(groceryByCat).length === 0 ? (
                <div className="empty-state premium-card">
                    <div className="empty-illustration">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Add meals to your planner to generate your shopping list.</p>
                </div>
            ) : (
                <div className="grocery-grid">
                  {Object.entries(groceryByCat).map(([cat, items]) => (
                    <div className="grocery-cat-card premium-card" key={cat}>
                      <h4>{cat}</h4>
                      <div className="grocery-items">
                        {items.map((item) => {
                          const isHave = !!pantry[item.key];
                          const isChecked = !!checked[item.key];
                          return (
                            <div className={`grocery-item ${isHave ? 'faded' : ''}`} key={item.key}>
                              <label className="checkbox-wrap">
                                <input type="checkbox" checked={isChecked} onChange={() => setChecked((c) => ({ ...c, [item.key]: !c[item.key] }))} />
                                <span className={isChecked ? 'strike' : ''}>{item.icon} {item.name} <strong>{fmtQty(item.qty, item.unit)}</strong></span>
                              </label>
                              <button className={`have-toggle ${isHave ? 'active' : ''}`} onClick={() => setPantry((p) => ({ ...p, [item.key]: !p[item.key] }))}>
                                {isHave ? 'In Pantry' : "Don't have"}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
            )}
        </section>
      )}

      {/* 📊 NUTRITION VIEW */}
      {view === 'nutrition' && (
         <section className="view-animate nutrition-view">
            <div className="recipe-hero-copy">
              <h2>Nutrition Summary</h2>
              <p>Track your macros and reach your wellness goals.</p>
            </div>

            <div className="stats-cards">
              <div className="stat-card premium-card">
                <span className="stat-icon bg-purple">🔥</span>
                <div className="stat-info">
                  <span>Total Weekly Kcal</span>
                  <strong>{weeklyCalories}</strong>
                </div>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-icon bg-green">📈</span>
                <div className="stat-info">
                  <span>Daily Average Kcal</span>
                  <strong>{Math.round(weeklyCalories / (totalMeals/3 || 1))}</strong>
                </div>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-icon bg-blue">🥩</span>
                <div className="stat-info">
                  <span>Total Protein</span>
                  <strong>{Object.values(plan).reduce((s, id) => s + (mealById(id)?.protein || 0), 0)}g</strong>
                </div>
              </div>
            </div>

            <div className="bars-card premium-card">
              <h3 className="section-heading">Daily Calorie Breakdown</h3>
              <div className="animated-bars">
                {DAYS.map((d, i) => {
                  const pct = Math.min(100, Math.round((dayCalories[i] / 2200) * 100));
                  return (
                    <div className="bar-row" key={d}>
                      <span className="bar-label">{d}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #a78bfa, #f472b6)` }}></div>
                      </div>
                      <span className="bar-value">{dayCalories[i]} kcal</span>
                    </div>
                  )
                })}
              </div>
            </div>
         </section>
      )}

      {/* PLANNER ADD MEAL MODAL */}
      {openSlot && view === 'planner' && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target.className === 'modal-backdrop') setOpenSlot(null) }}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>Schedule for {DAYS[openSlot.split('-')[0]]} {MEAL_TYPES[openSlot.split('-')[1]]}</h3>
              <button className="close-btn" onClick={() => setOpenSlot(null)}>×</button>
            </div>
            <div className="filters-row">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search meals (or select AI generated below)..." className="recipe-search" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="recipe-filter">
                {FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="planner-picker-list">
              {visiblePlannerMeals.map((m) => (
                <div key={m.id} className="picker-meal" onClick={() => { toggleMeal(openSlot, m.id); setOpenSlot(null) }}>
                  <img src={m.image} alt=""/>
                  <div className="picker-meal-info">
                    <strong>{m.name}</strong>
                    <span className="picker-tag">{m.category} {m.id > 100000 ? '✨ AI' : ''}</span>
                  </div>
                  <div className="picker-kcal">{m.cal} kcal</div>
                </div>
              ))}
              {visiblePlannerMeals.length === 0 && <p className="empty-sub" style={{textAlign: 'center', padding: '1rem'}}>No meals found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
