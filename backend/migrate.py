import pymysql
conn = pymysql.connect(host='localhost', user='root', password='', database='student_dropout')
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE users ADD COLUMN status ENUM('Active', 'Inactive') DEFAULT 'Active';")
except Exception as e:
    print(e)
try:
    cursor.execute("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Dean', 'Head of Department', 'Teacher', 'Clerk', 'Counselor') NOT NULL;")
except Exception as e:
    print(e)
conn.commit()
conn.close()
print("done")
