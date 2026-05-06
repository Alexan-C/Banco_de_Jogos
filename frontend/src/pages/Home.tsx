
import api from "../services/api";
import "./Home.css"
import { useState, useEffect, useCallback} from "react"
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
interface Jogo {
  id: number;
  ano: number;
  nome: string;
  descricao: string;
  categoria: string;
  capa_url: string;
  
}

const cardMesaVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    transition: {
      duration: 0.3,
    },
  },
};
export function Home() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [indice, setIndice] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [estaAnimando, setEstaAnimando] = useState(false);

  const navigate = useNavigate();

useEffect(() => {
    let montado = true;

    api.get('pedidos/list')
      .then(res => {
        if (!montado) return;
        const listaValida = Array.isArray(res.data) ? res.data : [];
        if (listaValida.length > 0) {
          setJogos(listaValida);
          setIndice(Math.floor(Math.random() * listaValida.length));
        }
      })
      .catch(err => console.error("Erro na API:", err))
      .finally(() => {
        if (montado) setCarregando(false);
      });

    return () => { montado = false; };
  }, []);

   const proximoJogo = useCallback(() => {
    if (jogos.length === 0 || estaAnimando) return;
    setEstaAnimando(true);
    setIndice((prev) => (prev + 1) % jogos.length);
  }, [jogos.length, estaAnimando]);

  const jogoAnterior = useCallback(() => {
    if (jogos.length === 0 || estaAnimando) return;
    setEstaAnimando(true);
    setIndice((prev) => (prev - 1 + jogos.length) % jogos.length);
  }, [jogos.length, estaAnimando]);
  
useEffect(() => {
    if (jogos.length <= 1 || carregando) return;

    const timer = setInterval(proximoJogo, 7000);
    return () => clearInterval(timer);
  }, [proximoJogo, jogos.length, carregando]);

useEffect(() => {
  // Trava o scroll no body ao entrar
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  
  return () => {
   
    document.body.style.overflow = 'auto';
  };
}, []);

if (carregando) {
    return (
      <div className="home-container">
        <div className="vignette-overlay"></div>
        <main className="viewport-Estilo">
          <div className="glass-effect-card skeleton-card">
            <div className="info-section-Estilo">
              <div className="skeleton-badge"></div>
              <div className="skeleton-title"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-button"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }
    if (jogos.length === 0) {
    return (
      <div className="home-container">
        <div className="vignette-overlay"></div>
        <p style={{color: 'white', textAlign: 'center', marginTop: '20%'}}>
          Nenhum jogo disponível na projeção.
        </p>
      </div>
    );
  }
    const jogo = jogos[indice];




return (
    <div className="home-container">

      <div
        className="dynamic-background"
        style={{ backgroundImage: `url(${jogo?.capa_url})` }}
      ></div>
      <div className="vignette-overlay"></div>

      <main className="viewport-Estilo">
        <button 
          className="nav-arrow left" 
          onClick={jogoAnterior} 
          disabled={estaAnimando}
        >‹</button>

        <AnimatePresence mode="wait">
       
          <motion.div
            key={jogo?.id || indice}
            variants={cardMesaVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onAnimationComplete={() => setEstaAnimando(false)}
            className="glass-effect-card"
          >
            <div className="background-poster-wrapper">
              {jogo?.capa_url && (
                <img src={jogo.capa_url} alt={jogo.nome} className="main-poster-full" />
              )}
              <div className="scanline-effect"></div>
              <div className="info-gradient-overlay"></div>
            </div>

            <div className="info-section-Estilo">
              <div className="badge-categoria">{jogo?.categoria || 'Digital Game'}</div>
              <h1 className="title-Estilo">{jogo?.nome}</h1>
              <p className="description-Estilo">{jogo?.descricao}</p>
              <div className="action-area">
                <button 
                  className="btn-Estilo-action" 
                  onClick={() => navigate('/jogos', { state: { abrirJogoId: jogo.id } })}
                >
                  Vincular Jogo
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button 
          className="nav-arrow right" 
          onClick={proximoJogo} 
          disabled={estaAnimando}
        >›</button>
      </main>
    </div>
  );
}

export default Home