import numpy as np

# Create 6x7 grid filled with zeros (empty spaces)
grid = np.zeros((6, 7), dtype=int)


# Each column can have betwee 0 and 6 pieces so has 7 states
# There are 7 columns so there are 7^7 possible board states

import numpy as np
def TODO():pass



def is_game_over(grid):
    # Check for wins at each position
    for row in range(6):
        for col in range(7):
            if check_win_at_position(grid, row, col):
                return True
    
    # Check if board is full
    return np.all(grid != 0)

def is_valid_grid(grid):
    # Check if the grid is valid
    # Check that there are equal numbers of pieces in total or one more for player 1
    player1_count = np.count_nonzero(grid == 1)
    player2_count = np.count_nonzero(grid == 2)
    if not (player1_count == player2_count or player1_count == player2_count + 1):
        return False
    
    # It now suffices that, if there is no win, the board is valid
    if not is_game_over(grid):
        return True
    
    # Check that there is only one winning player
    # First, check if player 1 has won
    original_grid = grid.copy()
    grid[grid == 2] = 0  # Temporarily remove player 2's pieces
    player1_won = is_game_over(grid) and not np.all(grid != 0)  # Check win, excluding full board
    
    # Then check if player 2 has won
    grid = original_grid.copy()
    grid[grid == 1] = 0  # Temporarily remove player 1's pieces
    player2_won = is_game_over(grid) and not np.all(grid != 0)  # Check win, excluding full board
    
    if player1_won and player2_won:  # Can't have two winners
        return False
        
    # A drawn game is certainly valid
    return True

def check_win_at_position(grid, row, col):
    """
    Check if there's a win at the given position
    Returns: 0 if no win, or the player number (1 or 2) if there's a win
    """
    player = grid[row][col]
    if player == 0:  # Empty position can't be a win
        return 0
        
    # Check horizontal
    count = 0
    for c in range(max(0, col-3), min(7, col+4)):  # Check up to 3 positions left and right
        if grid[row][c] == player:
            count += 1
            if count == 4:
                return player
        else:
            count = 0
            
    # Check vertical
    count = 0
    for r in range(max(0, row-3), min(6, row+4)):  # Check up to 3 positions up and down
        if grid[r][col] == player:
            count += 1
            if count == 4:
                return player
        else:
            count = 0
            
    # Check diagonal (positive slope)
    count = 0
    for i in range(-3, 4):  # Check up to 3 positions in each direction
        r = row + i
        c = col + i
        if 0 <= r < 6 and 0 <= c < 7:
            if grid[r][c] == player:
                count += 1
                if count == 4:
                    return player
            else:
                count = 0
                
    # Check diagonal (negative slope)
    count = 0
    for i in range(-3, 4):  # Check up to 3 positions in each direction
        r = row - i
        c = col + i
        if 0 <= r < 6 and 0 <= c < 7:
            if grid[r][c] == player:
                count += 1
                if count == 4:
                    return player
            else:
                count = 0
                
    return 0
