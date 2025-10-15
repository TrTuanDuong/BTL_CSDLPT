from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Chỉ admin mới được phép"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class IsOwnerOrAdmin(BasePermission):
    """Chỉ owner hoặc admin mới được phép"""

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.user == request.user


class ReadOnlyOrAdmin(BasePermission):
    """Read-only cho mọi người, write cho admin"""

    def has_permission(self, request, view):
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True
        return request.user and request.user.is_staff
