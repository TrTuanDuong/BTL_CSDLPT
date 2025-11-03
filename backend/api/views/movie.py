from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Exists, OuterRef
from ..models import Movie, Genre, Showtime
from ..serializers.movie import MovieSerializer, MovieCreateSerializer, GenreSerializer


class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["rating"]
    search_fields = ["title", "description"]
    ordering_fields = ["release_date", "title"]
    ordering = ["-release_date"]

    def get_queryset(self):
        queryset = super().get_queryset()

        # ✅ LOGIC MỚI: Chỉ hiển thị phim còn suất chiếu trong tương lai
        # (Trừ khi là admin)
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            # Lọc phim có ít nhất 1 suất chiếu chưa bắt đầu
            queryset = queryset.filter(
                Exists(
                    Showtime.objects.filter(
                        movie=OuterRef("pk"), start_time__gte=timezone.now()
                    )
                )
            )

        return queryset

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MovieCreateSerializer
        return MovieSerializer

    def get_permissions(self):
        # Cho phép xem danh sách và chi tiết phim không cần đăng nhập
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [AllowAny]
    ordering = ["name"]
