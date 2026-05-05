
import api from "../services/api";
import "./Home.css"
import { useState, useEffect, useCallback} from "react"
import { useNavigate } from "react-router-dom";


interface Jogo {
  id: number;
  ano: number;
  nome: string;
  descricao: string;
  categoria: string;
  capa_url: string;
  
}
export function Home() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [indice, setIndice] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [direcao, setDirecao] = useState('');

  const navigate = useNavigate();

  useEffect(()=> {
    api.get('pedidos/list').then(res => {
        const listaValida = Array.isArray(res.data) ? res.data :[];
        setJogos(listaValida);
        if(listaValida.length>0){
            setIndice(Math.floor(Math.random() * listaValida.length))
        }
    }).catch(err => console.error("Erro ao buscar jogos", err))
    .finally(()=> setCarregando(false))
  }, []);
    const proximoJogo = useCallback(()=> {
        if (jogos.length === 0 )return
        setDirecao('slide-right');
        setIndice((prev)=> (prev - 1 + jogos.length) % jogos.length);
    }, [jogos.length]);

    const jogoAnterior = () => {
        if (jogos.length === 0) return
        setDirecao('slide-right');
        setIndice((prev)=> (prev -1 + jogos.length) % jogos.length)
    };
    useEffect(()=> {
        if (jogos.length === 0 )return;
        const timer = setInterval(proximoJogo, 6000);
        return () => clearInterval(timer);
    }, [proximoJogo, jogos.length]);
    

    if(carregando) return <div className="carregando-Holograma">Iniciando projeção...</div>
    if(jogos.length === 0) return <div className="erro-Holograma">Nenhum dado encontrado</div>
    
    const jogo = jogos[indice];
    const handleVincularClick = () => {
  // Passamos o ID do jogo atual para a rota /jogos
  navigate('/jogos', { state: { abrirJogoId: jogo.id } });
};




return (
  <div className="home-container">
    <div 
      className="dynamic-background" 
      style={{ backgroundImage: `url(${jogo.capa_url})` }}
    ></div>
    
    <div className="vignette-overlay"></div>

    <main className="viewport-Estilo">
      <button className="nav-arrow left" onClick={jogoAnterior}>‹</button>
      
      <div className={`card-Estilo-container ${direcao}`} onAnimationEnd={() => setDirecao('')}>
        <div className="glass-effect-card">
          

          <div className="background-poster-wrapper">
            <img key={jogo.nome} src={jogo.capa_url} alt={jogo.nome} className="main-poster-full" />
            <div className="scanline-effect"></div>

            <div className="info-gradient-overlay"></div>
          </div>

          <div className="info-section-Estilo">
            <div className="badge-categoria">{jogo.categoria || 'Epic Game'}</div>
            <h1 className="title-Estilo">{jogo.nome}</h1>
            <p className="description-Estilo">{jogo.descricao}</p>
            
            <div className="action-area">
              <button className="btn-Estilo-action" onClick={handleVincularClick}>
                Vincular Jogo
              </button>
            </div>
          </div>
          
        </div>
      </div>

      <button className="nav-arrow right" onClick={proximoJogo}>›</button>
    </main>
  </div>
);
}

export default Home