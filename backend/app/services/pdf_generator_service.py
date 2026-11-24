import json
import logging
from io import BytesIO
from typing import Dict, Any, List, Optional
from uuid import UUID

from pypdf import PdfReader, PdfWriter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import FormTemplate, FormFieldMapping, UserFormDraft, Document
from app.core.encryption import encryption_service

logger = logging.getLogger(__name__)

class PDFGeneratorService:
    @staticmethod
    async def get_decrypted_draft_data(db: AsyncSession, draft_id: UUID, user_id: UUID) -> Dict[str, Any]:
        result = await db.execute(
            select(UserFormDraft).where(
                (UserFormDraft.id == draft_id) & (UserFormDraft.user_id == user_id)
            )
        )
        draft = result.scalar_one_or_none()
        if not draft:
            return None
        
        decrypted_data = encryption_service.decrypt(draft.data_enc)
        if not decrypted_data:
            return {}
        return json.loads(decrypted_data)

    @staticmethod
    async def fill_pdf_template(
        db: AsyncSession, 
        draft_id: UUID, 
        user_id: UUID
    ) -> bytes:
        """
        Takes data from a user draft and injects it into a PDF template based on mappings.
        """
        # 1. Get draft
        result = await db.execute(
            select(UserFormDraft).where(
                (UserFormDraft.id == draft_id) & (UserFormDraft.user_id == user_id)
            )
        )
        draft = result.scalar_one_or_none()
        if not draft:
            raise ValueError("Draft not found or access denied")

        # 2. Get Template and Mappings
        result = await db.execute(select(FormTemplate).where(FormTemplate.id == draft.template_id))
        template = result.scalar_one_or_none()
        if not template:
            raise ValueError("Form template not found")
        
        result = await db.execute(
            select(FormFieldMapping).where(FormFieldMapping.template_id == template.id)
        )
        mappings = result.scalars().all()

        # 3. Decrypt data
        user_data = json.loads(encryption_service.decrypt(draft.data_enc))

        # 4. Prepare PDF data dictionary
        pdf_values = {}
        for m in mappings:
            val = user_data.get(m.frontend_key, "")
            # pypdf expects strings for form fields
            pdf_values[m.pdf_field_name] = str(val if val is not None else "")

        # 5. Fill PDF
        try:
            # We assume templates are stored locally in a 'templates' directory
            reader = PdfReader(template.pdf_template_path)
            writer = PdfWriter()

            for page in reader.pages:
                writer.add_page(page)

            # Injecting data on the first page
            # Successive pages could also be handled if mappings specify page numbers
            writer.update_page_form_field_values(writer.pages[0], pdf_values)
            
            # Memory buffer for the output
            output = BytesIO()
            writer.write(output)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Error generating PDF from template {template.code}: {str(e)}")
            raise RuntimeError(f"Could not generate PDF: {str(e)}")

    @staticmethod
    def inspect_pdf_fields(file_path: str) -> List[str]:
        """Utility to find field names in a PDF file."""
        try:
            reader = PdfReader(file_path)
            fields = reader.get_fields()
            return list(fields.keys()) if fields else []
        except Exception as e:
            logger.error(f"Error inspecting PDF fields: {str(e)}")
            return []

pdf_generator_service = PDFGeneratorService()
