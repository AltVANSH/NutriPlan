import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import Planner from './pages/Planner';
import ShoppingList from './pages/ShoppingList';
import Nutrition from './pages/Nutrition';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pantry"
            element={
              <ProtectedRoute>
                <Layout>
                  <Pantry />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <Layout>
                  <Recipes />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <Layout>
                  <Planner />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/shopping"
            element={
              <ProtectedRoute>
                <Layout>
                  <ShoppingList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/nutrition"
            element={
              <ProtectedRoute>
                <Layout>
                  <Nutrition />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;