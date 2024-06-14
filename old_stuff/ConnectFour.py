#!/usr/bin/python
# -*- coding: utf-8 -*-



class Game:

    def __init__(
        self,
        maxp=2,
        H=8,
        W=7,
        ):

        if maxp > 5:
            print('Too Many Friends')
            raise
        self.remainingvalidcol = [
            'red',
            'blue',
            'green',
            'yellow',
            'orange',
            'purple',
            'white',
            ]
        self.size = (H, W)
        self.grid = [[Counter()] * H for _ in range(W)]
        self.turn = 1
        self.players = [Player(i) for i in range(maxp)]
        self.scores = [0] * maxp
        self.draws = 0

    def check_wins(self, x, y):

        pass

    def run(self):
        for i in self.players:
            i.color = self.getcol()
        while True:
            print(self)
            if self.turn > len(self.players):
                self.turn = 1
            print('Turn for', self.players[self.turn - 1])
            col = self.getcolumn()
            self.grid[col - 1][0] = Counter(str(self.players[self.turn - 1]))
            row = self.apply_gravity(col - 1)
            self.turn += 1
            if self.check_wins(row, col):
                break

    def getcol(self):
        while True:
            c = input('Enter color: ')
            if c not in self.remainingvalidcol:
                print('Invalid Color, enter one of',
                              ''.join(self.remainingvalidcol))
                continue
            else:
                self.remainingvalidcol.remove(c)
                return c

    def getcolumn(self):
        while True:
            try:
                c = int(input('Enter Column: '))
                if 0 < c and c <= self.size[1]:
                    return c
                else:
                    raise Exception('Out Of Bounds')
            except:
                print('Invalid Column, enter a number between 1 and'
                              , self.size[1])

    def update(self, col):
        j = [i[col] for i in self.grid]

    def apply_gravity(self, col):
        print(self.grid[col])
        last_empty = self.size[0] - 1
        for i in range(self.size[0] - 1, -1, -1):
            if self.grid[col][i].isempty():
                continue
            else:
                self.grid[col][last_empty] = Counter(self.grid[col][i].color)
                if last_empty != i:
                    self.grid[col][i] = Counter()
                last_empty -= 1
        print(self.grid[col])
        
        return last_empty

    def check_draw(self):
        return any(i[-1].isempty() for i in self.grid)

    def __repr__(self):
        return '\n'.join('|'.join(map(str, [i[row] for i in
                         self.grid])) for row in
                         range(len(self.grid[0]))) + "\n\n" + ','.join(list(map(str, self.scores))) + '\n'


class Player:

    def __init__(self, id, color=None):
        self.id = id
        self.color = color

    def __repr__(self):
        return self.color


class Counter:

    def __init__(self, color=None):
        self.color = color

    def isempty(self):
        return self.color == None

    def __repr__(self):
        if self.color:
            return self.color[0].upper()
        else:
            return 'X'



class AI:
    pass