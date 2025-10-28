import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, AlertCircle, BarChart } from 'lucide-react';

interface DailyNutrition {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

const COLORS = ['#FF6B6B', '#3B82F6', '#F59E0B']; // Protein, Carbs, Fat

export default function Nutrition() {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<DailyNutrition | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailyNutrition[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNutritionData();
  }, [selectedDate]);

  const fetchNutritionData = async () => {
  try {
    setLoading(true);
    setError('');
    const weekStart = new Date(selectedDate);
    weekStart.setDate(weekStart.getDate() - 6);

    const [dailyRes, weeklyRes] = await Promise.all([
      api.get(`/nutrition?date=${selectedDate}`),
      api.get(`/nutrition/week?start_date=${weekStart.toISOString().split('T')[0]}`),
    ]);

    // FIX: Access nested data structure
    // Daily data: { success: true, data: { date, nutrition, targets, percentages } }
    const dailyData = dailyRes.data?.data || dailyRes.data;
    setDailyData({
      date: dailyData.date || selectedDate,
      total_calories: dailyData.nutrition?.calories || 0,
      total_protein: dailyData.nutrition?.protein || 0,
      total_carbs: dailyData.nutrition?.carbs || 0,
      total_fat: dailyData.nutrition?.fat || 0,
    });
    
    // Weekly data: { success: true, data: { weeklyData: [...], weeklyAverages, targets } }
    const weeklyDataArray = weeklyRes.data?.data?.weeklyData || [];
    const formattedWeeklyData = weeklyDataArray.map((day: any) => ({
      date: day.date,
      total_calories: day.nutrition?.calories || 0,
      total_protein: day.nutrition?.protein || 0,
      total_carbs: day.nutrition?.carbs || 0,
      total_fat: day.nutrition?.fat || 0,
    }));
    
    setWeeklyData(Array.isArray(formattedWeeklyData) ? formattedWeeklyData : []);

  } catch (err: any) {
    setError('Failed to load nutrition data.');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const macroData = dailyData
    ? [
        { name: 'Protein', value: dailyData.total_protein },
        { name: 'Carbs', value: dailyData.total_carbs },
        { name: 'Fat', value: dailyData.total_fat },
      ]
    : [];
  
  const totalMacros = (dailyData?.total_protein || 0) + (dailyData?.total_carbs || 0) + (dailyData?.total_fat || 0);

  const weeklyChartData = weeklyData.map(d => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Calories: d.total_calories,
    Protein: d.total_protein,
    Carbs: d.total_carbs,
    Fat: d.total_fat,
  }));

  return (
    <div className="container mx-auto p-6 bg-[#F5F1E8] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Nutrition Report</h1>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent outline-none"
            max={new Date().toISOString().split('T')[0]} // Can't select future dates
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Daily Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Daily Summary ({new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })})
        </h2>
        {loading ? (
          <div className="text-center text-gray-500">Loading daily data...</div>
        ) : dailyData && dailyData.total_calories > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calories Card */}
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-600">Total Calories</span>
              <span className="text-5xl font-bold text-[#8B9D83] my-2">{dailyData.total_calories}</span>
              <span className="text-gray-500">/ {user?.preferences.daily_calorie_target || 2000} kcal</span>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div className="bg-[#8B9D83] h-2.5 rounded-full" style={{ width: `${Math.min(100, (dailyData.total_calories / (user?.preferences.daily_calorie_target || 2000)) * 100)}%` }}></div>
              </div>
            </div>

            {/* Macros Breakdown */}
            <div className="md:col-span-2 grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg">
                <span className="text-sm font-semibold text-red-700">Protein</span>
                <span className="text-3xl font-bold text-red-600 my-1">{dailyData.total_protein}g</span>
                <span className="text-gray-500 text-sm">/ {user?.preferences.daily_protein_target || 50}g</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <span className="text-sm font-semibold text-blue-700">Carbs</span>
                <span className="text-3xl font-bold text-blue-600 my-1">{dailyData.total_carbs}g</span>
                <span className="text-gray-500 text-sm">/ {user?.preferences.daily_carbs_target || 250}g</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-lg">
                <span className="text-sm font-semibold text-amber-700">Fat</span>
                <span className="text-3xl font-bold text-amber-600 my-1">{dailyData.total_fat}g</span>
                <span className="text-gray-500 text-sm">/ {user?.preferences.daily_fat_target || 70}g</span>
              </div>
            </div>

            {/* Macro Pie Chart */}
            <div className="md:col-span-3">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Macronutrient Split</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}g`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-10">
            <BarChart className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">No Nutrition Data</h3>
            <p className="text-gray-500 mt-2">No meals were logged for this day.</p>
          </div>
        )}
      </div>

      {/* Weekly Trend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Weekly Trend</h2>
        {loading ? (
          <div className="text-center text-gray-500">Loading weekly data...</div>
        ) : weeklyChartData.length > 0 ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Calories</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="Calories" stroke="#8B9D83" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Macronutrients (grams)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Protein" stroke="#FF6B6B" strokeWidth={2} />
                  <Line type="monotone" dataKey="Carbs" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Fat" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No weekly data available
          </div>
        )}
      </div>
    </div>
  );
}