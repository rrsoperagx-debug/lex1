
"""Add 2FA support to user

Revision ID: 490118ede771
Revises: 2f1b58d1647e
Create Date: 2026-03-01 07:11:02.315447

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '490118ede771'
down_revision: Union[str, None] = '2f1b58d1647e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
