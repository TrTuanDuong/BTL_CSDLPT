"""
Custom MSSQL backend untuk Django dengan hỗ trợ SSL options
"""
from mssql.backend import DatabaseWrapper as MSSQLDatabaseWrapper
import pyodbc


class DatabaseWrapper(MSSQLDatabaseWrapper):
    """Custom MSSQL backend với SSL options tùy chỉnh"""
    
    def get_new_connection(self, conn_params):
        """Override để thêm Encrypt=no vào connection string"""
        # Gọi parent method trước để lấy connection params
        conn_string_parts = []
        
        # Build connection string
        driver = 'ODBC Driver 18 for SQL Server'
        server = conn_params.get('host', '.')
        port = conn_params.get('port', 1433)
        database = conn_params.get('database', '')
        user = conn_params.get('user', '')
        password = conn_params.get('password', '')
        
        conn_string = (
            f'Driver={{{driver}}};'
            f'Server={server},{port};'
            f'Database={database};'
            f'UID={user};'
            f'PWD={password};'
            f'Encrypt=no;'
        )
        
        return pyodbc.connect(conn_string, **conn_params.get('extra', {}))
