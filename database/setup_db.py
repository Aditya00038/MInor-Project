#!/usr/bin/env python3
"""
CitizenApp Database Setup Script
Creates MySQL database and tables from schema.sql
"""

import mysql.connector
from mysql.connector import Error
import sys

def create_database():
    """Create database from schema.sql"""
    
    try:
        # Read schema file
        with open('d:\\Minor Project\\database\\schema.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        print("📊 Creating MySQL Database...")
        print("=" * 60)
        
        # Connect to MySQL (no database selected initially)
        try:
            connection = mysql.connector.connect(
                host='localhost',
                user='root',
                password=''  # No password by default
            )
        except Error as e:
            print(f"❌ Connection Error: {e}")
            print("\n⚠️  Trying with password prompt...")
            password = input("Enter MySQL root password: ")
            connection = mysql.connector.connect(
                host='localhost',
                user='root',
                password=password
            )
        
        cursor = connection.cursor()
        
        # Split and execute statements
        statements = schema_sql.split(';')
        count = 0
        
        for statement in statements:
            statement = statement.strip()
            if statement and not statement.startswith('--') and not statement.startswith('/*'):
                try:
                    cursor.execute(statement)
                    if 'CREATE' in statement.upper() or 'INSERT' in statement.upper():
                        count += 1
                        print(f"✓ Executed: {statement[:70]}...")
                except Error as e:
                    if 'already exists' in str(e).lower():
                        print(f"ℹ️  Skipping (already exists): {statement[:50]}...")
                    else:
                        print(f"⚠️  Error: {e}")
        
        connection.commit()
        
        print("\n" + "=" * 60)
        print("✅ Database Setup Complete!")
        print("=" * 60)
        
        # Verify tables
        cursor.execute("USE citizen_app_db")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print(f"\n📋 Tables Created ({len(tables)}):")
        for table in tables:
            print(f"  ✓ {table[0]}")
        
        # Verify sample data
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"\n👥 Sample Users: {user_count}")
        
        cursor.execute("SELECT name, email, points, badge FROM users ORDER BY points DESC")
        users = cursor.fetchall()
        for user in users:
            print(f"  • {user[0]}: {user[1]} ({user[2]} points - {user[3]})")
        
        # Close connections
        cursor.close()
        connection.close()
        
        print("\n" + "=" * 60)
        print("🎉 Database is ready for use!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Set up backend: cd backend && python -m venv venv")
        print("2. Activate: venv\\Scripts\\activate")
        print("3. Install: pip install -r requirements.txt")
        print("4. Run: python -m uvicorn main:app --reload")
        print("\n📖 API Documentation: http://localhost:8000/docs")
        
        return True
        
    except FileNotFoundError:
        print("❌ Error: schema.sql not found at d:\\Minor Project\\database\\schema.sql")
        return False
    except Error as e:
        print(f"❌ Database Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    success = create_database()
    sys.exit(0 if success else 1)
