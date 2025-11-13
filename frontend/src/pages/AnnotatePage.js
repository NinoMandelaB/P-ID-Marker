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
  const [scale, setScale] = useState(1.0);
  
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

  // Calculate actual canvas dimensions based on zoom
  const actualCanvasWidth = canvasWidth * scale;
  const actualCanvasHeight = canvasHeight * scale;

  // Scale shapes for display based on current zoom
  const scaledElements = elements
    .filter(e => e.overlay_page === pageNum)
    .map(e => ({
      ...e,
      x: e.overlay_x * scale,
      y: e.overlay_y * scale,
      width: (e.width || 50) * scale,
      height: (e.height || 50) * scale,
      radius: e.radius ? e.radius * scale : undefined,
      points: e.points ? e.points.map(p => p * scale) : undefined
    }));

  const handleDrawShape = (shape) => {
    // Store shape in base coordinates (at scale 1.0)
    const unscaledShape = {
      ...shape,
      x: shape.x / scale,
      y: shape.y / scale,
      width: shape.width / scale,
      height: shape.height / scale,
      points: shape.points ? shape.points.map(p => p / scale) : undefined
    };
    
    setPendingShape(unscaledShape);
    setSelectedElement(null);
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
        const res = await updateElement(selectedElement.id, newElement);
        setElements(elements.map(e => e.id === selectedElement.id ? res.data : e));
        alert("Annotation updated successfully!");
      } else {
        const res = await addElement(newElement);
        setElements([...elements, res.data]);
        setSelectedElement(res.data);
        setPendingShape(null);
        alert("Annotation saved! You can now add attachments.");
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
    const originalElement = elements.find(e => e.id === shape.id);
    if (!originalElement) return;
    
    setSelectedElement(originalElement);
    setPendingShape(null);
    setForm({
      element_type: originalElement.element_type || '',
      serial_number: originalElement.serial_number || '',
      position: originalElement.position || '',
      internal_number: originalElement.internal_number || ''
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
      const res = await getAttachmentsByElement(selectedElement.id);
      setAttachments(res.data);
      setAttachmentFile(null);
      setAttachmentFilename('');
      
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

      {/* PDF + Canvas - both in same scrollable container */}
      <div style={{ 
        maxHeight: '70vh', 
        overflow: 'auto', 
        border: '2px solid #ccc',
        borderRadius: '4px',
        position: 'relative',
        background: '#fafafa'
      }}>
        <div style={{ position: 'relative', minHeight: '400px' }}>
          {/* PDF Viewer */}
          <PDFViewer
            pdfUrl={pdfUrl}
            pageNum={pageNum}
            numPages={numPages}
            onPageChange={setPageNum}
            onDocumentLoad={({ numPages }) => setNumPages(numPages)}
            setContainerWidth={setCanvasWidth}
            scale={scale}
            setScale={setScale}
          />
          
          {/* Canvas Overlay - positioned exactly over PDF */}
          {canvasWidth && canvasHeight && (
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '62px', // Height of zoom controls + margins
              transform: 'translateX(-50%)',
              width: actualCanvasWidth,
              height: actualCanvasHeight,
              pointerEvents: 'auto',
              zIndex: 10
            }}>
              <AnnotationCanvas
                shapes={scaledElements}
                onDrawShape={handleDrawShape}
                onSelectShape={handleSelectShape}
                mode={mode}
                tool={tool}
                width={actualCanvasWidth}
                height={actualCanvasHeight}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
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
            </>
          )}

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
