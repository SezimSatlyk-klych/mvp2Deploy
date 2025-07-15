import React, { useState } from 'react';
import { Box, Typography, Button, Container, Tabs, Tab } from '@mui/material';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ProfileEditForm from './ProfileEditForm';
import UploadExcelForm from './UploadExcelForm';
import UploadExcelForm2025 from './UploadExcelForm2025';
import ManualCrmPage from './ManualCrmPage';
import CrmTable from './CrmTable';
import CrmTable2025 from './CrmTable2025';
import DonorProfilePage from './DonorProfilePage';
import DonorProfilePage2025 from './DonorProfilePage2025';
import ManualCrmPage2025 from './ManualCrmPage2025';

function MainPage({ pageOverride }) {
  const [page, setPage] = useState(pageOverride || 'admin');
  const [crmRefresh, setCrmRefresh] = useState(0);
  const [profileKey, setProfileKey] = useState(null);
  const [profile2025, setProfile2025] = useState(null);
  const [manualTab, setManualTab] = useState(0);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box sx={{
        width: 220,
        background: 'linear-gradient(120deg, #e0eafc 0%, #b6e0fe 100%)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: '2px 0 12px 0 rgba(66,165,245,0.08)',
      }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 4, color: '#2563eb', letterSpacing: 1 }}>
          DonorFlow
        </Typography>
        <Button
          startIcon={<BusinessCenterRoundedIcon />}
          sx={{
            mb: 2,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            color: page === 'admin' ? '#fff' : '#2563eb',
            background: page === 'admin' ? 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)' : 'transparent',
            boxShadow: page === 'admin' ? '0 2px 12px 0 rgba(66,165,245,0.10)' : 'none',
            textTransform: 'none',
            width: '100%',
            justifyContent: 'flex-start',
            '&:hover': {
              background: 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)',
              color: '#fff',
            },
          }}
          onClick={() => setPage('admin')}
        >
          Профиль
        </Button>
        <Button
          startIcon={<UploadFileRoundedIcon />}
          sx={{
            mb: 2,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            color: page === 'upload' ? '#fff' : '#2563eb',
            background: page === 'upload' ? 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)' : 'transparent',
            boxShadow: page === 'upload' ? '0 2px 12px 0 rgba(66,165,245,0.10)' : 'none',
            textTransform: 'none',
            width: '100%',
            justifyContent: 'flex-start',
            '&:hover': {
              background: 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)',
              color: '#fff',
            },
          }}
          onClick={() => setPage('upload')}
        >
          Загрузить Excel
        </Button>
        <Button
          startIcon={<InsightsRoundedIcon />}
          sx={{
            mb: 2,
            px: 2,
            py: 1.5,
            
            borderRadius: 2,
            fontWeight: 700,
            color: page === 'crm' ? '#fff' : '#2563eb',
            background: page === 'crm' ? 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)' : 'transparent',
            boxShadow: page === 'crm' ? '0 2px 12px 0 rgba(66,165,245,0.10)' : 'none',
            textTransform: 'none',
            width: '100%',
            justifyContent: 'flex-start',
            '&:hover': {
              background: 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)',
              color: '#fff',
            },
          }}
          onClick={() => setPage('crm')}
        >
          CRM 2018-2024
        </Button>
        <Button
          startIcon={<InsightsRoundedIcon />}
          sx={{
            mb: 2,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            color: page === 'crm2025' ? '#fff' : '#2563eb',
            background: page === 'crm2025' ? 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)' : 'transparent',
            boxShadow: page === 'crm2025' ? '0 2px 12px 0 rgba(66,165,245,0.10)' : 'none',
            textTransform: 'none',
            width: '100%',
            justifyContent: 'flex-start',
            '&:hover': {
              background: 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)',
              color: '#fff',
            },
          }}
          onClick={() => setPage('crm2025')}
        >
          CRM 2025
        </Button>
        <Button
          startIcon={<AddRoundedIcon />}
          sx={{
            mb: 2,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            color: page === 'manual' ? '#fff' : '#2563eb',
            background: page === 'manual' ? 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)' : 'transparent',
            textTransform: 'none',
            width: '100%',
            justifyContent: 'flex-start',
            '&:hover': {
              background: 'linear-gradient(90deg, #4f8cff 0%, #6fd6ff 100%)',
              color: '#fff',
            },
          }}
          onClick={() => setPage('manual')}
        >
          Добавить вручную
        </Button>
      </Box>
      {/* Main content */}
      <Box sx={{ flex: 1, p: 6 }}>
        {page === 'admin' && (
          <Container sx={{ mt: 10, textAlign: 'center', maxWidth: 600 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Профиль
            </Typography>
            <Typography variant="body1" sx={{ color: '#2563eb', mb: 3 }}>
              Добро пожаловать в ваш профиль DonorFlow!
            </Typography>
            <ProfileEditForm />
            {/* Здесь можно добавить админ-функции */}
          </Container>
        )}
        {page === 'upload' && (
          <Container sx={{ mt: 10, textAlign: 'center', maxWidth: 1100 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Загрузка Excel
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 6, justifyContent: 'center', mt: 6 }}>
              <Box sx={{ flex: 1, p: 3, border: '1px solid #e3e3e3', borderRadius: 3, background: '#f8fbff', minWidth: 320 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#2563eb' }}>До 2025</Typography>
                <UploadExcelForm />
              </Box>
              <Box sx={{ flex: 1, p: 3, border: '1px solid #e3e3e3', borderRadius: 3, background: '#f8fbff', minWidth: 320 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#2563eb' }}>2025</Typography>
                <UploadExcelForm2025 />
              </Box>
            </Box>
          </Container>
        )}
        {page === 'crm' && (
          <Box sx={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            py: 8,
          }}>
            <Box sx={{ width: '100%', maxWidth: 1100 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#2563eb', mb: 4 }}>
                CRM 2018-2024
              </Typography>
              <CrmTable refresh={crmRefresh} onProfile={key => { setProfileKey(key); setPage('profile'); }} />
            </Box>
          </Box>
        )}
        {page === 'crm2025' && !profile2025 && (
          <Box sx={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            py: 8,
          }}>
            <Box sx={{ width: '100%', maxWidth: 1100 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#2563eb', mb: 4 }}>
                CRM 2025
              </Typography>
              <CrmTable2025 onProfile={(key, by) => setProfile2025({ key, by })} />
            </Box>
          </Box>
        )}
        {page === 'crm2025' && profile2025 && (
          <DonorProfilePage2025 key={profile2025.key + profile2025.by} searchKey={profile2025.key} by={profile2025.by} onBack={() => setProfile2025(null)} />
        )}
        {/* Объединённая страница добавления вручную */}
        {page === 'manual' && (
          <Container maxWidth={false} sx={{ mt: 8, mb: 8, maxWidth: '100%' }}>
            <Box sx={{ background: '#fff', borderRadius: 4, boxShadow: '0 4px 32px 0 rgba(66,165,245,0.10)', border: '2px solid #e0eafc', p: 4, maxWidth: '100%', mx: 'auto' }}>
              <Tabs value={manualTab} onChange={(_, v) => setManualTab(v)} sx={{ mb: 3 }}>
                <Tab label="До 2025" value={0} />
                <Tab label="2025" value={1} />
              </Tabs>
              {manualTab === 0 && (
                <ManualCrmPage onSuccess={() => setPage('crm')} onCancel={() => setPage('crm')} />
              )}
              {manualTab === 1 && (
                <ManualCrmPage2025 onSuccess={() => setPage('crm2025')} onCancel={() => setPage('crm2025')} />
              )}
            </Box>
          </Container>
        )}
        {page === 'profile' && profileKey && (
          <DonorProfilePage donorKey={profileKey} onBack={() => setPage('crm')} />
        )}
      </Box>
    </Box>
  );
}

export default MainPage; 