import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Search, Clock, ChefHat, X, Plus, Sparkles } from 'lucide-react';

interface Recipe {
  _id?: string;
  id?: string;
  name: string;
  cooking_time_minutes: number;
  dietary_category: string[];
  matchPercentage?: number;
  missingCount?: number;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface RecipeDetail extends Recipe {
  ingredients: Array<{
    ingredient: {
      _id?: string;
      id?: string;
      name: string;
    };
    quantity_grams: number;
  }>;
  instructions: string;
}

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxCookingTime, setMaxCookingTime] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError('');
      setShowSuggestions(false);
      
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (maxCookingTime) params.max_cooking_time = maxCookingTime;
      
      const response = await api.get('/recipes', { params });
      
      // ✅ ROBUST: Handle nested data structure
      const recipesData = response.data?.data?.recipes || [];
      
      const formattedRecipes = recipesData.map((recipe: any) => ({
        id: recipe._id || recipe.id,
        name: recipe.name,
        cooking_time_minutes: recipe.cooking_time_minutes,
        dietary_category: recipe.dietary_category || [],
        matchPercentage: recipe.matchPercentage,
        missingCount: recipe.missingCount,
        nutritionalInfo: recipe.nutritionalInfo || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      }));
      
      setRecipes(formattedRecipes);
      
    } catch (err: any) {
      setError('Failed to fetch recipes. Please check your backend connection.');
      console.error('Fetch recipes error:', err);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeSuggestions = async () => {
    try {
      setLoading(true);
      setError('');
      setShowSuggestions(true);
      
      const response = await api.get('/recipes/suggest');
      
      // ✅ ROBUST: Handle nested data structure
      const suggestedData = response.data?.data?.suggestions || [];
      
      const formattedSuggestions = suggestedData.map((recipe: any) => ({
        id: recipe._id || recipe.id,
        name: recipe.name,
        cooking_time_minutes: recipe.cooking_time_minutes,
        dietary_category: recipe.dietary_category || [],
        matchPercentage: recipe.matchPercentage,
        missingCount: recipe.missingCount,
        nutritionalInfo: recipe.nutritionalInfo || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      }));
      
      setRecipes(formattedSuggestions);
      
    } catch (err: any) {
      setError('Failed to get recipe suggestions.');
      console.error('Suggestions error:', err);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecipes();
  };

  const handleSelectRecipe = async (recipeId: string) => {
    try {
      setModalLoading(true);
      setError('');
      
      const response = await api.get(`/recipes/${recipeId}`);
      
      // ✅ ROBUST: Handle nested data structure
      const recipeData = response.data?.data?.recipe || response.data?.recipe || response.data;
      
      const formattedRecipe: RecipeDetail = {
        id: recipeData._id || recipeData.id,
        name: recipeData.name,
        cooking_time_minutes: recipeData.cooking_time_minutes,
        dietary_category: recipeData.dietary_category || [],
        instructions: recipeData.instructions,
        ingredients: (recipeData.ingredients || []).map((ing: any) => ({
          ingredient: {
            id: ing.ingredient?._id || ing.ingredient?.id,
            name: ing.ingredient?.name || 'Unknown',
          },
          quantity_grams: ing.quantity_grams,
        })),
        nutritionalInfo: recipeData.nutritionalInfo || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      };
      
      setSelectedRecipe(formattedRecipe);
      
    } catch (err: any) {
      setError('Failed to load recipe details.');
      console.error('Recipe details error:', err);
      setSelectedRecipe(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddToPlan = () => {
    setSuccess(`Successfully added ${selectedRecipe?.name} to plan! (Go to Planner to complete)`);
    setSelectedRecipe(null);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="container mx-auto p-6 bg-[#F5F1E8] min-h-screen">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Discover Recipes</h1>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="mb-6 bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full">
          <input
            type="text"
            placeholder="Search for recipes (e.g., 'Chicken')"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if(showSuggestions) setShowSuggestions(false);
            }}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
        <div className="relative w-full md:w-auto">
          <input
            type="number"
            placeholder="Max time (min)"
            value={maxCookingTime}
            onChange={(e) => {
              setMaxCookingTime(e.target.value);
              if(showSuggestions) setShowSuggestions(false);
            }}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
          />
          <Clock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="submit"
          className="w-full md:w-auto px-6 py-3 bg-[#8B9D83] text-white rounded-lg hover:bg-[#7a8c74] transition font-medium"
        >
          Search
        </button>
        <button
          type="button"
          onClick={fetchRecipeSuggestions}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium"
        >
          <Sparkles className="w-5 h-5" />
          Suggest
        </button>
      </form>

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

      {showSuggestions && recipes.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
          Showing recipe suggestions based on your pantry!
        </div>
      )}

      {/* Recipe List */}
      {loading ? (
        <div className="text-center text-gray-600">Loading recipes...</div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 bg-white rounded-lg shadow-md">
          <ChefHat className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">No Recipes Found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => handleSelectRecipe(recipe.id!)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="h-40 w-full bg-[#8B9D83] flex items-center justify-center">
                <ChefHat className="w-16 h-16 text-white opacity-50" />
              </div>
              <div className="p-6">
                {recipe.matchPercentage !== undefined && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mb-2">
                    {Math.round(recipe.matchPercentage)}% Pantry Match
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{recipe.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.cooking_time_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{Math.round(recipe.nutritionalInfo?.calories || 0)}</span>
                    <span>kcal</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recipe.dietary_category.slice(0, 3).map((cat) => (
                    <span key={cat} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full capitalize">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {modalLoading ? (
              <div className="p-10 text-center text-gray-600">Loading details...</div>
            ) : (
              <>
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedRecipe.name}</h2>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{selectedRecipe.cooking_time_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{Math.round(selectedRecipe.nutritionalInfo?.calories || 0)}</span>
                          <span>kcal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{Math.round(selectedRecipe.nutritionalInfo?.protein || 0)}g</span>
                          <span>Protein</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRecipe(null);
                        setError('');
                      }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Ingredients</h3>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium text-gray-900">{ingredient.ingredient.name}</span>
                          <span className="text-gray-600">{ingredient.quantity_grams}g</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Instructions</h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{selectedRecipe.instructions}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToPlan}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#8B9D83] text-white rounded-lg hover:bg-[#7a8c74] transition"
                  >
                    <Plus className="w-5 h-5" />
                    Add to Meal Plan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}