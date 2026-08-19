"""seed dev user and domains

Revision ID: 002
Revises: 001
Create Date: 2026-07-21

"""
from typing import Sequence, Union

from alembic import op

revision: str = "002"
down_revision: Union[str, Sequence[str], None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO users (id, username, email)
        VALUES (1, 'dev', 'dev@local')
        ON CONFLICT (id) DO NOTHING
        """
    )
    op.execute(
        """
        INSERT INTO domains (name, user_id)
        SELECT v.name, 1
        FROM (VALUES ('career'), ('fitness'), ('finances'), ('school')) AS v(name)
        WHERE NOT EXISTS (
            SELECT 1 FROM domains d WHERE d.user_id = 1 AND d.name = v.name
        )
        """
    )
    op.execute("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))")
    op.execute("SELECT setval('domains_id_seq', (SELECT COALESCE(MAX(id), 1) FROM domains))")


def downgrade() -> None:
    op.execute("DELETE FROM domains WHERE user_id = 1")
    op.execute("DELETE FROM users WHERE id = 1")
