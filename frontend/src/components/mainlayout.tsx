import { NavLink, Link} from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import './mainlayout.css'
import React, { useState } from 'react';
import { User } from 'lucide-react';

export const MainLayout: React.FC = () =>{

    // !! = se tiver token está logado (True ou seja logado ) se não retornar é falso (Não logado)
    const  estaLogado = !!localStorage.getItem('token')

    //Subseção 
    const [menuAberto, setMenuAberto] = useState(false)


    const handleSair = () => {
        localStorage.removeItem('token') // remove o token
        setMenuAberto(false)
        window.location.href = '/'

    };
return (
  <div className='container__principal'>
    <nav className="navbar">
      <div className='nav-links-container'>
        <NavLink to={"/"} className={"nav-item"}>Inicio</NavLink>
        <NavLink to="/minha_biblioteca" 
         className={({isActive}) => isActive ? 'nav-item ativo' : 'nav-item'}>Biblioteca
                </NavLink>
          <NavLink to={"/jogos"} className={({isActive})=> isActive ? 'nav-item ativo' : 'nav-item'}>Jogos</NavLink>
                </div>
        {estaLogado ? (
          <div className="usuario-container">
            <button 
              className="btn-usuario" 
              onClick={() => setMenuAberto(!menuAberto)}
            >
              <User className='iconeUser' size={20}/> 
              <span>{menuAberto ? '▴' : '▾'}</span>
              </button>
            

            {menuAberto && (
              <div className="setaBaixo-menu">
                <Link to="/perfil" className="setaBaixo-item" onClick={() => setMenuAberto(false)}>
                  Perfil
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
    </nav>
    <main className='container-principal2'>
      <Outlet/>

    </main>
    
    </div>
  );
}

export default MainLayout;