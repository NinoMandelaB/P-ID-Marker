from sqlalchemy.orm import Session
from . import models, schemas

# PID Documents
def create_pid_document(db: Session, doc: schemas.PIDDocumentCreate):
    pid_doc = models.PIDDocument(
        filename=doc.filename,
        pdf_data=doc.pdf_data
    )
    db.add(pid_doc)
    db.commit()
    db.refresh(pid_doc)
    return pid_doc

def get_pid_documents(db: Session, skip=0, limit=100):
    return db.query(models.PIDDocument).offset(skip).limit(limit).all()

def get_pid_document(db: Session, doc_id: int):
    return db.query(models.PIDDocument).filter(models.PIDDocument.id == doc_id).first()

# Elements
def create_element(db: Session, element: schemas.ElementCreate):
    el = models.Element(**element.dict())
    db.add(el)
    db.commit()
    db.refresh(el)
    return el

def get_elements_by_doc(db: Session, pid_doc_id: int):
    return db.query(models.Element).filter(models.Element.pid_doc_id == pid_doc_id).all()

def get_element(db: Session, element_id: int):
    return db.query(models.Element).filter(models.Element.id == element_id).first()

# Attachments
def create_attachment(db: Session, attachment: schemas.AttachmentCreate):
    att = models.Attachment(**attachment.dict())
    db.add(att)
    db.commit()
    db.refresh(att)
    return att

def get_attachments_by_element(db: Session, element_id: int):
    return db.query(models.Attachment).filter(models.Attachment.element_id == element_id).all()

# Comments
def create_comment(db: Session, comment: schemas.CommentCreate):
    c = models.Comment(**comment.dict())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

def get_comments_by_element(db: Session, element_id: int):
    return db.query(models.Comment).filter(models.Comment.element_id == element_id).all()
