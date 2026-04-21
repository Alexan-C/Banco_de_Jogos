import { useNavigate, Link } from 'react-router-dom';
import './Navbar.css'
import { useState } from 'react';


export function Navbar(){

    const navigate = useNavigate();

    // !! = se tiver token está logado (True ou seja logado ) se não retornar é falso (Não logado)
    const  estaLogado = !!localStorage.getItem('token')

    //Subseção 
    const [menuAberto, setMenuAberto] = useState(false)


    const handleSair = () => {
        localStorage.removeItem('token') // remove o token
        setMenuAberto(false)
        navigate('/')

    };
return (
    <nav className="navbar">
      <div className="logo">Minha Biblioteca</div>

      <div className="links-container">
        <Link to="/" className="nav-link">Início</Link>

        {estaLogado ? (
          <div className="usuario-container">
            <button 
              className="btn-usuario" 
              onClick={() => setMenuAberto(!menuAberto)}
            >
              Usuário <span>{menuAberto ? '▴' : '▾'}</span>
            </button>

            {menuAberto && (
              <div className="setaBaixo-menu">
                <Link to="/perfil" className="setaBaixo-item" onClick={() => setMenuAberto(false)}>
                  Meu Perfil
                </Link>
                <Link to="/biblioteca" className="setaBaixo-item" onClick={() => setMenuAberto(false)}>
                  Ver Biblioteca
                </Link>
                <button onClick={handleSair} className="setaBaixo-item btn-sair">
                  Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="nav-link btn-login">Entrar</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar