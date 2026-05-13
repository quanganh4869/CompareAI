"""seed_master_data

Revision ID: c8b9d7f4a102
Revises: 468ee9b25b80
Create Date: 2026-04-02 16:10:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c8b9d7f4a102"
down_revision: Union[str, None] = "468ee9b25b80"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed master data for auth providers and subscription plans."""

    op.execute(
        """
        INSERT INTO auth_providers (provider_name, is_active)
        VALUES ('google', TRUE)
        ON CONFLICT (provider_name) DO NOTHING
        """
    )

    op.execute(
        """
        INSERT INTO subscriptions_plans (name, price, description)
        VALUES
            ('FREE', 0, 'Free plan'),
            ('PRO', 199000, 'Professional plan'),
            ('ENTERPRISE', 499000, 'Enterprise plan')
        ON CONFLICT (name) DO UPDATE
        SET
            price = EXCLUDED.price,
            description = EXCLUDED.description
        """
    )


def downgrade() -> None:
    """Remove seeded master data when not referenced."""

    op.execute(
        """
        DELETE FROM subscriptions_plans sp
        WHERE sp.name IN ('FREE', 'PRO', 'ENTERPRISE')
          AND NOT EXISTS (
              SELECT 1 FROM users u WHERE u.plan_id = sp.id
          )
        """
    )

    op.execute(
        """
        DELETE FROM auth_providers ap
        WHERE ap.provider_name = 'google'
          AND NOT EXISTS (
              SELECT 1 FROM auth_identities ai WHERE ai.provider_id = ap.id
          )
        """
    )
