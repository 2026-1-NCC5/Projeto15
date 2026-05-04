// CORRETO
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const AdminPainel = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <h1>Painel Administrativo</h1>
      <p>Bem-vindo, Administrador!</p>
      <button onClick={handleLogout} style={styles.button}>Sair</button>
    </div>
  );
};

const styles = {
  container: {
    padding: '32px',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh'
  },
  button: {
    backgroundColor: '#d32f2f',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px'
  }
};

export default AdminPainel;