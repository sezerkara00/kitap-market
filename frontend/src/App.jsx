import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import Home from './components/Home';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import MyBooks from './components/MyBooks';
import Cart from './components/Cart';
import Orders from './components/Orders';
import Profile from './components/Profile';
import axios from './utils/axiosConfig';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected Route bileşeni
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <GoogleOAuthProvider clientId="790404761945-jsoqpoadlcv6ilhrt63vgmi0eu6aq5si.apps.googleusercontent.com">
      <ThemeProvider theme={theme}>
        <Router>
          <div>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/books" element={<BookList />} />
              <Route path="/book/:title/:id" element={<BookDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              <Route path="/my-books" element={<ProtectedRoute><MyBooks /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App; 