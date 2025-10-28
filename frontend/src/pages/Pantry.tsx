import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Plus, Trash2, Search, AlertCircle, Package } from 'lucide-react';

interface PantryItem {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity_grams: number;
  expiry_date: string;
}

interface Ingredient {
  id: number;
  name: string;
  category: string;
}

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPantryItems();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 1) {
        searchIngredients();
      } else {
        setIngredients([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchPantryItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pantry');
      
      const pantryData = response.data?.data?.pantry?.items || [];
      
      const formattedItems = pantryData.map((item: any) => ({
        id: item._id,
        ingredient_id: item.ingredient_id?._id || item.ingredient_id,
        ingredient_name: item.ingredient_id?.name || 'Unknown',
        quantity_grams: item.quantity_grams,
        expiry_date: item.expiry_date,
      }));
      
      setItems(Array.isArray(formattedItems) ? formattedItems : []);
      
    } catch (err: any) {
      setError('Failed to fetch pantry items');
      console.error('Pantry fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchIngredients = async () => {
    try {
      setSearchLoading(true);
      setError(''); // Clear previous errors
      
      console.log('🔍 Searching for:', searchQuery);
      
      const response = await api.get(`/ingredients?search=${searchQuery}`);
      
      console.log('📦 Full response:', response);
      console.log('📦 response.data:', response.data);
      
      // ✅ SIMPLIFIED: Direct access to the correct path
      const ingredientsData = response.data?.data?.ingredients || [];
      
      console.log('📦 Ingredients found:', ingredientsData.length);
      console.log('📦 Raw ingredients:', ingredientsData);
      
      if (!Array.isArray(ingredientsData)) {
        console.error('❌ Ingredients data is not an array:', typeof ingredientsData);
        setIngredients([]);
        setError('Invalid response from server. Please check backend.');
        return;
      }
      
      if (ingredientsData.length === 0) {
        console.warn('⚠️ No ingredients found for query:', searchQuery);
        setIngredients([]);
        return;
      }
      
      // Format ingredients
      const formattedIngredients = ingredientsData.map((ing: any) => ({
        id: ing._id || ing.id,
        name: ing.name,
        category: ing.category || 'other',
      }));
      
      console.log('✅ Formatted ingredients:', formattedIngredients);
      
      setIngredients(formattedIngredients);
      
    } catch (err: any) {
      console.error('❌ Search error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      const errorMsg = err.response?.data?.message || err.message || 'Search failed';
      setError(`Search error: ${errorMsg}`);
      setIngredients([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIngredient) {
      setError('Please select an ingredient from the list');
      return;
    }
    
    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    
    if (!expiryDate) {
      setError('Please select an expiry date');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const newItem = {
        ingredient_id: selectedIngredient.id,
        quantity_grams: parseInt(quantity, 10),
        expiry_date: expiryDate,
      };
      
      console.log('Adding item:', newItem);
      
      await api.post('/pantry', newItem);
      setSuccess('Item added successfully!');
      fetchPantryItems();

      // Reset form
      setShowAddForm(false);
      setSearchQuery('');
      setSelectedIngredient(null);
      setQuantity('');
      setExpiryDate('');
      setIngredients([]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add item';
      setError(`Failed to add item: ${errorMsg}`);
      console.error('Add item error:', err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await api.delete(`/pantry/${itemId}`);
      setSuccess('Item deleted successfully!');
      setItems(items.filter((item) => item.id !== itemId));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(`Failed to delete item: ${errorMsg}`);
      console.error('Delete error:', err);
    }
  };

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setSearchQuery(ingredient.name);
    setIngredients([]);
  };

  const [filterQuery, setFilterQuery] = useState('');

  const filteredItems = items.filter((item) =>
    item.ingredient_name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="container mx-auto p-6 bg-[#F5F1E8] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-gray-900">My Pantry</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#8B9D83] text-white rounded-lg hover:bg-[#7a8c74] transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError('')}
            className="absolute top-2 right-2 text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Pantry Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label htmlFor="ingredient" className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredient *
                </label>
                <div className="relative">
                  <input
                    id="ingredient"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedIngredient(null);
                      setError(''); // Clear error when typing
                    }}
                    placeholder="Type to search (e.g., Chicken, Rice, Tomato)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent outline-none"
                    autoComplete="off"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#8B9D83] border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                {/* Selected Ingredient Display */}
                {selectedIngredient && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-medium text-green-900">{selectedIngredient.name}</span>
                      <span className="text-green-700 text-sm ml-2">({selectedIngredient.category})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIngredient(null);
                        setSearchQuery('');
                      }}
                      className="text-green-700 hover:text-green-900"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Ingredient Dropdown */}
                {ingredients.length > 0 && !selectedIngredient && (
                  <div className="border border-gray-300 rounded-lg mt-2 max-h-48 overflow-y-auto bg-white shadow-lg">
                    {ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        onClick={() => handleSelectIngredient(ing)}
                        className="p-3 hover:bg-[#8B9D83] hover:text-white cursor-pointer transition"
                      >
                        <span className="font-medium">{ing.name}</span>
                        <span className="text-sm ml-2 opacity-75">({ing.category})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results message - IMPROVED */}
                {searchQuery.length > 1 && ingredients.length === 0 && !selectedIngredient && !searchLoading && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    <p className="font-medium">No ingredients found for "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try: Chicken, Rice, Tomato, Onion, Garlic, etc.</p>
                  </div>
                )}
                
                {/* Search hint */}
                {searchQuery.length > 0 && searchQuery.length <= 1 && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                    Type at least 2 characters to search
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (grams) *
                </label>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent outline-none"
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!selectedIngredient || !quantity || !expiryDate}
                  className="flex-1 bg-[#8B9D83] text-white py-2 rounded-lg hover:bg-[#7a8c74] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                    setSearchQuery('');
                    setSelectedIngredient(null);
                    setIngredients([]);
                    setQuantity('');
                    setExpiryDate('');
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

      {/* Search Bar for Pantry List */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search your pantry..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent outline-none"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
      </div>

      {/* Pantry List */}
      {loading ? (
        <div className="text-center text-gray-600">Loading pantry items...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 bg-white rounded-lg shadow-md">
          <Package className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">Your pantry is empty</h3>
          <p className="text-gray-500 mt-2">Click "Add Item" to start tracking your ingredients.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const expiry = new Date(item.expiry_date);
            const diffTime = expiry.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const expired = diffDays < 0;
            const expiringSoon = diffDays >= 0 && diffDays <= 3;

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4"
                style={{ borderColor: expired ? '#FF6B6B' : expiringSoon ? '#F59E0B' : '#8B9D83' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{item.ingredient_name}</h3>
                    <p className="text-2xl font-bold text-[#8B9D83] mt-1">{item.quantity_grams}g</p>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Expires:</span>
                    <span className={`font-medium ${expired ? 'text-red-600' : expiringSoon ? 'text-amber-600' : 'text-gray-900'}`}>
                      {new Date(item.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                  {(expired || expiringSoon) && (
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      expired ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {expired ? 'Expired' : 'Expiring Soon'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}