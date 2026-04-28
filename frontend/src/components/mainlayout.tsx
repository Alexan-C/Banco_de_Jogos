import { NavLink, Link} from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import './mainlayout.css'
import React, { useState } from 'react';
import { User, Crown } from 'lucide-react';

export const MainLayout: React.FC = () =>{

    // !! = se tiver token está logado (True ou seja logado ) se não retornar é falso (Não logado)
    const  estaLogado = !!localStorage.getItem('token')

    //Subseção 
    const [menuAberto, setMenuAberto] = useState(false)
      // admin verificação 
      const adminSalvo = localStorage.getItem('user_admin');
      const eAdmin = estaLogado && adminSalvo === 'true';
    

    const handleSair = () => {
        localStorage.removeItem('token') // remove o token
        localStorage.removeItem('user_role')
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
          {eAdmin && (
                          <NavLink to={"/admin/adicionar"} className={({isActive})=> isActive ? 'nav-item ativo  btn-admin' : 'nav-item  btn-admin'} >
                             Adicionar Jogos/Remover
                         </NavLink>
                    )}
                 </div>
        {estaLogado ? (
          <div className="usuario-container">
            <button 
              className="btn-usuario" 
              onClick={() => setMenuAberto(!menuAberto)}
            >
            {eAdmin && <Crown className={`icone-coroa-topo ${menuAberto ? 'animar-coroa' : ''}`} size={10} 
/>}

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