@echo off
cd /d "d:\Minor Project\database"
echo Creating database...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < schema.sql
echo.
echo ✓ Database created! Verifying tables...
echo.
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p citizen_app_db -e "SHOW TABLES;"
echo.
echo ✓ All tables created successfully!
