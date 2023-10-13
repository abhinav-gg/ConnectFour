from flask import *
from flask_socketio import *
from ConnectFour import *

app = Flask(__name__)	
socketio = SocketIO(app)


@app.route("/", strict_slashes=False, methods=["GET"])
def home():
	return "a"





def main():
	X = Game()
	X.run()


if __name__ == "__main__":
	#app.run(host="0.0.0.0", port=8080)
	main()