from rest_framework.routers import DefaultRouter
from django.urls import path, include
from api.views.user import UserViewSet
from api.views.movie import MovieViewSet, GenreViewSet
from api.views.auditorium import AuditoriumViewSet, SeatViewSet
from api.views.showtime import ShowtimeViewSet
from api.views.booking import BookingViewSet, TicketViewSet
from api.views.payment import PaymentViewSet

# Router cho API endpoints
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'movies', MovieViewSet)
router.register(r'genres', GenreViewSet)
router.register(r'auditoriums', AuditoriumViewSet)
router.register(r'seats', SeatViewSet)
router.register(r'showtime', ShowtimeViewSet)
router.register(r'booking', BookingViewSet)
router.register(r'ticket', TicketViewSet)
router.register(r'payments', PaymentViewSet)

urlpatterns = [
    # API endpoints
    path('api/', include(router.urls)),
]