import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'aluno',
    equipe: ''  // NOVO CAMPO
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const resetToLogin = () => {
    setLoading(false);
    setMessage({ text: '', type: '' });
    setShowResetPassword(false);
    setShowCreateAccount(false);
    setEmail('');
    setPassword('');
    setResetEmail('');
    setNewAccount({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'aluno',
      equipe: ''
    });
  };

  // Função para normalizar o cargo (aceita "Admin", "admin", "administrador")
  const normalizarCargo = (cargo) => {
    if (!cargo) return 'aluno';
    const cargoLower = cargo.toLowerCase();
    
    if (cargoLower === 'admin' || cargoLower === 'administrador') {
      return 'administrador';
    }
    
    return 'aluno';
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const cargoOriginal = userData.cargo;
        
        // NORMALIZA O CARGO (converte "Admin" para "administrador")
        const cargoNormalizado = normalizarCargo(cargoOriginal);
        
        localStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          nome: userData.nome,
          cargo: cargoNormalizado,  // Salva o cargo já normalizado
          equipe: userData.equipe || ''
        }));
        
        setLoading(false);
        
        // Redireciona baseado no cargo normalizado
        if (cargoNormalizado === 'administrador') {
          navigate('/admin');
        } else {
          navigate('/aluno');
        }
      } else {
        setLoading(false);
        setMessage({ text: "Usuário não encontrado no banco de dados.", type: 'error' });
      }
    } catch (error) {
      setLoading(false);
      console.error("Erro no login:", error);
      
      let errorMsg = "";
      if (error.code === 'auth/invalid-credential') {
        errorMsg = "Email ou senha inválidos";
      } else if (error.code === 'auth/user-not-found') {
        errorMsg = "Usuário não encontrado";
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = "Senha incorreta";
      } else {
        errorMsg = error.message;
      }
      setMessage({ text: errorMsg, type: 'error' });
    }
  };

  // RECUPERAR SENHA
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setLoading(false);
      setMessage({ 
        text: "Email de recuperação enviado! Verifique sua caixa de entrada.", 
        type: 'success' 
      });
      setTimeout(() => {
        resetToLogin();
      }, 3000);
    } catch (error) {
      setLoading(false);
      setMessage({ text: "Erro: " + error.message, type: 'error' });
    }
  };

  // CRIAR CONTA
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    // Validações
    if (newAccount.password !== newAccount.confirmPassword) {
      setMessage({ text: "As senhas não coincidem", type: 'error' });
      setLoading(false);
      return;
    }
    
    if (newAccount.password.length < 6) {
      setMessage({ text: "A senha deve ter pelo menos 6 caracteres", type: 'error' });
      setLoading(false);
      return;
    }
    
    // Se for aluno, precisa selecionar a equipe
    if (newAccount.role === 'aluno' && !newAccount.equipe) {
      setMessage({ text: "Selecione sua equipe", type: 'error' });
      setLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newAccount.email, 
        newAccount.password
      );
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: newAccount.name });
      
      // Define o cargo a ser salvo no banco
      // Se for aluno, salva como "aluno"; se for admin, salva como "Admin" (para compatibilidade com app)
      let cargoParaSalvar;
      if (newAccount.role === 'administrador') {
        cargoParaSalvar = 'Admin';  // Salva como "Admin" para ser consistente com o app
      } else {
        cargoParaSalvar = 'aluno';
      }
      
      await setDoc(doc(db, "users", user.uid), {
        cargo: cargoParaSalvar,
        email: newAccount.email,
        equipe: newAccount.role === 'aluno' ? newAccount.equipe : '',
        nome: newAccount.name,
        uid: user.uid,
        createdAt: new Date().toISOString()
      });
      
      setLoading(false);
      setMessage({ 
        text: "Conta criada com sucesso! Agora faça login.", 
        type: 'success' 
      });
      
      setTimeout(() => {
        resetToLogin();
      }, 2000);
      
    } catch (error) {
      setLoading(false);
      console.error("Erro ao criar conta:", error);
      
      let errorMsg = "";
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = "Este email já está em uso";
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = "Email inválido";
      } else if (error.code === 'auth/weak-password') {
        errorMsg = "Senha muito fraca. Use pelo menos 6 caracteres";
      } else if (error.code === 'permission-denied') {
        errorMsg = "Erro de permissão. Contate o administrador.";
      } else {
        errorMsg = error.message;
      }
      setMessage({ text: errorMsg, type: 'error' });
    }
  };

  // Tela de recuperação de senha
  if (showResetPassword) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <form onSubmit={handleResetPassword} style={styles.form}>
            <h2 style={styles.title}>Recuperar Senha</h2>
            
            {message.text && (
              <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                {message.text}
              </div>
            )}
            
            <div style={styles.inputGroup}>
              <input 
                type="email" 
                placeholder="Digite seu e-mail" 
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)} 
                style={styles.input} 
                required 
              />
            </div>
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Enviando..." : "Enviar email"}
            </button>
            
            <button type="button" onClick={resetToLogin} style={styles.linkButton}>
              Voltar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tela de criar conta
  if (showCreateAccount) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <form onSubmit={handleCreateAccount} style={styles.form}>
            <h2 style={styles.title}>Criar Conta</h2>
            
            {message.text && (
              <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                {message.text}
              </div>
            )}
            
            <div style={styles.inputGroup}>
              <input 
                type="text" 
                placeholder="Nome completo" 
                value={newAccount.name}
                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})} 
                style={styles.input} 
                required 
              />
            </div>
            
            <div style={styles.inputGroup}>
              <input 
                type="email" 
                placeholder="E-mail" 
                value={newAccount.email}
                onChange={(e) => setNewAccount({...newAccount, email: e.target.value})} 
                style={styles.input} 
                required 
              />
            </div>
            
            <div style={styles.inputGroup}>
              <input 
                type="password" 
                placeholder="Senha (mínimo 6 caracteres)" 
                value={newAccount.password}
                onChange={(e) => setNewAccount({...newAccount, password: e.target.value})} 
                style={styles.input} 
                required 
              />
            </div>
            
            <div style={styles.inputGroup}>
              <input 
                type="password" 
                placeholder="Confirmar senha" 
                value={newAccount.confirmPassword}
                onChange={(e) => setNewAccount({...newAccount, confirmPassword: e.target.value})} 
                style={styles.input} 
                required 
              />
            </div>
            
            <div style={styles.inputGroup}>
              <select 
                value={newAccount.role}
                onChange={(e) => setNewAccount({...newAccount, role: e.target.value, equipe: ''})} 
                style={styles.input}
              >
                <option value="aluno">Aluno</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            
            {/* Campo de equipe - aparece APENAS para alunos */}
            {newAccount.role === 'aluno' && (
              <div style={styles.inputGroup}>
                <select 
                  value={newAccount.equipe}
                  onChange={(e) => setNewAccount({...newAccount, equipe: e.target.value})} 
                  style={styles.input}
                  required
                >
                  <option value="">Selecione sua equipe</option>
                  <option value="Equipe 1">Equipe 1</option>
                  <option value="Equipe 2">Equipe 2</option>
                  <option value="Equipe 3">Equipe 3</option>
                </select>
              </div>
            )}
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Criando..." : "Criar conta"}
            </button>
            
            <button type="button" onClick={resetToLogin} style={styles.linkButton}>
              Voltar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tela de login principal
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <form onSubmit={handleLogin} style={styles.form}>
          <h3 style={styles.subtitle}>Bem-Vindo(a)!</h3>
          
          {message.text && (
            <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
              {message.text}
            </div>
          )}
          
          <div style={styles.inputGroup}>
            <input 
              type="email" 
              placeholder="E-mail" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              style={styles.input} 
              required 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <input 
              type="password" 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input} 
              required 
            />
          </div>
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          
          <div style={styles.linksContainer}>
            <button 
              type="button" 
              onClick={() => {
                setShowResetPassword(true);
                setMessage({ text: '', type: '' });
              }} 
              style={styles.linkButton}
            >
              Esqueci minha senha
            </button>
            <span style={styles.divider}>|</span>
            <button 
              type="button" 
              onClick={() => {
                setShowCreateAccount(true);
                setMessage({ text: '', type: '' });
              }} 
              style={styles.linkButton}
            >
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#b9fab9',
    margin: 0,
    padding: '20px',
    boxSizing: 'border-box'
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    borderRadius: '70px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden'
  },
  form: {
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    boxSizing: 'border-box'
  },
  title: {
    textAlign: 'center',
    marginBottom: '25px',
    color: '#1f711b',
    fontSize: '22px',
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: '20px',
    width: '100%'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #adadad',
    borderRadius: '70px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007041',
    color: '#fff',
    border: 'none',
    borderRadius: '70px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  },
  subtitle: {
    textAlign: 'center',
    marginTop: '6px',
    marginBottom: '29px',
    color: '#104a1d',
    fontSize: '22px',
    fontWeight: '600'
  },
  linksContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#007041',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 12px'
  },
  divider: {
    color: '#ccc',
    fontSize: '14px'
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center'
  },
  successMessage: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center'
  }
};

export default Login;