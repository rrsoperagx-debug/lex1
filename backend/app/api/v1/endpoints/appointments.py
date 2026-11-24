from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.api import deps
from app.db.models import Appointment, User, Notification, Message
from app.schemas.appointment import Appointment as AppointmentSchema, AppointmentCreate, AppointmentUpdate
from app.core.encryption import encryption_service

router = APIRouter()

@router.get("/", response_model=List[AppointmentSchema])
async def read_appointments(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve appointments.
    """
    query = select(Appointment)
    # Clients only see their own, lawyers/admins see all
    if current_user.role == "client":
        query = query.where(Appointment.user_id == current_user.id)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/", response_model=AppointmentSchema)
async def create_appointment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    appointment_in: AppointmentCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new appointment.
    """
    appointment = Appointment(
        **appointment_in.model_dump(),
        user_id=current_user.id
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    
    # Task 4: Auto-Notification for Operator (Lawyer)
    # Find active lawyers
    result = await db.execute(select(User).where(User.role == "lawyer", User.is_active == True))
    lawyers = result.scalars().all()
    
    for lawyer in lawyers:
        # Create system notification
        notif = Notification(
            user_id=lawyer.id,
            message=f"Nowy termin zarezerwowany: {appointment.title} przez {current_user.full_name or current_user.email} na {appointment.date} o {appointment.time}."
        )
        db.add(notif)
        
        # Create system message (internal mail)
        sys_msg = Message(
            sender_id=current_user.id,
            recipient_id=lawyer.id,
            subject="Nowy termin w kalendarzu",
            content_enc=encryption_service.encrypt(f"Klient {current_user.full_name or current_user.email} umówił wizytę: {appointment.title}.\nData: {appointment.date}\nGodzina: {appointment.time}\nLink do kalendarza: /lawyer/calendar")
        )
        db.add(sys_msg)

    # Simulate sending email to client (Task 4)
    print(f"DEBUG: Sent HTML Confirmation Email to {current_user.email} for appointment {appointment.id}")
    
    await db.commit()
    return appointment

@router.patch("/{appointment_id}", response_model=AppointmentSchema)
async def update_appointment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    appointment_id: uuid.UUID,
    appointment_in: AppointmentUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update an appointment.
    """
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if current_user.role == "client" and appointment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = appointment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    return appointment

@router.delete("/{appointment_id}")
async def delete_appointment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    appointment_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete an appointment.
    """
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if current_user.role == "client" and appointment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    await db.execute(delete(Appointment).where(Appointment.id == appointment_id))
    await db.commit()
    return {"message": "Appointment deleted"}
