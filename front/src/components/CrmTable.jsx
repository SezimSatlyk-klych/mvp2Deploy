import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, TextField, Button, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText } from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import SaveAltIcon from '@mui/icons-material/SaveAlt';

// Удаляем служебные части "БИН: …", "ИИК: …", "ИИН: …" и т.п. из ФИО
const cleanName = (raw = '') => {
  const idx = raw.search(/\b(БИН|BIN|IIK|ИИК|ИИН|IIN|БИК|BIK):/i);
  return (idx !== -1 ? raw.slice(0, idx) : raw).trim();
};

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
    { value: 'single', label: 'Разовый' },
    { value: 'periodic', label: 'Периодический' },
    { value: 'frequent', label: 'Частый' },
  ];

  const donorTypeMap = donorTypes.reduce((acc, o) => { acc[o.value] = o.label; return acc; }, {});

  const byOptions = [
    { value: '', label: 'ФИО' },
    { value: 'E-mail', label: 'E-mail' },
  ];

  // Add filter state and UI
  const [draftFilters, setDraftFilters] = useState({
    year: '',
    month: '',
    amount_from: '',
    amount_to: '',
    date_from: '',
    date_to: '',
    source: '',
    type: [], // массив для мультиселекта
    by: '',   // новый фильтр
  });
  const [filters, setFilters] = useState({
    year: '',
    month: '',
    amount_from: '',
    amount_to: '',
    date_from: '',
    date_to: '',
    source: '',
    type: [],
    by: '',
  });

  const handleDraftChange = (key, value) => {
    setDraftFilters(f => ({ ...f, [key]: value }));
  };
  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
  };
  const handleResetFilters = () => {
    setDraftFilters({ year: '', month: '', amount_from: '', amount_to: '', date_from: '', date_to: '', source: '', type: [], by: '' });
    setFilters({ year: '', month: '', amount_from: '', amount_to: '', date_from: '', date_to: '', source: '', type: [], by: '' });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const params = [];
      if (filters.year) params.push(`year=${encodeURIComponent(filters.year)}`);
      if (filters.month) params.push(`month=${encodeURIComponent(filters.month)}`);
      if (filters.amount_from) params.push(`amount_from=${encodeURIComponent(filters.amount_from)}`);
      if (filters.amount_to) params.push(`amount_to=${encodeURIComponent(filters.amount_to)}`);
      if (filters.date_from) params.push(`date_from=${encodeURIComponent(filters.date_from)}`);
      if (filters.date_to) params.push(`date_to=${encodeURIComponent(filters.date_to)}`);
      if (filters.source) params.push(`source=${encodeURIComponent(filters.source)}`);
      if (filters.type.length) filters.type.forEach(t=>params.push(`type=${encodeURIComponent(t)}`));
      if (filters.by) params.push(`by=${encodeURIComponent(filters.by)}`);
      const query = params.length ? `?${params.join('&')}` : '';
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      const url = `${API_BASE}/api/crm/export_excel${query}`;
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Ошибка экспорта файла');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'crm_2018_2024.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    // Build query params for /api/crm/filter
    const params = [];
    if (filters.year) params.push(`year=${encodeURIComponent(filters.year)}`);
    if (filters.month) params.push(`month=${encodeURIComponent(filters.month)}`);
    if (filters.amount_from) params.push(`amount_from=${encodeURIComponent(filters.amount_from)}`);
    if (filters.amount_to) params.push(`amount_to=${encodeURIComponent(filters.amount_to)}`);
    if (filters.date_from) params.push(`date_from=${encodeURIComponent(filters.date_from)}`);
    if (filters.date_to) params.push(`date_to=${encodeURIComponent(filters.date_to)}`);
    if (filters.source) params.push(`source=${encodeURIComponent(filters.source)}`);
    if (filters.type.length) filters.type.forEach(t=>params.push(`type=${encodeURIComponent(t)}`));
    if (filters.by) params.push(`by=${encodeURIComponent(filters.by)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    fetch(`${API_BASE}/api/crm/filter${query}`)
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки данных CRM');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
    setPage(1);
  }, [refresh, filters]);

  if (loading) return <Typography>Загрузка...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!Array.isArray(data) || data.length === 0) return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 320, background: '#fafdff', borderRadius: 4, boxShadow: '0 2px 16px 0 rgba(66,165,245,0.07)', p: 6, mt: 4
    }}>
      <TableChartIcon sx={{ fontSize: 64, color: '#b6d4fe', mb: 2 }} />
      <Typography variant="h6" sx={{ color: '#2563eb', fontWeight: 700, mb: 1 }}>По данному фильтру нет данных</Typography>
      <Typography variant="body2" sx={{ color: '#888' }}>Измените параметры фильтра или сбросьте фильтры для просмотра всех записей.</Typography>
      <Button variant="outlined" sx={{ mt: 3, fontWeight: 700, borderRadius: 2 }} onClick={() => { setYear(''); setMonth(''); setDonorType(''); }}>
        Вернуть в CRM
      </Button>
    </Box>
  );

  // Get all unique columns from data
  let columns = Array.from(
    data.reduce((cols, row) => {
      Object.keys(row).forEach(key => cols.add(key));
      return cols;
    }, new Set())
  );
  // Перемещаем полностью пустые/нулевые колонки в конец
  const nonEmptyCols = [];
  const emptyCols = [];
  columns.forEach(col => {
    const hasData = data.some(row => {
      const val = row[col];
      return val !== null && val !== undefined && String(val).trim() !== '';
    });
    (hasData ? nonEmptyCols : emptyCols).push(col);
  });
  columns = [...nonEmptyCols, ...emptyCols];

  // Ensure 'источник' отображается после 'язык'
  if (columns.includes('источник')) {
    columns = columns.filter(col => col !== 'источник');
    const langIdx = columns.indexOf('язык');
    if (langIdx !== -1) {
      columns.splice(langIdx + 1, 0, 'источник');
    } else {
      columns.push('источник');
    }
  }

  // Filtered and paginated data
  const filtered = data.filter(row =>
    columns.some(col => String(row[col] || '').toLowerCase().includes(search.toLowerCase()))
  );
  const pageCount = Math.ceil(filtered.length / rowsPerPage);
  // Формируем массив номеров страниц (до 10 кнопок)
  const maxPageButtons = 10;
  let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
  let endPage = startPage + maxPageButtons - 1;
  if (endPage > pageCount) {
    endPage = pageCount;
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx);
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Helper for status chip
  const renderCell = (col, value, row) => {
    const colLower = col.toLowerCase();
    if (colLower.includes('отправитель') || colLower.includes('фио') || colLower.includes('e-mail')) {
      // Kлюч для профиля: приоритетно ФИО, иначе email/phone (текущая ячейка)
      const donorKeyRaw = row['ФИО'] && row['ФИО'].trim() ? row['ФИО'] : value;
      const donorKey = cleanName(String(donorKeyRaw));
      return <Button variant="text" sx={{ color: '#2563eb', textTransform: 'none', fontWeight: 700, p: 0 }} onClick={() => onProfile && onProfile(donorKey)}>{value}</Button>;
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
      {/* Фильтры */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Год</InputLabel>
          <Select value={draftFilters.year} label="Год" onChange={e => handleDraftChange('year', e.target.value)}>
            <MenuItem value="">Все</MenuItem>
            {allYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Месяц</InputLabel>
          <Select value={draftFilters.month} label="Месяц" onChange={e => handleDraftChange('month', e.target.value)}>
            {monthsList.map(m => <MenuItem key={m} value={m}>{m ? m[0].toUpperCase() + m.slice(1) : 'Все'}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Тип</InputLabel>
          <Select
            multiple
            value={draftFilters.type}
            label="Тип"
            onChange={e => handleDraftChange('type', e.target.value)}
            renderValue={selected => selected.length===0 ? 'Все типы' : selected.map(v=>donorTypeMap[v]||v).join(', ')}
          >
            {donorTypes.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox checked={draftFilters.type.indexOf(opt.value) > -1} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Мин. сумма"
          value={draftFilters.amount_from}
          onChange={e => handleDraftChange('amount_from', e.target.value)}
          sx={{ minWidth: 100 }}
        />
        <TextField
          size="small"
          label="Макс. сумма"
          value={draftFilters.amount_to}
          onChange={e => handleDraftChange('amount_to', e.target.value)}
          sx={{ minWidth: 100 }}
        />
        <TextField
          size="small"
          label="Дата с (ДД.ММ.ГГГГ)"
          value={draftFilters.date_from}
          onChange={e => handleDraftChange('date_from', e.target.value)}
          sx={{ minWidth: 140 }}
        />
        <TextField
          size="small"
          label="Дата по (ДД.ММ.ГГГГ)"
          value={draftFilters.date_to}
          onChange={e => handleDraftChange('date_to', e.target.value)}
          sx={{ minWidth: 140 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Ключ</InputLabel>
          <Select value={draftFilters.by} label="Ключ" onChange={e => handleDraftChange('by', e.target.value)}>
            {byOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Источник"
          value={draftFilters.source}
          onChange={e => handleDraftChange('source', e.target.value)}
          sx={{ minWidth: 120 }}
        />
        <Button variant="contained" color="primary" sx={{ height: 40, minWidth: 120, fontWeight: 700 }} onClick={handleApplyFilters}>
          Применить фильтры
        </Button>
        <Button variant="outlined" color="secondary" sx={{ height: 40, minWidth: 130, fontWeight: 700 }} onClick={handleResetFilters}>
          Сбросить фильтры
        </Button>
      </Box>
      {/* Заголовок, поиск, экспорт */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, background: '#f4f8ff', borderRadius: 3, p: 2, boxShadow: '0 2px 8px 0 rgba(66,165,245,0.07)' }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#2563eb', letterSpacing: 0.5 }}>Все записи 2018-2024</Typography>
        <TextField
          size="small"
          placeholder="Поиск по таблице..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          sx={{ minWidth: 220, background: '#fff', borderRadius: 2, boxShadow: '0 1px 4px 0 rgba(66,165,245,0.04)' }}
        />
        <Button variant="contained" color="success" startIcon={<SaveAltIcon />} onClick={handleExport} sx={{ fontWeight: 700 }}>
          Скачать Excel
        </Button>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
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
                  zIndex: 1,
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
                {columns.map((col, idx) => (
                  <td key={col} style={{
                    padding: '12px 10px',
                    color: '#222',
                    fontSize: 15,
                    borderBottom: '1px solid #f0f0f0',
                    maxWidth: 220,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
        {pageNumbers.map(num => (
          <Button
            key={num}
            size="small"
            variant={page === num ? 'contained' : 'outlined'}
            sx={{ minWidth: 32 }}
            onClick={() => setPage(num)}
          >
            {num}
          </Button>
        ))}
        <Button size="small" disabled={page === pageCount || pageCount === 0} onClick={() => setPage(page + 1)}>&gt;</Button>
      </Box>
      <Typography variant="body2" sx={{ color: '#888', mt: 2 }}>
        Показано {filtered.length === 0 ? 0 : (page-1)*rowsPerPage+1}–{Math.min(page*rowsPerPage, filtered.length)} из {filtered.length} записей
      </Typography>
      {/* Empty state if no data */}
      {(!Array.isArray(data) || data.length === 0) && !loading && !error && (
        <Box sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 320, background: '#fafdff', borderRadius: 4, boxShadow: '0 2px 16px 0 rgba(66,165,245,0.07)', p: 6, mt: 4
        }}>
          <TableChartIcon sx={{ fontSize: 64, color: '#b6d4fe', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#2563eb', fontWeight: 700, mb: 1 }}>По данному фильтру нет данных</Typography>
          <Typography variant="body2" sx={{ color: '#888' }}>Измените параметры фильтра или сбросьте фильтры для просмотра всех записей.</Typography>
          <Button variant="outlined" sx={{ mt: 3, fontWeight: 700, borderRadius: 2 }} onClick={handleResetFilters}>
            Вернуть в CRM
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default CrmTable; 