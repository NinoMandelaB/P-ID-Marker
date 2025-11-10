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
      if (selectedElement) {
        const res = await updateElement(selectedElement.id, newElement);
        setElements(elements.map(e => e.id === selectedElement.id ? res.data : e));
      } else {
        const res = await addElement(newElement);
        setElements([...elements, res.data]);
      }
      
      setModalOpen(false);
      setPendingShape(null);
      setSelectedElement(null);
    } catch (err) {
      console.error("Failed to save annotation:", err);
      alert("Failed to save annotation");
    }
  };

  const handleSelectShape = (shape) => {
    setSelectedElement(shape);
    setForm({
      element_type: shape.element_type || '',
      serial_number: shape.serial_number || '',
      position: shape.position || '',
      internal_number: shape.internal_number || ''
    });
    setModalOpen(true);
  };

  const handleDeleteAnnotation = async () => {
    if (!selectedElement) return;
    
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
    } catch (err) {
      console.error("Failed to upload attachment:", err);
      alert("Failed to upload attachment");
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
          Draw Mode
        </Button>
        <Button 
          variant={mode === 'edit' ? 'contained' : 'outlined'} 
          onClick={() => setMode('edit')}
          style={{ marginRight: '16px' }}
        >
          Edit Mode
        </Button>
        
        {mode === 'draw' && (
          <>
            <Button 
              variant={tool === 'rect' ? 'contained' : 'outlined'} 
              onClick={() => setTool('rect')}
              style={{ marginRight: '8px' }}
            >
              Rectangle
            </Button>
            <Button 
              variant={tool === 'circle' ? 'contained' : 'outlined'} 
              onClick={() => setTool('circle')}
              style={{ marginRight: '8px' }}
            >
              Circle
            </Button>
            <Button 
              variant={tool === 'freehand' ? 'contained' : 'outlined'} 
              onClick={() => setTool('freehand')}
            >
              Freehand
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
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedElement ? 'Edit Annotation' : 'New Annotation'}</DialogTitle>
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

          {/* Attachments Section - Only show for existing elements */}
          {selectedElement?.id && (
            <>
              <Typography variant="h6" style={{ marginTop: '20px' }}>Attachments</Typography>
              <div style={{ marginTop: '10px' }}>
                <input
                  type="file"
                  onChange={e => setAttachmentFile(e.target.files[0])}
                  style={{ marginBottom: '10px' }}
                />
                <TextField
                  label="Filename (optional)"
                  value={attachmentFilename}
                  onChange={e => setAttachmentFilename(e.target.value)}
                  size="small"
                  style={{ marginLeft: '10px', marginRight: '10px' }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleUploadAttachment}
                  disabled={!attachmentFile}
                >
                  Upload Attachment
                </Button>
              </div>

              <List>
                {attachments.map(att => (
                  <ListItem key={att.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{att.filename} ({att.file_type})</span>
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          {selectedElement && (
            <Button onClick={handleDeleteAnnotation} color="error">
              Delete
            </Button>
          )}
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAnnotation} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
