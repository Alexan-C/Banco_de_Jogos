import "../pages/Biblioteca.css"
import { useEffect, useState } from 'react';
import api from "../services/api";
import { gerenciarVinculo, sincronizarBotoesPopup } from "../services/vinculo";
import { createPortal } from "react-dom";
import { FaSteam, FaPlaystation, FaXbox } from "react-icons/fa";
import { SiEpicgames } from "react-icons/si"

interface Jogo {
  id: number;
  ano: number;
  nome: string;
  descricao: string;
  categoria: string;
  capa_url: string;
   
}
const Biblioteca = () => {
    const [jogos, setJogos] = useState<Jogo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [showPopup,setShowPopup] = useState(false)
    const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null);
    
    useEffect(() => {
  if (showPopup && jogoSelecionado) {
    sincronizarBotoesPopup(jogoSelecionado.id);
  }
}, [showPopup, jogoSelecionado]);
    
    useEffect(()=> {
        api.get('pedidos/minha_biblioteca').then(res => {
          const listaValida = Array.isArray(res.data) ? res.data : [];
          setJogos(listaValida);
        }).catch(err => {
          console.error("Erro ao buscar jogos", err)
          setJogos([])
        }).finally(() => {
          setCarregando(false)
        } )
      }, [])
 
      useEffect(() => {
    api.get('pedidos/list')
      .then(res => {
        const listaValida = Array.isArray(res.data) ? res.data : [];
        setJogos(listaValida);
      })
      .catch(err => {
        console.error("Erro ao buscar jogos", err);
        setJogos([]);
      })
      .finally(() => setCarregando(false));
  }, []);

const handleVinculo = async (
  e: React.MouseEvent<HTMLButtonElement>,
  plataforma: string,
  sub: string | null
) => {
  if (!jogoSelecionado) return;

  await gerenciarVinculo(e.currentTarget, jogoSelecionado.id, plataforma, sub);
  setTimeout(() => {
    sincronizarBotoesPopup(jogoSelecionado.id);
  }, 50);
};

return (
    <>
      <div className="biblioteca-container">
        {carregando ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
            <p>Carregando Jogos...</p>
          </div>
        ) : (
          <div className="jogos-grid">
            {jogos.map((jogo) => (
              <div 
                key={jogo.id} 
                className="card-jogo-minimalista" 
                onClick={() => { setJogoSelecionado(jogo); setShowPopup(true); sincronizarBotoesPopup(jogo.id); }}
              >
                <img src={jogo.capa_url} className="capa-principal" alt={jogo.nome} />
                <div className="card-overlay-minimalista">
                  <span>{jogo.nome}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPopup && jogoSelecionado && createPortal(
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={() => setShowPopup(false)}>✕</button>
            
            <div className="popup-left">
              <img src={jogoSelecionado.capa_url} className="img-main" alt={jogoSelecionado.nome} />
              <div className="gradient-overlay"></div>
            </div>

            <div className="popup-right">
              <span className="badge-categoria">{jogoSelecionado.categoria}</span>
              <h2 className="popup-title">{jogoSelecionado.nome}</h2>
              <p className="description-Estilo">{jogoSelecionado.descricao}</p>

              <div className="platform-group">
                <h4>Vincular ao Console</h4>
                <div className="btn-row">
                  <button 
                    className="btn-platform-choice btn-ps" 
                    data-plataforma="PS5" // Deve ser PS5 para sincronizar com o banco
                    onClick={(e) => handleVinculo(e, 'PS5', null)}
                  >
                    <FaPlaystation/> PlayStation
                  </button>
                  <button 
                    className="btn-platform-choice btn-xbox" 
                    data-plataforma="XBOX" // Deve ser XBOX para sincronizar com o banco
                    onClick={(e) => handleVinculo(e, 'XBOX', null)}
                  >
                    <FaXbox/> Xbox
                  </button>
                </div>

                <h4>Vincular ao PC</h4>
                <div className="btn-row">
                  <button 
                    className="btn-platform-choice btn-epic" 
                    data-plataforma = "PC"
                    data-sub="Epic" 
                    onClick={(e) => handleVinculo(e, 'PC', 'Epic')}
                  >
                    <SiEpicgames/> Epic Games
                  </button>
                  <button 
                    className="btn-platform-choice btn-steam" 
                    data-plataforma = "PC"
                    data-sub="Steam"
                    onClick={(e) => handleVinculo(e, 'PC', 'Steam')}
                  >
                    <FaSteam/> Steam
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
export default Biblioteca



