import os
from flask import Flask, render_template, request # type: ignore
from dotenv import load_dotenv # type: ignore


load_dotenv("keys.env")

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

@app.route("/")
def home_page():
    return render_template('index.html')

@app.route("/about")
def about_page():
    return render_template('about.html')

@app.route("/africa")
def africa_page():
    return render_template('africa.html')

@app.route("/connect")
def connect_page():
    return render_template('connect.html')

if __name__ == '__main__':
    app.run(debug=True)