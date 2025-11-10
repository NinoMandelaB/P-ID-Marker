import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, List, ListItem, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { uploadPDF, getPDFs, deletePDF } from '../api/api';

export default function UploadPage({ onSelectPDF }) {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPDFs();
  }, []);

  const loadPDFs = () => {
    getPDFs()
      .then(res => setPdfs(res.data))
      .catch(() => setPdfs([]));
  };

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
      loadPDFs();
    } catch (err) {
      setError("Upload failed!");
    }
    setLoading(false);
  };

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this PDF?")) {
      try {
        await deletePDF(docId);
        loadPDFs();
      } catch (err) {
        setError("Delete failed!");
      }
    }
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
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <span>{pdf.filename} ({new Date(pdf.uploaded_at).toLocaleString()})</span>
            <IconButton 
              edge="end" 
              aria-label="delete"
              onClick={(e) => handleDelete(pdf.id, e)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
}
