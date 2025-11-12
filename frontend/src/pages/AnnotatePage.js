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
  const [baseWidth, setBaseWidth] = useState(null); // NEW: Track base PDF width
  
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
      // Set base width on first load (without zoom)
      if (!baseWidth) {
        setBaseWidth(canvasWidth);
      }
    }
  }, [canvasWidth, baseWidth]);

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

  // Calculate scale factor for zoom
  const scaleFactor = baseWidth && canvasWidth ? canvasWidth / baseWidth : 1;

  // Scale shapes for display based on current zoom
  const scaledElements = elements
    .filter(e => e.overlay_page === pageNum)
    .map(e => ({
      ...e,
      x: e.overlay_x * scaleFactor,
      y: e.overlay_y * scaleFactor,
      width: (e.width || 50) * scaleFactor,
      height: (e.height || 50) * scaleFactor,
      radius: e.radius ? e.radius * scaleFactor : undefined,
      points: e.points ? e.points.map((p, i) => p * scaleFactor) : undefined
    }));

  const handleDrawShape = (shape) => {
    // Store shape in base coordinates (unscaled)
    const unscaledShape = {
      ...shape,
      x: shape.x / scaleFactor,
      y: shape.y / scaleFactor,
      width: shape.width / scaleFactor,
      height: shape.height / scaleFactor,
      points: shape.points ? shape.points.map(p => p / scaleFactor) : undefined
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
    // Find original unscaled element
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
              shapes={scaledElements}  {/* USE SCALED ELEMENTS */}
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

      {/* Modal code stays the same... */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        {/* ... rest of your modal code ... */}
      </Dialog>
    </div>
  );
}
