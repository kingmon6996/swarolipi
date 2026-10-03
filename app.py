import os
from pathlib import Path

from flask import Flask, jsonify, send_file
from flask_cors import CORS

from database import init_db
from route.face import face_blueprint
from route.human import MAX_WEBSOCKET_MESSAGE_BYTES, human_blueprint
from route.profile import profile_blueprint

from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file
app = Flask(__name__)
CORS(app)

app.config["SOCK_SERVER_OPTIONS"] = {
    "max_message_size": MAX_WEBSOCKET_MESSAGE_BYTES,
}

app.register_blueprint(face_blueprint, url_prefix="/face")
app.register_blueprint(human_blueprint, url_prefix="/human")
app.register_blueprint(profile_blueprint, url_prefix="/profile")

# Initialize PostgreSQL / SQLModel database tables
init_db()


@app.route("/")
def index():
    return send_file(Path(__file__).resolve().with_name("index.html"))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5634")),
        debug=False,
        threaded=True,
    )
