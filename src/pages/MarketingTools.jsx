import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Tag as TagIcon, 
  Layout, 
  Check, 
  AlertCircle,
  RefreshCcw,
  Sparkles,
  ShoppingBag,
  MoveVertical,
  MoveHorizontal,
  Maximize2,
  Camera,
  Type,
  Coins,
  Palette,
  X,
  Brush
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import CanvasElement from '../components/CanvasElement';

const MarketingTools = () => {
  // Inicializa o estado a partir do LocalStorage (se existir)
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('marketing_products');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        nome: '', 
        preco: '9,99', 
        imagem1: '', 
        imagem2: '', 
        scale1: 1, x1: 0, y1: 0,
        scale2: 1, x2: 0, y2: 0,
        nameScale: 1, nameX: 0, nameY: 0, nameColor: '#ffffff',
        priceScale: 1, priceX: 0, priceY: 0, priceColor: '#ffffff',
        bgColor: '#ffffff'
      }
    ];
  });

  const [selectedId, setSelectedId] = useState(1);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  const [containerWidth, setContainerWidth] = useState(500);
  const previewRefs = useRef({});
  const containerRef = useRef(null);

  // Observa o redimensionamento do container para escala perfeita
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const manualSave = () => {
    localStorage.setItem('marketing_products', JSON.stringify(products));
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const addProduct = () => {
    const lastProduct = products[products.length - 1];
    const newId = Date.now();
    
    setProducts([...products, { 
      id: newId, 
      nome: '', 
      preco: lastProduct?.preco || '9,99', 
      imagem1: '', 
      imagem2: '', 
      scale1: lastProduct?.scale1 || 1, x1: lastProduct?.x1 || 0, y1: lastProduct?.y1 || 0,
      scale2: lastProduct?.scale2 || 1, x2: lastProduct?.x2 || 0, y2: lastProduct?.y2 || 0,
      nameScale: lastProduct?.nameScale || 1, nameX: lastProduct?.nameX || 0, nameY: lastProduct?.nameY || 0, nameColor: lastProduct?.nameColor || '#ffffff',
      priceScale: lastProduct?.priceScale || 1, priceX: lastProduct?.priceX || 0, priceY: lastProduct?.priceY || 0, priceColor: lastProduct?.priceColor || '#ffffff',
      bgColor: lastProduct?.bgColor || '#ffffff'
    }]);
    setSelectedId(newId);
  };

  const removeProduct = (id) => {
    if (products.length === 1) return;
    setProducts(products.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(products[0].id);
  };

  const updateProduct = (id, field, value) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const loadFromCatalog = async () => {
    const { data, error } = await supabase.from('vestidos').select('*');
    if (data && !error) {
      const newProducts = data.map(v => ({
        id: v.id + Date.now(),
        nome: v.nome,
        preco: v.preco_base.toString(),
        imagem1: v.foto_url,
        imagem2: v.fotos?.[1] || '',
        scale1: 1, x1: 0, y1: 0,
        scale2: 1, x2: 0, y2: 0,
        nameScale: 1, nameX: 0, nameY: 0, nameColor: '#ffffff',
        priceScale: 1, priceX: 0, priceY: 0, priceColor: '#ffffff',
        bgColor: '#ffffff'
      }));
      setProducts([...products, ...newProducts]);
    }
  };

  const handleImageUpload = (id, field, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProduct(id, field, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImageArray = async () => {
    setIsExporting(true);
    try {
      for (const product of products) {
        const ref = previewRefs.current[product.id];
        if (ref) {
          const dataUrl = await toPng(ref, { 
            quality: 1,
            canvasWidth: 1028,
            canvasHeight: 1028,
            width: 1028,
            height: 1028,
            pixelRatio: 1,
            style: { transform: 'none', transformOrigin: 'top left', left: '0', top: '0' }
          });
          const link = document.createElement('a');
          link.download = `art-${product.nome || 'vestido'}-${product.id}.png`;
          link.href = dataUrl;
          link.click();
        }
      }
    } catch (err) {
      console.error('Error exporting images:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const activeProduct = products.find(p => p.id === selectedId) || products[0];

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen animate-in fade-in duration-500 pb-20 px-0 md:px-0">
      {/* Preview Section - Sticky on Mobile for better UX */}
      <div className="lg:w-3/5 order-1 lg:order-2 sticky top-0 z-[100]">
        <div className="w-full flex flex-col items-center bg-white/95 backdrop-blur-xl p-2 lg:p-0 lg:bg-transparent rounded-b-[2.5rem] lg:rounded-none shadow-2xl shadow-slate-200/50 lg:shadow-none mb-2 lg:mb-0 border-b border-slate-100 lg:border-none h-fit">
          <div ref={containerRef} className="relative shadow-2xl overflow-hidden bg-white w-full max-w-[400px] lg:max-w-[500px] aspect-square border-4 border-white rounded-3xl lg:rounded-xl">
            <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${containerWidth / 1028})`, width: '1028px', height: '1028px' }}>
              <div ref={el => previewRefs.current[activeProduct.id] = el} className="w-[1028px] h-[1028px] relative overflow-hidden" style={{ width: '1028px', height: '1028px', backgroundColor: activeProduct.bgColor || '#ffffff' }}>
                <div className="absolute inset-0 flex z-10 overflow-hidden" onClick={() => setSelectedLayer(null)}>
                  {activeProduct.imagem1 && activeProduct.imagem2 ? (
                    <>
                      <CanvasElement
                        isImageWrapper
                        className="flex-1"
                        mode="translate"
                        x={activeProduct.x1 || 0} y={activeProduct.y1 || 0} scale={activeProduct.scale1 || 1}
                        zoomFactor={containerWidth / 1028}
                        isSelected={selectedLayer === 'imagem1'}
                        onSelect={() => setSelectedLayer('imagem1')}
                        onUpdate={(nx, ny, ns) => { updateProduct(activeProduct.id, 'x1', nx); updateProduct(activeProduct.id, 'y1', ny); updateProduct(activeProduct.id, 'scale1', ns); }}
                      >
                        <img src={activeProduct.imagem1} className="absolute inset-0 w-full h-full object-cover" />
                      </CanvasElement>
                      <div className="w-[12px] h-full bg-white z-20 shadow-[0_0_30px_rgba(0,0,0,0.3)] pointer-events-none" />
                      <CanvasElement
                        isImageWrapper
                        className="flex-1"
                        mode="translate"
                        x={activeProduct.x2 || 0} y={activeProduct.y2 || 0} scale={activeProduct.scale2 || 1}
                        zoomFactor={containerWidth / 1028}
                        isSelected={selectedLayer === 'imagem2'}
                        onSelect={() => setSelectedLayer('imagem2')}
                        onUpdate={(nx, ny, ns) => { updateProduct(activeProduct.id, 'x2', nx); updateProduct(activeProduct.id, 'y2', ny); updateProduct(activeProduct.id, 'scale2', ns); }}
                      >
                        <img src={activeProduct.imagem2} className="absolute inset-0 w-full h-full object-cover" />
                      </CanvasElement>
                    </>
                  ) : activeProduct.imagem1 || activeProduct.imagem2 ? (
                    <CanvasElement
                      isImageWrapper
                      className="w-full h-full"
                      mode="translate"
                      x={activeProduct.x1 || 0} y={activeProduct.y1 || 0} scale={activeProduct.scale1 || 1}
                      zoomFactor={containerWidth / 1028}
                      isSelected={selectedLayer === 'imagem1'}
                      onSelect={() => setSelectedLayer('imagem1')}
                      onUpdate={(nx, ny, ns) => { updateProduct(activeProduct.id, 'x1', nx); updateProduct(activeProduct.id, 'y1', ny); updateProduct(activeProduct.id, 'scale1', ns); }}
                    >
                      <img src={activeProduct.imagem1 || activeProduct.imagem2} className="absolute inset-0 w-full h-full object-contain" />
                    </CanvasElement>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <ImageIcon className="w-72 h-72 opacity-20" />
                    </div>
                  )}
                </div>

                {activeProduct.nome && (
                  <CanvasElement
                    mode="absolute"
                    style={{ bottom: `${230 - (activeProduct.nameY || 0)}px`, left: `${48 + (activeProduct.nameX || 0)}px`, zIndex: 40 }}
                    className="flex flex-col"
                    x={activeProduct.nameX || 0} y={activeProduct.nameY || 0} scale={activeProduct.nameScale || 1}
                    zoomFactor={containerWidth / 1028}
                    isSelected={selectedLayer === 'name'}
                    onSelect={() => setSelectedLayer('name')}
                    onUpdate={(nx, ny, ns) => { updateProduct(activeProduct.id, 'nameX', nx); updateProduct(activeProduct.id, 'nameY', ny); updateProduct(activeProduct.id, 'nameScale', ns); }}
                  >
                    <h2 className="text-[4rem] font-black uppercase tracking-[-0.08em] font-boulder italic leading-none pointer-events-none" style={{ color: activeProduct.nameColor || '#ffffff', textShadow: '3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 5px 5px 25px rgba(0,0,0,0.6)', WebkitTextStroke: '2px white' }}>{activeProduct.nome}</h2>
                  </CanvasElement>
                )}

                {activeProduct.preco && (
                  <CanvasElement
                    mode="absolute"
                    style={{ bottom: `${230 - (activeProduct.priceY || 0)}px`, left: `${48 + (activeProduct.priceX || 0)}px`, zIndex: 40 }}
                    className="flex flex-col"
                    x={activeProduct.priceX || 0} y={activeProduct.priceY || 0} scale={activeProduct.priceScale || 1}
                    zoomFactor={containerWidth / 1028}
                    isSelected={selectedLayer === 'price'}
                    onSelect={() => setSelectedLayer('price')}
                    onUpdate={(nx, ny, ns) => { updateProduct(activeProduct.id, 'priceX', nx); updateProduct(activeProduct.id, 'priceY', ny); updateProduct(activeProduct.id, 'priceScale', ns); }}
                  >
                    <div className="flex items-baseline gap-2 pointer-events-none">
                        <span className="text-[2.2rem] font-black italic shadow-black font-boulder" style={{ color: activeProduct.priceColor || '#ffffff', textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 5px 5px 15px rgba(0,0,0,0.4)', WebkitTextStroke: '1px white' }}>R$</span>
                        <span className="text-[5.4rem] font-black italic tracking-[-0.1em] font-boulder" style={{ color: activeProduct.priceColor || '#ffffff', textShadow: '3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 5px 5px 30px rgba(0,0,0,0.7)', WebkitTextStroke: '2px white' }}>{activeProduct.preco}</span>
                      </div>
                  </CanvasElement>
                )}

                <div className="absolute bottom-0 left-0 w-full z-40 pointer-events-none">
                  <img src="/RODAPE.png" alt="Rodapé" className="w-full h-auto pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Section */}
      <div className="w-full lg:w-2/5 order-2 lg:order-1 space-y-6">
        <header className="hidden lg:block">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight uppercase italic underline decoration-red-600 underline-offset-8">
            Vitrine <span className="text-red-700">Studio</span>
          </h2>
          <p className="text-slate-500 mt-2 font-medium font-sans">Cor de fundo, escalas e tipografia personalizada.</p>
        </header>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-slate-800 flex items-center gap-2 font-sans tracking-tight uppercase italic">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Catálogo de Artes
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={loadFromCatalog} className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-2xl hover:bg-slate-800 transition-colors text-xs font-bold">
                <ShoppingBag className="w-4 h-4" /> Importar
              </button>
              <button onClick={addProduct} className="p-2 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm">
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar p-1">
            {products.map((p, idx) => (
              <div 
                key={p.id}
                className={cn(
                  "p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative",
                  selectedId === p.id ? "border-red-600 bg-red-50/10 shadow-lg" : "border-slate-100"
                )}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <span className="text-xs font-black text-slate-400 tracking-tighter uppercase italic underline underline-offset-4 decoration-red-600">Veste #{idx + 1}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeProduct(p.id); }} className="text-slate-300 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <input type="text" placeholder="Nome" value={p.nome || ''} onChange={(e) => updateProduct(p.id, 'nome', e.target.value)} className="flex-1 px-5 py-3 border border-slate-200 rounded-[1.2rem] text-sm focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all shadow-sm font-bold" />
                    <input type="text" placeholder="9,99" value={p.preco || ''} onChange={(e) => updateProduct(p.id, 'preco', e.target.value)} className="w-[120px] px-5 py-3 border border-slate-200 rounded-[1.2rem] text-sm outline-none font-black text-red-700 font-sans" />
                  </div>
                  
                  {selectedId === p.id && (
                    <div className="space-y-3">
                      {/* Cor de Fundo do Template */}
                      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase italic tracking-widest"><Brush className="w-4 h-4 text-red-500" /> Cor de Fundo da Arte</div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black">{p.bgColor || '#ffffff'}</span>
                            <input type="color" value={p.bgColor || '#ffffff'} onChange={(e) => updateProduct(p.id, 'bgColor', e.target.value)} className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer overflow-hidden p-0" />
                         </div>
                      </div>

                      {/* Ajuste de Nome */}
                      <div className={cn("bg-amber-50 p-4 rounded-2xl border space-y-3 transition-all cursor-pointer", selectedLayer === 'name' ? 'border-red-400 shadow-md ring-4 ring-red-100' : 'border-amber-100 hover:border-red-200')} onClick={() => setSelectedLayer('name')}>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-700 italic"><Type className="w-4 h-4" /> Nome {selectedLayer === 'name' && <span className="text-red-600">(Livre Manipulação Ativa)</span>}</div>
                           <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <Palette className="w-3 h-3 text-red-500" />
                              <input type="color" value={p.nameColor || '#ffffff'} onChange={(e) => updateProduct(p.id, 'nameColor', e.target.value)} className="w-6 h-6 rounded-md border-none cursor-pointer" />
                           </div>
                        </div>
                        {selectedLayer === 'name' && <p className="text-[10px] text-slate-500 font-bold border-t border-amber-200 pt-2 opacity-80 animate-in fade-in">Arraste o texto diretamente no canvas ao lado. Puxe as alças nos cantos para redimensionar proporcionalmente.</p>}
                      </div>

                      {/* Ajuste do Preço */}
                      <div className={cn("bg-amber-50 p-4 rounded-2xl border space-y-3 transition-all cursor-pointer", selectedLayer === 'price' ? 'border-amber-500 shadow-md ring-4 ring-amber-100' : 'border-amber-100 hover:border-amber-300')} onClick={() => setSelectedLayer('price')}>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-700 italic"><Coins className="w-4 h-4" /> Preço {selectedLayer === 'price' && <span className="text-amber-600">(Livre Manipulação Ativa)</span>}</div>
                           <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <Palette className="w-3 h-3 text-amber-400" />
                              <input type="color" value={p.priceColor || '#ffffff'} onChange={(e) => updateProduct(p.id, 'priceColor', e.target.value)} className="w-6 h-6 rounded-md border-none cursor-pointer" />
                           </div>
                        </div>
                        {selectedLayer === 'price' && <p className="text-[10px] text-slate-500 font-bold border-t border-amber-200 pt-2 opacity-80 animate-in fade-in">Arraste o preço diretamente no canvas ao lado. Puxe as alças nos cantos para redimensionar proporcionalmente.</p>}
                      </div>
                    </div>
                  )}

                  {/* AJUSTES DE IMAGEM */}
                  <div className={cn("bg-slate-50 p-4 rounded-2xl border space-y-3 transition-all cursor-pointer", selectedLayer === 'imagem1' ? 'border-red-500 shadow-md ring-4 ring-red-100 bg-white' : 'border-slate-100 hover:border-slate-300')} onClick={() => setSelectedLayer('imagem1')}>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 mb-1 italic">
                      <span className="flex items-center gap-2"><Camera className="w-3 h-3" /> Enquadramento Principal</span>
                      {selectedLayer === 'imagem1' && <span className="text-red-600 font-bold bg-red-50 px-2 rounded-full">ATIVO E EDITÁVEL</span>}
                    </div>
                    {selectedLayer === 'imagem1' && <p className="text-[10px] text-slate-400 font-bold mt-2 animate-in fade-in border-t border-slate-100 pt-2"><span className="text-red-500">Arraste a imagem no canvas</span>. Para aplicar Zoom, use o controle deslizante (slider) na parte inferior ou a roda do mouse quando selecionado.</p>}
                  </div>

                  {p.imagem2 && (
                    <div className={cn("bg-slate-50 p-4 rounded-2xl border space-y-3 transition-all cursor-pointer", selectedLayer === 'imagem2' ? 'border-red-500 shadow-md ring-4 ring-red-100 bg-white' : 'border-slate-100 hover:border-slate-300')} onClick={() => setSelectedLayer('imagem2')}>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 mb-1 italic">
                        <span className="flex items-center gap-2"><Camera className="w-4 h-4" /> Enquadramento Secundário</span>
                        {selectedLayer === 'imagem2' && <span className="text-red-600 font-bold bg-red-50 px-2 rounded-full">ATIVO E EDITÁVEL</span>}
                      </div>
                      {selectedLayer === 'imagem2' && <p className="text-[10px] text-slate-400 font-bold mt-2 animate-in fade-in border-t border-slate-100 pt-2"><span className="text-red-500">Arraste a imagem no canvas</span>. Para aplicar Zoom, use o controle deslizante (slider) na parte inferior ou a roda do mouse quando selecionado.</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative border-2 border-dashed border-slate-200 rounded-[1.2rem] p-2 h-24 flex items-center justify-center bg-white group hover:border-red-600 transition-colors">
                      {p.imagem1 ? (
                        <>
                          <img src={p.imagem1} className="h-full object-contain rounded-lg" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateProduct(p.id, 'imagem1', ''); }}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex items-center justify-center cursor-pointer">
                          <Plus className="text-slate-300" />
                          <input type="file" className="hidden" onChange={(e) => handleImageUpload(p.id, 'imagem1', e)} />
                        </label>
                      )}
                    </div>

                    <div className="relative border-2 border-dashed border-slate-200 rounded-[1.2rem] p-2 h-24 flex items-center justify-center bg-white group hover:border-red-600 transition-colors">
                      {p.imagem2 ? (
                        <>
                          <img src={p.imagem2} className="h-full object-contain rounded-lg" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateProduct(p.id, 'imagem2', ''); }}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex items-center justify-center cursor-pointer">
                          <Plus className="text-slate-300" />
                          <input type="file" className="hidden" onChange={(e) => handleImageUpload(p.id, 'imagem2', e)} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button 
              onClick={manualSave} 
              className={cn(
                "py-5 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-tighter",
                saveStatus ? "bg-emerald-500 text-white" : "bg-white text-slate-800 border-2 border-slate-100 hover:border-emerald-500"
              )}
            >
              <Check className={cn("w-6 h-6", saveStatus ? "inline-block" : "hidden")} />
              {saveStatus ? "Ajustes Salvos!" : "Salvar Ajustes"}
            </button>
            <button 
              onClick={downloadImageArray} 
              disabled={isExporting} 
              className="py-5 bg-red-700 hover:bg-red-800 text-white rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-tighter shadow-red-200/50"
            >
              {isExporting ? <RefreshCcw className="animate-spin" /> : <Download />} Salvar Artes
            </button>
          </div>
        </div>
      </div>


      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Passion+One:wght@400;700;900&display=swap');
        .font-impact { font-family: 'Passion One', cursive; }
        .font-boulder { font-family: 'Archivo Black', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        
        /* Otimização de toque para Sliders Mobile */
        .mobile-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 12px;
          background: #f1f5f9;
          border-radius: 99px;
          margin: 8px 0;
          cursor: pointer;
        }
        .mobile-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #dc2626;
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          cursor: grab;
        }
        .mobile-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #dc2626;
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          cursor: grab;
        }
        .mobile-slider:active::-webkit-slider-thumb { cursor: grabbing; transform: scale(1.1); }
      `}</style>
    </div>
  );
};

export default MarketingTools;
