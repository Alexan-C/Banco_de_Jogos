import { useState } from 'react';
import api from '../services/api';

export function Login(){
    const [email, setEmail] = useState('')
    const[senha, setSenha] = useState('')

    const fazerLogin = async () => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      alert("Sucesso!")
      localStorage.setItem('token', response.data.access_token);
     } catch {
      console.error("Erro no login");
     }
};
return (
    <div>
      <input 
        type="email" 
        placeholder="E-mail" 
        onChange={(e) => setEmail(e.target.value)} // Atualiza o estado
      />
      <input 
        type="password" 
        placeholder="Senha" 
        onChange={(e) => setSenha(e.target.value)} // Atualiza o estado
      />
      
      <button onClick={fazerLogin}>Entrar</button>
    </div>
  );
}

export default Login;
