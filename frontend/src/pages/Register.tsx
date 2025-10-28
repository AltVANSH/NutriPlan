import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, AlertCircle, Plus, X } from 'lucide-react';

// Define the object structure for options
interface Option {
  label: string;
  value: string;
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State remains string[], which is correct
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [proteinTarget, setProteinTarget] = useState('50');
  const [carbsTarget, setCarbsTarget] = useState('250');
  const [fatTarget, setFatTarget] = useState('70');
  
  const [newRestriction, setNewRestriction] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const restrictionOptions: Option[] = [
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Gluten-Free', value: 'gluten-free' },
    { label: 'Dairy-Free', value: 'dairy-free' },
    { label: 'Nut-Free', value: 'nut-free' },
    { label: 'Paleo', value: 'paleo' },
    { label: 'Keto', value: 'keto' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const preferences = {
        daily_calorie_target: parseInt(calorieTarget, 10),
        daily_protein_target: parseInt(proteinTarget, 10),
        daily_carbs_target: parseInt(carbsTarget, 10),
        daily_fat_target: parseInt(fatTarget, 10),
        dietary_restrictions: dietaryRestrictions,
        allergies: allergies,
      };
      
      await register(email, password, preferences);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  // --- FIX: Logic to add restriction string ---
  const addRestriction = (restrictionValue: string) => {
    if (restrictionValue && !dietaryRestrictions.includes(restrictionValue)) {
      setDietaryRestrictions([...dietaryRestrictions, restrictionValue]);
    }
    setNewRestriction(''); // Clear selection
  };

  // --- FIX: Logic to add allergy string ---
  const addAllergy = (allergy: string) => {
    if (allergy && !allergies.includes(allergy)) {
      setAllergies([...allergies, allergy]);
    }
    setNewAllergy(''); // Clear input
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#8B9D83] rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">to start your personalized nutrition plan.</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3" role="alert">
                <AlertCircle className="w-5 h-5" />
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Account Credentials */}
            <fieldset className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Account Details</h3>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            </fieldset>

            {/* Nutritional Targets */}
            <fieldset className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Daily Nutritional Goals</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="calorieTarget" className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                  <input
                    type="number"
                    id="calorieTarget"
                    value={calorieTarget}
                    onChange={(e) => setCalorieTarget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="proteinTarget" className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                  <input
                    type="number"
                    id="proteinTarget"
                    value={proteinTarget}
                    onChange={(e) => setProteinTarget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="carbsTarget" className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                  <input
                    type="number"
                    id="carbsTarget"
                    value={carbsTarget}
                    onChange={(e) => setCarbsTarget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="fatTarget" className="block text-sm font-medium text-gray-700 mb-2">Fat (g)</label>
                  <input
                    type="number"
                    id="fatTarget"
                    value={fatTarget}
                    onChange={(e) => setFatTarget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none"
                  />
                </div>
              </div>
            </fieldset>
            
            {/* Preferences */}
            <fieldset className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Preferences</h3>
              {/* Dietary Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
                <select
                  value={newRestriction}
                  onChange={(e) => addRestriction(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D83] outline-none bg-white"
                >
                  <option value="">Select a restriction...</option>
                  {restrictionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {dietaryRestrictions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3">
                    {/* --- FIX: Map and render correctly --- */}
                    {dietaryRestrictions.map((restrictionValue) => (
                      <span
                        key={restrictionValue}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {restrictionOptions.find(r => r.value === restrictionValue)?.label || restrictionValue}
                        <button
                          type="button"
                          onClick={() => setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== restrictionValue))}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
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
                    aria-label="Add allergy"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3">
                    {/* --- FIX: Map and render correctly --- */}
                    {allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#FF6B6B] text-white rounded-full text-sm"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => setAllergies(allergies.filter((a) => a !== allergy))}
                          className="hover:bg-[#ff5252] rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8B9D83] text-white py-3 rounded-lg hover:bg-[#7a8c74] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#8B9D83] hover:text-[#7a8c74] font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}