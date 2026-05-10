#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


# Patch mssql-django để hỗ trợ SSL options
def patch_mssql_django():
    """Patch mssql-django để thêm Encrypt=no"""
    try:
        import pyodbc
        original_connect = pyodbc.connect
        
        def patched_connect(connection_string, **kwargs):
            # Nếu chưa có Encrypt, thêm Encrypt=no
            if 'Encrypt' not in connection_string:
                if connection_string.endswith(';'):
                    connection_string += 'Encrypt=no;'
                else:
                    connection_string += ';Encrypt=no;'
            return original_connect(connection_string, **kwargs)
        
        pyodbc.connect = patched_connect
    except Exception:
        pass


patch_mssql_django()


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
