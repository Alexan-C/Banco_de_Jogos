import { useState } from 'react';
import "./form.css"
import { Mail, Eye, EyeOff } from 'lucide-react';
import api from '../services/api.ts';



export function Login(){
    const [email, setEmail] = useState('');
    const[senha, setSenha] = useState ('');
    const [mostrarSenha, setMostrarSenha] = useState(false)
    
    const handleLogin = async(e: React.FormEvent) =>{
        e.preventDefault();
        if (!email || !senha){
            alert("Preencha todos os campos");
            return
        }
        try {
                const response = await api.post('/auth/login', {email, senha})
                alert("Sucesso!")
                localStorage.setItem('token', response.data.access_token)
                } catch (error){
                    console.error("Erro no login", error)
                    alert("E-mail ou senha incorretos")
                }
    }
    
    
    
    return(
        <>
            <title>Login</title>
            <div>
                <form onSubmit={handleLogin}>
                    <fieldset>
                        <legend>
                            <div className='container'>
                                <div className='quadrado-branco'>
                                    <label>Email</label>
                                    <div className='iconeEmailDiv'>  
                                        <Mail className='iconeEmail' size={20}/>
                                        <input type="text" id='email' placeholder='Digite seu e-mail' 
                                        onChange={(e) => setEmail(e.target.value)} value={email}/>
                                        </div>
                                    <div>
                                        <label>Senha</label>
                                        <div className='mostrarSenhaDiv'>

                                        <input type={mostrarSenha ? "text" : "password"} id='senha' placeholder= 'Digite sua senha' onChange={(e) => setSenha(e.target.value)} value={senha}/>
                                        <button type='button' className='mostrarSenha'
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                        >
                                            {mostrarSenha ? <EyeOff size={20}/>: <Eye size={20}/>}
                                        </button>
                                        </div>
                                    </div>
                                    <button type='submit'>Entrar</button>
                                </div>
                            </div>
                        </legend>
                    </fieldset>
                </form>
            </div>
            </>
        );
    
}      
    export default Login