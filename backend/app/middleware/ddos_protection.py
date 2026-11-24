"""
DDoS Protection Middleware

Provides additional protection layer beyond basic rate limiting:
- IP reputation tracking
- Suspicious pattern detection
- Automatic temporary bans
- Integration with Redis for distributed tracking
"""

from __future__ import annotations

import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta, timezone
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis

# Set up logging
logger = logging.getLogger("ddos_middleware")

class DDoSProtectionMiddleware(BaseHTTPMiddleware):
    """
    Advanced DDoS protection middleware with Redis safety
    """
    
    def __init__(
        self, 
        app, 
        redis_client: Optional[redis.Redis] = None,
        trusted_ips: Optional[List[str]] = None,
        max_violations: int = 5,
        ban_duration: int = 900,
        violation_window: int = 300
    ):
        super().__init__(app)
        self.redis_client = redis_client
        self.trusted_ips = set(trusted_ips or ["127.0.0.1", "::1"])

        # Configuration
        self.max_violations = max_violations
        self.ban_duration = timedelta(seconds=ban_duration)
        self.violation_window = timedelta(seconds=violation_window)
        
        # In-memory fallback
        self.ip_violations: Dict[str, int] = {}
        self.banned_ips: Dict[str, datetime] = {}
    
    async def dispatch(self, request: Request, call_next):
        try:
            client_ip = self._get_client_ip(request)

            if not (client_ip in self.trusted_ips):
                # Check if IP is banned
                if await self._is_banned(client_ip):
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "detail": "Your IP has been temporarily banned due to suspicious activity. Please try again later."
                        }
                    )
                
                # Check for suspicious patterns
                if await self._detect_suspicious_pattern(request, client_ip):
                    await self._record_violation(client_ip)
                    
                    violations = await self._get_violations(client_ip)
                    if violations >= self.max_violations:
                        await self._ban_ip(client_ip)
                        return JSONResponse(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            content={
                                "detail": "Too many violations detected. Your IP has been temporarily banned."
                            }
                        )
        except Exception as e:
            # Critical safety: if middleware logic fails, log it but don't crash the request
            logger.error(f"DDoS Middleware internal failure: {e}")
            
        # Proceed to the next middleware/endpoint
        # This is now outside the try/except block that covers the middleware logic
        return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        return request.client.host if request.client else "unknown"
    
    async def _is_banned(self, ip: str) -> bool:
        if self.redis_client:
            try:
                ban_key = f"ddos:ban:{ip}"
                return bool(await self.redis_client.exists(ban_key))
            except Exception as e:
                logger.warning(f"Redis error in _is_banned: {e}")

        if ip in self.banned_ips:
            if datetime.now(timezone.utc) < self.banned_ips[ip]:
                return True
            del self.banned_ips[ip]
        return False
    
    async def _detect_suspicious_pattern(self, request: Request, ip: str) -> bool:
        path = request.url.path.lower()
        # Specifically avoid blocking our own admin dashboard
        if "/api/v1/admin" in path:
            return False

        suspicious_paths = ["/phpmyadmin", "/.env", "/wp-admin", "/.git", "/config", "/setup", "/install"]
        if any(susp in path for susp in suspicious_paths):
            return True
        
        # Block generic "/admin" only if it's NOT our API
        if path == "/admin" or path.startswith("/admin/"):
            return True

        return False
    
    async def _record_violation(self, ip: str):
        if self.redis_client:
            try:
                violation_key = f"ddos:violations:{ip}"
                await self.redis_client.incr(violation_key)
                await self.redis_client.expire(violation_key, int(self.violation_window.total_seconds()))
                return
            except Exception as e:
                logger.warning(f"Redis error in _record_violation: {e}")
        
        self.ip_violations[ip] = self.ip_violations.get(ip, 0) + 1
    
    async def _get_violations(self, ip: str) -> int:
        if self.redis_client:
            try:
                violation_key = f"ddos:violations:{ip}"
                v = await self.redis_client.get(violation_key)
                return int(v) if v else 0
            except Exception as e:
                logger.warning(f"Redis error in _get_violations: {e}")
        return self.ip_violations.get(ip, 0)
    
    async def _ban_ip(self, ip: str):
        if self.redis_client:
            try:
                ban_key = f"ddos:ban:{ip}"
                await self.redis_client.setex(ban_key, int(self.ban_duration.total_seconds()), "1")
                return
            except Exception as e:
                logger.warning(f"Redis error in _ban_ip: {e}")
        
        self.banned_ips[ip] = datetime.now(timezone.utc) + self.ban_duration
