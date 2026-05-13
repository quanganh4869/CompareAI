"""Documents: create unified documents table.

Revision ID: 9c3a7b1d2e4f
Revises: c8b9d7f4a102
Create Date: 2026-04-13 09:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "9c3a7b1d2e4f"
down_revision: Union[str, None] = "c8b9d7f4a102"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("owner_user_id", sa.Integer(), nullable=False),
        sa.Column("document_type", sa.String(length=20), nullable=False),
        sa.Column("file_name", sa.String(length=512), nullable=False),
        sa.Column("storage_key", sa.String(length=1024), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("size_bytes", sa.BigInteger(), nullable=True),
        sa.Column(
            "source",
            sa.String(length=50),
            nullable=False,
            server_default=sa.text("'UPLOADED'"),
        ),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "document_type IN ('CV', 'JD')",
            name="ck_documents_document_type",
        ),
    )
    op.create_index(
        "ix_documents_storage_key", "documents", ["storage_key"], unique=True
    )
    op.create_index(
        "ix_documents_owner_type_created_at",
        "documents",
        ["owner_user_id", "document_type", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_documents_owner_type_created_at", table_name="documents")
    op.drop_index("ix_documents_storage_key", table_name="documents")
    op.drop_table("documents")
