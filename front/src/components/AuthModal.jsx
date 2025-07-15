import React, { useState } from 'react';
import { Modal, Fade, Box, Tabs, Tab, TextField, Alert, Button, CircularProgress } from '@mui/material';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';

const API_URL = import.meta.env.VITE_API_BASE_URL + '/api';

function AuthModal({ open, handleClose, onAuthSuccess }) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleTabChange = (_, newValue) => { setTab(newValue); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 0 ? '/login' : '/register';
      let body;
      if (tab === 0) {
        // Login: only email and password
        body = JSON.stringify({ email: form.email, password: form.password });
      } else {
        // Register: username, email, password
        body = JSON.stringify({ username: form.username, email: form.email, password: form.password });
      }
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Ошибка авторизации');
      }
      let data = await res.json();
      // Если мы сейчас регистрировались и сервер не вернул access_token, пробуем авторизоваться сразу же
      if (!data.access_token && tab === 1) {
        const loginRes = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        if (loginRes.ok) {
          data = await loginRes.json();
        }
      }
      if (data.access_token) {
        // Очистим старые токены и сохраним новый в двух хранилищах
        try {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        localStorage.setItem('token', data.access_token);
        } catch (_) {}
        sessionStorage.setItem('token', data.access_token);
      }
      onAuthSuccess();
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} closeAfterTransition>
      <Fade in={open}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', width: 370,
          bgcolor: 'rgba(255,255,255,0.85)', boxShadow: 24, borderRadius: 4, p: 4,
          backdropFilter: 'blur(12px)'
        }}>
          <Tabs value={tab} onChange={handleTabChange} centered>
            <Tab label="Вход" />
            <Tab label="Регистрация" />
          </Tabs>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {tab === 1 && (
              <TextField
                label="Имя пользователя"
                name="username"
                type="text"
                fullWidth
                margin="normal"
                value={form.username}
                onChange={handleChange}
                required
              />
            )}
            <TextField
              label="Email" name="email" type="email" fullWidth margin="normal"
              value={form.email} onChange={handleChange} required
            />
            <TextField
              label="Пароль" name="password" type="password" fullWidth margin="normal"
              value={form.password} onChange={handleChange} required
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button
              type="submit" variant="contained" fullWidth
              sx={{
                mt: 2, borderRadius: 2, fontWeight: 700,
                background: 'linear-gradient(90deg, #42a5f5 0%, #478ed1 100%)',
                boxShadow: '0 2px 16px 0 rgba(66,165,245,0.10)',
                textTransform: 'none',
                fontSize: 18
              }}
              disabled={loading}
              startIcon={loading && <CircularProgress size={18} />}
            >
              {tab === 0 ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

export default AuthModal; 