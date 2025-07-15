import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert, MenuItem } from '@mui/material';

const monthsList = [
  '', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const genders = [ '', 'женщина', 'мужчина' ];
const languages = [ '', 'казахский', 'русский', 'английский', 'другое' ];

function ManualCrmPage2025({ onSuccess, onCancel }) {
  const emptyRow = {
    "ФИО": '',
    "month": '',
    "E-mail": '',
    "Дата": '',
    "Сумма": '',
    "Идентификатор платежа": '',
    "телефон": '',
    "язык": '',
    "gender": '',
    "источник": '',
  };
  const [rows, setRows] = useState([ { ...emptyRow }, { ...emptyRow }, { ...emptyRow } ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (rowIdx, e) => {
    const { name, value } = e.target;
    const updated = rows.map((row, i) => i === rowIdx ? { ...row, [name]: value } : row);
    setRows(updated);
    setError('');
    setSuccess('');
  };

  const handleAddRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

  const handleRemoveRow = (idx) => {
    if (rows.length > 1) setRows(rows.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Убираем id из отправляемых данных, gender возвращаем
      const toSend = rows
        .filter(row => Object.values(row).some(v => v))
        .map(({ id, ...rest }) => rest); // удаляем только id
      if (toSend.length === 0) throw new Error('Заполните хотя бы одну строку');
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      for (const row of toSend) {
        const res = await fetch(`${API_BASE}/api/add_user_excel_2025`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Ошибка добавления');
        }
      }
      setSuccess('Все записи успешно добавлены!');
      setRows([ { ...emptyRow }, { ...emptyRow }, { ...emptyRow } ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ mt: 8, mb: 8, maxWidth: '100%' }}>
      <Box sx={{
        background: '#fff',
        borderRadius: 4,
        boxShadow: '0 4px 32px 0 rgba(66,165,245,0.10)',
        border: '2px solid #e0eafc',
        p: 4,
        maxWidth: '100%',
        mx: 'auto',
      }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#2563eb', mb: 2 }}>
          Ручное добавление в Excel 2025
        </Typography>
        <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
          Заполните строки для массового добавления. Можно добавить несколько записей сразу.
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {rows.map((row, idx) => (
              <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, alignItems: 'center', background: '#f4f8ff', borderRadius: 2, p: 2 }}>
                <TextField label="ФИО" name="ФИО" value={row["ФИО"]} onChange={e => handleChange(idx, e)} fullWidth required />
                <TextField select label="Месяц" name="month" value={row["month"]} onChange={e => handleChange(idx, e)} fullWidth required>
                  {monthsList.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
                <TextField label="E-mail" name="E-mail" value={row["E-mail"]} onChange={e => handleChange(idx, e)} fullWidth required />
                <TextField label="Дата (2025-01-01T00:00:00)" name="Дата" value={row["Дата"]} onChange={e => handleChange(idx, e)} fullWidth required />
                <TextField label="Сумма" name="Сумма" value={row["Сумма"]} onChange={e => handleChange(idx, e)} fullWidth required type="number" />
                <TextField label="Идентификатор платежа" name="Идентификатор платежа" value={row["Идентификатор платежа"]} onChange={e => handleChange(idx, e)} fullWidth />
                <TextField label="Телефон" name="телефон" value={row["телефон"]} onChange={e => handleChange(idx, e)} fullWidth />
                <TextField select label="Язык" name="язык" value={row["язык"]} onChange={e => handleChange(idx, e)} fullWidth required>
                  {languages.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </TextField>
                <TextField select label="Пол" name="gender" value={row["gender"]} onChange={e => handleChange(idx, e)} fullWidth>
                  {genders.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
                <TextField label="Источник" name="источник" value={row["источник"]} onChange={e => handleChange(idx, e)} fullWidth />
                <Button onClick={() => handleRemoveRow(idx)} color="error" variant="outlined" sx={{ height: 40, minWidth: 40, gridColumn: { xs: '1', md: '4' } }} disabled={rows.length === 1}>–</Button>
              </Box>
            ))}
          </Box>
          <Button onClick={handleAddRow} variant="outlined" sx={{ mt: 3, mb: 2, borderRadius: 2, fontWeight: 700 }} disabled={loading}>
            + Добавить строку
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              sx={{ borderRadius: 2, fontWeight: 700, fontSize: 18, flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Добавление...' : 'Добавить все'}
            </Button>
            <Button
              variant="outlined"
              sx={{ borderRadius: 2, fontWeight: 700, fontSize: 18, flex: 1 }}
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default ManualCrmPage2025; 