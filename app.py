import os
from flask import Flask, render_template, request
from dotenv import load_dotenv


load_dotenv("keys.env")

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

@app.route("/")
def home_page():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)