from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class PIDDocument(Base):
    __tablename__ = "pid_documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    pdf_data = Column(LargeBinary)

    # CASCADE DELETE: When PDF is deleted, all elements are automatically deleted
    elements = relationship("Element", back_populates="pid_document", cascade="all, delete-orphan")

class Element(Base):
    __tablename__ = "elements"
    id = Column(Integer, primary_key=True, index=True)
    element_type = Column(String)
    serial_number = Column(String)
    position = Column(String)
    internal_number = Column(String)
    photo = Column(LargeBinary, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    overlay_x = Column(Float)
    overlay_y = Column(Float)
    overlay_page = Column(Integer)
    overlay_type = Column(Text)
    
    # CASCADE on database level: When parent PDF is deleted, this element is deleted
    pid_doc_id = Column(Integer, ForeignKey('pid_documents.id', ondelete='CASCADE'))

    pid_document = relationship("PIDDocument", back_populates="elements")
    
    # CASCADE DELETE: When element is deleted, all attachments and comments are deleted
    attachments = relationship("Attachment", back_populates="element", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="element", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True, index=True)
    
    # CASCADE on database level: When parent element is deleted, this attachment is deleted
    element_id = Column(Integer, ForeignKey('elements.id', ondelete='CASCADE'))
    
    filename = Column(String)
    file_data = Column(LargeBinary)
    file_type = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    element = relationship("Element", back_populates="attachments")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    
    # CASCADE on database level: When parent element is deleted, this comment is deleted
    element_id = Column(Integer, ForeignKey('elements.id', ondelete='CASCADE'))
    
    comment_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    element = relationship("Element", back_populates="comments")
