import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  CalendarDays, 
  DollarSign, 
  AlertCircle, 
  ChevronRight,
  RefreshCcw,
  ArrowRight,
  PlusCircle,
  Trophy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, isWithinInterval, addDays, getMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [locacoes, setLocacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(getMonth(new Date()));
  const [searchQuery] = useState('');

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase
      .from('locacoes')
      .select('*')
      .order('data_locacao', { ascending: true });

    if (!error) setLocacoes(data);
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('locacoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locacoes' }, () => {
        fetchData(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLocacoes = useMemo(() => {
    return locacoes.filter(loc => {
      const date = parseISO(loc.data_locacao);
      const locMonth = getMonth(date);
      const matchesMonth = locMonth === currentMonth;
      const matchesSearch = loc.nome.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMonth && matchesSearch;
    });
  }, [locacoes, currentMonth, searchQuery]);

  const stats = useMemo(() => {
    const totalArrecadado = filteredLocacoes.reduce((sum, loc) => sum + Number(loc.valor), 0);
    const qtdLocacoes = filteredLocacoes.length;
    
    const chartData = months.map((m, index) => {
      const monthTotal = locacoes
        .filter(loc => getMonth(parseISO(loc.data_locacao)) === index)
        .reduce((sum, loc) => sum + Number(loc.valor), 0);
        
      return {
        name: m.substring(0, 3),
        valor: monthTotal,
        originalName: m,
        isCurrent: index === currentMonth
      };
    });

    const currentYear = new Date().getFullYear();
    const totalLocacoesAno = locacoes.filter(loc => {
      const date = parseISO(loc.data_locacao);
      return date.getFullYear() === currentYear;
    }).length;

    return { totalArrecadado, qtdLocacoes, chartData, totalLocacoesAno };
  }, [locacoes, filteredLocacoes, currentMonth]);

  const upcomingRentals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return locacoes
      .filter(loc => {
        const rentalDate = parseISO(loc.data_locacao);
        return rentalDate >= today;
      })
      .slice(0, 5);
  }, [locacoes]);

  const isCritical = (dateStr) => {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = addDays(today, 3);
    return isWithinInterval(date, { start: today, end: threeDaysFromNow });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-4 order-1 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Painel de <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Controle</span></h2>
          <p className="text-slate-500 mt-2 font-light">Bem-vinda de volta. Veja o desempenho da sua loja hoje.</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            className="input-field max-w-[180px] bg-white border-2 border-indigo-50"
          >
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          
          <Link to="/nova-locacao" className="btn-primary">
            <PlusCircle className="w-5 h-5" />
            Nova Locação
          </Link>
        </div>
      </div>

      <div className="lg:col-span-1 order-2 lg:order-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col h-fit lg:sticky lg:top-8">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">Próximas <br /> Locações</h3>
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <AnimatePresence>
            {upcomingRentals.map((loc, idx) => (
              <Link 
                key={loc.id}
                to={`/editar-locacao/${loc.id}`}
                className="flex items-center gap-4 group cursor-pointer"
              >
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4 w-full"
                >
                  <div className="relative">
                    <img 
                      src={loc.foto_url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop'} 
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-indigo-200 transition-all border-2 border-white"
                      alt={loc.nome}
                    />
                    {isCritical(loc.data_locacao) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full ring-4 ring-white animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{loc.nome}</h5>
                    <p className={cn(
                      "text-xs font-medium",
                      isCritical(loc.data_locacao) ? "text-red-500" : "text-slate-400"
                    )}>
                      {format(parseISO(loc.data_locacao), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </motion.div>
              </Link>
            ))}
          </AnimatePresence>

          {upcomingRentals.length === 0 && (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">Nenhuma locação <br /> agendada</p>
            </div>
          )}
        </div>

        <Link to="/locacoes" className="w-full mt-10 py-4 bg-slate-50 rounded-2xl text-slate-500 font-bold text-sm text-center hover:bg-indigo-50 hover:text-indigo-600 transition-all">
          Ver todas as locações
        </Link>
      </div>

      <div className="lg:col-span-4 order-3 lg:order-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-indigo-50 shadow-xl shadow-slate-200/50 flex flex-col justify-between group transition-all duration-300 hover:shadow-indigo-100 hover:translate-y-[-4px]">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-50 p-3 rounded-2xl group-hover:bg-indigo-100 transition-colors">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-500 bg-emerald-50 p-1 rounded-full" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Recurso Total (Mês)</p>
            <h4 className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(stats.totalArrecadado)}</h4>
          </div>
        </div>

        <div className="bg-linear-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl shadow-xl shadow-indigo-200 flex flex-col justify-between group transition-all duration-300 hover:translate-y-[-4px] text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <ArrowRight className="w-5 h-5 text-white/50" />
          </div>
          <div>
            <p className="text-indigo-100 text-sm font-medium">Total Locações (Mês)</p>
            <h4 className="text-4xl font-bold mt-1 tracking-tight">{stats.qtdLocacoes} <span className="text-lg font-light opacity-80">vestidos</span></h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-indigo-50 shadow-xl shadow-slate-200/50 flex flex-col justify-between group transition-all duration-300 hover:translate-y-[-4px]">
           <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-3 rounded-2xl">
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Locações do Ano ({new Date().getFullYear()})</p>
            <h4 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalLocacoesAno} <span className="text-lg font-light opacity-80">unidades</span></h4>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 order-4 lg:order-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800">Crescimento Anual</h3>
            <p className="text-slate-400 text-sm mt-1">Comparativo de faturamento entre os meses do ano</p>
          </div>
          
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px' 
                  }}
                  formatter={(val) => [formatCurrency(val), 'Faturamento']}
                  labelFormatter={(name, payload) => payload[0]?.payload?.originalName || name}
                />
                <Bar 
                  dataKey="valor" 
                  radius={[8, 8, 8, 8]}
                  barSize={40}
                  animationDuration={1500}
                >
                  {stats.chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isCurrent ? '#6366f1' : '#E2E8F0'} 
                      className="transition-all duration-300 hover:fill-indigo-400"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
