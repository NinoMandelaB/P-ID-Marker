/*import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, List, ListItem, CircularProgress } from '@mui/material';
import { uploadPDF, getPDFs } from '../api/api';

export default function UploadPage({ onSelectPDF }) {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getPDFs().then(res => setPdfs(res.data)).catch(() => setPdfs([]));
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
      getPDFs().then(res => setPdfs(res.data));
    } catch (err) {
      setError("Upload failed!");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: "auto", paddingTop: 32 }}>
      <Typography variant="h5" gutterBottom>Upload New P&ID PDF</Typography>
      <TextField label="Document Name" value={filename} onChange={e => setFilename(e.target.value)} fullWidth margin="normal" />
      <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} />
      <Button variant="contained" color="primary" disabled={loading} onClick={handleUpload}>Upload</Button>
      {loading && <CircularProgress size={24} />}
      {error && <Typography color="error">{error}</Typography>}
      <Typography variant="h6" style={{ marginTop: 40 }}>Uploaded Documents</Typography>
      <List>
        {pdfs.map(pdf => (
          <ListItem key={pdf.id} button onClick={() => onSelectPDF(pdf)}>
            {pdf.filename} ({new Date(pdf.uploaded_at).toLocaleString()})
          </ListItem>
        ))}
      </List>
    </div>
  );
}*/

export default function UploadPage(props) {
  return <div>Hello from UploadPage!</div>;
}


