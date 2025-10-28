import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, AlertCircle, Search, UtensilsCrossed, Check } from 'lucide-react';

interface MealPlan {
  id: number;
  recipe_id: number;
  recipe_name: string;
  plan_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  cooking_time_minutes: number;
  calories: number;
  protein: number;
}

interface Recipe {
  id: number;
  name: string;
  cooking_time_minutes: number;
}

// Helper to get the start of the week (Monday) - FIXED
function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

// Helper to format date as YYYY-MM-DD in LOCAL timezone
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Planner() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: string } | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [servings, setServings] = useState('1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  // Generate week days array - FIXED
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  useEffect(() => {
    fetchMealPlans();
  }, [currentWeekStart]);

  useEffect(() => {
    if (searchQuery.length > 1) {
      searchRecipes();
    } else {
      setRecipes([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endDate = new Date(currentWeekStart);
      endDate.setDate(endDate.getDate() + 6);
      
      const startDateStr = formatDateLocal(currentWeekStart);
      const endDateStr = formatDateLocal(endDate);
      
      console.log('Fetching meal plans from:', startDateStr, 'to', endDateStr);
      
      const response = await api.get('/meal-plan', {
        params: {
          start_date: startDateStr,
          end_date: endDateStr,
        },
      });
      
      console.log('Raw meal plan response:', response.data);
      
      const mealPlanData = response.data?.data?.mealPlan || [];
      
      // Flatten the nested structure
      const formattedMeals: MealPlan[] = [];
      if (Array.isArray(mealPlanData)) {
        mealPlanData.forEach((dayPlan: any) => {
          console.log('Processing dayPlan for date:', dayPlan.date);
          
          ['breakfast', 'lunch', 'dinner', 'snack'].forEach((mealType) => {
            if (Array.isArray(dayPlan[mealType])) {
              dayPlan[mealType].forEach((meal: any) => {
                if (meal.recipe) {
                  const nutritionalInfo = meal.nutritionalInfo || {};
                  formattedMeals.push({
                    id: meal.id,
                    recipe_id: meal.recipe._id || meal.recipe.id,
                    recipe_name: meal.recipe.name,
                    meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
                    servings: meal.servings || 1,
                    plan_date: dayPlan.date, // This is already YYYY-MM-DD from backend
                    cooking_time_minutes: meal.recipe.cooking_time_minutes || 0,
                    calories: nutritionalInfo.calories || 0,
                    protein: nutritionalInfo.protein || 0,
                  });
                }
              });
            }
          });
        });
      }
      
      console.log('All formatted meals:', formattedMeals);
      setMealPlans(formattedMeals);
      
    } catch (err: any) {
      setError('Failed to fetch meal plan.');
      console.error('Fetch error:', err);
      setMealPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const searchRecipes = async () => {
    try {
      const response = await api.get('/recipes', {
        params: { search: searchQuery },
      });
      
      const recipesData = response.data?.data?.recipes || [];
      const formattedRecipes = recipesData.map((r: any) => ({
        id: r._id || r.id,
        name: r.name,
        cooking_time_minutes: r.cooking_time_minutes,
      }));
      setRecipes(Array.isArray(formattedRecipes) ? formattedRecipes : []);
      
    } catch (err) {
      console.error('Failed to search recipes:', err);
      setRecipes([]);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId || !selectedSlot) {
      setError('No recipe or slot selected.');
      return;
    }

    setError('');
    setSuccess('');

    console.log('Adding meal to date:', selectedSlot.date, 'meal type:', selectedSlot.mealType);

    try {
      const newMeal = {
        recipe_id: selectedRecipeId,
        plan_date: selectedSlot.date, // Already in YYYY-MM-DD format
        meal_type: selectedSlot.mealType,
        servings: parseInt(servings, 10),
      };
      
      console.log('Posting meal data:', newMeal);
      
      const response = await api.post('/meal-plan', newMeal);
      console.log('Add meal response:', response.data);
      
      setSuccess('Meal added successfully!');
      
      // Reset modal
      setShowAddModal(false);
      setSelectedSlot(null);
      setSelectedRecipeId(null);
      setSearchQuery('');
      setServings('1');
      setRecipes([]);
      
      // Refresh meal plans
      fetchMealPlans();
      
    } catch (err: any) {
      console.error('Add meal error:', err.response?.data);
      setError('Failed to add meal. ' + (err.response?.data?.message || ''));
    }
  };

  const handleDeleteMeal = async (mealId: number) => {
    if (!window.confirm('Are you sure you want to remove this meal?')) {
      return;
    }

    try {
      await api.delete(`/meal-plan/${mealId}`);
      setSuccess('Meal removed successfully!');
      setMealPlans(mealPlans.filter((meal) => meal.id !== mealId));
    } catch (err: any) {
      setError('Failed to remove meal. ' + (err.response?.data?.message || ''));
      console.error(err);
    }
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentWeekStart(newWeekStart);
  };

  const getMealsForSlot = (date: string, mealType: string) => {
    const meals = mealPlans.filter(
      (meal) => meal.plan_date === date && meal.meal_type === mealType
    );
    console.log(`Getting meals for ${date} ${mealType}:`, meals.length);
    return meals;
  };

  return (
    <div className="container mx-auto p-6 bg-[#F5F1E8] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Meal Planner</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeWeek('prev')}
            className="p-2 text-gray-700 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-xl font-semibold text-gray-800">
            {currentWeekStart.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            {' - '}
            {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
          </span>
          <button
            onClick={() => changeWeek('next')}
            className="p-2 text-gray-700 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {/* Planner Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[900px]">
          {weekDays.map((day) => {
            // Format date as YYYY-MM-DD in local timezone
            const dateString = formatDateLocal(day);
            
            console.log('Rendering column for:', day.toDateString(), '-> dateString:', dateString);
            
            return (
              <div key={dateString} className="border-r border-gray-200">
                <div className="text-center py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                  <p className="font-semibold text-gray-800">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                  <p className="text-2xl font-bold text-[#8B9D83]">{day.getDate()}</p>
                  <p className="text-xs text-gray-500">{dateString}</p>
                </div>
                <div className="space-y-2 p-2">
                  {mealTypes.map((mealType) => {
                    const mealsInSlot = getMealsForSlot(dateString, mealType);
                    const hasMeals = mealsInSlot.length > 0;
                    
                    return (
                      <div 
                        key={mealType} 
                        className={`rounded-lg shadow-sm p-3 min-h-[120px] transition-all ${
                          hasMeals ? 'bg-green-50 border-2 border-green-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-gray-600 capitalize">{mealType}</h4>
                          {hasMeals && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="w-4 h-4" />
                              <span className="text-xs font-medium">{mealsInSlot.length}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {mealsInSlot.map((meal) => (
                            <div key={meal.id} className="bg-white rounded-md p-2 text-xs group relative border border-green-200">
                              <p className="font-semibold text-gray-900 pr-6">{meal.recipe_name}</p>
                              <p className="text-gray-500">{Math.round(meal.calories)} kcal · {meal.servings}x</p>
                              <button
                                onClick={() => handleDeleteMeal(meal.id)}
                                className="absolute top-1 right-1 p-1 text-red-500 opacity-0 group-hover:opacity-100 transition hover:bg-red-50 rounded-full"
                                title="Remove meal"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            console.log('Opening modal for date:', dateString, 'meal:', mealType);
                            setSelectedSlot({ date: dateString, mealType });
                            setShowAddModal(true);
                          }}
                          className={`w-full mt-2 p-1 text-xs rounded-lg flex items-center justify-center gap-1 transition ${
                            hasMeals 
                              ? 'text-green-700 hover:bg-green-100 border border-green-200' 
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <Plus className="w-3 h-3" /> {hasMeals ? 'Add More' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Meal Modal */}
      {showAddModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Meal</h2>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-700">
                <span className="font-semibold text-blue-900">Date:</span>{' '}
                {new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-semibold text-blue-900">Meal:</span>{' '}
                <span className="capitalize">{selectedSlot.mealType}</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">Selecting for: {selectedSlot.date}</p>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label htmlFor="recipe" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Recipe
                </label>
                <div className="relative">
                  <input
                    id="recipe"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedRecipeId(null);
                    }}
                    placeholder="Type to search..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent outline-none"
                    autoComplete="off"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                {recipes.length > 0 && (
                  <div className="border border-gray-300 rounded-lg mt-2 max-h-48 overflow-y-auto bg-white shadow-lg">
                    {recipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        onClick={() => {
                          setSelectedRecipeId(recipe.id);
                          setSearchQuery(recipe.name);
                          setRecipes([]);
                        }}
                        className={`p-3 cursor-pointer transition ${
                          selectedRecipeId === recipe.id 
                            ? 'bg-[#8B9D83] text-white' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium">{recipe.name}</p>
                        <p className={`text-sm ${
                          selectedRecipeId === recipe.id 
                            ? 'text-gray-200' 
                            : 'text-gray-500'
                        }`}>
                          {recipe.cooking_time_minutes} min
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.length > 1 && recipes.length === 0 && !selectedRecipeId && (
                  <div className="p-3 text-gray-500 text-sm mt-2">No recipes found.</div>
                )}
              </div>

              <div>
                <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-2">
                  Servings
                </label>
                <input
                  id="servings"
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  required
                  min="1"
                  max="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!selectedRecipeId}
                  className="flex-1 bg-[#8B9D83] text-white py-2 rounded-lg hover:bg-[#7a8c74] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Add Meal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedSlot(null);
                    setSelectedRecipeId(null);
                    setSearchQuery('');
                    setServings('1');
                    setRecipes([]);
                    setError('');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}