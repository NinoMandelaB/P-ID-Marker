from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas import Element, ElementCreate
from ..crud import create_element, get_elements_by_doc, get_element
from ..utils import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=Element)
def add_element(element: ElementCreate, db: Session = Depends(get_db)):
    return create_element(db, element)

@router.get("/by_doc/{pid_doc_id}", response_model=list[Element])
def list_elements(pid_doc_id: int, db: Session = Depends(get_db)):
    return get_elements_by_doc(db, pid_doc_id)

@router.get("/{element_id}", response_model=Element)
def get_element_info(element_id: int, db: Session = Depends(get_db)):
    element = get_element(db, element_id)
    if not element:
        raise HTTPException(status_code=404, detail="Element not found")
    return element
