import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Modal, TextField, Tabs, Tab,
  Container, Alert, CircularProgress, Paper, Stack, Fade, Link, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import EmojiEmotionsRoundedIcon from '@mui/icons-material/EmojiEmotionsRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import MenuIcon from '@mui/icons-material/Menu';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import axios from 'axios';
import AuthModal from './components/AuthModal';
import HeroIllustration from './components/HeroIllustration';
import UploadExcelForm from './components/UploadExcelForm';
import ProfileEditForm from './components/ProfileEditForm';
import ManualCrmPage from './components/ManualCrmPage';
import DonorProfilePage from './components/DonorProfilePage';
import MainPage from './components/MainPage';

const API_URL = 'http://localhost:8000/api';

function Landing() {
  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(120deg, #e0eafc 0%, #b6e0fe 100%)',
      pt: { xs: 10, md: 14 },
      pb: 8,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowX: 'hidden',
    }}>
      <Container maxWidth="md">
        {/* Hero Section */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          mb: 10,
        }}>
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h2" fontWeight={900} sx={{
              mb: 2, letterSpacing: -2, color: '#2563eb', fontSize: { xs: 36, md: 54 }, lineHeight: 1.1
            }}>
              DonorFlow
            </Typography>
            <Typography variant="h5" sx={{ mb: 3, color: '#2563eb', fontWeight: 400 }}>
              Современное B2B-решение для автоматизации и управления всеми процессами донорства в рамках одного бизнеса.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: 20, color: '#222', mb: 3 }}>
              Система позволяет вести учет донатов, анализировать поступления, формировать отчеты и обеспечивает высокий уровень безопасности данных.
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                px: 5, py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 20,
                background: 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)',
                boxShadow: '0 4px 24px 0 rgba(66,165,245,0.15)',
                textTransform: 'none',
              }}
            >
              Начать работу с DonorFlow
            </Button>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <HeroIllustration />
          </Box>
        </Box>
        {/* Benefits Section */}
        <Box id="benefits" sx={{ mb: 10 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center">
            <Paper elevation={2} sx={{
              p: 4, borderRadius: 4, minWidth: 220, textAlign: 'center',
              background: '#fff', color: '#222',
              boxShadow: '0 2px 16px 0 rgba(66,165,245,0.08)',
              transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-8px) scale(1.04)' }
            }}>
              <EmojiEventsRoundedIcon sx={{ fontSize: 48, color: '#4f8cff', mb: 1 }} />
              <Typography fontWeight={700} sx={{ mb: 1 }}>Автоматизация</Typography>
              <Typography color="#2563eb">Все процессы донорства в одной системе</Typography>
            </Paper>
            <Paper elevation={2} sx={{
              p: 4, borderRadius: 4, minWidth: 220, textAlign: 'center',
              background: '#fff', color: '#222',
              boxShadow: '0 2px 16px 0 rgba(66,165,245,0.08)',
              transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-8px) scale(1.04)' }
            }}>
              <InsightsRoundedIcon sx={{ fontSize: 48, color: '#4f8cff', mb: 1 }} />
              <Typography fontWeight={700} sx={{ mb: 1 }}>Аналитика</Typography>
              <Typography color="#2563eb">Глубокий анализ и отчеты</Typography>
            </Paper>
            <Paper elevation={2} sx={{
              p: 4, borderRadius: 4, minWidth: 220, textAlign: 'center',
              background: '#fff', color: '#222',
              boxShadow: '0 2px 16px 0 rgba(66,165,245,0.08)',
              transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-8px) scale(1.04)' }
            }}>
              <SecurityRoundedIcon sx={{ fontSize: 48, color: '#4f8cff', mb: 1 }} />
              <Typography fontWeight={700} sx={{ mb: 1 }}>Безопасность</Typography>
              <Typography color="#2563eb">Надежное хранение и защита данных</Typography>
            </Paper>
          </Stack>
        </Box>
        {/* Footer */}
        <Box sx={{ mt: 10, pt: 6, borderTop: '1px solid #e3e3e3', textAlign: 'center', color: '#888' }}>
          <Typography variant="body2">
            © 2024 DonorFlow. Все права защищены. | info@donorflow.ru
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

