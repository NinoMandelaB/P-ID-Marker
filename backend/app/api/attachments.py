from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..schemas import Attachment, AttachmentCreate
from ..crud import create_attachment, get_attachments_by_element
from ..utils import SessionLocal
import io

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=Attachment)
async def upload_attachment(
    element_id: int = Form(...),
    filename: str = Form(...),
    file_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_data = await file.read()
    new_attachment = AttachmentCreate(
        element_id=element_id,
        filename=filename,
        file_type=file_type,
        file_data=file_data
    )
    return create_attachment(db, new_attachment)

@router.get("/by_element/{element_id}", response_model=list[Attachment])
def get_element_attachments(element_id: int, db: Session = Depends(get_db)):
    return get_attachments_by_element(db, element_id)

@router.delete("/{attachment_id}", status_code=204)
def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    from ..models import Attachment as AttachmentModel
    attachment = db.query(AttachmentModel).filter(AttachmentModel.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    db.delete(attachment)
    db.commit()
    return

# NEW: Download endpoint
@router.get("/{attachment_id}/download")
def download_attachment(attachment_id: int, db: Session = Depends(get_db)):
    from ..models import Attachment as AttachmentModel
    
    attachment = db.query(AttachmentModel).filter(AttachmentModel.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    return StreamingResponse(
        io.BytesIO(attachment.file_data),
        media_type=attachment.file_type,
        headers={"Content-Disposition": f"attachment; filename={attachment.filename}"}
    )
