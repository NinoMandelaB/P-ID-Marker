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

    elements = relationship("Element", back_populates="pid_document")

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
    pid_doc_id = Column(Integer, ForeignKey('pid_documents.id'))

    pid_document = relationship("PIDDocument", back_populates="elements")
    attachments = relationship("Attachment", back_populates="element")
    comments = relationship("Comment", back_populates="element")

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True, index=True)
    element_id = Column(Integer, ForeignKey('elements.id'))
    filename = Column(String)
    file_data = Column(LargeBinary)
    file_type = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    element = relationship("Element", back_populates="attachments")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    element_id = Column(Integer, ForeignKey('elements.id'))
    comment_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    element = relationship("Element", back_populates="comments")
