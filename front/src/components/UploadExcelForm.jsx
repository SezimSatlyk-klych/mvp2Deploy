import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';

function UploadExcelForm() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [source, setSource] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!files.length) {
      setError('Выберите хотя бы один файл Excel.');
      return;
    }
    if (!source.trim()) {
      setError('Пожалуйста, укажите источник.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('source', source);
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${API_BASE}/api/upload_excel`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Ошибка загрузки файла');
      }
      await res.json();
      setSuccess('Файл(ы) успешно загружены!');
      setFiles([]);
      setSource('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
      <TextField
        label="Источник"
        value={source}
        onChange={e => setSource(e.target.value)}
        required
        fullWidth
        sx={{ mb: 2, maxWidth: 400 }}
      />
      <Button
        variant="outlined"
        component="label"
        sx={{ mb: 2, borderRadius: 2, fontWeight: 600, fontSize: 16 }}
      >
        Выбрать Excel-файл(ы)
        <input
          type="file"
          accept=".xlsx,.xls"
          multiple
          hidden
          onChange={handleFileChange}
        />
      </Button>
      <Box sx={{ mb: 2, minHeight: 24 }}>
        {files.length > 0 && (
          <Typography variant="body2" color="primary">
            {files.map(f => f.name).join(', ')}
          </Typography>
        )}
      </Box>
      <Button
        type="submit"
        variant="contained"
        disabled={loading}
        sx={{ borderRadius: 2, fontWeight: 700, fontSize: 18, px: 4, py: 1 }}
      >
        {loading ? 'Загрузка...' : 'Загрузить'}
      </Button>
      {success && <Alert severity="success" sx={{ mt: 3 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
    </Box>
  );
}

export default UploadExcelForm; 