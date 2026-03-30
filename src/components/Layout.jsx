import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Scissors,
  List,
  Menu,
  X,
  ShoppingBag
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import BrandIcon from './BrandIcon';

const Layout = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fecha o menu ao mudar de rota (mobile)
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/locacoes', label: 'Locações', icon: List },
    { path: '/catalogo', label: 'Catálogo', icon: ShoppingBag },
    { path: '/nova-locacao', label: 'Nova Locação', icon: PlusCircle },
    { path: '/marketing', label: 'Marketing', icon: Scissors },
  ];

  const SidebarContent = () => (
    <>
      <div className="mb-10 px-2 flex items-center gap-2">
        <div className="bg-amber-400 p-2 rounded-2xl block mx-auto lg:mx-0">
          <BrandIcon className="w-32 h-auto md:w-40" />
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-red-700 text-white shadow-lg shadow-red-200'
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
      >
        <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
        <span className="font-medium">Sair</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Header Mobile */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-slate-800 tracking-tight">Sistema LC</span>
        </div>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay Mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Mobile (Animated) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-white z-[70] p-6 flex flex-col shadow-2xl md:hidden"
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar Desktop (Fixed) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-6 flex-col glass sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto p-4 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
