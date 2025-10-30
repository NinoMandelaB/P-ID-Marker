/* import React, { useState } from 'react';
import UploadPage from './pages/UploadPage';
import AnnotatePage from './pages/AnnotatePage';

function App() {
  const [selectedPDF, setSelectedPDF] = useState(null);

  return (
    <>
      <div>Hello, frontend works!</div> {/* <-- This ensures something is always visible *//*} 
      {!selectedPDF
        ? <UploadPage onSelectPDF={setSelectedPDF} />
        : <AnnotatePage pdfDoc={selectedPDF} />
      }
    </>
  );
}

export default App; */

function App() {
  const [selectedPDF, setSelectedPDF] = useState(null);
  return (
    <>
      <div>Hello, frontend works!</div>
      {!selectedPDF
        ? <UploadPage onSelectPDF={setSelectedPDF} />
        : <AnnotatePage pdfDoc={selectedPDF} />
      }
    </>
  );
}

export default App;