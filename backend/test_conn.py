import pymysql
from app.core.config import settings

def test_conn():
    print("Database URL:", settings.database_url)
    try:
        # Connect to MySQL server without database first to check if database exists
        conn = pymysql.connect(
            host=settings.mysql_host,
            port=settings.mysql_port,
            user=settings.mysql_user,
            password=settings.mysql_password
        )
        print("Successfully connected to MySQL server!")
        with conn.cursor() as cursor:
            cursor.execute("SHOW DATABASES")
            databases = [db[0] for db in cursor.fetchall()]
            print("Existing databases:", databases)
            
            if settings.mysql_database not in databases:
                print(f"Database '{settings.mysql_database}' does not exist. Creating it...")
                cursor.execute(f"CREATE DATABASE {settings.mysql_database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                print(f"Database '{settings.mysql_database}' created successfully.")
            else:
                print(f"Database '{settings.mysql_database}' already exists.")
        conn.close()
        
        # Now connect to the database itself and check tables
        conn_db = pymysql.connect(
            host=settings.mysql_host,
            port=settings.mysql_port,
            user=settings.mysql_user,
            password=settings.mysql_password,
            database=settings.mysql_database
        )
        with conn_db.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = [t[0] for t in cursor.fetchall()]
            print("Existing tables:", tables)
        conn_db.close()
        
    except Exception as e:
        print("Error connecting to MySQL:", e)

if __name__ == "__main__":
    test_conn()
