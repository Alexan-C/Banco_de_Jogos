import { useState, type ChangeEvent, type FormEvent } from "react";
import "./Addjogos.css";
import api from "../services/api";
import { type AxiosError } from "axios";

function AddJogos() {
    const [modo, setModo] = useState<'adicionar' | 'remover'>('adicionar');
    const [jogo, setJogo] = useState({
    
        nome: '', categoria: '', ano: '', descricao: '', capa_url: '',
    });
    const [nomeParaDeletar, setNomeParaDeletar] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJogo({ ...jogo, [name]: value });
    };

    const adicionarNovoJogo = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/pedidos/jogo/adicionar_jogo', jogo);
            alert("Jogo adicionado!");
            setJogo({ nome: '', categoria: '', ano: '', descricao: '', capa_url: '' });
        } catch (error: unknown) {
            const err = error as AxiosError<{ detail: string }>;
            alert(err.response?.data?.detail || "Erro ao adicionar");
        }
    };

    const deletarJogo = async (e: FormEvent) => {
        e.preventDefault();
        if (!window.confirm(`Excluir "${nomeParaDeletar}"?`)) return;
        try {
            const res = await api.delete(`/pedidos/jogo/removerJogo?nome_jogo=${nomeParaDeletar.trim()}`);
            alert(res.data.mensagem);
            setNomeParaDeletar('');
        } catch (error: unknown) {
            const err = error as AxiosError<{ detail: string }>;
            alert(err.response?.data?.detail || "Erro ao remover");
        }
    };

return (
        <div className="pagina-add-jogos-wrapper">
            <div className="dashboard-container">
                {/* LADO ESQUERDO: PREVIEW DA CAPA */}
<div 
    className="preview-side"
    style={jogo.capa_url ? { backgroundImage: `url(${jogo.capa_url})` } : {}}
>
    {/* Essa div cria o desfoque escuro por cima do background */}
    <div className="preview-blur-overlay"></div>

    {jogo.capa_url ? (
        <>
            {jogo.nome && (
                <div className="overlay-nome">
                    <h3>{jogo.nome}</h3>
                </div>
            )}
        </>
    ) : (
        <div className="placeholder-img">
            <p>Aguardando URL da capa...</p>
        </div>
    )}
</div>

                {/* LADO DIREITO: CONTROLES E FORMULÁRIO */}
                <div className="form-side">
                    <button 
                        className={`btn-toggle-unico ${modo === 'remover' ? 'modo-remover' : ''}`}
                        onClick={() => setModo(modo === 'adicionar' ? 'remover' : 'adicionar')}
                    >
                        {modo === 'adicionar' ? 'Alternar para: Remover Jogo' : 'Alternar para: Adicionar Jogo'}
                    </button>

                    <div className="form-content" key={modo}>
                        {modo === 'adicionar' ? (
<form onSubmit={adicionarNovoJogo} className="form-dashboard">
    <div className="cabecalho-form">
        <h2>Novo Jogo</h2>
        <p className="subtitulo-form">Adicione um novo título ao catálogo da biblioteca.</p>
    </div>

    <div className="input-group">
        <input type="text" name="nome" placeholder="Nome do Jogo" value={jogo.nome} onChange={handleChange} required />
    </div>

    <div className="input-group">
        {/* Usando um Select real para Categoria! */}
        <select name="categoria" value={jogo.categoria} onChange={handleChange} >
            <option value="" disabled>Selecione a Categoria...</option>
            <option value="Action RPG">Action RPG</option>
            <option value="Souls-like">Souls-like</option>
            <option value="Ação / Aventura">Ação / Aventura</option>
            <option value="Mundo Aberto">Mundo Aberto</option>
            <option value="FPS">FPS</option>
        </select>
    </div>

    <div className="input-group">
        <input type="number" name="ano" placeholder="Ano de Lançamento" value={jogo.ano} onChange={handleChange} required />
    </div>

    <div className="input-group">
        <textarea name="descricao" placeholder="Descrição do jogo..." value={jogo.descricao} onChange={handleChange} required />
    </div>

    <div className="input-group">
        <input type="url" name="capa_url" placeholder="URL da Imagem de Capa" value={jogo.capa_url} onChange={handleChange} required />
    </div>

    <button type="submit" className="btn-confirmar">Salvar Jogo</button>
</form>
                        ) : (
                            <form onSubmit={deletarJogo} className="form-dashboard">
                                <h2>Remover Jogo</h2>
                                <p className="subtitulo">Digite o nome exato para deletar do banco.</p>
                                <input 
                                    type="text" 
                                    placeholder="Nome do jogo..." 
                                    value={nomeParaDeletar} 
                                    onChange={(e) => setNomeParaDeletar(e.target.value)} 
                                    required 
                                />
                                <button type="submit" className="btn-confirmar btn-danger">Confirmar Exclusão</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddJogos;