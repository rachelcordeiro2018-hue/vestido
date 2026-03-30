import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, ImageIcon, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const schema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  descricao: z.string().optional(),
  preco_base: z.string().min(1, 'Preço é obrigatório'),
});

const DressForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]); // Agora suporta múltiplos arquivos
  const [previews, setPreviews] = useState([]); // Agora suporta múltiplas prévias

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    if (id) {
      supabase.from('vestidos').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setValue('nome', data.nome);
          setValue('descricao', data.descricao);
          setValue('preco_base', data.preco_base?.toString());
          // Carrega fotos antigas ou novas
          const initialFotos = (data.fotos && data.fotos.length > 0) ? data.fotos : (data.foto_url ? [data.foto_url] : []);
          setPreviews(initialFotos);
        }
      });
    }
  }, [id, setValue]);

  const uploadImages = async (files) => {
    const uploadedUrls = [];
    for (const file of files) {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const filePath = `catalog/${fileName}`;
      const { error } = await supabase.storage.from('vestidos').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('vestidos').getPublicUrl(filePath);
      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Mantém as URLs que já estavam (de edições anteriores) e adiciona as novas
      let finalFotos = previews.filter(p => typeof p === 'string' && p.startsWith('http'));
      
      if (imageFiles.length > 0) {
        const newUrls = await uploadImages(imageFiles);
        finalFotos = [...finalFotos, ...newUrls];
      }

      const payload = {
        nome: data.nome,
        descricao: data.descricao,
        preco_base: parseFloat(data.preco_base),
        fotos: finalFotos,
        foto_url: finalFotos[0] || null // Mantém compatibilidade por enquanto
      };

      if (id) await supabase.from('vestidos').update(payload).eq('id', id);
      else await supabase.from('vestidos').insert([payload]);

      navigate('/catalogo');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar no catálogo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = (index) => {
    // Remove tanto do arquivo (se for novo) quanto da prévia
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    
    // Se for um arquivo que acabou de ser selecionado localmente
    const newFiles = [...imageFiles];
    // Precisamos de uma lógica melhor aqui se misturamos arquivos e URLs, 
    // mas para simplificar: os previews refletem tudo.
    // Na hora de salvar, filtramos o que é URL vs o que será upload.
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-6">
        <button onClick={() => navigate('/catalogo')} className="p-3 bg-white rounded-2xl hover:bg-slate-50 transition-all shadow-lg border border-slate-100"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{id ? 'Editar' : 'Novo'} <span className="text-red-700">Vestido</span></h2>
          <p className="text-slate-500 mt-1 font-light">Adicione fotos e especificações técnicas.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
          <h4 className="label-text font-bold">Galeria de Fotos (Vários ângulos)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            <AnimatePresence>
              {previews.map((url, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={idx} 
                  className="aspect-square rounded-2xl overflow-hidden relative group border border-slate-100 shadow-sm"
                >
                  <img src={url} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    type="button" 
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-red-500 mb-2" />
              <span className="text-xs font-bold text-slate-400 group-hover:text-red-700">Adicionar</span>
              <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="label-text">Nome do Modelo</label>
              <input {...register('nome')} className="input-field" placeholder="Ex: Vestido Gala Sereia" />
              {errors.nome && <p className="text-red-500 text-xs">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="label-text">Preço de Aluguel</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 font-bold pointer-events-none">R$</span>
                <input {...register('preco_base')} type="number" step="0.01" className="input-field !pl-12" placeholder="0.00" />
              </div>
              {errors.preco_base && <p className="text-red-500 text-xs">{errors.preco_base.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="label-text">Descrição Técnica / Materiais</label>
            <textarea {...register('descricao')} rows="5" className="input-field pt-3" placeholder="Ex: Cetim italiano, bordado em renda francesa, fechamento em zíper invisível..."></textarea>
          </div>

          <div className="md:col-span-2 pt-4">
             <button type="submit" disabled={loading} className="btn-primary w-full py-5 text-lg shadow-2xl shadow-amber-200">
               {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5 flex items-center justify-center" /> Salvar Vestido</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DressForm;
