from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from api.models.user import User
from api.permissions import IsCentralAdmin
from api.serializers.user import (
    UserSerializer,
    AdminUserSerializer,
    UserCreateSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return User.objects.none()

        if getattr(self.request.user, "role", None) == User.ADMIN or self.request.user.is_superuser:
            return User.objects.all().order_by("-date_joined")
        return User.objects.filter(id=self.request.user.id)
    
    def get_permissions(self):
        """Phân quyền theo action"""
        if self.action == 'create':
            permission_classes = [AllowAny]
        elif self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsCentralAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['list', 'retrieve', 'update', 'partial_update']:
            return AdminUserSerializer
        elif self.action == 'update_profile':
            return UserProfileUpdateSerializer
        elif self.action == 'change_password':
            return ChangePasswordSerializer
        return UserSerializer
    
    def create(self, request):
        """Đăng ký user mới"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Tạo JWT token cho user mới
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Đăng ký thành công',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Đăng xuất - blacklist refresh token"""
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Đăng xuất thành công'})
        except Exception as e:
            return Response({'error': 'Token không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Lấy thông tin profile user hiện tại"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Cập nhật thông tin profile"""
        serializer = UserProfileUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Cập nhật thông tin thành công',
            'user': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Đổi mật khẩu"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Mật khẩu cũ không đúng'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Đổi mật khẩu thành công'})
    
    @action(detail=False, methods=['get'])
    def my_bookings(self, request):
        """Lấy danh sách booking của user"""
        return Response({
            'message': 'Chức năng booking sẽ được implement sau',
            'bookings': []
        })