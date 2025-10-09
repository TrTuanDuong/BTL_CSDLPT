from rest_framework import serializers
from django.contrib.auth import authenticate
from api.models.user import User

class UserSerializer(serializers.ModelSerializer):
    """Serializer cho hiển thị thông tin user"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'phone', 'role', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'role']

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer cho đăng ký user mới"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'full_name', 'phone', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Mật khẩu xác nhận không khớp")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    """Serializer cho đăng nhập"""
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Tên đăng nhập hoặc mật khẩu không đúng")
            if not user.is_active:
                raise serializers.ValidationError("Tài khoản đã bị khóa")
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu")

class ChangePasswordSerializer(serializers.Serializer):
    """Serializer cho đổi mật khẩu"""
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Mật khẩu mới xác nhận không khớp")
        return attrs