import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import ExcelImport from './pages/ExcelImport';
import ExpiringSoon from './pages/ExpiringSoon';
import QuickScan from './pages/QuickScan';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/excel" element={<ExcelImport />} />
              <Route path="/expiring-soon" element={<ExpiringSoon />} />
              <Route path="/scan" element={<QuickScan />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}
