import "./Home.css"

import {Navbar} from "../components/Navbar"


export function Home() {

    return(
        <div className="container-home">
            <Navbar/>
            <main className="content-home">
                <header className="secao-home">
                    <h1>Bem vindo a sua Biblioteca Digital</h1>
                    <p>Organize seus jogos, descubra novos títulos e gerencie sua coleção</p>
                </header>
            </main>
        </div>
    )


}

export default Home