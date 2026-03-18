import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import RentalForm from './pages/RentalForm';
import RentalList from './pages/RentalList';
import DressCatalog from './pages/DressCatalog';
import DressForm from './pages/DressForm';
import PublicDressView from './pages/PublicDressView';
import PublicCatalogView from './pages/PublicCatalogView';
import Login from './pages/Login';
import Layout from './components/Layout';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/vestido/:id/ver" element={<PublicDressView />} />
      <Route path="/catalogo/ver" element={<PublicCatalogView />} />
      <Route
        path="/"
        element={session ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Dashboard />} />
        <Route path="locacoes" element={<RentalList />} />
        <Route path="nova-locacao" element={<RentalForm />} />
        <Route path="editar-locacao/:id" element={<RentalForm />} />
        <Route path="catalogo" element={<DressCatalog />} />
        <Route path="novo-vestido" element={<DressForm />} />
        <Route path="editar-vestido/:id" element={<DressForm />} />
      </Route>
    </Routes>
  );
}

export default App;
