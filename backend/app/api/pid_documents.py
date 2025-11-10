from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..schemas import PIDDocument, PIDDocumentCreate
from ..crud import create_pid_document, get_pid_documents, get_pid_document
from ..utils import SessionLocal
import io

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Upload PDF endpoint
@router.post("/", response_model=PIDDocument)
async def upload_pid_document(
    filename: str = Form(...),
    pdf_file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    pdf_data = await pdf_file.read()
    new_doc = PIDDocumentCreate(filename=filename, pdf_data=pdf_data)
    return create_pid_document(db, new_doc)

# List all PDFs (metadata only, no pdf_data)
@router.get("/", response_model=list[PIDDocument])
def list_pid_documents(db: Session = Depends(get_db)):
    return get_pid_documents(db)

# Get single PDF metadata
@router.get("/{doc_id}", response_model=PIDDocument)
def get_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = get_pid_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

# Stream PDF file directly
@router.get("/{doc_id}/pdf")
def get_pdf_file(doc_id: int, db: Session = Depends(get_db)):
    doc = get_pid_document(db, doc_id)
    if not doc or not doc.pdf_data:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return StreamingResponse(
        io.BytesIO(doc.pdf_data),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={doc.filename}"}
    )

# DELETE PDF endpoint (NEW)
@router.delete("/{doc_id}", status_code=204)
def delete_pdf(doc_id: int, db: Session = Depends(get_db)):
    doc = get_pid_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return
