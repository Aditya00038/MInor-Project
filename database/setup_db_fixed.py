#!/usr/bin/env python3
"""
CitizenApp Database Setup Script - Fixed Version
Creates MySQL database and tables from schema.sql
"""

import mysql.connector
from mysql.connector import Error
import sys
import getpass

def create_database(password=None):
    """Create database from schema_fixed.sql"""
    
    try:
        # Read schema file
        with open('d:\\Minor Project\\database\\schema_fixed.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        print("\n" + "=" * 70)
        print("🗄️  CITIZENAPP DATABASE SETUP")
        print("=" * 70)
        
        # Connect to MySQL
        try:
            if password:
                connection = mysql.connector.connect(
                    host='localhost',
                    user='root',
                    password=password
                )
            else:
                try:
                    connection = mysql.connector.connect(
                        host='localhost',
                        user='root'
                    )
                except Error as e:
                    if '1045' in str(e):  # Access denied
                        print("\n⚠️  MySQL root account requires a password.")
                        password = getpass.getpass("Enter MySQL root password: ")
                        connection = mysql.connector.connect(
                            host='localhost',
                            user='root',
                            password=password
                        )
                    else:
                        raise
        except Error as e:
            print(f"\n❌ Connection failed: {e}")
            return False
        
        cursor = connection.cursor()
        
        # Execute full schema
        print("\n📊 Creating database structure...")
        print("-" * 70)
        
        try:
            # Split by statements and execute
            statements = []
            current_stmt = ""
            
            for line in schema_sql.split('\n'):
                line = line.strip()
                if not line or line.startswith('--'):
                    continue
                current_stmt += " " + line
                if line.endswith(';'):
                    statements.append(current_stmt[:-1])  # Remove trailing ;
                    current_stmt = ""
            
            for idx, statement in enumerate(statements, 1):
                statement = statement.strip()
                if not statement:
                    continue
                    
                try:
                    cursor.execute(statement)
                    
                    # Provide feedback
                    if 'CREATE DATABASE' in statement.upper():
                        print("✓ Database created: citizen_app_db")
                    elif 'CREATE TABLE' in statement.upper():
                        table_name = statement.split('CREATE TABLE')[1].split('(')[0].strip()
                        print(f"✓ Table created: {table_name}")
                    elif 'INSERT INTO' in statement.upper():
                        print(f"✓ Sample data inserted")
                    elif 'CREATE OR REPLACE VIEW' in statement.upper():
                        view_name = statement.split('CREATE OR REPLACE VIEW')[1].split('AS')[0].strip()
                        print(f"✓ View created: {view_name}")
                        
                except Error as e:
                    if 'already exists' in str(e).lower():
                        print(f"ℹ️  Skipped (already exists): {statement[:60]}...")
                    else:
                        print(f"⚠️  Skipped error: {statement[:60]}...")
                        print(f"   Error: {str(e)[:80]}")
            
            connection.commit()
            
        except Exception as e:
            print(f"\n❌ Execution error: {e}")
            connection.close()
            return False
        
        # Verify database was created
        print("\n" + "-" * 70)
        print("✅ Database setup complete!")
        print("-" * 70)
        
        try:
            cursor.execute("USE citizen_app_db")
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            print(f"\n📋 Tables Created ({len(tables)}):")
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f"   ✓ {table[0]:<20} ({count} rows)")
            
            # Show sample users
            cursor.execute("SELECT id, name, email, points, badge FROM users ORDER BY points DESC")
            users = cursor.fetchall()
            
            if users:
                print(f"\n👥 Sample Users Loaded:")
                for user in users:
                    print(f"   • {user[1]:<20} | {user[2]:<25} | Points: {user[3]:<4} | Badge: {user[4]}")
            
            # Show views
            cursor.execute("SHOW VIEWS")
            views = cursor.fetchall()
            if views:
                print(f"\n📊 Database Views ({len(views)}):")
                for view in views:
                    print(f"   ✓ {view[0]}")
            
        except Error as e:
            print(f"⚠️  Could not verify tables: {e}")
        
        cursor.close()
        connection.close()
        
        # Success message
        print("\n" + "=" * 70)
        print("🎉 DATABASE READY!")
        print("=" * 70)
        print("\n📌 Connection Details:")
        print("   Host: localhost")
        print("   Database: citizen_app_db")
        print("   User: root")
        print("   Port: 3306")
        
        print("\n📌 Backend Setup (Python/FastAPI):")
        print("   1. cd backend")
        print("   2. python -m venv venv")
        print("   3. venv\\Scripts\\activate")
        print("   4. pip install -r requirements.txt")
        print("   5. python -m uvicorn main:app --reload")
        print("\n   📖 API Docs: http://localhost:8000/docs")
        
        print("\n📌 Frontend Apps:")
        print("   • CitizenApp: npm run dev (port 5173)")
        print("   • WorkersApp: npm run dev (port 5174)")
        
        print("\n" + "=" * 70 + "\n")
        return True
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: File not found - {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    password = None
    if len(sys.argv) > 1:
        password = sys.argv[1]
    
    success = create_database(password)
    sys.exit(0 if success else 1)
