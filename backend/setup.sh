#!/bin/bash

echo "🎬 Cinema BTL - Quick Setup"
echo "==========================="

DB_NAME="cinema_btl"
DB_USER="trantuanduong"

# 1. Drop & Create DB
echo "📦 Setting up database..."
psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
psql -U $DB_USER -d $DB_NAME -f schema.sql > /dev/null

# 2. Clean migrations
echo "🧹 Cleaning migrations..."
rm -rf api/migrations/0001_initial.py 2>/dev/null
rm -rf api/migrations/__pycache__/0001_* 2>/dev/null

# 3. Fake migrate
echo "⚙️  Faking migrations..."
python manage.py makemigrations > /dev/null 2>&1
python manage.py migrate --fake-initial > /dev/null 2>&1

# 4. Create admin
echo "👤 Creating admin user..."
python manage.py shell <<EOF
from api.models import User
from django.contrib.auth.hashers import make_password

if not User.objects.filter(username='admin').exists():
    User.objects.create(
        username='admin',
        email='admin@cinema.com',
        password=make_password('admin123'),
        full_name='Administrator',
        role='admin',
        is_staff=True,
        is_superuser=True,
        is_active=True
    )
    print("✅ Admin created")
else:
    print("✅ Admin exists")
EOF

echo ""
echo "✅ Setup complete!"
echo "==================="
echo "Database: $DB_NAME"
echo "Admin: admin / admin123"
echo ""
echo "Run: python manage.py runserver"
