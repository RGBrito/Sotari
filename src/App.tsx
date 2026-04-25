import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Features from './pages/Features';
import Matrix from './pages/Matrix';
import RankedList from './pages/RankedList';
import Roadmap from './pages/Roadmap';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="features" element={<Features />} />
          <Route path="matrix" element={<Matrix />} />
          <Route path="ranked" element={<RankedList />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
