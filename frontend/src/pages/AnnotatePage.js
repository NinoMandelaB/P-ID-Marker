import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, 
  Select, MenuItem, FormControl, InputLabel, List, ListItem, Typography 
} from '@mui/material';
import PDFViewer from '../components/PDFViewer';
import AnnotationCanvas from '../components/AnnotationCanvas';
import { 
  getElementsByDoc, addElement, updateElement, deleteElement,
  uploadAttachment, getAttachmentsByElement, deleteAttachment
} from '../api/api';

export default function AnnotatePage({ pdfDoc, goBack }) {
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [elements, setElements] = useState([]);
  const [canvasWidth, setCanvasWidth] = useState(null);
  const [canvasHeight, setCanvasHeight] = useState(null);
  
  // Drawing/editing state
  const [mode, setMode] = useState('draw');
  const [tool, setTool] = useState('rect');
  const [selectedElement, setSelectedElement] = useState(null);
  const [pendingShape, setPendingShape] = useState(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    element_type: '',
    serial_number: '',
    position: '',
    internal_number: ''
  });

  // Attachments state
  const [attachments, setAttachments] = useState([]);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentFilename, setAttachmentFilename] = useState('');

  const pdfUrl = pdfDoc?.id
    ? `https://p-id-marker-production.up.railway.app/api/pid_documents/${pdfDoc.id}/pdf`
    : null;

  useEffect(() => {
    if (pdfDoc?.id) {
      getElementsByDoc(pdfDoc.id)
        .then(res => setElements(res.data))
        .catch(() => setElements([]));
    }
  }, [pdfDoc]);

  useEffect(() => {
    if (canvasWidth) {
      setCanvasHeight(Math.floor(canvasWidth * 1.414));
    }
  }, [canvasWidth]);

  // Load attachments when element is selected
  useEffect(() => {
    if (selectedElement?.id) {
      getAttachmentsByElement(selectedElement.id)
        .then(res => setAttachments(res.data))
        .catch(() => setAttachments([]));
    } else {
      setAttachments([]);
    }
  }, [selectedElement]);

  const handleDrawShape = (shape) => {
    setPendingShape(shape);
    setSelectedElement(null); // Clear selected element for new annotation
    setForm({
      element_type: '',
      serial_number: '',
      position: '',
      internal_number: ''
    });
    setModalOpen(true);
  };

  const handleSaveAnnotation = async () => {
    if (!pendingShape || !pdfDoc) return;

    const newElement = {
      ...form,
      overlay_x: pendingShape.x,
      overlay_y: pendingShape.y,
      overlay_page: pageNum,
      overlay_type: pendingShape.tool,
      width: pendingShape.width,
      height: pendingShape.height,
      radius: pendingShape.tool === 'circle' ? Math.abs(pendingShape.width) / 2 : undefined,
      points: pendingShape.points || [],
      pid_doc_id: pdfDoc.id,
      photo: null
    };

    try {
      if (selectedElement?.id) {
        // Update existing
        const res = await updateElement(selectedElement.id, newElement);
        setElements(elements.map(e => e.id === selectedElement.id ? res.data : e));
        alert("Annotation updated successfully!");
      } else {
        // Create new
        const res = await addElement(newElement);
        setElements([...elements, res.data]);
        
        // KEY CHANGE: Set the newly created element as selected so user can add attachments
        setSelectedElement(res.data);
        setPendingShape(null);
        alert("Annotation saved! You can now add attachments.");
        // Don't close modal - keep it open for attachments
        return;
      }
      
      setModalOpen(false);
      setPendingShape(null);
      setSelectedElement(null);
    } catch (err) {
      console.error("Failed to save annotation:", err);
      alert("Failed to save annotation: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleSelectShape = (shape) => {
    setSelectedElement(shape);
    setPendingShape(null); // No pending shape when editing
    setForm({
      element_type: shape.element_type || '',
      serial_number: shape.serial_number || '',
      position: shape.position || '',
      internal_number: shape.internal_number || ''
    });
    setModalOpen(true);
  };

  const handleDeleteAnnotation = async () => {
    if (!selectedElement?.id) return;
    
    if (window.confirm("Delete this annotation?")) {
      try {
        await deleteElement(selectedElement.id);
        setElements(elements.filter(e => e.id !== selectedElement.id));
        setModalOpen(false);
        setSelectedElement(null);
      } catch (err) {
        console.error("Failed to delete annotation:", err);
        alert("Failed to delete annotation");
      }
    }
  };

  const handleUploadAttachment = async () => {
    if (!attachmentFile || !selectedElement?.id) {
      alert("Please select a file and ensure an element is selected");
      return;
    }

    const filename = attachmentFilename || attachmentFile.name;
    const fileType = attachmentFile.type || 'application/octet-stream';

    try {
      await uploadAttachment(attachmentFile, filename, fileType, selectedElement.id);
      // Reload attachments
      const res = await getAttachmentsByElement(selectedElement.id);
      setAttachments(res.data);
      setAttachmentFile(null);
      setAttachmentFilename('');
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      alert("Attachment uploaded successfully!");
    } catch (err) {
      console.error("Failed to upload attachment:", err);
      alert("Failed to upload attachment: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (window.confirm("Delete this attachment?")) {
      try {
        await deleteAttachment(attachmentId);
        setAttachments(attachments.filter(a => a.id !== attachmentId));
      } catch (err) {
        console.error("Failed to delete attachment:", err);
        alert("Failed to delete attachment");
      }
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPendingShape(null);
    setSelectedElement(null);
    setAttachmentFile(null);
    setAttachmentFilename('');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <button onClick={goBack}>Back to Uploads</button>
      <h2>Annotate PDF: {pdfDoc?.filename}</h2>
      
      {/* Tool controls */}
      <div style={{ marginBottom: '1rem' }}>
        <Button 
          variant={mode === 'draw' ? 'contained' : 'outlined'} 
          onClick={() => setMode('draw')}
          style={{ marginRight: '8px' }}
        >
          DRAW MODE
        </Button>
        <Button 
          variant={mode === 'edit' ? 'contained' : 'outlined'} 
          onClick={() => setMode('edit')}
          style={{ marginRight: '16px' }}
        >
          EDIT MODE
        </Button>
        
        {mode === 'draw' && (
          <>
            <Button 
              variant={tool === 'rect' ? 'contained' : 'outlined'} 
              onClick={() => setTool('rect')}
              style={{ marginRight: '8px' }}
            >
              RECTANGLE
            </Button>
            <Button 
              variant={tool === 'circle' ? 'contained' : 'outlined'} 
              onClick={() => setTool('circle')}
              style={{ marginRight: '8px' }}
            >
              CIRCLE
            </Button>
            <Button 
              variant={tool === 'freehand' ? 'contained' : 'outlined'} 
              onClick={() => setTool('freehand')}
            >
              FREEHAND
            </Button>
          </>
        )}
      </div>

      {/* PDF + Canvas Overlay */}
      <div style={{ position: 'relative', width: '100%' }}>
        <PDFViewer
          pdfUrl={pdfUrl}
          pageNum={pageNum}
          numPages={numPages}
          onPageChange={setPageNum}
          onDocumentLoad={({ numPages }) => setNumPages(numPages)}
          setContainerWidth={setCanvasWidth}
        />
        {canvasWidth && canvasHeight && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 80,
            transform: 'translateX(-50%)',
            width: canvasWidth,
            height: canvasHeight,
            pointerEvents: mode === 'draw' ? 'auto' : 'auto'
          }}>
            <AnnotationCanvas
              shapes={elements.filter(e => e.overlay_page === pageNum)}
              onDrawShape={handleDrawShape}
              onSelectShape={handleSelectShape}
              mode={mode}
              tool={tool}
              width={canvasWidth}
              height={canvasHeight}
            />
          </div>
        )}
      </div>

      {/* Annotation Metadata Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedElement?.id ? 'Edit Annotation' : 'New Annotation'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={form.element_type}
              onChange={e => setForm({ ...form, element_type: e.target.value })}
            >
              <MenuItem value="Valve">Valve</MenuItem>
              <MenuItem value="Pump">Pump</MenuItem>
              <MenuItem value="Tank">Tank</MenuItem>
              <MenuItem value="Pipe">Pipe</MenuItem>
              <MenuItem value="Instrument">Instrument</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Serial Number"
            fullWidth
            margin="normal"
            value={form.serial_number}
            onChange={e => setForm({ ...form, serial_number: e.target.value })}
          />
          <TextField
            label="Position"
            fullWidth
            margin="normal"
            value={form.position}
            onChange={e => setForm({ ...form, position: e.target.value })}
          />
          <TextField
            label="Internal Number"
            fullWidth
            margin="normal"
            value={form.internal_number}
            onChange={e => setForm({ ...form, internal_number: e.target.value })}
          />

          {/* Attachments Section - Show after element is saved */}
          {selectedElement?.id && (
            <>
              <Typography variant="h6" style={{ marginTop: '20px', marginBottom: '10px' }}>
                Attachments
              </Typography>
              <div style={{ marginTop: '10px', marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <input
                  type="file"
                  onChange={e => setAttachmentFile(e.target.files[0])}
                  style={{ marginBottom: '10px' }}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <br />
                <TextField
                  label="Filename (optional)"
                  value={attachmentFilename}
                  onChange={e => setAttachmentFilename(e.target.value)}
                  size="small"
                  style={{ marginRight: '10px', width: '200px' }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleUploadAttachment}
                  disabled={!attachmentFile}
                >
                  Upload Attachment
                </Button>
              </div>

              // In the attachments list section, replace the current List with this:

              {attachments.length > 0 ? (
                <List>
                  {attachments.map(att => (
                    <ListItem 
                      key={att.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        border: '1px solid #eee', 
                        marginBottom: '5px',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <a 
                          href={`https://p-id-marker-production.up.railway.app/api/attachments/${att.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}
                        >
                          {att.filename}
                        </a>
                        <span style={{ marginLeft: '10px', color: '#666' }}>({att.file_type})</span>
                      </div>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={() => handleDeleteAttachment(att.id)}
                      >
                        Delete
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No attachments yet
                </Typography>
              )}

          {/* Message for new annotations */}
          {!selectedElement?.id && (
            <Typography variant="body2" color="textSecondary" style={{ marginTop: '15px' }}>
              Save the annotation first to add attachments
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {selectedElement?.id && (
            <Button onClick={handleDeleteAnnotation} color="error">
              Delete Annotation
            </Button>
          )}
          <Button onClick={handleCloseModal}>
            {selectedElement?.id ? 'Close' : 'Cancel'}
          </Button>
          {!selectedElement?.id || pendingShape ? (
            <Button onClick={handleSaveAnnotation} variant="contained" color="primary">
              Save
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </div>
  );
}
