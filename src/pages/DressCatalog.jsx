import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Share2, Trash2, Edit2, ShoppingBag, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';

const DressCatalog = () => {
  const [vestidos, setVestidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDresses = async () => {
    setLoading(true);
    const { data } = await supabase.from('vestidos').select('*').order('created_at', { ascending: false });
    if (data) setVestidos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDresses();
    const ch = supabase.channel('v-catalog').on('postgres_changes', { event: '*', schema: 'public', table: 'vestidos' }, () => fetchDresses()).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Excluir este vestido do catálogo?')) {
      await supabase.from('vestidos').delete().eq('id', id);
    }
  };

  const shareWhatsApp = (vestido) => {
    const publicUrl = `${window.location.origin}/vestido/${vestido.id}/ver`;
    const text = `Olá! Veja este vestido: *${vestido.nome}*\n${vestido.descricao || ''}\nPreço: ${formatCurrency(vestido.preco_base)}\nConfira mais detalhes e fotos aqui: ${publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareFullCatalog = () => {
    const publicUrl = `${window.location.origin}/catalogo/ver`;
    const text = `Olá! Confira nosso catálogo completo de vestidos online:\n${publicUrl}\n\nAgende sua prova e escolha o modelo perfeito! 👗✨`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filtered = vestidos.filter(v => v.nome.toLowerCase().includes(search.toLowerCase()));

  const getFotoCapa = (v) => (v.fotos && v.fotos.length > 0) ? v.fotos[0] : v.foto_url;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Catálogo de <span className="text-red-700">Vestidos</span></h2>
          <p className="text-slate-500 font-light mt-1">Gerencie seu inventário e compartilhe com clientes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <button onClick={shareFullCatalog} className="bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-100 transition-all text-sm">
             <Share2 className="w-5 h-5" /> Compartilhar Catálogo
           </button>
           <Link to="/catalogo/ver" target="_blank" className="bg-amber-50 text-red-700 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-100 transition-all text-sm">
             <ExternalLink className="w-5 h-5" /> Ver Vitrine
           </Link>
           <Link to="/novo-vestido" className="btn-primary px-5 py-3">
             <Plus className="w-5 h-5" /> Novo Vestido
           </Link>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          className="input-field pl-12" 
          placeholder="Buscar no catálogo..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando catálogo...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filtered.map((v) => (
              <motion.div 
                layout 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                key={v.id} 
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group"
              >
                <div className="aspect-[3/4] overflow-hidden relative">
                  <img src={getFotoCapa(v)} alt={v.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button onClick={() => shareWhatsApp(v)} className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg hover:bg-emerald-600 transition-colors tooltip" title="Enviar WhatsApp">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <Link to={`/vestido/${v.id}/ver`} target="_blank" className="bg-white text-red-700 p-2.5 rounded-xl shadow-lg hover:bg-amber-50 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{v.nome}</h3>
                    <span className="text-red-700 font-bold whitespace-nowrap">{formatCurrency(v.preco_base)}</span>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2">{v.descricao || 'Sem descrição'}</p>
                  <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                    <Link to={`/editar-vestido/${v.id}`} className="text-slate-400 hover:text-red-700 transition-colors p-2"><Edit2 className="w-5 h-5" /></Link>
                    <button onClick={() => handleDelete(v.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default DressCatalog;
