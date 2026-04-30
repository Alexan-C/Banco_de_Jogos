import "../pages/Biblioteca.css"
import { useEffect, useState } from 'react';
import api from "../services/api";


interface Jogo {
  ano: number;
  nome: string;
  descricao: string;
  categoria: string;
  capa_url: string;
   
}
const Biblioteca = () => {
    const [jogos, setJogos] = useState<Jogo[]>([]);
    const [carregando, setCarregando] = useState(true);

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
      })

return (
  <div className="biblioteca-container">
    {/* 1. Se estiver carregando, mostra apenas o loading */}
    {carregando ? (
      <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
        <p>Carregando Jogos...</p>
      </div>
    ) : (
      <>
        {/* 2. Se NÃO estiver carregando, mas a lista for zero, mostra mensagem de vazio */}
        {jogos.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
            <p>Adicione Algum Jogo</p>
          </div>
        ) : (
          /* 3. Se houver jogos, renderiza o grid */
          <div className="jogos-grid">
            {jogos.map((jogo, index) => (
              <div key={index} className="card-jogo">
                <div className="cabecalho-jogo">
                  <h3>{jogo.nome} <span className="ano-texto">({jogo.ano})</span></h3>
                  <span className="tag-genero">{jogo.categoria}</span>
                </div>

                <div className="capa-container">
                  <img src={jogo.capa_url} alt={jogo.nome} />
                </div>

                <div className="info-jogo">
                  <p className="descricao-jogo">
                    {jogo.descricao || "Sem descrição disponível."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </div>
);
}
export default Biblioteca



