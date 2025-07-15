import React, { useState, useEffect } from 'react';
import { Container, Button, Box, Typography, Alert, Divider, Grid, Paper, Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent } from '@mui/material';
// import PaidIcon from '@mui/icons-material/Paid'; // Kept commented; we now use CurrencyTengeIcon
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
// CurrencyTengeIcon not available in @mui/icons-material; using Unicode symbol.

function getMonthStats(transactions) {
  const stats = {};
  if (!Array.isArray(transactions)) return stats;
  transactions.forEach(tr => {
    const m = tr["month"] || '—';
    stats[m] = (stats[m] || 0) + (Number(tr["Сумма"]) || 0);
  });
  return stats;
}

function DonorProfilePage2025({ searchKey, by, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${API_BASE}/api/user_analytics_excel_2025?key=${encodeURIComponent(searchKey)}&by=${encodeURIComponent(by)}`)
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки профиля');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [searchKey, by]);

  if (loading) return <Typography>Загрузка...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Typography>Нет данных по донору.</Typography>;

  const { user_info, stats, transactions } = data;
  const monthStats = getMonthStats(transactions);
  const months = Object.keys(monthStats);
  const maxValue = Math.max(...Object.values(monthStats), 1);

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Button variant="outlined" sx={{ mb: 3 }} onClick={onBack}>&larr; Назад к CRM 2025</Button>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 5 }, borderRadius: 5, background: '#fafdff', boxShadow: '0 8px 40px 0 rgba(66,165,245,0.10)' }}>
        {/* Заголовок */}
        <Typography variant="h3" fontWeight={900} sx={{ color: '#2563eb', mb: 1, letterSpacing: 1, textShadow: '0 2px 12px #b6e0fe55' }}>
          {user_info?.ФИО || searchKey}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#6b7280', mb: 3, fontSize: 20 }}>{user_info?.gender ? `Пол: ${user_info.gender}` : ''}</Typography>
        {/* Карточки статистики */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'linear-gradient(120deg, #e0eafc 0%, #b6e0fe 100%)', borderRadius: 4, boxShadow: '0 2px 12px #b6e0fe33' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <Typography sx={{ color: '#2563eb', fontSize: 36, fontWeight: 800, mb: 1, lineHeight: '36px', transform: 'translateY(-2px)' }}>₸</Typography>
                <Typography variant="h5" fontWeight={800}>{stats?.total_amount ?? '-'}</Typography>
                <Typography variant="body2" color="text.secondary">Сумма</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'linear-gradient(120deg, #e0eafc 0%, #b6e0fe 100%)', borderRadius: 4, boxShadow: '0 2px 12px #b6e0fe33' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <BarChartIcon sx={{ color: '#2563eb', fontSize: 36, mb: 1 }} />
                <Typography variant="h5" fontWeight={800}>{stats?.total_count ?? '-'}</Typography>
                <Typography variant="body2" color="text.secondary">Донатов</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'linear-gradient(120deg, #e0eafc 0%, #b6e0fe 100%)', borderRadius: 4, boxShadow: '0 2px 12px #b6e0fe33' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <Typography sx={{ color: '#2563eb', fontSize: 36, fontWeight: 800, mb: 1, lineHeight: '36px', transform: 'translateY(-2px)' }}>₸</Typography>
                <Typography variant="h5" fontWeight={800}>{stats?.average_amount ?? '-'}</Typography>
                <Typography variant="body2" color="text.secondary">Средний чек</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'linear-gradient(120deg, #e0eafc 0%, #b6e0fe 100%)', borderRadius: 4, boxShadow: '0 2px 12px #b6e0fe33' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <CalendarMonthIcon sx={{ color: '#2563eb', fontSize: 36, mb: 1 }} />
                <Typography variant="h5" fontWeight={800}>{stats?.last_transaction ? stats.last_transaction.split('T')[0] : '-'}</Typography>
                <Typography variant="body2" color="text.secondary">Последний донат</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {/* Мини-график по месяцам */}
        {months.length > 0 && (
          <Box sx={{ mb: 5, mt: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#2563eb', fontSize: 20, letterSpacing: 0.5 }}>
              Активность по месяцам
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 3,
              height: 160,
              bgcolor: '#f4f8ff',
              borderRadius: 4,
              p: 3,
              overflowX: 'auto',
              boxShadow: '0 2px 12px #b6e0fe22',
              minWidth: 340,
            }}>
              {months.map(month => {
                const isMax = monthStats[month] === maxValue && maxValue > 0;
                return (
                  <Box key={month} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48 }}>
                    {/* Значение сверху */}
                    <Typography variant="body2" sx={{ color: isMax ? '#2563eb' : '#222', fontWeight: isMax ? 900 : 500, mb: 0.5, fontSize: 18 }}>{monthStats[month]}</Typography>
                    {/* Бар */}
                    <Box sx={{
                      height: `${100 * (monthStats[month] / maxValue)}px`,
                      width: 30,
                      background: isMax
                        ? 'linear-gradient(180deg, #42a5f5 0%, #2563eb 100%)'
                        : 'linear-gradient(180deg, #b6e0fe 0%, #2563eb 100%)',
                      borderRadius: 3,
                      mb: 1,
                      boxShadow: isMax ? '0 4px 16px #2563eb33' : '0 2px 8px #b6e0fe22',
                      transition: 'height 0.5s cubic-bezier(.4,2,.6,1)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                    }} />
                    {/* Название месяца */}
                    <Typography variant="body2" sx={{ color: isMax ? '#2563eb' : '#888', fontWeight: isMax ? 700 : 500, mt: 0.5, fontSize: 15, letterSpacing: 0.5 }}>
                      {month}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
        <Divider sx={{ my: 4 }} />
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#2563eb' }}>История транзакций</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ borderRadius: 3, overflow: 'hidden', background: '#fff' }}>
            <TableHead>
              <TableRow sx={{ background: '#e0eafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>ФИО</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Месяц</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>E-mail</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Дата</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Сумма</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Идентификатор платежа</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Телефон</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Язык</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Источник</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(transactions) && transactions.length > 0 ? transactions.map((tr, idx) => (
                <TableRow key={tr.id || idx} sx={{ background: idx % 2 === 0 ? '#fafdff' : '#f4f8ff' }}>
                  <TableCell>{tr["ФИО"]}</TableCell>
                  <TableCell>{tr["month"]}</TableCell>
                  <TableCell>{tr["E-mail"]}</TableCell>
                  <TableCell>{tr["Дата"]}</TableCell>
                  <TableCell>{tr["Сумма"]}</TableCell>
                  <TableCell>{tr["Идентификатор платежа"]}</TableCell>
                  <TableCell>{tr["телефон"]}</TableCell>
                  <TableCell>{tr["язык"]}</TableCell>
                  <TableCell>{tr["источник"]}</TableCell>
                  <TableCell>{tr["id"]}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={10} align="center">Нет транзакций</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Container>
  );
}

export default DonorProfilePage2025; 