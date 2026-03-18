import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, ShoppingBag, Scissors, PhoneOutgoing, ExternalLink, ArrowRight, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';

const PublicCatalogView = () => {
  const [vestidos, setVestidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDresses = async () => {
    setLoading(true);
    const { data } = await supabase.from('vestidos').select('*').eq('disponivel', true).order('created_at', { ascending: false });
    if (data) setVestidos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDresses();
  }, []);

  const filtered = vestidos.filter(v => v.nome.toLowerCase().includes(search.toLowerCase()));
  const getFotoCapa = (v) => (v.fotos && v.fotos.length > 0) ? v.fotos[0] : v.foto_url;

  const shareCatalog = () => {
    const url = window.location.href;
    const text = `Confira esse catálogo incrível de vestidos de festa! 👗✨\n\nVeja todos os modelos aqui:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header Profissional */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-xl block"><BrandIcon className="text-white w-5 h-5" /></div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">Vitrine da Moda <span className="text-indigo-600">LC</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={shareCatalog}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all text-sm sm:text-base"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden min-[400px]:inline">Compartilhar</span>
            </button>
            <button
              onClick={() => window.open(`https://wa.me/5538998401668?text=${encodeURIComponent('Olá! Gostaria de conhecer seu catálogo completo de vestidos.')}`, '_blank')}
              className="hidden sm:flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
            >
              Falar com Consultora <PhoneOutgoing className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white px-6 py-16 md:py-24 text-center border-b border-slate-100">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-indigo-600 font-bold tracking-[0.2em] uppercase text-sm bg-indigo-50 px-6 py-2 rounded-full"
          >
            Coleção 2024/2025
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight"
          >
            Encontre o Vestido dos Seus <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Sonhos</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl font-light max-w-2xl mx-auto"
          >
            Explore nossa curadoria de vestidos exclusivos para festas, casamentos e eventos de gala.
          </motion.p>
        </div>
      </section>

      {/* Filtros e Busca */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-white p-4 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 max-w-2xl mx-auto flex items-center">
          <Search className="text-slate-400 w-6 h-6 ml-4" />
          <input
            type="text"
            placeholder="Qual modelo você procura? (ex: Sereia, Marsala...)"
            className="flex-1 px-4 py-4 focus:outline-none text-slate-700 font-medium placeholder:font-light"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Vestidos */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Search className="text-slate-300 w-10 h-10" /></div>
            <p className="text-slate-400 text-lg font-medium">Ops! Nenhum modelo encontrado com esse termo.</p>
            <button onClick={() => setSearch('')} className="text-indigo-600 font-bold mt-4">Ver Todos</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence>
              {filtered.map((v, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={v.id}
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-lg shadow-slate-200/40 group hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500"
                >
                  <Link to={`/vestido/${v.id}/ver`}>
                    <div className="aspect-[3/4] overflow-hidden relative">
                      <img src={getFotoCapa(v)} alt={v.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                        <span className="text-white font-bold flex items-center gap-2">Ver detalhes <ArrowRight className="w-5 h-5" /></span>
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{v.nome}</h3>
                        <p className="text-indigo-600 font-extrabold text-lg">{formatCurrency(v.preco_base)}</p>
                      </div>
                      <p className="text-slate-400 text-sm font-light line-clamp-2 leading-relaxed">{v.descricao || 'Este modelo é exclusivo da nossa nova coleção. Agende uma prova e encante-se.'}</p>
                      <div className="pt-2 flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Disponível
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer Público */}
      <footer className="bg-white border-t border-slate-100 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center space-y-8 text-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-2xl"><BrandIcon className="text-white w-6 h-6" /></div>
            <span className="font-bold text-2xl text-slate-900 tracking-tight leading-none italic">Vitrine da Moda <span className="text-indigo-600">LC</span></span>
          </div>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">Sua melhor opção para aluguel de vestidos de luxo. Viva seu momento especial com elegância.</p>
          <div className="flex gap-4">
            <button onClick={() => window.open('https://wa.me/5538998401668', '_blank')} className="bg-emerald-50 text-emerald-600 px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors">WhatsApp <PhoneOutgoing className="w-5 h-5" /></button>
          </div>
          <p className="text-slate-300 text-xs pt-10">© 2024 Vitrine da Moda LC. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicCatalogView;
