from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from ..schemas import Attachment, AttachmentCreate
from ..crud import create_attachment, get_attachments_by_element
from ..utils import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=Attachment)
async def upload_attachment(filename: str, file_type: str, element_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_data = await file.read()
    attachment_create = AttachmentCreate(filename=filename, file_type=file_type, file_data=file_data, element_id=element_id)
    return create_attachment(db, attachment_create)

@router.get("/by_element/{element_id}", response_model=list[Attachment])
def list_attachments(element_id: int, db: Session = Depends(get_db)):
    return get_attachments_by_element(db, element_id)
