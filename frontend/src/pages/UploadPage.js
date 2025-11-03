import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, List, ListItem, CircularProgress } from '@mui/material';
import { uploadPDF, getPDFs } from '../api/api';

export default function UploadPage({ onSelectPDF }) {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getPDFs()
      .then(res => setPdfs(res.data))
      .catch(() => setPdfs([]));
  }, []);

  const handleUpload = async () => {
    if (!file || !filename) {
      setError("Filename and PDF file are required!");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await uploadPDF(file, filename);
      setFilename('');
      setFile(null);
      // Refresh the list
      getPDFs().then(res => setPdfs(res.data));
    } catch (err) {
      setError("Upload failed!");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Typography variant="h5">Upload New P&ID PDF</Typography>
      <TextField
        label="Filename"
        value={filename}
        onChange={e => setFilename(e.target.value)}
        fullWidth
        margin="normal"
      />
      <input
        type="file"
        accept="application/pdf"
        onChange={e => setFile(e.target.files[0])}
        style={{ margin: '16px 0' }}
      />
      <div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={loading}
        >
          Upload
        </Button>
        {loading && <CircularProgress size={25} style={{ marginLeft: 16 }} />}
      </div>
      {error && <Typography color="error">{error}</Typography>}
      <Typography variant="h6" style={{ marginTop: 24 }}>Uploaded Documents</Typography>
      <List>
        {pdfs.map(pdf => (
          <ListItem
            button
            onClick={() => onSelectPDF(pdf)}
            key={pdf.id}
          >
            {pdf.filename} ({new Date(pdf.uploaded_at).toLocaleString()})
          </ListItem>
        ))}
      </List>
    </div>
  );
}
