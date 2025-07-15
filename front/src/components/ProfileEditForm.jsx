// components/ProfileEditForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Alert, Avatar, Typography, Paper,
  Divider, Grid
} from '@mui/material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function ProfileEditForm() {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    city: '',
    address: '',
    profile_photo_url: '',
    file: null,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');


  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const res = await axios.get(`${API_BASE}/api/me/profile`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      setForm(f => ({ ...f, ...res.data }));
    } catch (err) {
      console.error('Ошибка получения профиля');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === 'file') setForm(f => ({ ...f, file: files[0] }));
    else setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'file' && v) formData.append('file', v);
        else if (k !== 'file') formData.append(k, v);
      });
      await axios.post(`${API_BASE}/api/me/profile`, formData, {
        headers: { 'Authorization': (sessionStorage.getItem('token') || localStorage.getItem('token')) ? `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` : undefined }
      });
      setSuccess('Профиль успешно обновлён!');
      await fetchProfile();
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = form.profile_photo_url
    ? form.profile_photo_url.startsWith('http')
      ? form.profile_photo_url
      : `${API_BASE}${form.profile_photo_url}`
    : '';

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 4, maxWidth: 700, mx: 'auto', background: '#fdfdfd' }}>
      <Typography variant="h5" fontWeight={700} sx={{ color: '#2563eb', mb: 2 }}>
        Профиль пользователя
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
            <Avatar src={avatarUrl} sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }} />
            <Button variant="outlined" component="label" fullWidth>
              Загрузить фото
              <input type="file" name="file" hidden onChange={handleChange} />
            </Button>
          </Grid>

          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField label="ФИО" name="full_name" value={form.full_name} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Телефон" name="phone" value={form.phone} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Дата рождения" name="birth_date" value={form.birth_date} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Город" name="city" value={form.city} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Адрес" name="address" value={form.address} onChange={handleChange} fullWidth /></Grid>
            </Grid>
          </Grid>

          {success && <Grid item xs={12}><Alert severity="success">{success}</Alert></Grid>}
          {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}

          <Grid item xs={12}>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, fontSize: 18, borderRadius: 2 }} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
