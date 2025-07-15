import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, TextField, Button, MenuItem, FormControl, InputLabel, Select, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, ListItemText, FormGroup, FormControlLabel } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import EditIcon from '@mui/icons-material/Edit';
import TableChartIcon from '@mui/icons-material/TableChart';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';

const columns = [
  'ФИО',
  'month',
  'E-mail',
  'Дата',
  'Сумма',
  'Идентификатор платежа',
  'телефон',
  'язык',
  'источник',
];

const donorTypes = [
  { value: '', label: 'Все типы' },
  { value: 'single', label: 'Разовый' },
  { value: 'periodic', label: 'Периодический' },
  { value: 'frequent', label: 'Частый' },
];
const genders = [
  { value: '', label: 'Любой' },
  { value: 'мужчина', label: 'Мужчина' },
  { value: 'женщина', label: 'Женщина' },
  { value: 'неизвестно', label: 'Неизвестно' },
];
const languages = [
  { value: '', label: 'любой' },
  { value: 'казахский', label: 'казахский' },
  { value: 'русский', label: 'русский' },
  { value: 'английский', label: 'английский' },
  { value: 'другой', label: 'другой' },
];
const byOptions = [
  { value: '', label: 'ФИО' },
  { value: 'E-mail', label: 'E-mail' },
];

const editLanguages = [ '', 'казахский', 'русский', 'английский', 'другое' ];

// Карты value -> label для отображения выбранных значений
const donorTypeMap = donorTypes.reduce((acc, o) => { if (o.value) acc[o.value] = o.label; return acc; }, {});
const genderMap = genders.reduce((acc, o) => { if (o.value) acc[o.value] = o.label; return acc; }, {});
const languageMap = languages.reduce((acc, o) => { if (o.value) acc[o.value] = o.label; return acc; }, {});

