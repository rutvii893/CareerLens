from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..dependencies import get_current_user, get_db

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/me', response_model=schemas.UserRead)
def read_me(current_user: schemas.UserRead = Depends(get_current_user)):
    return current_user


@router.put('/me', response_model=schemas.UserRead)
def update_me(updates: schemas.UserUpdate, db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    if current_user.email and updates.email:
        existing = crud.get_user_by_email(db, updates.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already in use')
    updated = crud.update_user(db, current_user, updates)
    return updated


@router.get('/me/dashboard', response_model=schemas.DashboardMetrics)
def get_dashboard(db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    return crud.get_dashboard_metrics(db, current_user.id)
