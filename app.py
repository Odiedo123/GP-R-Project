import os
from flask import Flask, render_template, request # type: ignore
from dotenv import load_dotenv # type: ignore


load_dotenv("keys.env")

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

@app.route("/")
def home_page():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)