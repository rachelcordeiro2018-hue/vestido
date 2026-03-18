import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  RefreshCcw,
  User,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO, isWithinInterval, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

const RentalList = () => {
  const [locacoes, setLocacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('locacoes')
      .select('*')
      .order('data_locacao', { ascending: false });

    if (!error) setLocacoes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('locacoes-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locacoes' }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLocacoes = useMemo(() => {
    return locacoes.filter(loc => 
      loc.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.celular.includes(searchQuery)
    );
  }, [locacoes, searchQuery]);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta locação?')) return;
    
    setDeletingId(id);
    const { error } = await supabase
      .from('locacoes')
      .delete()
      .eq('id', id);

    if (!error) {
      setLocacoes(locacoes.filter(l => l.id !== id));
    }
    setDeletingId(null);
  };

  const isCritical = (dateStr) => {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = addDays(today, 3);
    return isWithinInterval(date, { start: today, end: threeDaysFromNow });
  };

  if (loading && locacoes.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Todas as <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Locações</span></h2>
          <p className="text-slate-500 mt-2 font-light">Gerencie e visualize todo o seu histórico de aluguéis.</p>
        </div>

        <Link to="/nova-locacao" className="btn-primary">
          <PlusCircle className="w-5 h-5" />
          Nova Locação
        </Link>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente ou telefone..."
            className="input-field pl-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Observações</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocacoes.map((loc, idx) => (
                <motion.tr 
                  key={loc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={loc.foto_url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop'} 
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-slate-100"
                          alt={loc.nome}
                        />
                        {isCritical(loc.data_locacao) && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{loc.nome}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Phone className="w-3 h-3" />
                          {loc.celular}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex flex-col">
                      <p className={cn("font-medium", isCritical(loc.data_locacao) ? "text-red-500" : "text-slate-700")}>
                        {format(parseISO(loc.data_locacao), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className={cn("text-xs font-medium lowercase", isCritical(loc.data_locacao) ? "text-red-400" : "text-slate-400")}>
                        {format(parseISO(loc.data_locacao), "EEEE", { locale: ptBR })}
                      </p>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <p className="font-bold text-indigo-600">{formatCurrency(loc.valor)}</p>
                  </td>
                  <td className="py-5 px-4 max-w-xs">
                    <p className="text-sm text-slate-500 truncate">{loc.observacoes || '-'}</p>
                  </td>
                  <td className="py-5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/editar-locacao/${loc.id}`)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(loc.id)}
                        disabled={deletingId === loc.id}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        {deletingId === loc.id ? (
                          <RefreshCcw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}

              {filteredLocacoes.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium font-lg">Nenhuma locação encontrada</p>
                    <p className="text-slate-300 text-sm mt-1">Tente mudar sua busca ou adicione uma nova locação.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RentalList;
