import logging
import uuid
from typing import Any, Dict, Optional
from jinja2 import Template
import markdown
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import LegalTemplate, Document, Case
from app.core.config import settings

logger = logging.getLogger(__name__)

class DocumentService:
    @staticmethod
    async def generate_from_template(
        db: AsyncSession,
        template_id: uuid.UUID,
        case_id: Optional[uuid.UUID],
        data: Dict[str, Any]
    ) -> Document:
        """
        Generates a document based on a LegalTemplate.
        Fills the markdown content with provided data, converts to HTML (and ideally PDF).
        """
        # Fetch template
        result = await db.execute(select(LegalTemplate).where(LegalTemplate.id == template_id))
        template_obj = result.scalar_one_or_none()
        if not template_obj:
            raise ValueError(f"Template with ID {template_id} not found")

        # Fill template content using Jinja2
        try:
            template = Template(template_obj.content)
            filled_content = template.render(**data)
        except Exception as e:
            logger.error(f"Error rendering template: {e}")
            # Fallback to simple replacement if Jinja fails or for basic usage
            filled_content = template_obj.content
            for key, value in data.items():
                filled_content = filled_content.replace(f"{{{{{key}}}}}", str(value))

        # Convert Markdown to HTML
        html_content = markdown.markdown(filled_content)

        import os
        from playwright.async_api import async_playwright
        
        static_dir = os.path.join(os.path.dirname(__file__), "..", "static", "documents")
        os.makedirs(static_dir, exist_ok=True)
        
        filename = f"{template_obj.title.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.pdf"
        filepath = os.path.join(static_dir, filename)
        file_url = f"/static/documents/{filename}"

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                html_wrapper = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {{ font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }}
                        h1, h2, h3 {{ color: #1e293b; }}
                    </style>
                </head>
                <body>
                    {html_content}
                </body>
                </html>
                """
                await page.set_content(html_wrapper)
                await page.pdf(path=filepath, format="A4", print_background=True)
                await browser.close()
        except Exception as e:
            logger.error(f"Failed to generate PDF with Playwright: {{e}}")
            raise ValueError(f"Failed to generate PDF: {{e}}")

        # Save document record
        document = Document(
            case_id=case_id,
            template_id=template_id,
            filename=filename,
            file_url=file_url,
            status="unsigned",
            filled_data=data
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)

        logger.info(f"Generated document: {filename} for template {template_obj.custom_id}")
        return document

    @staticmethod
    async def delete_old_documents(years: int) -> int:
        """
        Stub/Utility method simulating deletion of expired documents according 
        to data retention policies (e.g. after 7 years for GDPR compliance).
        """
        # In a real app we'd query db with `date < datetime.now() - timedelta(days=years*365)`
        return 0

document_service = DocumentService()
