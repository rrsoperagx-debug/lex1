# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base
from app.db.models import User, UserProfile, FinanceMetric, TrafficMetric, SystemSetting, AuditLog, FormTemplate, FormFieldMapping, LegalTemplate
from app.models.template import Template
from app.models.generated_document import GeneratedDocument
