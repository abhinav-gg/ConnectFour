from flask import *
from flask_socketio import *
from ConnectFour import *
import os

app = Flask(__name__)	
socketio = SocketIO(app)


@app.route("/", strict_slashes=False, methods=["GET"])
def home():
	return "a"




#167 133
def main():
	SCORES = [21, 11, 0]
	for _ in range(300):
		p1 = Player("gray", "Player 1")
		p1 = AI("1", "Player 1")
		x = Player("Tan", "Player 2")
		x = AI("2", "Player 2")
		g = Game([p1, x])
		SCORES[g.RunGame()] += 1
		# while input("R?") != "y":
		# 	continue
		os.system("cls")
	print(SCORES)


if __name__ == "__main__":
	#app.run(host="0.0.0.0", port=8080)
	main()