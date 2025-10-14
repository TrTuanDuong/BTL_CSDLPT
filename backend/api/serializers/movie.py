from rest_framework import serializers
from ..models import Movie, Genre, MovieGenre

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']

class MovieSerializer(serializers.ModelSerializer):
    genres = serializers.SerializerMethodField()
    
    class Meta:
        model = Movie
        fields = ['id', 'title', 'duration_min', 'rating', 'release_date',
                'description', 'poster_url', 'genres']
    
    def get_genres(self, obj):
        movie_genres = MovieGenre.objects.filter(movie=obj).select_related('genre')
        return [mg.genre.name for mg in movie_genres]

class MovieCreateSerializer(serializers.ModelSerializer):
    genre_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Movie
        fields = ['title', 'duration_min', 'rating', 'release_date', 
                'description', 'poster_url', 'genre_ids']
    
    def create(self, validated_data):
        genre_ids = validated_data.pop('genre_ids', [])
        movie = Movie.objects.create(**validated_data)
        
        # Thêm genres cho movie
        for genre_id in genre_ids:
            try:
                genre = Genre.objects.get(id=genre_id)
                MovieGenre.objects.create(movie=movie, genre=genre)
            except Genre.DoesNotExist:
                continue
        
        return movie