// CRM Table component
function CrmTable({ refresh, onProfile }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [donorType, setDonorType] = useState('');
  const allYears = Array.from({length: 2030-2019+1}, (_,i) => String(2019+i));
  const monthsList = [
    '', 'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
  ];
  const donorTypes = [
    { value: '', label: 'Все типы' },
    { value: 'single', label: 'Разовый' },
    { value: 'periodic', label: 'Периодический' },
    { value: 'frequent', label: 'Частый' },
  ];

  React.useEffect(() => {
    setLoading(true);
    setError('');
    let url = 'http://localhost:8000/api/crm';
    if (donorType) {
      url = `http://localhost:8000/api/crm/donator_type?type=${donorType}`;
    } else if (year || month) {
      const params = [];
      if (year) params.push(`year=${year}`);
      if (month) params.push(`month=${encodeURIComponent(month)}`);
      url = `http://localhost:8000/api/crm/filter?${params.join('&')}`;
    }
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки данных CRM');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [refresh, year, month, donorType]);

  if (loading) return <Typography>Загрузка...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!Array.isArray(data) || data.length === 0) return <Typography>Нет данных CRM.</Typography>;

  // Get all unique columns from data
  const columns = Array.from(
    data.reduce((cols, row) => {
      Object.keys(row).forEach(key => cols.add(key));
      return cols;
    }, new Set())
  );

  // Filtered and paginated data
  const filtered = data.filter(row =>
    columns.some(col => String(row[col] || '').toLowerCase().includes(search.toLowerCase()))
  );
  const pageCount = Math.ceil(filtered.length / rowsPerPage);
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Helper for status chip
  const renderCell = (col, value, row) => {
    if (col.toLowerCase().includes('отправитель')) {
      return <Button variant="text" sx={{ color: '#2563eb', textTransform: 'none', fontWeight: 700, p: 0 }} onClick={() => onProfile && onProfile(value)}>{value}</Button>;
    }
    if (col.toLowerCase().includes('status')) {
      let color = 'default';
      if (String(value).toLowerCase().includes('active')) color = 'success';
      if (String(value).toLowerCase().includes('inactive')) color = 'error';
      return <span style={{
        display: 'inline-block',
        padding: '2px 14px',
        borderRadius: 16,
        fontWeight: 600,
        fontSize: 14,
        background: color === 'success' ? '#d1fae5' : color === 'error' ? '#fee2e2' : '#e0eafc',
        color: color === 'success' ? '#059669' : color === 'error' ? '#b91c1c' : '#2563eb',
      }}>{value}</span>;
    }
    return value;
  };

  return (
    <Box sx={{
      mt: 0,
      background: '#fff',
      borderRadius: 6,
      boxShadow: '0 8px 40px 0 rgba(66,165,245,0.13)',
      border: '2px solid #e0eafc',
      p: 4,
      minWidth: 900,
      maxWidth: '100%',
      mx: 'auto',
      position: 'relative',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#2563eb' }}>Все записи</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Поиск..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            sx={{ minWidth: 180, background: '#f4f8ff', borderRadius: 2 }}
          />
          <FormControl size="small" sx={{ minWidth: 160, background: '#f4f8ff', borderRadius: 2 }}>
            <InputLabel>Тип донора</InputLabel>
            <Select value={donorType} label="Тип донора" onChange={e => { setDonorType(e.target.value); setPage(1); }}>
              {donorTypes.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120, background: '#f4f8ff', borderRadius: 2 }}>
            <InputLabel>Год</InputLabel>
            <Select value={year} label="Год" onChange={e => { setYear(e.target.value); setPage(1); }}>
              <MenuItem value="">Все</MenuItem>
              {allYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140, background: '#f4f8ff', borderRadius: 2 }}>
            <InputLabel>Месяц</InputLabel>
            <Select value={month} label="Месяц" onChange={e => { setMonth(e.target.value); setPage(1); }}>
              {monthsList.map(m => <MenuItem key={m} value={m}>{m ? m[0].toUpperCase() + m.slice(1) : 'Все'}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} style={{
                  padding: '14px 10px',
                  background: '#f4f8ff',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: 15,
                  borderBottom: '2px solid #b6e0fe',
                  textAlign: 'left',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid #e3e3e3',
                background: i % 2 === 0 ? '#fff' : '#f9fbff',
                transition: 'background 0.2s',
                cursor: 'pointer',
                ':hover': { background: '#e0eafc' }
              }}>
                {columns.map(col => (
                  <td key={col} style={{
                    padding: '12px 10px',
                    color: '#222',
                    fontSize: 15,
                    borderBottom: '1px solid #f0f0f0',
                    maxWidth: 220,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>{renderCell(col, row[col], row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 3, gap: 1 }}>
        <Button size="small" disabled={page === 1} onClick={() => setPage(page - 1)}>&lt;</Button>
        {[...Array(pageCount).keys()].slice(Math.max(0, page-2), Math.min(pageCount, page+1)).map(i => (
          <Button
            key={i+1}
            size="small"
            variant={page === i+1 ? 'contained' : 'outlined'}
            sx={{ minWidth: 32 }}
            onClick={() => setPage(i+1)}
          >
            {i+1}
          </Button>
        ))}
        <Button size="small" disabled={page === pageCount || pageCount === 0} onClick={() => setPage(page + 1)}>&gt;</Button>
      </Box>
      <Typography variant="body2" sx={{ color: '#888', mt: 2 }}>
        Показано {filtered.length === 0 ? 0 : (page-1)*rowsPerPage+1}–{Math.min(page*rowsPerPage, filtered.length)} из {filtered.length} записей
      </Typography>
    </Box>
  );
}

function App() {
  const [auth, setAuth] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState('admin');
  useEffect(() => {
    if (auth) setPage('admin');
  }, [auth]);
  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: '#fff',
          color: '#2563eb',
          boxShadow: '0 2px 16px 0 rgba(66,165,245,0.10)',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <BusinessCenterRoundedIcon sx={{ color: '#2563eb', fontSize: 32, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 900, letterSpacing: 1 }}>
            DonorFlow
          </Typography>
          {/* Only login/registration or logout button on the right */}
          {!auth && (
            <Button
              color="primary"
              variant="outlined"
              sx={{
                borderColor: '#2563eb',
                color: '#2563eb',
                borderRadius: 2,
                fontWeight: 700,
                px: 3,
                ml: 2,
                '&:hover': { background: 'rgba(37,99,235,0.08)' },
                textTransform: 'none'
              }}
              startIcon={<LoginRoundedIcon />}
              onClick={() => setModalOpen(true)}
            >
              Вход / Регистрация
            </Button>
          )}
          {auth && (
            <Button
              color="primary"
              variant="outlined"
              sx={{
                borderColor: '#2563eb',
                color: '#2563eb',
                borderRadius: 2,
                fontWeight: 700,
                px: 3,
                ml: 2,
                '&:hover': { background: 'rgba(37,99,235,0.08)' },
                textTransform: 'none'
              }}
              onClick={() => {
                try {
                  localStorage.removeItem('token');
                } catch (_) {}
                sessionStorage.removeItem('token');
                setAuth(false);
              }}
            >
              Выйти
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <AuthModal open={modalOpen} handleClose={() => setModalOpen(false)} onAuthSuccess={() => setAuth(true)} />
      {auth ? <MainPage pageOverride={page} /> : <Landing />}
    </>
  );
}

export default App; 