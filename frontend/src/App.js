import React, { useState } from 'react';
import UploadPage from './pages/UploadPage';
import AnnotatePage from './pages/AnnotatePage';

function App() {
  const [selectedPDF, setSelectedPDF] = useState(null);
  const handleGoBack = () => setSelectedPDF(null);

  return (
    <>
      {/*<div>Hello, frontend works!</div>*/}
      {!selectedPDF
        ? <UploadPage onSelectPDF={setSelectedPDF} />
        : <AnnotatePage pdfDoc={selectedPDF} goBack={handleGoBack} />
      }
    </>
  );
}

export default App;
