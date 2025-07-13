import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [api, setApi] = useState<string>('Aguardando...');
  useEffect(() => {
    axios.get(API_URL).then((res) => setApi(JSON.stringify(res.data, null, 2))).catch((err) => setApi('Erro de conexão'));
  }, []);
  return (
    <Container maxWidth="sm">
      <Box mt={8}>
        <Paper elevation={2} style={{ padding: 24 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Sistema de Gestão de Ativos de TI
          </Typography>
          <Typography variant="body1" gutterBottom>
            Teste de comunicação com backend:
          </Typography>
          <pre style={{ background: '#eee', padding: 12, borderRadius: 4 }}>{api}</pre>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
