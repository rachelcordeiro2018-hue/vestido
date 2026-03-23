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
  AlertCircle,
  Eye,
  X,
  FileText
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
  const [activeTab, setActiveTab] = useState('ativas'); // 'ativas' or 'finalizadas'
  const [selectedRental, setSelectedRental] = useState(null);
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

  const { activeLocacoes, finishedLocacoes } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = locacoes.filter(loc => 
      loc.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.celular.includes(searchQuery)
    );

    const active = filtered
      .filter(loc => parseISO(loc.data_locacao) >= today)
      .sort((a, b) => parseISO(a.data_locacao) - parseISO(b.data_locacao)); // Mais próximas primeiro

    const finished = filtered
      .filter(loc => parseISO(loc.data_locacao) < today)
      .sort((a, b) => parseISO(b.data_locacao) - parseISO(a.data_locacao)); // Mais recentes primeiro

    return { activeLocacoes: active, finishedLocacoes: finished };
  }, [locacoes, searchQuery]);

  const currentLocacoes = activeTab === 'ativas' ? activeLocacoes : finishedLocacoes;

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
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Gerenciar <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Locações</span></h2>
          <p className="text-slate-500 mt-2 font-light">Controle e organize todos os seus aluguéis de vestidos.</p>
        </div>

        <Link to="/nova-locacao" className="btn-primary">
          <PlusCircle className="w-5 h-5" />
          Nova Locação
        </Link>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-4 pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por cliente ou telefone..."
              className="input-field !pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button
              onClick={() => setActiveTab('ativas')}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                activeTab === 'ativas' 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Em Aberto
              <span className={cn(
                "px-2 py-0.5 rounded-lg text-[10px]",
                activeTab === 'ativas' ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-500"
              )}>
                {activeLocacoes.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('finalizadas')}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                activeTab === 'finalizadas' 
                  ? "bg-white text-slate-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Finalizadas
              <span className={cn(
                "px-2 py-0.5 rounded-lg text-[10px]",
                activeTab === 'finalizadas' ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
              )}>
                {finishedLocacoes.length}
              </span>
            </button>
          </div>
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
              {currentLocacoes.map((loc, idx) => (
                <motion.tr 
                  key={loc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer"
                  onClick={() => setSelectedRental(loc)}
                >
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={loc.foto_url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop'} 
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-slate-100"
                          alt={loc.nome}
                        />
                        {activeTab === 'ativas' && isCritical(loc.data_locacao) && (
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
                      <p className={cn(
                        "font-medium", 
                        activeTab === 'ativas' && isCritical(loc.data_locacao) ? "text-red-500" : "text-slate-700"
                      )}>
                        {format(parseISO(loc.data_locacao), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className={cn(
                        "text-xs font-medium lowercase", 
                        activeTab === 'ativas' && isCritical(loc.data_locacao) ? "text-red-400" : "text-slate-400"
                      )}>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRental(loc);
                        }}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/editar-locacao/${loc.id}`);
                        }}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(loc.id);
                        }}
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

              {currentLocacoes.length === 0 && (
                <tr className="animate-in fade-in duration-300">
                  <td colSpan="5" className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium font-lg">
                      {activeTab === 'ativas' ? 'Nenhuma locação em aberto' : 'Nenhuma locação finalizada'}
                    </p>
                    <p className="text-slate-300 text-sm mt-1">
                      {searchQuery ? 'Tente mudar sua busca.' : 'Seus registros aparecerão aqui.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedRental && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedRental(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setSelectedRental(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Imagem */}
                <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-50">
                  <img 
                    src={selectedRental.foto_url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop'} 
                    className="w-full h-full object-cover"
                    alt={selectedRental.nome}
                  />
                </div>

                {/* Info */}
                <div className="w-full md:w-1/2 p-8 md:p-10 space-y-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                      {selectedRental.nome}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium">
                      <Phone className="w-4 h-4 text-indigo-500" />
                      {selectedRental.celular}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data da Locação</p>
                        <p className="font-bold text-slate-700">
                          {format(parseISO(selectedRental.data_locacao), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor do Aluguel</p>
                        <p className="font-black text-indigo-600 text-lg">
                          {formatCurrency(selectedRental.valor)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedRental.observacoes && (
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        Observações
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {selectedRental.observacoes}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => {
                        navigate(`/editar-locacao/${selectedRental.id}`);
                        setSelectedRental(null);
                      }}
                      className="flex-1 btn-primary py-3 rounded-2xl text-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </button>
                    <button 
                      onClick={() => {
                        handleDelete(selectedRental.id);
                        setSelectedRental(null);
                      }}
                      className="px-4 py-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RentalList;
