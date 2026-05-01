import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <h1>Painel Administrativo</h1>
          </ProtectedRoute>
        } />
        <Route path="/patrocinador" element={
          <ProtectedRoute>
            <h1>Painel do Patrocinador</h1>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;