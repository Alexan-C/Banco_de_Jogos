import "../pages/Jogos.css"
import { useEffect, useState } from 'react';
import api from "../services/api";


interface Jogo {
  ano: number;
  nome: string;
  descricao: string;
  categoria: string;
  capa_url: string;
  
//   capa_url: string; 
}
const Jogos = () => {
    const [jogos, setJogos] = useState<Jogo[]>([]);

    useEffect(() => {
        api.get('/pedidos/list').then(res => setJogos(res.data)).catch(err => console.error("Erro ao buscar jogos", err));
       }, []);

return (
  <div className="biblioteca-container">
    <div className="jogos-grid">
      {jogos.map((jogo, index) => (
        <div key={index} className="card-jogo">
          
          {/* 1. Nome e Categoria agora no TOPO */}
          <div className="cabecalho-jogo">
            <h3>{jogo.nome} <span className="ano-texto">({jogo.ano})</span></h3>
            <span className="tag-genero">{jogo.categoria}</span>
          </div>

          {/* 2. Imagem no MEIO */}
          <div className="capa-container">
            <img src={jogo.capa_url} alt={jogo.nome} />
          </div>

          {/* 3. Descrição embaixo */}
          <div className="info-jogo">
            <p className="descricao-jogo">
              {jogo.descricao || "Sem descrição disponível."}
            </p>
          </div>
          
        </div>
      ))}
    </div>

    {jogos.length === 0 && (
      <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
        <p>Carregando biblioteca de jogos...</p>
      </div>
      
    )}
  </div>
);
}
export default Jogos