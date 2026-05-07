import { useState, useEffect } from 'react';
import "./form.css"
import { Mail, Eye, EyeOff, User } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';



// useState para conversar com o banco e tipação
export function Login(){
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [nome,  setNome ] = useState('');
    const [email, setEmail] = useState('');
    const[senha, setSenha] = useState ('');
    const [modoLogin, setmodoLogin] = useState(true);
    const [mostrarSenha, setMostrarSenha] = useState<boolean>(false)
    
    // Recuperar rota anterior e jogoId
    const navigate = useNavigate();
    const location = useLocation();
    const rotaAnterior = location.state?.from || "/jogos";
    const abrirJogoId = location.state?.abrirJogoId;

    
    const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        const emailverificação =  /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        if(!emailverificação.test(email)){
            alert("Por favor, insira um e-mail válido (exemplo: nome@dominio.com)")
            return
        }
        if (!email || !senha || (!modoLogin && !nome)){
            alert("Preencha todos os campos");
            return
        }
        if (!modoLogin && senha !== confirmarSenha){
            alert("As senhas não coincidem")
            return
        }

        try {
            // Define a rota baseada no modo
            const rota = modoLogin ? '/auth/login' : '/auth/criar_conta';
            const corpo = modoLogin ? { email, senha} : { nome, email, senha};

            const response = await api.post(rota, corpo);

            // acess token salva independentemente do login ou cadastro
            if(response.data.access_token){
                localStorage.setItem('token', response.data.access_token);
                // verifica se é admin
                localStorage.setItem('user_admin', String(response.data.admin));
                localStorage.setItem('nome', String(response.data.nome))
                
                // Redirecionar inteligentemente com state preservado
                navigate(rotaAnterior, { 
                  replace: true, 
                  state: { abrirJogoId } 
                });
            } else {
                if (!modoLogin){
                    setmodoLogin(true);
                    alert("Conta criada com sucesso! Faça seu login")
                }
            }
            // tratamento de erros 
    } catch (error: unknown) {
        if (axios.isAxiosError(error))
        if (error.response) {
            // Se o status for 400 (E-mail já existe)
            if (error.response.status === 400) {
                alert(error.response.data.detail); 
            } 
            // Se for 422 (Erro de validação ou campos faltando)
            else if (error.response.status === 422) {
                alert("Erro de validação: Verifique os campos ou o formato do e-mail.");
                console.log("Detalhes 422:", error.response.data.detail);
            }
            // erros de servidor / outros
            else {
                alert("Erro no servidor: " + (error.response.data.detail || "Erro desconhecido"));
            }
        } else {
            console.error("Erro na operação", error);
            alert("Não foi possível conectar ao servidor.");
        }
    }

    };
    useEffect(() => {
        document.title = modoLogin ? "Login" : "Cadastro";
    },[modoLogin]);
    
     return(
                    <div className='container'>
                        <div className='quadrado-branco'>
                            <AnimatePresence mode='wait'>
                                <motion.div key={modoLogin ? "login" : "cadastro"} 
                        initial={{ opacity: 0, x: 20 }}      
                        animate={{ opacity: 1, x: 0 }}       
                        exit={{ opacity: 0, x: -20 }}         
                        transition={{ duration: 0.3 }}>
                                    <h2>{modoLogin ? "Login" : "Criar Conta"}</h2>
                       <form onSubmit={handleSubmit}>
                        {!modoLogin && (
                        <div className='input-group'>
                            <label>Nome</label>
                            <div className='iconeEmailDiv'>
                                <User className='iconeEmail' size={20}/>
                                <input
                                    type="text"
                                    placeholder='Seu nome'
                                    onChange={(e) => setNome(e.target.value)}
                                    value={nome}/>
                            </div>
                        </div>
                    )}
                    <div className='input-group'>
                                    <label>Email</label>
                                    <div className='iconeEmailDiv'>  
                                        <Mail className='iconeEmail' size={20}/>
                                        <input type="text" id='email' placeholder='Digite seu e-mail'
                                        onChange={(e) => setEmail(e.target.value)} value={email}/>
                                    </div>
                                    </div>

                                    <div className='input-group'>
                                        <label>Senha</label>
                                        <div className='mostrarSenhaDiv'>
                                        <input type={mostrarSenha ? "text" : "password"} id='senha' placeholder= 'Digite sua senha' onChange={(e) => setSenha(e.target.value)} value={senha} maxLength={72}/>

                                        <button type='button' className='mostrarSenha'
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                        >
                                        {mostrarSenha ? <EyeOff size={20}/>: <Eye size={20}/>}
                                        </button>
                                        </div>
                                    </div>
                                    {!modoLogin && (
                                        <div className='input-group'>
                                            <label>Confirme sua Senha</label>
                                            <div className='mostrarSenhaDiv'>
                                                <input type={ mostrarSenha ? "text" : "password"} placeholder='Repita sua senha' onChange={(e) => setConfirmarSenha(e.target.value)}value={confirmarSenha} maxLength={72}/>

                                            </div>
                                        </div>
                                    ) }

                                    <button type='submit'>{modoLogin ? "Entrar": "Cadastrar"}</button>

                            <p className='CadastrarDiv'>
                                <span className='Cadastrarspan' onClick={() => setmodoLogin(!modoLogin)}>
                                    {modoLogin ? "Não tem conta? ": "Já possui uma conta?"}
                                </span>
                                </p>

                            </form>
                            </motion.div>
                        </AnimatePresence>
                    </div>
            </div>
   );
}    

export default Login