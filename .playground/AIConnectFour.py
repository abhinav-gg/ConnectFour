
# Code me connect four in python using tkinter GUI
# imports
import tkinter as tk
import tkinter
from tkinter import messagebox


class Game:
    def __init__(self):
        self.board = [[0 for _ in range(7)] for _ in range(6)]
        self.MaxCon = 4
        self.turn = 1
        self.winner = None
        self.draw = False
        self.moves = 0
    
    def make_move(self, column):
        if self.winner or self.draw:
            return
        
        if self.board[0][column] != 0:
            return
        
        for row in range(5, -1, -1):
            if self.board[row][column] == 0:
                self.board[row][column] = self.turn
                self.moves += 1
                self.check_win(row, column)
                self.turn = 1 if self.turn == 2 else 2
                return
            

    # write a function that takes a row and a column and checks if there are 4 in a row
    def check_win(self, row, column):
        # Check horizontal
        count = 0
        for j in range(7):
            if self.board[row][j] == self.turn:
                count += 1
                if count >= self.MaxCon:
                    self.winner = self.turn
                    return
            else:
                count = 0

        # Check vertical
        count = 0
        for i in range(6):
            if self.board[i][column] == self.turn:
                count += 1
                if count >= self.MaxCon:
                    self.winner = self.turn
                    return
            else:
                count = 0

        # Check diagonal (positive slope)
        count = 0
        r = row
        c = column
        while r > 0 and c > 0:
            r -= 1
            c -= 1
        while r < 6 and c < 7:
            if self.board[r][c] == self.turn:
                count += 1
                if count >= self.MaxCon:
                    self.winner = self.turn
                    return
            else:
                count = 0
            r += 1
            c += 1

        # Check diagonal (negative slope)
        count = 0
        r = row
        c = column
        while r > 0 and c < 6:
            r -= 1
            c += 1
        while r < 6 and c >= 0:
            if self.board[r][c] == self.turn:
                count += 1
                if count >= self.MaxCon:
                    self.winner = self.turn
                    return
            else:
                count = 0
            r += 1
            c -= 1

        # Check for draw
        if self.moves == 42:
            self.draw = True
        


class GUI:

    def __init__(self):
        self.root = tk.Tk()
        self.score = [0, 0]
        self.root.title("Connect Four")
        self.root.geometry("700x600")
        self.root.resizable(False, False)
        self.game = Game()
        self.buttons = []
        self.draw_board()
        self.root.mainloop()

    def draw_board(self):
        # add the score to the top of screen
        for i in range(6):
            row = []
            for j in range(7):
                button = tk.Button(self.root, text="", width=10, height=5, command=lambda x=j: self.make_move(x))
                button.grid(row=i, column=j)
                row.append(button)
            self.buttons.append(row)
        self.score_label = tk.Label(self.root, text=f"Red: {self.score[0]} Yellow: {self.score[1]}", font=("Helvetica", 16))

    def make_move(self, column):
        self.game.make_move(column)
        if self.game.winner:
            self.show_winner()
        elif self.game.draw:
            self.show_draw()
        else:
            self.update_board()

    def update_board(self):
        for i in range(6):
            for j in range(7):
                if self.game.board[i][j] == 1:
                    self.buttons[i][j].config(text="R", bg="red")
                elif self.game.board[i][j] == 2:
                    self.buttons[i][j].config(text="Y", bg="yellow")

    def show_winner(self):
        self.update_board()
        winner = "Red" if self.game.winner == 1 else "Yellow"
        messagebox.showinfo("Game Over", f"{winner} wins!")
        self.root.after(2000, self.restart)

    
    def show_draw(self):
        self.update_board()
        messagebox.showinfo("Game Over", "It's a draw!")
        self.root.after(2000, self.restart)

    def restart(self):
        self.root.destroy()
        GUI()
    

if __name__ == "__main__":
    GUI().run()
    # keep track of score
