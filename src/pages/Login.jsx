import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Scissors, Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import BrandIcon from '../components/BrandIcon';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      {/* Left Side: Brand & Visual */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-amber-400 p-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:24px_24px]"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full mb-8 border border-white/20 text-white/80">
            <Sparkles className="w-4 h-4 text-amber-950" />
            <span className="text-sm font-medium">Lançamento 2026</span>
          </div>
          
          <h2 className="text-5xl font-bold text-amber-950 mb-6 leading-tight">
            Seu Controle de <br /> Brilho em Suas Mãos
          </h2>
          <p className="text-amber-900 text-lg max-w-md mx-auto mb-10 leading-relaxed font-light">
            Modernidade, elegância e controle total das suas locações de vestidos em uma plataforma completa.
          </p>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex flex-col items-center justify-center p-6 md:p-20">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
              <div className="bg-amber-400 p-2 rounded-[2rem] block">
                <BrandIcon className="w-48 h-auto" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">Bem-vinda(o)!</h3>
            <p className="text-slate-500 mt-3 text-lg font-light">
              Entre com suas credenciais para gerenciar <br className="hidden md:block"/> suas locações com maestria.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label-text">E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-700 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="seuemail@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-700 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-4 text-lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm font-light">
            © 2026 Vitrine da Moda LC System. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
