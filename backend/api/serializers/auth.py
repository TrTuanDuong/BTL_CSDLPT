from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed
from django.db import connection
from rest_framework_simplejwt.tokens import RefreshToken
from api.authentication import LegacyUserProxy, normalize_legacy_role

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @staticmethod
    def _map_legacy_role(raw_role):
        return normalize_legacy_role(raw_role)

    @classmethod
    def _authenticate_from_legacy_table(cls, username, password):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT TOP 1 user_id, full_name, email, password, phone, role
                FROM dbo.users
                WHERE user_id = %s OR email = %s
                """,
                [username, username],
            )
            row = cursor.fetchone()

        if not row:
            raise AuthenticationFailed("Tên đăng nhập hoặc mật khẩu không đúng")

        user_id, full_name, email, raw_password, phone, raw_role = row
        if str(raw_password) != str(password):
            raise AuthenticationFailed("Tên đăng nhập hoặc mật khẩu không đúng")

        mapped_role = cls._map_legacy_role(raw_role)
        return LegacyUserProxy(
            id=str(user_id),
            username=str(user_id),
            email=email or f"{user_id}@local",
            full_name=full_name,
            phone=phone,
            role=mapped_role,
            password=str(raw_password),
        )

    @classmethod
    def get_token(cls, user):
        token = RefreshToken()
        token['legacy_user_id'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['phone'] = user.phone
        
        return token
    
    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        if not username or not password:
            raise AuthenticationFailed("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu")

        self.user = self._authenticate_from_legacy_table(username, password)
        refresh = self.get_token(self.user)

        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
        
        # Thêm thông tin user vào response
        data['user'] = {
            'id': str(self.user.id),
            'username': self.user.username,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
        }
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer