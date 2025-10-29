from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from ..schemas import PIDDocument, PIDDocumentCreate
from ..crud import create_pid_document, get_pid_documents, get_pid_document
from ..utils import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=PIDDocument)
async def upload_pid_document(filename: str, pdf_file: UploadFile = File(...), db: Session = Depends(get_db)):
    pdf_data = await pdf_file.read()
    new_doc = PIDDocumentCreate(filename=filename, pdf_data=pdf_data)
    return create_pid_document(db, new_doc)

@router.get("/", response_model=list[PIDDocument])
def list_pid_documents(db: Session = Depends(get_db)):
    return get_pid_documents(db)

@router.get("/{doc_id}", response_model=PIDDocument)
def get_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = get_pid_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
