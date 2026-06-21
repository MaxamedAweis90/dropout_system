import sqlalchemy
from sqlalchemy import create_engine

engine = create_engine("mysql+pymysql://student_app:student_app_password@127.0.0.1:3306/student_dropout")
try:
    with engine.connect() as conn:
        result = conn.execute(sqlalchemy.text("SHOW TABLES"))
        print([row[0] for row in result])
except Exception as e:
    print("student_app error:", e)

engine2 = create_engine("mysql+pymysql://root:@127.0.0.1:3306/student_dropout")
try:
    with engine2.connect() as conn:
        result = conn.execute(sqlalchemy.text("SHOW TABLES"))
        print("root tables:", [row[0] for row in result])
except Exception as e:
    print("root error:", e)
