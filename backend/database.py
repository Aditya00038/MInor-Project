import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error
from contextlib import contextmanager

load_dotenv()

class Database:
    def __init__(self):
        self.host = os.getenv("DB_HOST", "localhost")
        self.user = os.getenv("DB_USER", "root")
        self.password = os.getenv("DB_PASSWORD", "")
        self.database = os.getenv("DB_NAME", "citizen_app_db")
        self.port = int(os.getenv("DB_PORT", 3306))

    def get_connection(self):
        """Get a connection to the database"""
        try:
            connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=self.port
            )
            return connection
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            raise

    @contextmanager
    def get_db(self):
        """Context manager for database connections"""
        conn = self.get_connection()
        try:
            yield conn
        finally:
            conn.close()

    def execute_query(self, query, params=None, fetch=False):
        """Execute a query and optionally fetch results"""
        with self.get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            try:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                if fetch:
                    result = cursor.fetchall()
                else:
                    conn.commit()
                    result = cursor.rowcount
                
                return result
            except Error as e:
                conn.rollback()
                print(f"Query Error: {e}")
                raise
            finally:
                cursor.close()

    def execute_many(self, query, data):
        """Execute multiple queries"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            try:
                cursor.executemany(query, data)
                conn.commit()
                return cursor.rowcount
            except Error as e:
                conn.rollback()
                print(f"Batch Query Error: {e}")
                raise
            finally:
                cursor.close()

# Initialize database instance
db = Database()
