import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, ChevronLeft, Calendar, Share2, PhoneOutgoing, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../lib/utils';

const PublicDressView = () => {
  const { id } = useParams();
  const [vestido, setVestido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    supabase.from('vestidos')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setVestido(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div></div>;
  if (!vestido) return <div className="min-h-screen flex items-center justify-center text-slate-500">Vestido não encontrado</div>;

  const fotos = (vestido.fotos && vestido.fotos.length > 0) ? vestido.fotos : [vestido.foto_url];
  const shareText = `Olá! Estou interessada no seu vestido: *${vestido.nome}*\nPreço: ${formatCurrency(vestido.preco_base)}\nVi o modelo no seu catálogo online!`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg"><Scissors className="text-white w-5 h-5" /></div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Dress<span className="text-indigo-600">Rent</span></span>
          </div>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')} className="btn-primary py-2 px-4 text-sm"><Share2 className="w-4 h-4" /> Compartilhar</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galeria de Imagens */}
          <div className="space-y-6">
            <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-2xl relative">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={fotos[selectedImage]} 
                  className="w-full h-full object-cover" 
                  alt={vestido.nome} 
                />
              </AnimatePresence>
            </div>
            
            {fotos.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {fotos.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-indigo-600 ring-2 ring-indigo-50 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-8 flex flex-col justify-center">
            <div className="space-y-4">
              <span className="bg-indigo-50 text-indigo-700 font-bold px-4 py-1.5 rounded-full text-sm">Disponível para Locação</span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">{vestido.nome}</h1>
              <p className="text-3xl font-bold text-indigo-600">{formatCurrency(vestido.preco_base)}</p>
            </div>

            <div className="space-y-4">
               <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2 underline decoration-indigo-200 underline-offset-4">Descrição do Modelo</h4>
               <p className="text-slate-500 leading-relaxed text-lg font-light">{vestido.descricao || 'Este modelo não possui descrição detalhada.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
               <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center space-y-2">
                 <Calendar className="w-6 h-6 text-indigo-500" />
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reserva Fácil</span>
                 <p className="text-sm font-medium text-slate-700">Consulte datas</p>
               </div>
               <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center space-y-2">
                 <ShoppingBag className="w-6 h-6 text-indigo-500" />
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ajustes Gratuitos</span>
                 <p className="text-sm font-medium text-slate-700">Feitos sob medida</p>
               </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}
                className="w-full btn-primary py-6 text-xl rounded-3xl shadow-2xl shadow-indigo-200"
              >
                Tenho Interesse <PhoneOutgoing className="w-6 h-6 ml-2" />
              </button>
              <p className="text-center text-slate-400 text-sm mt-4 italic">Fale conosco pelo WhatsApp para reservar este modelo.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé Simples */}
      <footer className="bg-slate-50 py-12 px-4 mt-20">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg"><Scissors className="text-white w-5 h-5" /></div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">DressRent</span>
          </div>
          <p className="text-slate-400 text-sm">Sua loja favorita de aluguel de vestidos de festa.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicDressView;
