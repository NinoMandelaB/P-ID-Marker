from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PIDDocumentBase(BaseModel):
    filename: str

class PIDDocumentCreate(PIDDocumentBase):
    pdf_data: bytes

class PIDDocument(PIDDocumentBase):
    id: int
    uploaded_at: datetime
    class Config:
        orm_mode = True

class ElementBase(BaseModel):
    element_type: str
    serial_number: str
    position: str
    internal_number: str
    overlay_x: float
    overlay_y: float
    overlay_page: int
    overlay_type: str

class ElementCreate(ElementBase):
    photo: Optional[bytes] = None
    pid_doc_id: int

class Element(ElementBase):
    id: int
    photo: Optional[bytes] = None
    created_at: datetime
    updated_at: datetime
    pid_doc_id: int
    class Config:
        orm_mode = True

class AttachmentBase(BaseModel):
    filename: str
    file_type: str

class AttachmentCreate(AttachmentBase):
    file_data: bytes
    element_id: int

# UPDATED: Response model WITHOUT file_data
class Attachment(AttachmentBase):
    id: int
    element_id: int
    uploaded_at: datetime
    # Removed file_data from response to avoid serialization issues
    class Config:
        orm_mode = True

class CommentBase(BaseModel):
    comment_text: str

class CommentCreate(CommentBase):
    element_id: int

class Comment(CommentBase):
    id: int
    element_id: int
    created_at: datetime
    class Config:
        orm_mode = True
