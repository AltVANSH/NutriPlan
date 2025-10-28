import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { ShoppingCart, Calendar, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link

interface ShoppingItem {
  ingredient_id: number;
  ingredient_name: string;
  category: string;
  total_quantity_grams: number;
}

interface GroupedItems {
  [category: string]: ShoppingItem[];
}

// Category colors for styling
const categoryColors: { [key: string]: string } = {
  protein: 'bg-red-100 text-red-800 border-red-200',
  vegetable: 'bg-green-100 text-green-800 border-green-200',
  fruit: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  grain: 'bg-amber-100 text-amber-800 border-amber-200',
  dairy: 'bg-blue-100 text-blue-800 border-blue-200',
  oil: 'bg-purple-100 text-purple-800 border-purple-200',
  spice: 'bg-pink-100 text-pink-800 border-pink-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};


export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);

    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(weekFromNow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchShoppingList();
    }
  }, [startDate, endDate]);

  const fetchShoppingList = async () => {
  try {
    setLoading(true);
    setError('');
    const response = await api.get(`/shopping-list?start_date=${startDate}&end_date=${endDate}`);
    
    // FIX: Access nested data structure from backend
    // Backend returns: { success: true, data: { shoppingList: {...}, totalItems: N } }
    const shoppingData = response.data?.data?.shoppingList || {};
    
    // Convert grouped object to flat array for display
    const flatItems: ShoppingItem[] = [];
    if (shoppingData && typeof shoppingData === 'object') {
      Object.entries(shoppingData).forEach(([category, items]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            flatItems.push({
              ingredient_id: item.ingredient?.id || item.ingredient?._id,
              ingredient_name: item.ingredient?.name || 'Unknown',
              category: category,
              total_quantity_grams: item.quantity_grams || 0,
            });
          });
        }
      });
    }
    
    setItems(flatItems);
    
  } catch (err: any) {
    setError('Failed to load shopping list');
    console.error(err);
    setItems([]); // Set to empty array on error
  } finally {
    setLoading(false);
  }
};

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as GroupedItems);

  return (
    <div className="container mx-auto p-6 bg-[#F5F1E8] min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-4xl font-bold text-gray-900">Shopping List</h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent outline-none"
          />
          <span className="text-gray-600">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600">Generating shopping list...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 bg-white rounded-lg shadow-md">
          <ShoppingCart className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">Your shopping list is empty</h3>
          <p className="text-gray-500 mt-2">Plan some meals in the <Link to="/planner" className="text-[#8B9D83] hover:text-[#7a8c74] font-medium">Planner</Link> to see what you need.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, categoryItems]) => (
            <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className={`px-6 py-4 border-b-2 ${categoryColors[category] || categoryColors.default}`}>
                <h3 className="text-lg font-bold capitalize">{category}</h3>
                <p className="text-sm opacity-75">{categoryItems.length} item{categoryItems.length > 1 ? 's' : ''}</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryItems.map((item) => (
                    <div
                      key={item.ingredient_id}
                      className="flex items-center justify-between p-4 bg-[#F5F1E8] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`item-${item.ingredient_id}`}
                          className="w-5 h-5 rounded border-gray-300 text-[#8B9D83] focus:ring-[#8B9D83]"
                        />
                        <label htmlFor={`item-${item.ingredient_id}`} className="font-medium text-gray-900 cursor-pointer">{item.ingredient_name}</label>
                      </div>
                      <span className="text-gray-600 font-semibold">
                        {item.total_quantity_grams}g
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}