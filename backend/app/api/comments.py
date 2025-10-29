from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas import Comment, CommentCreate
from ..crud import create_comment, get_comments_by_element
from ..utils import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=Comment)
def add_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    return create_comment(db, comment)

@router.get("/by_element/{element_id}", response_model=list[Comment])
def list_comments(element_id: int, db: Session = Depends(get_db)):
    return get_comments_by_element(db, element_id)
