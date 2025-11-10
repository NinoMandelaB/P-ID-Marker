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
def create_new_element(element: ElementCreate, db: Session = Depends(get_db)):
    return create_element(db, element)

@router.get("/by_doc/{doc_id}", response_model=list[Element])
def get_doc_elements(doc_id: int, db: Session = Depends(get_db)):
    return get_elements_by_doc(db, doc_id)

@router.get("/{element_id}", response_model=Element)
def get_single_element(element_id: int, db: Session = Depends(get_db)):
    element = get_element(db, element_id)
    if not element:
        raise HTTPException(status_code=404, detail="Element not found")
    return element

@router.put("/{element_id}", response_model=Element)
def update_element(element_id: int, element: ElementCreate, db: Session = Depends(get_db)):
    db_element = get_element(db, element_id)
    if not db_element:
        raise HTTPException(status_code=404, detail="Element not found")
    
    for key, value in element.dict().items():
        setattr(db_element, key, value)
    
    db.commit()
    db.refresh(db_element)
    return db_element

@router.delete("/{element_id}", status_code=204)
def delete_element(element_id: int, db: Session = Depends(get_db)):
    element = get_element(db, element_id)
    if not element:
        raise HTTPException(status_code=404, detail="Element not found")
    db.delete(element)
    db.commit()
    return
