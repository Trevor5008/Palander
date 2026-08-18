"""add user password hash

Revision ID: 003
Revises: 002
Create Date: 2026-08-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

revision: str = "003"
down_revision: Union[str, Sequence[str], None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEV_PASSWORD_HASH = (
    "$2b$12$uQ.fFeIqiMVwL98MRtCT0eQDEnxqIocs5ibDarQzTE2DegGAfuqly"
)


def upgrade() -> None:
    op.add_column("users", sa.Column("password_hash", sa.String(), nullable=True))
    connection = op.get_bind()
    connection.execute(
        text("UPDATE users SET password_hash = :hash WHERE username = 'dev'"),
        {"hash": DEV_PASSWORD_HASH},
    )
    op.alter_column("users", "password_hash", nullable=False)


def downgrade() -> None:
    op.drop_column("users", "password_hash")
