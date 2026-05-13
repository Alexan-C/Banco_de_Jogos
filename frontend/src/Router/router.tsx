import {Route, Routes, BrowserRouter, Navigate, useLocation} from "react-router-dom"
import Home from "../pages/Home/Home.tsx"
import Form  from "../pages/Login/form.tsx"
import MainLayout from "../components/Navbar/mainlayout.tsx"
import Biblioteca from "../pages/Biblioteca/Biblioteca.tsx"
import Jogos from "../pages/Jogos/Jogos.tsx"
import "./router.css"
import Addjogos from "../admin/AddJogos.tsx"

// está logado //

function AnimationRoutes() {
  const estaLogado = !!localStorage.getItem('token');
  const adminSalvo = localStorage.getItem('user_admin');
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="minha_biblioteca" element={estaLogado ? <Biblioteca /> : <Navigate to="/login" replace />} />
        <Route path="jogos" element={<Jogos/>} />
        <Route path="admin/adicionar" element={estaLogado && adminSalvo ? <Addjogos /> : <Navigate to="/login" replace />} />
      </Route>
      <Route path="/login" element={<Form />} />
    </Routes>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <AnimationRoutes />
    </BrowserRouter>
  );
}

