import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './components/Home';
import BookList from './components/BookList';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import MyBooks from './components/MyBooks';
import Cart from './components/Cart';
import Orders from './components/Orders';
import { useEffect } from 'react';

// Protected Route bileşeni
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<BookList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              {localStorage.getItem('user') && 
               JSON.parse(localStorage.getItem('user')).role === 'admin' ? 
               <AdminPanel /> : 
               <Navigate to="/" />}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/my-books" 
          element={
            <ProtectedRoute>
              <MyBooks />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/cart" 
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 