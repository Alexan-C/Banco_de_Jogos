import {Route, Routes, BrowserRouter} from "react-router-dom"

import Home from "../pages/Home"
import Form  from "../pages/form.tsx"


function Router(){
    return(
        <BrowserRouter>
          <Routes>
            <Route path="/" element = {<Home/>}/>
            <Route path="/cadastro" element = {<Form/>}/>
          </Routes>
        </BrowserRouter>
    )
}
export default Router