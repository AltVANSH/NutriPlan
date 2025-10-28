import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Save, AlertCircle, Plus, X } from 'lucide-react';

// Define the object structure for options
interface Option {
  label: string;
  value: string;
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [calorieTarget, setCalorieTarget] = useState(user?.preferences.daily_calorie_target.toString() || '2000');
  const [proteinTarget, setProteinTarget] = useState(user?.preferences.daily_protein_target.toString() || '50');
  const [carbsTarget, setCarbsTarget] = useState(user?.preferences.daily_carbs_target.toString() || '250');
  const [fatTarget, setFatTarget] = useState(user?.preferences.daily_fat_target.toString() || '70');
  
  // State remains string[], which is correct
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(user?.preferences.dietary_restrictions || []);
  const [allergies, setAllergies] = useState<string[]>(user?.preferences.allergies || []);
  
  const [newRestriction, setNewRestriction] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const commonRestrictions: Option[] = [
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Gluten-Free', value: 'gluten-free' },
  { label: 'Dairy-Free', value: 'dairy-free' },
  { label: 'Nut-Free', value: 'nut-free' },
  { label: 'Paleo', value: 'paleo' },
  { label: 'Keto', value: 'keto' },
  { label: 'No-Cook', value: 'no-cook' },  // ✅ ADDED THIS
];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const preferences = {
        daily_calorie_target: parseInt(calorieTarget, 10),
        daily_protein_target: parseInt(proteinTarget, 10),
        daily_carbs_target: parseInt(carbsTarget, 10),
        daily_fat_target: parseInt(fatTarget, 10),
        dietary_restrictions: dietaryRestrictions,
        allergies: allergies,
      };
      await updateProfile({ preferences });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError('Failed to update profile. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // --- FIX: Logic to add restriction string ---
  const addRestriction = (restrictionValue: string) => {
    if (restrictionValue && !dietaryRestrictions.includes(restrictionValue)) {
      setDietaryRestrictions([...dietaryRestrictions, restrictionValue]);
    }
    setNewRestriction(''); // Clear input
  };

  // --- FIX: Logic to add allergy string ---
  const addAllergy = (allergy: string) => {
    if (allergy && !allergies.includes(allergy)) {
      setAllergies([...allergies, allergy]);
    }
    setNewAllergy(''); // Clear input
  };
  
  // --- FIX: Helper to get label from value ---
  const getRestrictionLabel = (value: string) => {
    return commonRestrictions.find(r => r.value === value)?.label || value;
  };

  return (
    <div className="container mx-auto p-6 bg-[#F5F1E8] min-h-screen max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <User className="w-8 h-8 text-[#8B9D83]" />
        <h1 className="text-4xl font-bold text-gray-900">Your Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Success: </strong>
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        {/* Nutritional Targets */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">Nutritional Targets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="calorieTarget" className="block text-sm font-medium text-gray-700 mb-2">Daily Calories (kcal)</label>
              <input
                type="number"
                id="calorieTarget"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
              />
            </div>
            <div>
              <label htmlFor="proteinTarget" className="block text-sm font-medium text-gray-700 mb-2">Daily Protein (g)</label>
              <input
                type="number"
                id="proteinTarget"
                value={proteinTarget}
                onChange={(e) => setProteinTarget(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
              />
            </div>
            <div>
              <label htmlFor="carbsTarget" className="block text-sm font-medium text-gray-700 mb-2">Daily Carbs (g)</label>
              <input
                type="number"
                id="carbsTarget"
                value={carbsTarget}
                onChange={(e) => setCarbsTarget(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
              />
            </div>
            <div>
              <label htmlFor="fatTarget" className="block text-sm font-medium text-gray-700 mb-2">Daily Fat (g)</label>
              <input
                type="number"
                id="fatTarget"
                value={fatTarget}
                onChange={(e) => setFatTarget(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dietary Restrictions */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Dietary Restrictions</h3>
            <div className="flex gap-2">
              <select
                value={newRestriction}
                onChange={(e) => addRestriction(e.target.value)}
                className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none bg-white"
              >
                <option value="">Select a restriction...</option>
                {commonRestrictions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {dietaryRestrictions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {/* --- FIX: Map and render correctly --- */}
                {dietaryRestrictions.map((restrictionValue) => (
                  <span
                    key={restrictionValue} // Key is now a unique string
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg"
                  >
                    {getRestrictionLabel(restrictionValue)} {/* Render the label */}
                    <button
                      type="button"
                      onClick={() => setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== restrictionValue))}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Allergies */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Allergies</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="e.g., Peanuts"
                className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
              />
              <button
                type="button"
                onClick={() => addAllergy(newAllergy)}
                className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#ff5252] transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {/* --- FIX: Map and render correctly --- */}
                {allergies.map((allergy) => (
                  <span
                    key={allergy} // Key is a unique string
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B6B] text-white rounded-lg"
                  >
                    {allergy} {/* Render the string */}
                    <button
                      type="button"
                      onClick={() => setAllergies(allergies.filter((a) => a !== allergy))}
                      className="hover:bg-[#ff5252] rounded-full p-0.5 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-10 flex items-center justify-center gap-2 px-6 py-3 bg-[#8B9D83] text-white rounded-lg hover:bg-[#7a8c74] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}