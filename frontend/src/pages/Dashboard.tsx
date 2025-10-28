import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, TrendingUp, UtensilsCrossed, AlertCircle, Package, User } from 'lucide-react';

interface Meal {
  id: number;
  recipe_id: number;
  recipe_name: string;
  meal_type: string;
  servings: number;
  plan_date: string;
  cooking_time_minutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionData {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  try {
    setLoading(true);
    setError('');
    const [mealsRes, nutritionRes] = await Promise.all([
      api.get(`/meal-plan?start_date=${today}&end_date=${today}`),
      api.get(`/nutrition?date=${today}`),
    ]);

    // FIX: Access nested data structure
    // Meal plan response: { success: true, data: { mealPlan: [...] } }
    const mealPlanData = mealsRes.data?.data?.mealPlan || [];
    
    // Format meals from the meal plan data
    const formattedMeals: Meal[] = [];
    if (Array.isArray(mealPlanData)) {
      mealPlanData.forEach((dayPlan: any) => {
        // Each meal type (breakfast, lunch, dinner, snack) is an array
        ['breakfast', 'lunch', 'dinner', 'snack'].forEach((mealType) => {
          if (Array.isArray(dayPlan[mealType])) {
            dayPlan[mealType].forEach((meal: any) => {
              if (meal.recipe) {
                const nutritionalInfo = meal.nutritionalInfo || {};
                formattedMeals.push({
                  id: meal.id,
                  recipe_id: meal.recipe._id || meal.recipe.id,
                  recipe_name: meal.recipe.name,
                  meal_type: mealType,
                  servings: meal.servings || 1,
                  plan_date: dayPlan.date,
                  cooking_time_minutes: meal.recipe.cooking_time_minutes || 0,
                  calories: nutritionalInfo.calories || 0,
                  protein: nutritionalInfo.protein || 0,
                  carbs: nutritionalInfo.carbs || 0,
                  fat: nutritionalInfo.fat || 0,
                });
              }
            });
          }
        });
      });
    }
    
    setMeals(formattedMeals);

    // Nutrition response: { success: true, data: { date, nutrition, targets, percentages } }
    const nutritionData = nutritionRes.data?.data || nutritionRes.data;
    setNutrition({
      total_calories: nutritionData.nutrition?.calories || 0,
      total_protein: nutritionData.nutrition?.protein || 0,
      total_carbs: nutritionData.nutrition?.carbs || 0,
      total_fat: nutritionData.nutrition?.fat || 0,
    });

  } catch (err: any) {
    setError('Failed to load dashboard data. Please try again.');
    console.error('Dashboard fetch error:', err);
  } finally {
    setLoading(false);
  }
};

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="container mx-auto p-6 bg-[#F5F1E8] min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">{getGreeting()}, {user?.email.split('@')[0]}!</h1>
        <p className="text-lg text-gray-600 mt-2">Here's your plan for today, {new Date(today).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-3" />
            <div>
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Plan */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Today's Meal Plan</h2>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              Loading today's plan...
            </div>
          ) : meals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-10 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">No meals planned for today</h3>
              <p className="text-gray-500 mt-2">Go to the <Link to="/planner" className="text-[#8B9D83] hover:text-[#7a8c74] font-medium">Planner</Link> to add some meals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meals.map((meal) => (
                <div key={meal.id} className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase text-gray-500">{meal.meal_type}</span>
                    <h3 className="text-lg font-bold text-gray-900">{meal.recipe_name}</h3>
                    <p className="text-sm text-gray-600">{meal.calories} kcal · {meal.cooking_time_minutes} min</p>
                  </div>
                  <Link to={`/recipes`} className="px-4 py-2 bg-[#8B9D83] text-white text-sm rounded-lg hover:bg-[#7a8c74] transition">
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Nutrition & Quick Links */}
        <div className="space-y-6">
          {/* Nutrition Summary */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Today's Nutrition</h2>
            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                Loading nutrition...
              </div>
            ) : nutrition ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-gray-800">Calories</span>
                      <span className="text-xl font-bold text-[#8B9D83]">{nutrition.total_calories} <span className="text-sm font-normal text-gray-600">/ {user?.preferences.daily_calorie_target || 2000} kcal</span></span>
                    </div>
                    {/* Progress Bar (Example) */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-[#8B9D83] h-2.5 rounded-full" style={{ width: `${Math.min(100, (nutrition.total_calories / (user?.preferences.daily_calorie_target || 2000)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Protein</span>
                    <span className="font-medium text-gray-900">{nutrition.total_protein}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Carbs</span>
                    <span className="font-medium text-gray-900">{nutrition.total_carbs}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fat</span>
                    <span className="font-medium text-gray-900">{nutrition.total_fat}g</span>
                  </div>
                </div>
                <Link to="/nutrition" className="block w-full text-center mt-6 px-4 py-2 border border-[#8B9D83] text-[#8B9D83] text-sm rounded-lg hover:bg-[#8B9D83] hover:text-white transition">
                  View Full Report
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                No nutrition data for today.
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="space-y-4">
              <Link
                to="/planner"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#8B9D83] bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-opacity-20 transition">
                    <Calendar className="w-6 h-6 text-[#8B9D83]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Meal Planner</h3>
                    <p className="text-sm text-gray-600">Plan your week</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/pantry"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-opacity-20 transition">
                    <Package className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Pantry</h3>
                    <p className="text-sm text-gray-600">Manage ingredients</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/recipes"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FF6B6B] bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-opacity-20 transition">
                    <UtensilsCrossed className="w-6 h-6 text-[#FF6B6B]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Recipes</h3>
                    <p className="text-sm text-gray-600">Browse & discover</p>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/profile"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-opacity-20 transition">
                    <User className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Profile</h3>
                    <p className="text-sm text-gray-600">Set your preferences</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}