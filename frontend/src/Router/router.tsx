import {Route, Routes, BrowserRouter, Navigate, useLocation} from "react-router-dom"
import Home from "../pages/Home"
import Form  from "../pages/form.tsx"
import MainLayout from "../components/mainlayout.tsx"
import Biblioteca from "../pages/biblioteca.tsx"
import "./router.css"

// está logado //



function AnimationRoutes(){
  const  estaLogado = !!localStorage.getItem('token')
  const  location = useLocation()
    return(
          <div key={location.pathname} className="animacao-suave">
          <Routes location={location}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="minha_biblioteca" element = {estaLogado ?  <Biblioteca /> : <Navigate to ="/login" replace />} />
              <Route path="perfil" element={<div>Página de Perfil em breve</div>} />
            </Route>
            <Route path="/login" element = {<Form/>}/>
          </Routes>
          </div>
    )
}
function Router(){
  return(
    <BrowserRouter>
    <AnimationRoutes/>
    </BrowserRouter>
  )
}

export default Router