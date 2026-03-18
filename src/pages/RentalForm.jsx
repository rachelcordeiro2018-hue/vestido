import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Upload, 
  User, 
  Phone, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  XCircle,
  Loader2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { maskPhone, cn } from '../lib/utils';

const rentalSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  celular: z.string().min(10, 'Número de celular inválido'),
  data_locacao: z.string().min(1, 'Data da locação é obrigatória'),
  valor: z.string().min(1, 'Valor da locação é obrigatório'),
  observacoes: z.string().optional(),
});

const RentalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      nome: '',
      celular: '',
      data_locacao: '',
      valor: '',
      observacoes: '',
    }
  });

  const celular = watch('celular');
  useEffect(() => {
    if (celular) setValue('celular', maskPhone(celular));
  }, [celular, setValue]);

  useEffect(() => {
    if (id) {
      const fetchRental = async () => {
        setFetching(true);
        const { data, error } = await supabase
          .from('locacoes')
          .select('*')
          .eq('id', id)
          .single();

        if (data) {
          setValue('nome', data.nome);
          setValue('celular', data.celular);
          setValue('data_locacao', data.data_locacao);
          setValue('valor', data.valor.toString());
          setValue('observacoes', data.observacoes);
          if (data.foto_url) setImagePreview(data.foto_url);
        }
        setFetching(false);
      };
      fetchRental();
    }
  }, [id, setValue]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `dresses/${fileName}`;

    const { data, error } = await supabase.storage
      .from('vestidos')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('vestidos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setStatus(null);

    try {
      let foto_url = imagePreview;

      if (imageFile) {
        foto_url = await uploadImage(imageFile);
      }

      const payload = {
        nome: data.nome,
        celular: data.celular,
        data_locacao: data.data_locacao,
        valor: parseFloat(data.valor),
        observacoes: data.observacoes,
        foto_url,
      };

      let result;
      if (id) {
        result = await supabase.from('locacoes').update(payload).eq('id', id);
      } else {
        result = await supabase.from('locacoes').insert([payload]);
      }

      if (result.error) throw result.error;

      setStatus({ type: 'success', message: `Locação ${id ? 'atualizada' : 'cadastrada'} com sucesso!` });
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Houve um erro ao salvar a locação. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10 flex items-center gap-6">
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-white rounded-2xl hover:bg-slate-50 transition-colors shadow-lg shadow-slate-200/50 group border border-slate-100"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {id ? 'Editar' : 'Nova'} <span className="text-indigo-600">Locação</span>
          </h2>
          <p className="text-slate-500 mt-1 font-light">Preencha os dados abaixo para agendar o aluguel.</p>
        </div>
      </div>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "mb-8 p-5 rounded-3xl flex items-center gap-4 border shadow-xl shadow-slate-200/50",
              status.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
            )}
          >
            {status.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            <p className="font-bold">{status.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Photo Upload area */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <h4 className="label-text mb-6">Destaque do Vestido</h4>
            
            <label className={cn(
              "relative flex flex-col items-center justify-center aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden",
              imagePreview ? "border-transparent" : "border-slate-200 hover:border-indigo-400 bg-slate-50/50"
            )}>
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Preview" />
                  <div className="absolute inset-0 bg-indigo-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white p-3 rounded-full text-indigo-600 shadow-lg font-bold flex items-center gap-2">
                       <Upload className="w-5 h-5" />
                       Trocar
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center px-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                    <ImageIcon className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">Foto do Modelo</p>
                    <p className="text-xs text-slate-400">Arraste ou clique <br /> para fazer upload</p>
                  </div>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>

            {imagePreview && (
              <button 
                type="button"
                onClick={() => { setImagePreview(null); setImageFile(null); }}
                className="absolute top-10 right-10 bg-white/90 backdrop-blur p-2 rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Form details area */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="label-text">Cliente</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('nome')}
                  className="input-field pl-12"
                  placeholder="Nome completo"
                />
              </div>
              {errors.nome && <p className="text-red-500 text-xs mt-1 ml-1">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="label-text">WhatsApp / Celular</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('celular')}
                  className="input-field pl-12"
                  placeholder="(00) 00000-0000"
                />
              </div>
              {errors.celular && <p className="text-red-500 text-xs mt-1 ml-1">{errors.celular.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="label-text">Data da Locação</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('data_locacao')}
                  type="date"
                  className="input-field pl-12"
                />
              </div>
              {errors.data_locacao && <p className="text-red-500 text-xs mt-1 ml-1">{errors.data_locacao.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="label-text">Valor da Locação</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('valor')}
                  type="number"
                  step="0.01"
                  className="input-field pl-12"
                  placeholder="0,00"
                />
              </div>
              {errors.valor && <p className="text-red-500 text-xs mt-1 ml-1">{errors.valor.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="label-text">Observações</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <textarea
                {...register('observacoes')}
                rows="4"
                className="input-field pl-12 pt-3"
                placeholder="Detalhes sobre ajustes, entrega ou devolução..."
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4">
             <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full md:w-auto px-12 py-4 text-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Salvar Agendamento'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-8 py-4 rounded-xl text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RentalForm;
