from flask import Flask
import psycopg2

app = Flask(__name__)

# TODO: اطلاعات اتصال به دیتابیس را از تنظیمات بخوانید
conn = psycopg2.connect(
    dbname='central_db', user='postgres', password='password', host='localhost', port='5432'
)

@app.route('/')
def index():
    return 'Central Server Backend is running.'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 