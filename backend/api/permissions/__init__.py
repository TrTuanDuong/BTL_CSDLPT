from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsCentralAdmin(BasePermission):
    """Central server administrator role."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", None) == "admin" or user.is_superuser)
        )


class IsBranchStaffOrCentralAdmin(BasePermission):
    """Branch operators (staff) and central admins can manage branch resources."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        role = getattr(user, "role", None)
        return role in {"admin", "staff"} or user.is_superuser


class ReadOnlyOrCentralAdmin(BasePermission):
    """Public read access, write only for central admins."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", None) == "admin" or user.is_superuser)
        )


class ReadOnlyOrBranchStaffOrCentralAdmin(BasePermission):
    """Public read access, write for branch staff and central admins."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        role = getattr(user, "role", None)
        return role in {"admin", "staff"} or user.is_superuser


__all__ = [
    "IsCentralAdmin",
    "IsBranchStaffOrCentralAdmin",
    "ReadOnlyOrCentralAdmin",
    "ReadOnlyOrBranchStaffOrCentralAdmin",
]
