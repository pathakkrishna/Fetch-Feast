import { useEffect, useMemo, useState, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'

const FloatingDropdown = ({ value, onChange, options, suffix = '', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`floating-menu-wrapper ${className}`} ref={dropdownRef}>
      <button className={`floating-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)} type="button">
        {selectedOption.label} {suffix}
        <svg viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2' fill='none' strokeLinecap='round' strokeLinejoin='round' width="16" height="16" className="chevron-icon">
          <polyline points='6 9 12 15 18 9'></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="floating-menu">
          {options.map((opt) => (
            <div 
              key={opt.value} 
              className={`floating-option ${opt.value === value ? 'selected' : ''}`} 
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label} {suffix}
              {opt.value === value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="check-icon">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner']
const FILTERS = ['All', 'Veg', 'Non-Veg', 'Vegan']

// Replaced placeholder local images with high-quality real food photography from Unsplash
const SP_KEY = '2e3f177bd1fb47cc8451e28f24dfb80a';

const parseSpoonacularRecipe = (r, defaultCuisine = "Mix") => {
  const getNutrient = (name) => {
    const nut = r.nutrition?.nutrients?.find(n => n.name === name);
    return nut ? Math.round(nut.amount) : 0;
  };
  
  const mapCat = (aisle) => {
    const a = (aisle || '').toLowerCase();
    if (a.includes('produce') || a.includes('vegetable') || a.includes('fruit')) return 'Vegetables';
    if (a.includes('dairy') || a.includes('cheese') || a.includes('milk')) return 'Dairy';
    if (a.includes('pasta') || a.includes('bakery') || a.includes('bread') || a.includes('cereal') || a.includes('grain')) return 'Grains';
    if (a.includes('spice') || a.includes('seasoning')) return 'Spices';
    return 'Others';
  };

  const allIngredients = r.extendedIngredients || [...(r.usedIngredients || []), ...(r.missedIngredients || [])];
  
  let dishType = "Dinner";
  if (r.dishTypes) {
    if (r.dishTypes.includes('breakfast')) dishType = 'Breakfast';
    else if (r.dishTypes.includes('lunch') || r.dishTypes.includes('salad')) dishType = 'Lunch';
  }

  return {
    id: r.id + Math.floor(Math.random() * 100000), // Ensure unique IDs
    name: r.title,
    emoji: "🍽️",
    cal: getNutrient('Calories') || 400,
    carbs: getNutrient('Carbohydrates') || 40,
    protein: getNutrient('Protein') || 20,
    fat: getNutrient('Fat') || 10,
    category: r.vegan ? 'Vegan' : r.vegetarian ? 'Veg' : 'Non-Veg',
    cuisine: defaultCuisine,
    defaultType: dishType,
    prepTime: r.readyInMinutes ? `${r.readyInMinutes} min` : "30 min",
    ingredients: allIngredients.map(ing => ({
      name: ing.name || ing.originalName || "Ingredient",
      qty: ing.amount || 1,
      unit: ing.unit || "unit",
      cat: mapCat(ing.aisle),
      icon: "🍲"
    })).filter((v,i,a)=>a.findIndex(t=>(t.name===v.name))===i), // deduplicate
    instructions: r.analyzedInstructions?.[0]?.steps?.map(s => `${s.number}. ${s.step}`) || ["Cooking instructions are not provided by Spoonacular.", "Please refer to the ingredients list to guide your preparation."],
    image: r.image || `https://placehold.co/500x500/eaf0e9/4a4563.png?text=${encodeURIComponent('🍽️\n' + r.title)}`
  };
};

const FALLBACK_DB = [
  { id: 1, name: 'Avocado Toast', emoji: '🥑', cal: 320, carbs: 38, protein: 9, fat: 16, category: 'Veg', cuisine: 'Western', defaultType: 'Breakfast', prepTime: '10 min', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500&h=500&fit=crop', ingredients: [{ name: 'Bread', qty: 2, unit: 'slices', cat: 'Grains', icon: '🍞' }, { name: 'Avocado', qty: 1, unit: 'pc', cat: 'Vegetables', icon: '🥑' }], instructions: ['Toast the bread until golden brown.', 'Mash the avocado with a fork.', 'Spread the mashed avocado over the toasted bread and season with salt.'] },
  { id: 2, name: 'Greek Yogurt Bowl', emoji: '🫙', cal: 280, carbs: 32, protein: 18, fat: 8, category: 'Veg', cuisine: 'Mediterranean', defaultType: 'Breakfast', prepTime: '5 min', image: 'https://images.unsplash.com/photo-1517093763785-520c483988fb?w=500&h=500&fit=crop', ingredients: [{ name: 'Greek yogurt', qty: 200, unit: 'g', cat: 'Dairy', icon: '🥛' }, { name: 'Berries', qty: 80, unit: 'g', cat: 'Others', icon: '🍓' }], instructions: ['Scoop greek yogurt into a bowl.', 'Wash and dry the berries.', 'Top the yogurt with berries and drizzle with honey if desired.'] },
  { id: 3, name: 'Chicken Rice Bowl', emoji: '🍚', cal: 520, carbs: 58, protein: 38, fat: 12, category: 'Non-Veg', cuisine: 'Asian', defaultType: 'Lunch', prepTime: '20 min', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop', ingredients: [{ name: 'Chicken breast', qty: 150, unit: 'g', cat: 'Others', icon: '🍗' }, { name: 'Rice', qty: 100, unit: 'g', cat: 'Grains', icon: '🍚' }, { name: 'Broccoli', qty: 100, unit: 'g', cat: 'Vegetables', icon: '🥦' }], instructions: ['Cook the rice according to package instructions.', 'Grill or pan-fry the chicken breast.', 'Steam the broccoli.', 'Assemble the bowl and add your favorite sauce.'] },
  { id: 4, name: 'Veggie Wrap', emoji: '🌯', cal: 420, carbs: 52, protein: 14, fat: 16, category: 'Vegan', cuisine: 'Mexican', defaultType: 'Lunch', prepTime: '10 min', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&h=500&fit=crop', ingredients: [{ name: 'Tortilla', qty: 2, unit: 'pc', cat: 'Grains', icon: '🌮' }, { name: 'Bell pepper', qty: 1, unit: 'pc', cat: 'Vegetables', icon: '🫑' }], instructions: ['Slice the bell pepper.', 'Lay out the tortilla and spread hummus or sauce.', 'Add the veggies and wrap tightly.'] },
  { id: 5, name: 'Salmon & Veggies', emoji: '🐟', cal: 560, carbs: 20, protein: 44, fat: 28, category: 'Non-Veg', cuisine: 'Nordic', defaultType: 'Dinner', prepTime: '25 min', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&h=500&fit=crop', ingredients: [{ name: 'Salmon fillet', qty: 200, unit: 'g', cat: 'Others', icon: '🐟' }, { name: 'Spinach', qty: 100, unit: 'g', cat: 'Vegetables', icon: '🥬' }], instructions: ['Preheat oven to 400°F (200°C).', 'Season the salmon and place on a baking sheet.', 'Roast for 12-15 minutes.', 'Sauté spinach lightly and serve alongside the salmon.'] },
  { id: 6, name: 'Lentil Soup', emoji: '🍲', cal: 340, carbs: 48, protein: 20, fat: 6, category: 'Vegan', cuisine: 'Indian', defaultType: 'Dinner', prepTime: '35 min', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&h=500&fit=crop', ingredients: [{ name: 'Red lentils', qty: 150, unit: 'g', cat: 'Grains', icon: '🫘' }, { name: 'Onion', qty: 1, unit: 'pc', cat: 'Vegetables', icon: '🧅' }, { name: 'Spices', qty: 1, unit: 'tbsp', cat: 'Spices', icon: '🌶️' }], instructions: ['Dice the onion and sauté until translucent.', 'Rinse the lentils and add to the pot with broth and spices.', 'Simmer for 25-30 minutes until lentils are tender.'] },
  { id: 7, name: 'Overnight Oats', emoji: '🥣', cal: 380, carbs: 58, protein: 14, fat: 9, category: 'Vegan', cuisine: 'Western', defaultType: 'Breakfast', prepTime: '5 min', image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&h=500&fit=crop', ingredients: [{ name: 'Oats', qty: 80, unit: 'g', cat: 'Grains', icon: '🌾' }, { name: 'Oat milk', qty: 200, unit: 'ml', cat: 'Dairy', icon: '🥛' }], instructions: ['Mix oats and oat milk in a jar.', 'Add desired toppings like cinnamon or maple syrup.', 'Refrigerate overnight and enjoy cold in the morning.'] },
  { id: 8, name: 'Beef Stir Fry', emoji: '🥩', cal: 580, carbs: 28, protein: 42, fat: 30, category: 'Non-Veg', cuisine: 'Asian', defaultType: 'Dinner', prepTime: '20 min', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=500&fit=crop', ingredients: [{ name: 'Beef strips', qty: 180, unit: 'g', cat: 'Others', icon: '🥩' }, { name: 'Mixed vegetables', qty: 200, unit: 'g', cat: 'Vegetables', icon: '🥗' }, { name: 'Soy sauce', qty: 2, unit: 'tbsp', cat: 'Spices', icon: '🏺' }], instructions: ['Marinate the beef strips briefly in soy sauce.', 'Stir-fry the vegetables in a hot wok.', 'Add the beef and stir-fry until cooked through.', 'Serve immediately.'] },
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
  const [view, setView] = useState('landing')
  
  // Storage State
  const [plan, setPlan] = useState(() => JSON.parse(localStorage.getItem(storage.plan) || '{}'))
  const [checked, setChecked] = useState(() => JSON.parse(localStorage.getItem(storage.checked) || '{}'))
  const [servingSize, setServingSize] = useState(() => Number(localStorage.getItem(storage.serving) || 2))
  const [pantry, setPantry] = useState(() => JSON.parse(localStorage.getItem(storage.pantry) || '{}'))
  const [generatedMeals, setGeneratedMeals] = useState(() => JSON.parse(localStorage.getItem(storage.aiMeals) || '[]'))
  
  // UI State
  const [openSlot, setOpenSlot] = useState(null)
  const [activeRecipe, setActiveRecipe] = useState(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  // Recipe Page State
  const [recDay, setRecDay] = useState('Mon')
  const [recType, setRecType] = useState('Breakfast')
  const [recSearch, setRecSearch] = useState('')
  const [recFilter, setRecFilter] = useState('All')

  // AI State
  const [ingredientHint, setIngredientHint] = useState('')
  const [cuisineHint, setCuisineHint] = useState('')
  const [fetchedMeals, setFetchedMeals] = useState([])

  // Persist State to Local Storage
  useEffect(() => { localStorage.setItem(storage.plan, JSON.stringify(plan)) }, [plan])
  useEffect(() => { localStorage.setItem(storage.checked, JSON.stringify(checked)) }, [checked])
  useEffect(() => { localStorage.setItem(storage.serving, String(servingSize)) }, [servingSize])
  useEffect(() => { localStorage.setItem(storage.pantry, JSON.stringify(pantry)) }, [pantry])
  useEffect(() => { localStorage.setItem(storage.aiMeals, JSON.stringify(generatedMeals)) }, [generatedMeals])

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);

  useEffect(() => {
    let mounted = true;
    const fetchBaseMeals = async () => {
      try {
        const res = await fetch(`https://api.spoonacular.com/recipes/complexSearch?addRecipeNutrition=true&fillIngredients=true&instructionsRequired=true&number=12&apiKey=${SP_KEY}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.results && data.results.length > 0) {
            setFetchedMeals(data.results.map(r => parseSpoonacularRecipe(r, "Fusion")));
          } else if (mounted) {
            setFetchedMeals(FALLBACK_DB);
          }
        } else {
          if (mounted) setFetchedMeals(FALLBACK_DB);
        }
      } catch (e) {
        if (mounted) setFetchedMeals(FALLBACK_DB);
      }
    };
    fetchBaseMeals();
    return () => { mounted = false; };
  }, []);

  // Debounced API fetch for planner search OR recipes search
  useEffect(() => {
    // If the user isn't searching in the opened modal OR the recipes view, do nothing
    const query = (openSlot ? search : (view === 'recipes' ? recSearch : '')).trim();
    if (!query) return;

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        let newMeals = [];
        // 1. Try Spoonacular API
        const spResponse = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&addRecipeNutrition=true&fillIngredients=true&number=8&apiKey=${SP_KEY}`);
        
        if (spResponse.ok) {
           const spData = await spResponse.json();
           if (spData && spData.results && spData.results.length > 0) {
              newMeals = spData.results.map(r => parseSpoonacularRecipe(r, "Mix"));
           }
        }
        
        // 2. If no Spoonacular results, fallback to Gemini API
        if (newMeals.length === 0) {
            console.log("No Spoonacular results for", query, "- falling back to Gemini");
            const genAI = new GoogleGenerativeAI('AIzaSyCQvC2Q1oRPl5vqvoStq-7WZYrcjjVv1Y8');
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
            const prompt = `You are a culinary expert AI. A user searched for exactly this food query: \`${query}\`.
            Spoonacular API returned no results. Please generate 3 highly detailed, authentic, real-world recipe variations for this food.
            Return ONLY a raw JSON object matching this exact structure:
            {
              "recipes": [
                {
                  "id": 12345,
                  "name": "Exact Recipe Name",
                  "emoji": "🍳",
                  "cal": 450,
                  "carbs": 40,
                  "protein": 25,
                  "fat": 15,
                  "category": "Regular", 
                  "cuisine": "Global", 
                  "defaultType": "Dinner", 
                  "prepTime": "30 min", 
                  "ingredients": [
                    { "name": "Ingredient 1", "qty": 200, "unit": "g", "cat": "Others", "icon": "🍅" }
                  ],
                  "instructions": [
                    "Detailed step 1", "Detailed step 2", "Provide at least 5-8 detailed steps forming a complete instruction set."
                  ]
                }
              ]
            }
            * Note fields: 'cat' for ingredients must be exactly one of: Vegetables, Dairy, Grains, Spices, Others.
            'category' for recipe must be exactly one of: Veg, Non-Veg, Vegan.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            let parsed = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
            let generatedArray = Array.isArray(parsed) ? parsed : (parsed.recipes || []);
            newMeals = generatedArray.map(meal => ({
               ...meal,
               id: Math.floor(Math.random() * 9000000) + 1000000,
               image: `https://loremflickr.com/500/500/food,recipe?lock=${meal.id || Math.floor(Math.random() * 1000)}`
            }));
        }

        if (newMeals.length > 0) {
           setFetchedMeals(prev => {
              const prevNames = new Set(prev.map(m => m.name)); 
              const uniqueNew = newMeals.filter(m => !prevNames.has(m.name));
              return [...uniqueNew, ...prev];
           });
        }
      } catch (err) {
         console.error("Live search failed:", err);
      } finally {
         setIsSearching(false);
      }
    }, 1000); 

    return () => clearTimeout(timeoutId);
  }, [search, recSearch, openSlot, view]);


  const allMeals = useMemo(() => [...fetchedMeals, ...generatedMeals], [fetchedMeals, generatedMeals])
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
      let finalMeals = [];

      // 1. Try Spoonacular API First
      try {
        const spResponse = await fetch(`https://api.spoonacular.com/recipes/complexSearch?includeIngredients=${encodeURIComponent(ingredientHint)}&cuisine=${encodeURIComponent(cuisineHint || '')}&addRecipeNutrition=true&fillIngredients=true&instructionsRequired=true&number=4&apiKey=${SP_KEY}`);
        if (spResponse.ok) {
          const spData = await spResponse.json();
          if (spData && spData.results && spData.results.length > 0) {
            finalMeals = spData.results.map(r => parseSpoonacularRecipe(r, cuisineHint || 'Fusion'));
          }
        }
      } catch (spErr) {
        console.warn("Spoonacular API failed, skipping to AI generator:", spErr);
      }

      // 2. If nothing from Spoonacular, fallback to Gemini AI
      if (finalMeals.length === 0) {
        console.log("Using Gemini AI Fallback for Recipes");
        const genAI = new GoogleGenerativeAI('AIzaSyCQvC2Q1oRPl5vqvoStq-7WZYrcjjVv1Y8');
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        
        const prompt = `Generate 3 or 4 delicious, realistic meal recipes based on these ingredients: \`${ingredientHint}\`. 
        The cuisine style should be: \`${cuisineHint || 'Any'}\`.
        They should sound like premium restaurant meals.
        Return ONLY a raw JSON object matching this exact structure:
        {
          "recipes": [
            {
              "id": 12345,
              "name": "Recipe Name",
              "emoji": "🍳",
              "cal": 450,
              "carbs": 40,
              "protein": 25,
              "fat": 15,
              "category": "Veg", 
              "cuisine": "Mexican", 
              "defaultType": "Dinner", 
              "prepTime": "20 min", 
              "ingredients": [
                { "name": "Ingredient 1", "qty": 200, "unit": "g", "cat": "Others", "icon": "🍅" }
              ],
              "instructions": [
                "1. Detailed step 1: Explain exactly how to prep the ingredients (e.g., chop the tomatoes finely, marinate the chicken for 10 mins).",
                "2. Detailed step 2: Explain the cooking temperatures and methods in depth.",
                "3. Detailed step 3: Include flavor layering and plating instructions.",
                "... Provide at least 5 to 8 extremely detailed cooking steps to make a full recipe."
              ]
            }
          ]
        }
        * Notes: 'cat' for ingredients must be exactly one of: Vegetables, Dairy, Grains, Spices, Others.
        'category' for recipe must be exactly one of: Veg, Non-Veg, Vegan.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        let parsed = JSON.parse(cleanText);
        let generatedArray = Array.isArray(parsed) ? parsed : (parsed.recipes || []);
        
        // Append visual placeholders for AI generated meals
        finalMeals = generatedArray.map(meal => ({
          ...meal,
          id: Math.floor(Math.random() * 9000000) + 1000000,
          image: `https://loremflickr.com/500/500/food,recipe?lock=${meal.id || Math.floor(Math.random() * 1000)}`
        }));
      }

      setGeneratedMeals(prev => [...finalMeals, ...prev]);
      setIngredientHint(''); // Clear input
      
      // If we are currently browsing a slot to pick something, keep it open so they see the new generated items there as well.
      // But we will also navigate to planner to show them.
      setView('planner');

    } catch (err) {
      console.error('Error generating AI meals:', err);
      // Silently fallback without alert
      const mockMeals = [
        {
          id: Math.floor(Math.random() * 9000000) + 1000000,
          name: `${ingredientHint || 'Chef'} Special Bowl`,
          emoji: "🍲",
          cal: 450,
          carbs: 45,
          protein: 28,
          fat: 12,
          category: "Veg",
          cuisine: cuisineHint || "Fusion",
          defaultType: "Dinner",
          prepTime: "25 min",
          ingredients: [
            { name: "Primary Ingredient", qty: 200, unit: "g", cat: "Vegetables", icon: "🥗" }
          ],
          instructions: ["Prep ingredients.", "Cook thoroughly.", "Serve and enjoy!"],
          image: `https://loremflickr.com/500/500/food,recipe?lock=999`
        },
        {
          id: Math.floor(Math.random() * 9000000) + 1000000,
          name: `Rustic ${cuisineHint || 'Style'} Plate`,
          emoji: "🍛",
          cal: 520,
          carbs: 60,
          protein: 22,
          fat: 18,
          category: "Non-Veg",
          cuisine: cuisineHint || "Fusion",
          defaultType: "Lunch",
          prepTime: "30 min",
          ingredients: [
            { name: "Proteins & Greens", qty: 300, unit: "g", cat: "Others", icon: "🥦" }
          ],
          instructions: ["Mix ingredients.", "Simmer for 20 minutes.", "Garnish."],
          image: `https://loremflickr.com/500/500/food,recipe?lock=888`
        },
        {
          id: Math.floor(Math.random() * 9000000) + 1000000,
          name: `Quick ${ingredientHint || 'Fresh'} Wrap`,
          emoji: "🌯",
          cal: 380,
          carbs: 35,
          protein: 18,
          fat: 10,
          category: "Vegan",
          cuisine: cuisineHint || "Fusion",
          defaultType: "Lunch",
          prepTime: "15 min",
          ingredients: [
            { name: "Wrap filling", qty: 150, unit: "g", cat: "Others", icon: "🥬" }
          ],
          instructions: ["Assemble ingredients in wrap.", "Toast lightly.", "Serve."],
          image: `https://loremflickr.com/500/500/food,recipe?lock=777`
        }
      ];
      
      setGeneratedMeals(prev => [...mockMeals, ...prev]);
      setIngredientHint(''); 
      setView('planner');
    } finally {
      setIsGenerating(false);
    }
}

  const allPlannedMealIds = useMemo(() => {
    return Object.keys(plan).flatMap(slot => {
      const v = plan[slot];
      return Array.isArray(v) ? v : (v ? [v] : []);
    });
  }, [plan]);

  const validPlannedMeals = allPlannedMealIds.map(mealById).filter(Boolean)
  const totalMeals = validPlannedMeals.length
  const weeklyCalories = validPlannedMeals.reduce((sum, meal) => sum + (meal.cal || 0), 0)

  const grocery = useMemo(() => {
    const map = {}
    allPlannedMealIds.forEach((id) => {
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
  }, [allPlannedMealIds, servingSize, allMeals])

  const groceryByCat = useMemo(() => {
    return grocery.reduce((acc, item) => {
      if (!acc[item.cat]) acc[item.cat] = []
      acc[item.cat].push(item)
      return acc
    }, {})
  }, [grocery])

  const visiblePlannerMeals = useMemo(() => {
    const qWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = allMeals.filter((m) => {
      if (filter !== 'All' && m.category !== filter) return false
      if (qWords.length === 0) return true
      const searchStr = `${m.name} ${m.cuisine} ${m.ingredients.map(i=>i.name).join(' ')}`.toLowerCase();
      return qWords.every(word => {
          const normalizedWord = word.replace('panner', 'paneer').replace('sahi', 'shahi');
          return searchStr.includes(word) || searchStr.includes(normalizedWord);
      });
    });
    return filtered.slice(0, 10);
  }, [allMeals, filter, search])

  const visibleRecipes = useMemo(() => {
    const qWords = recSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = allMeals.filter((m) => {
      if (m.defaultType !== recType) return false;
      if (recFilter !== 'All' && m.category !== recFilter) return false
      if (qWords.length === 0) return true
      const searchStr = `${m.name} ${m.cuisine} ${m.ingredients.map(i=>i.name).join(' ')}`.toLowerCase();
      return qWords.every(word => {
          const normalizedWord = word.replace('panner', 'paneer').replace('sahi', 'shahi');
          return searchStr.includes(word) || searchStr.includes(normalizedWord);
      });
    });
    return filtered.slice(0, 10);
  }, [allMeals, recType, recSearch, recFilter])


  const toggleMeal = (slot, mealId) => setPlan((p) => {
    const current = p[slot] || [];
    const isArray = Array.isArray(current) ? current : [current];
    if (isArray.includes(mealId)) {
      const next = { ...p, [slot]: isArray.filter(id => id !== mealId) };
      if (next[slot].length === 0) delete next[slot];
      return next;
    } else {
      return { ...p, [slot]: [...isArray, mealId] };
    }
  })
  const removeMeal = (slot, mealId = null) => setPlan((p) => { 
    const next = { ...p }; 
    if (mealId) {
        const current = Array.isArray(p[slot]) ? p[slot] : (p[slot] ? [p[slot]] : []);
        next[slot] = current.filter(id => id !== mealId);
        if (next[slot].length === 0) delete next[slot];
    } else {
        delete next[slot]; 
    }
    return next; 
  })

  const dayCalories = DAYS.map((_, di) => MEAL_TYPES.reduce((sum, __, ti) => {
    const slot = `${di}-${ti}`;
    const ids = Array.isArray(plan[slot]) ? plan[slot] : (plan[slot] ? [plan[slot]] : []);
    return sum + ids.reduce((s, id) => s + (mealById(id)?.cal || 0), 0);
  }, 0))

  const currentSlotStr = `${DAYS.indexOf(recDay)}-${MEAL_TYPES.indexOf(recType)}`
  const plannedMealIds = Array.isArray(plan[currentSlotStr]) ? plan[currentSlotStr] : (plan[currentSlotStr] ? [plan[currentSlotStr]] : [])
  const plannedMealsInSlot = plannedMealIds.map(mealById).filter(Boolean)

  const handleAddToPlannerFromRecipe = (mealId) => {
      toggleMeal(currentSlotStr, mealId);
  }

  const handleRemoveFromPlannerRecipe = (mealId) => {
      removeMeal(currentSlotStr, mealId)
  }

  if (view === 'landing') {
    return (
      <div className="landing-page view-animate">
        <nav className="landing-nav">
          <h1><span className="brand-script" style={{color: '#8fa082'}}>Fetch</span><span style={{color: '#e8b63b'}}>Feast</span></h1>
          <button className="btn-outline-pill" onClick={() => setView('planner')}>Go to Planner</button>
        </nav>
        <main className="landing-main">
          <div className="landing-text">
            <span className="cursive-subtitle">Eat well, live well.</span>
            <h1 className="landing-h1">Plan Smarter, Eat Better,<br/>Live Fuller.</h1>
            <p className="landing-p">From Monday breakfast to Sunday dinner — plan every meal, auto-build your shopping list, and hit your nutrition goals without the guesswork.</p>
            <div className="landing-actions">
              <button className="btn-solid-pill" onClick={() => setView('planner')}>Start Planning</button>
              <button className="link-how" style={{background:'transparent', border:'none', cursor:'pointer', fontSize: '1.05rem', fontWeight: 600, color: '#4a4563'}} onClick={() => setShowHowItWorks(true)}>How it Works</button>
            </div>
          </div>
          <div className="landing-image-col">
            <div className="blob-container">
              <div className="blob blob-1"></div>
              <div className="blob blob-2"></div>
            </div>
            <img src="/assets/hero_food_image_1776166832691.png" alt="Healthy bowl" className="landing-hero-img" />
            <span className="floating-leaf-icon">🌿</span>
            <span className="floating-berry-icon">🍓</span>
          </div>
        </main>

        {/* HOW IT WORKS MODAL */}
        {showHowItWorks && (
          <div className="modal-backdrop" onClick={(e) => { if (e.target.className === 'modal-backdrop') setShowHowItWorks(false) }}>
            <div className="modal-card" style={{ maxWidth: '600px', textAlign: 'left' }}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.3rem', color: '#2e2770' }}>How FetchFeast Works</h3>
                <button className="close-btn" onClick={() => setShowHowItWorks(false)}>×</button>
              </div>
              <div className="rlc-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#eaf0e9', color: '#53694f', padding: '0.8rem', borderRadius: '12px', fontSize: '1.5rem' }}>📅</div>
                  <div>
                    <h4 style={{ color: '#2e2770', fontSize: '1.1rem', marginBottom: '0.3rem' }}>1. Plan Your Week</h4>
                    <p style={{ color: '#5d6773', lineHeight: '1.5' }}>Click 'Start Planning' to open your visual weekly calendar. Add curated premium meals directly to breakfast, lunch, or dinner slots across the week.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#eaf0e9', color: '#53694f', padding: '0.8rem', borderRadius: '12px', fontSize: '1.5rem' }}>✨</div>
                  <div>
                    <h4 style={{ color: '#2e2770', fontSize: '1.1rem', marginBottom: '0.3rem' }}>2. AI Recipe Generation</h4>
                    <p style={{ color: '#5d6773', lineHeight: '1.5' }}>Got leftover ingredients? Enter them into the AI Generator at the bottom of the planner, and our AI will instantly cook up 4 bespoke recipes just for you.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#eaf0e9', color: '#53694f', padding: '0.8rem', borderRadius: '12px', fontSize: '1.5rem' }}>🛒</div>
                  <div>
                    <h4 style={{ color: '#2e2770', fontSize: '1.1rem', marginBottom: '0.3rem' }}>3. Auto-Grocery List</h4>
                    <p style={{ color: '#5d6773', lineHeight: '1.5' }}>Switch to the Grocery tab to see everything you need for the week automatically categorized and tallied up. Mark items you already have to keep your cart clean.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#eaf0e9', color: '#53694f', padding: '0.8rem', borderRadius: '12px', fontSize: '1.5rem' }}>📊</div>
                  <div>
                    <h4 style={{ color: '#2e2770', fontSize: '1.1rem', marginBottom: '0.3rem' }}>4. Macrorganize Your Life</h4>
                    <p style={{ color: '#5d6773', lineHeight: '1.5' }}>Hit the Nutrition tab to see a breakdown of your daily caloric intake and weekly protein hits based on what you scheduled. No more guesswork.</p>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
                <button className="btn-solid-pill" onClick={() => { setShowHowItWorks(false); setView('planner'); }}>Start Planning Now</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app">
      <nav className="nav">
        <h1><span className="brand-script" style={{color: '#8fa082'}}>Fetch</span><span style={{color: '#e8b63b'}}>Feast</span></h1>
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
                <FloatingDropdown 
                  value={servingSize} 
                  onChange={(val) => setServingSize(Number(val))} 
                  options={[1, 2, 3, 4, 5, 6].map(n => ({ value: n, label: n }))} 
                  suffix="people" 
                />
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
                      const mealIds = Array.isArray(plan[slot]) ? plan[slot] : (plan[slot] ? [plan[slot]] : [])
                      const mealsInSlot = mealIds.map(mealById).filter(Boolean)
                      return (
                        <div className="slot" key={slot} onClick={() => { setSearch(''); setOpenSlot(slot); }}>
                          <span className="slot-type">{type}</span>
                          {mealsInSlot.length > 0 ? (
                            <div className="slot-content-multi">
                              {mealsInSlot.map(m => (
                                <div className="slot-content" key={m.id}>
                                  <img src={m.image} alt="" className="slot-img"/>
                                  <div className="slot-text">
                                    <strong>{m.name}</strong>
                                    <small>{m.cal} kcal</small>
                                  </div>
                                  <button className="slot-remove" onClick={(e) => { e.stopPropagation(); removeMeal(slot, m.id) }}>×</button>
                                </div>
                              ))}
                              <div className="slot-add-more" onClick={(e) => { e.stopPropagation(); setSearch(''); setOpenSlot(slot); }}>+ Add another</div>
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
                <FloatingDropdown 
                  value={cuisineHint} 
                  onChange={setCuisineHint} 
                  options={[
                    {value: '', label: 'Any Style'},
                    {value: 'Italian', label: 'Italian'},
                    {value: 'Mexican', label: 'Mexican'},
                    {value: 'Asian', label: 'Asian'},
                    {value: 'Indian', label: 'Indian'},
                    {value: 'Mediterranean', label: 'Mediterranean'},
                    {value: 'American', label: 'American'}
                  ]} 
                  className="full-width"
                />
              </div>
              <button className="btn-generate" onClick={handleAIGenerate} disabled={isGenerating}>
                {isGenerating ? "GENERATING..." : "GENERATE"}
              </button>
            </div>

            {generatedMeals.length > 0 && (
              <div className="ai-results-grid">
                 {/* Display 4 most recent generated meals with beautiful full-style cards directly beneath generator! */}
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
                   <h3 className="section-heading" style={{ margin: 0 }}>Recently Generated</h3>
                   <button className="btn-outline-pill" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => { setGeneratedMeals([]); localStorage.setItem(storage.aiMeals, '[]'); }}>Clear AI Meals</button>
                 </div>
                 <div className="recipes-grid">
                  {generatedMeals.slice(0, 4).map(recipe => (
                    <div key={recipe.id} className="recipe-card" onClick={() => setActiveRecipe(recipe)}>
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

          {plannedMealsInSlot.length > 0 && (
             <div className="planned-meals-list">
               {plannedMealsInSlot.map(pm => (
                 <div key={pm.id} className="planned-meal-container" style={{marginBottom: '2rem'}}>
                    <div className="planned-badge">★ Scheduled for {recDay} {recType}</div>
                    <div className="recipe-large-card premium-card">
                      <div className="rlc-header">
                          <img src={pm.image} alt={pm.name} className="rlc-img"/>
                          <div className="rlc-title-box">
                              <span className="rm-tag">{pm.category}</span>
                              <h2 className="recipe-h2-title">{pm.name}</h2>
                              <div className="rm-meta">
                                  <span>🔥 {pm.cal} kcal</span>
                                  <span>⏱️ {pm.prepTime}</span>
                                  <span>🍽️ {pm.cuisine}</span>
                              </div>
                          </div>
                      </div>
                      <div className="rlc-body">
                          <div className="rm-section">
                              <h3>Ingredients (for {servingSize})</h3>
                              <ul className="rm-ingredients">
                                  {pm.ingredients.map((ing, idx) => (
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
                                  {pm.instructions.map((step, idx) => (
                                      <li key={idx}>{step}</li>
                                  ))}
                              </ol>
                          </div>
                      </div>
                      <div className="rlc-footer">
                          <button className="btn btn-secondary shadow-hover" onClick={() => handleRemoveFromPlannerRecipe(pm.id)}>Remove from Planner</button>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          )}

          <div className="browse-recipes-container" style={{marginTop: plannedMealsInSlot.length > 0 ? '2rem' : '0'}}>
             {plannedMealsInSlot.length > 0 && <h3 className="section-heading" style={{marginBottom: '1rem'}}>Add More to {recType}</h3>}
             <div className="filters-row">
               <input value={recSearch} onChange={(e) => setRecSearch(e.target.value)} placeholder="Search recipes..." className="recipe-search" />
               <select value={recFilter} onChange={(e) => setRecFilter(e.target.value)} className="recipe-filter">
                 {FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
               </select>
             </div>

             <div className="recipes-grid">
               {visibleRecipes.map(recipe => (
                 <div key={recipe.id} className="recipe-card" onClick={() => setActiveRecipe(recipe)}>
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
               {visibleRecipes.length === 0 && (
                   <div className="empty-state">
                       <div className="empty-illustration">🔍</div>
                       <h3>{isSearching ? "Searching recipes..." : "No recipes found"}</h3>
                       <p>{isSearching ? "Just a moment..." : "Try adjusting your search or filters."}</p>
                   </div>
               )}
             </div>
          </div>
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
                                {isHave ? "Don't have" : "Have It"}
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
                  <strong>{validPlannedMeals.reduce((s, meal) => s + (meal.protein || 0), 0)}g</strong>
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
                        <div className="bar-fill" style={{ width: `${pct}%`, background: `#9caf97` }}></div>
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
              {visiblePlannerMeals.map((m) => {
                const isSelected = Array.isArray(plan[openSlot]) ? plan[openSlot].includes(m.id) : plan[openSlot] === m.id;
                return (
                  <div key={m.id} className={`picker-meal ${isSelected ? 'selected' : ''}`} onClick={() => toggleMeal(openSlot, m.id)}>
                    <img src={m.image} alt=""/>
                    <div className="picker-meal-info">
                      <strong>{m.name}</strong>
                      <span className="picker-tag">{m.category} {m.id > 100000 ? '✨ AI' : ''}</span>
                    </div>
                    <div className="picker-kcal">{m.cal} kcal</div>
                    {isSelected && <div className="picker-check" style={{fontSize: '1.2rem', color: '#10b981'}}>✓</div>}
                  </div>
                );
              })}
              {visiblePlannerMeals.length === 0 && <p className="empty-sub" style={{textAlign: 'center', padding: '1rem'}}>{isSearching ? "Searching recipes..." : "No meals found."}</p>}
            </div>
          </div>
        </div>
      )}

      {/* RECIPE DETAILS MODAL */}
      {activeRecipe && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target.className === 'modal-backdrop') setActiveRecipe(null) }}>
          <div className="modal-card" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#2e2770' }}>Recipe Details</h3>
              <button className="close-btn" onClick={() => setActiveRecipe(null)}>×</button>
            </div>
            <div className="recipe-large-card" style={{ padding: '0', border: 'none', boxShadow: 'none' }}>
              <div className="rlc-header" style={{ flexDirection: 'row', gap: '2rem' }}>
                  <img src={activeRecipe.image} alt={activeRecipe.name} className="rlc-img" style={{ width: '140px', height: '140px', borderRadius: '24px' }}/>
                  <div className="rlc-title-box">
                      <span className="rm-tag" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>{activeRecipe.category}</span>
                      <h2 className="recipe-h2-title" style={{ fontSize: '1.5rem', marginBottom: '0.8rem' }}>{activeRecipe.name}</h2>
                      <div className="rm-meta" style={{ display: 'flex', gap: '1rem', color: '#5d6773', fontSize: '0.9rem', fontWeight: '500' }}>
                          <span>🔥 {activeRecipe.cal} kcal</span>
                          <span>⏱️ {activeRecipe.prepTime}</span>
                          <span>🍽️ {activeRecipe.cuisine}</span>
                      </div>
                  </div>
              </div>
              <div className="rlc-body" style={{ marginTop: '2rem', gap: '3rem', display: 'block' }}>
                  <div className="rm-section">
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#4a4563' }}>Instructions</h3>
                      <ol className="rm-instructions" style={{ paddingLeft: '1.2rem', color: '#5d6773', display: 'flex', flexDirection: 'column', gap: '1.2rem', lineHeight: '1.8', fontSize: '1.05rem' }}>
                          {activeRecipe.instructions.map((step, idx) => (
                              <li key={idx}>{step}</li>
                          ))}
                      </ol>
                  </div>
              </div>
              <div className="rlc-footer" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#fdfcff', borderRadius: '0 0 24px 24px', borderTop: '1px solid #f2edf9' }}>
                 <button className="btn btn-secondary shadow-hover" onClick={() => setActiveRecipe(null)}>Close</button>
                 <button className="btn btn-primary shadow-hover" onClick={() => { handleAddToPlannerFromRecipe(activeRecipe.id); setActiveRecipe(null); }}>
                   + Schedule for {recDay} {recType}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
