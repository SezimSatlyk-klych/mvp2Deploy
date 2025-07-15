import React from 'react';
import { Box, Container, Typography, Button, Stack, Paper } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import HeroIllustration from './HeroIllustration';

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

export default Landing; 