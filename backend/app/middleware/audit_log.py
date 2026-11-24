from __future__ import annotations

import json
from typing import Callable, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.db.session import AsyncSessionLocal
from app.services.audit import create_audit_log


class AuditLogMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            # 1. Process the request
            response = await call_next(request)
        except Exception as e:
            # Re-raise standard exceptions, handle others properly later
            # (FastAPI generic exception handler will catch it)
            raise e

        # 2. Decide if we should log this action
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            if "/ai/ping" in request.url.path or "/audit/ws" in request.url.path:
                return response
            
            # Skip audit logging in test environment to avoid cross-DB FK violations
            from app.core.config import settings
            if settings.environment == "TESTING":
                return response
            
            # Fire and forget auditing to not block user response
            import asyncio
            asyncio.create_task(self._log_action_safe(request, response))

        return response

    async def _log_action_safe(self, request: Request, response: Response):
        try:
            await self._log_action(request, response)
        except Exception as e:
            print(f"Error in AuditLogBackground: {e}")

    async def _log_action(self, request: Request, response: Response):
        try:
            # Try to get user from request state (set by get_current_user dependency)
            user = getattr(request.state, "user", None)
            user_id = user.id if user else None

            action = f"{request.method} {request.url.path}"
            status = "success" if 200 <= response.status_code < 400 else "failed"
            
            # Extract possible resource ID from path
            resource_id = None
            path_parts = request.url.path.strip("/").split("/")
            if path_parts:
                last_part = path_parts[-1]
                try:
                    import uuid
                    resource_id = uuid.UUID(last_part)
                except ValueError:
                    pass

            async with AsyncSessionLocal() as db:
                await create_audit_log(
                    db=db,
                    action=action,
                    actor_id=user_id,
                    resource_id=resource_id,
                    ip_address=request.client.host if request.client else "unknown"
                )
        except Exception as e:
            print(f"Error in AuditLogMiddleware: {e}")
