from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.db.models import LegalTemplate, User
from app.schemas.legal_template import (
    LegalTemplate as LegalTemplateSchema,
    LegalTemplateCreate,
    LegalTemplateUpdate,
)
from pydantic import BaseModel, HttpUrl

class ScrapeRequest(BaseModel):
    url: HttpUrl

router = APIRouter()

@router.get("/", response_model=List[LegalTemplateSchema])
async def read_legal_templates(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve legal templates.
    """
    # Only active templates by default, unless admin
    query = select(LegalTemplate)
    if current_user.role.upper() != "ADMIN":
        query = query.where(LegalTemplate.is_active == True)
    
    result = await db.execute(query.offset(skip).limit(limit))
    templates = result.scalars().all()
    return templates

@router.post("/", response_model=LegalTemplateSchema)
async def create_legal_template(
    *,
    db: AsyncSession = Depends(deps.get_db),
    template_in: LegalTemplateCreate,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new legal template (Admin only).
    """
    template = LegalTemplate(**template_in.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

@router.get("/{template_id}", response_model=LegalTemplateSchema)
async def read_legal_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get legal template by ID.
    """
    result = await db.execute(select(LegalTemplate).where(LegalTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.put("/{template_id}", response_model=LegalTemplateSchema)
async def update_legal_template(
    *,
    db: AsyncSession = Depends(deps.get_db),
    template_id: uuid.UUID,
    template_in: LegalTemplateUpdate,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update a legal template (Admin only).
    """
    result = await db.execute(select(LegalTemplate).where(LegalTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

@router.post("/scrape")
async def scrape_legal_template_from_url(
    req: ScrapeRequest,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Scrape and parse a legal template from a provided URL (Admin only).
    Uses Playwright to fetch content and Google Gemini to parse it into JSON.
    """
    from app.services.scraper_service import scraper_service
    from app.services.template_parser_service import template_parser_service
    
    try:
        # 1. Scrape content
        raw_data = await scraper_service.scrape_template_url(str(req.url))
        
        # 2. Parse using AI
        parsed_template = await template_parser_service.parse_raw_template(
            title=raw_data["title"],
            description=raw_data["description"],
            raw_content=raw_data["raw_content"]
        )
        
        return {
            "status": "success",
            "data": parsed_template
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{template_id}", response_model=LegalTemplateSchema)
async def delete_legal_template(
    *,
    db: AsyncSession = Depends(deps.get_db),
    template_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Delete a legal template (Admin only).
    """
    result = await db.execute(select(LegalTemplate).where(LegalTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    await db.delete(template)
    await db.commit()
    return template
