/*import React, { useState } from 'react';
import UploadPage from './pages/UploadPage';
import AnnotatePage from './pages/AnnotatePage';

function App() {
  const [selectedPDF, setSelectedPDF] = useState(null);

  return (
    <>
      {!selectedPDF
        ? <UploadPage onSelectPDF={setSelectedPDF} />
        : <AnnotatePage pdfDoc={selectedPDF} />
      }
    </>
  );
}*/

export default App;
import React from 'react';

function App() {
  return (
    <div>
      Hello, frontend works!
    </div>
  );
}

export default App;