function CrmTable2025({ onProfile }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Фильтры (draft)
  const [draftFilters, setDraftFilters] = useState({
    type: [],
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
    gender: [],
    language: [],
    by: '',
    source: '',
  });
  // Активные фильтры (по ним делается запрос)
  const [filters, setFilters] = useState({
    type: [],
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
    gender: [],
    language: [],
    by: '',
    source: '',
  });

  // Сброс фильтров к исходным значениям
  const resetFilters = () => {
    const empty = {
      type: [],
      dateFrom: '',
      dateTo: '',
      amountFrom: '',
      amountTo: '',
      gender: [],
      language: [],
      by: '',
      source: '',
    };
    setDraftFilters(empty);
    setFilters(empty);
  };

  const [editRow, setEditRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  const handleDraftChange = (key, value) => {
    setDraftFilters(f => ({ ...f, [key]: value }));
  };

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
  };

  // helper to toggle value in array filter
  const toggleArrayValue = (key, value) => {
    setDraftFilters(prev => {
      const arr = [...prev[key]];
      const idx = arr.indexOf(value);
      if (idx > -1) arr.splice(idx, 1); else arr.push(value);
      return { ...prev, [key]: arr };
    });
  };

  const handleExport = async () => {
    try {
      const params = [];
      if (filters.type.length) filters.type.forEach(t=>params.push(`type=${encodeURIComponent(t)}`));
      if (filters.dateFrom) params.push(`date_from=${encodeURIComponent(filters.dateFrom)}`);
      if (filters.dateTo) params.push(`date_to=${encodeURIComponent(filters.dateTo)}`);
      if (filters.amountFrom) params.push(`amount_from=${encodeURIComponent(filters.amountFrom)}`);
      if (filters.amountTo) params.push(`amount_to=${encodeURIComponent(filters.amountTo)}`);
      if (filters.gender.length) filters.gender.forEach(g=>params.push(`gender=${encodeURIComponent(g)}`));
      if (filters.language.length) filters.language.forEach(l=>params.push(`language=${encodeURIComponent(l)}`));
      if (filters.by) params.push(`by=${encodeURIComponent(filters.by)}`);
      if (filters.source) params.push(`source=${encodeURIComponent(filters.source)}`);
      const query = params.length ? `?${params.join('&')}` : '';
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/api/export_users_excel_2025${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка экспорта файла');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users_2025.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (row) => {
    setEditRow(row);
    setEditData({ ...row });
    setEditSuccess('');
    setEditError('');
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(d => ({ ...d, [name]: value }));
  };
  const handleEditSave = async () => {
    setEditLoading(true);
    setEditSuccess('');
    setEditError('');
    try {
      const updates = { ...editData };
      delete updates.id;
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${API_BASE}/api/update_user_excel_2025`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editRow.id, updates }),
      });
      if (!res.ok) throw new Error('Ошибка при обновлении');
      setEditSuccess('Изменения успешно сохранены!');
      // Обновить данные в таблице
      setData(data => data.map(r => r.id === editRow.id ? { ...r, ...updates } : r));
      setTimeout(() => setEditRow(null), 1000);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };
  const handleEditClose = () => setEditRow(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = [];
    if (filters.type.length) filters.type.forEach(t=>params.push(`type=${encodeURIComponent(t)}`));
    if (filters.dateFrom) params.push(`date_from=${encodeURIComponent(filters.dateFrom)}`);
    if (filters.dateTo) params.push(`date_to=${encodeURIComponent(filters.dateTo)}`);
    if (filters.amountFrom) params.push(`amount_from=${encodeURIComponent(filters.amountFrom)}`);
    if (filters.amountTo) params.push(`amount_to=${encodeURIComponent(filters.amountTo)}`);
    if (filters.gender.length) filters.gender.forEach(g=>params.push(`gender=${encodeURIComponent(g)}`));
    if (filters.language.length) filters.language.forEach(l=>params.push(`language=${encodeURIComponent(l)}`));
    if (filters.by) params.push(`by=${encodeURIComponent(filters.by)}`);
    if (filters.source) params.push(`source=${encodeURIComponent(filters.source)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    fetch(`${API_BASE}/api/filter_users_excel_2025${query}`)
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки данных CRM 2025');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
    setPage(1);
  }, [filters]);

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
      <Button variant="outlined" sx={{ mt: 3, fontWeight: 700, borderRadius: 2 }} onClick={() => setFilters({
        type: '', dateFrom: '', dateTo: '', amountFrom: '', amountTo: '', gender: '', language: '', by: '', source: ''
      })}>
        Вернуть в CRM 2025
      </Button>
    </Box>
  );

  // Filtered and paginated data (поиск по всем полям)
  const filtered = data.filter(row =>
    columns.some(col => String(row[col] || '').toLowerCase().includes(search.toLowerCase()))
  );
  const pageCount = Math.ceil(filtered.length / rowsPerPage);
  // Формируем массив номеров страниц для отображения (не более 10 кнопок)
  const maxPageButtons = 10;
  let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
  let endPage = startPage + maxPageButtons - 1;
  if (endPage > pageCount) {
    endPage = pageCount;
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx);
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Тип</InputLabel>
          <Select
            multiple
            value={draftFilters.type}
            label="Тип"
            onChange={e => handleDraftChange('type', e.target.value)}
            renderValue={selected => selected.length===0 ? 'Все типы' : selected.map(v => donorTypeMap[v] || v).join(', ')}
          >
            {donorTypes.filter(d=>d.value).map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox checked={draftFilters.type.indexOf(opt.value) > -1} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
        <TextField
          size="small"
            label="Дата с"
            placeholder="ДД.ММ.ГГГГ"
          value={draftFilters.dateFrom}
          onChange={e => handleDraftChange('dateFrom', e.target.value)}
          sx={{ minWidth: 140 }}
        />

        <TextField
          size="small"
            label="Дата по"
            placeholder="ДД.ММ.ГГГГ"
          value={draftFilters.dateTo}
          onChange={e => handleDraftChange('dateTo', e.target.value)}
          sx={{ minWidth: 140 }}
        />
        </LocalizationProvider>
        <TextField
          size="small"
          label="Мин. сумма"
          value={draftFilters.amountFrom}
          onChange={e => handleDraftChange('amountFrom', e.target.value)}
          sx={{ minWidth: 100 }}
        />
        <TextField
          size="small"
          label="Макс. сумма"
          value={draftFilters.amountTo}
          onChange={e => handleDraftChange('amountTo', e.target.value)}
          sx={{ minWidth: 100 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Гендер</InputLabel>
          <Select
            multiple
            value={draftFilters.gender}
            label="Гендер"
            onChange={e => handleDraftChange('gender', e.target.value)}
            renderValue={selected => selected.length===0 ? 'Любой' : selected.map(v => genderMap[v] || v).join(', ')}
          >
            {genders.filter(g=>g.value).map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox checked={draftFilters.gender.indexOf(opt.value) > -1} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Язык</InputLabel>
          <Select
            multiple
            value={draftFilters.language}
            label="Язык"
            onChange={e => handleDraftChange('language', e.target.value)}
            renderValue={selected => selected.length===0 ? 'любой' : selected.map(v => languageMap[v] || v).join(', ')}
          >
            {languages.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox checked={draftFilters.language.indexOf(opt.value) > -1} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
        <Button variant="outlined" color="secondary" sx={{ height: 40, minWidth: 130, fontWeight: 700 }} onClick={resetFilters}>
          Сбросить фильтры
        </Button>
      </Box>
      {/* Заголовок и поиск */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, background: '#f4f8ff', borderRadius: 3, p: 2, boxShadow: '0 2px 8px 0 rgba(66,165,245,0.07)' }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#2563eb', letterSpacing: 0.5 }}>Все записи 2025</Typography>
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
      <Box sx={{ overflowX: 'auto', borderRadius: 4, boxShadow: '0 2px 16px 0 rgba(66,165,245,0.07)', background: '#fafdff', mt: 2 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} style={{
                  padding: '16px 12px',
                  background: '#eaf3ff',
                  color: '#2563eb',
                  fontWeight: 800,
                  fontSize: 16,
                  borderBottom: '2px solid #b6e0fe',
                  textAlign: 'left',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>{col}</th>
              ))}
              <th style={{ background: '#eaf3ff', borderBottom: '2px solid #b6e0fe' }}></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid #e3e3e3',
                background: i % 2 === 0 ? '#fff' : '#f9fbff',
                transition: 'background 0.2s',
                cursor: 'pointer',
                ':hover': { background: '#e3f0ff' },
              }}
              >
                {columns.map(col => (
                  <td key={col} style={{
                    padding: '14px 10px',
                    color: '#222',
                    fontSize: 15,
                    borderBottom: '1px solid #f0f0f0',
                    maxWidth: 220,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    ...(col === 'ФИО' && onProfile ? { color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' } : {})
                  }}
                  onClick={col === 'ФИО' && onProfile ? () => onProfile(row['ФИО'], 'ФИО') : undefined}
                  >
                    {row[col]}
                  </td>
                ))}
                <td>
                 <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditClick(row)} sx={{ minWidth: 36, px: 1.5, borderRadius: 2, fontWeight: 700, color: '#2563eb', borderColor: '#b6e0fe', background: '#f4f8ff', '&:hover': { background: '#e3f0ff', borderColor: '#2563eb' } }}>
                 </Button>
                </td>
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
      {/* Модальное окно редактирования */}
      <Dialog open={!!editRow} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#2563eb', fontSize: 22, pb: 1 }}>Редактировать запись</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
            mb: 2
          }}>
            {columns.map(col => (
              <Box key={col} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 700, mb: 0.5, letterSpacing: 0.2 }}>{col}</Typography>
                {col === 'язык' ? (
                  <TextField
                    select
                    name={col}
                    value={editData[col] || ''}
                    onChange={handleEditChange}
                    size="small"
                    fullWidth
                    sx={{ background: '#f4f8ff', borderRadius: 2 }}
                  >
                    {editLanguages.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                  </TextField>
                ) : (
                  <TextField
                    name={col}
                    value={editData[col] || ''}
                    onChange={handleEditChange}
                    size="small"
                    fullWidth
                    sx={{ background: '#f4f8ff', borderRadius: 2 }}
                  />
                )}
              </Box>
            ))}
          </Box>
          {editError && <Alert severity="error" sx={{ mb: 1 }}>{editError}</Alert>}
          {editSuccess && <Alert severity="success" sx={{ mb: 1 }}>{editSuccess}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={editLoading}>Отмена</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={editLoading}>{editLoading ? 'Сохранение...' : 'Сохранить'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CrmTable2025; 