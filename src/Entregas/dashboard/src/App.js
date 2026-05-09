import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './ProtectedRoute';
import AlunoPainel from './pages/AlunoPainel';
import AdminPainel from './pages/AdminPainel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPainel />
          </ProtectedRoute>
        } />
        <Route path="/aluno" element={
          <ProtectedRoute>
            <AlunoPainel />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;