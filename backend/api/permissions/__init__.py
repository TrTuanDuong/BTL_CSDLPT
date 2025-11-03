# Import permissions từ file permissions.py chính
from ..permissions import IsAdminUser, IsOwnerOrAdmin, ReadOnlyOrAdmin

__all__ = [
    "IsAdminUser",
    "IsOwnerOrAdmin",
    "ReadOnlyOrAdmin",
]
