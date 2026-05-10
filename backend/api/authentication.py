from dataclasses import dataclass

from django.db import connection
from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication


def normalize_legacy_role(raw_role):
    if not raw_role:
        return "user"

    role = str(raw_role).strip().lower()
    if role in {"admin", "qu?n tr?", "quản trị", "qu?n tr? viên", "quản trị viên"}:
        return "admin"
    if role in {"staff", "nhân viên", "nhan vien"}:
        return "staff"
    return "user"


@dataclass
class LegacyUserProxy:
    id: str
    username: str
    email: str
    full_name: str | None
    phone: str | None
    role: str
    password: str

    is_superuser: bool = False
    is_active: bool = True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_staff(self):
        return self.role == "admin" or self.is_superuser

    def check_password(self, raw_password):
        return str(self.password) == str(raw_password)

    def set_password(self, raw_password):
        self.password = str(raw_password)

    def save(self, *args, **kwargs):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE dbo.users
                SET full_name = %s,
                    email = %s,
                    phone = %s,
                    role = %s,
                    password = %s
                WHERE user_id = %s
                """,
                [self.full_name, self.email, self.phone, self.role, self.password, self.id],
            )

    @classmethod
    def from_row(cls, row):
        user_id, full_name, email, raw_password, phone, raw_role = row
        return cls(
            id=str(user_id),
            username=str(user_id),
            email=email or "",
            full_name=full_name,
            phone=phone,
            role=normalize_legacy_role(raw_role),
            password=str(raw_password),
        )


def fetch_legacy_user(identifier):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT TOP 1 user_id, full_name, email, password, phone, role
            FROM dbo.users
            WHERE user_id = %s OR email = %s
            """,
            [identifier, identifier],
        )
        row = cursor.fetchone()

    if not row:
        return None

    return LegacyUserProxy.from_row(row)


class LegacyDatabaseJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        legacy_user_id = validated_token.get("legacy_user_id") or validated_token.get("username")
        if not legacy_user_id:
            raise exceptions.AuthenticationFailed("Token không chứa thông tin người dùng hợp lệ")

        user = fetch_legacy_user(legacy_user_id)
        if user is None:
            raise exceptions.AuthenticationFailed("Người dùng không còn tồn tại")

        return user