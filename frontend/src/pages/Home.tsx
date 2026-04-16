import "./Home.css"
// import {useState } from 'react'
import { Link } from "react-router-dom";



function Home() {

    return(
        <>
        <div className="Título">
        <h1>Hello World</h1>
        <Link to= "/cadastro">Cadastrar Cliente</Link>
        </div>
        </>
    )


}

export default Home