
"""Add ChatMessage model

Revision ID: ab60c4070c3a
Revises: a94cbd1c7ad9
Create Date: 2026-02-22 11:08:37.912795

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab60c4070c3a'
down_revision: Union[str, None] = 'a94cbd1c7ad9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
