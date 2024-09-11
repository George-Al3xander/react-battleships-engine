# [React Battleship Engine](https://www.npmjs.com/package/react-battleships-engine) 

This package provides a TypeScript engine for the classic Battleship game, adapted for React using a custom hook, `useGameBoard`. The hook manages the game logic, including ship placement, tracking hits, and checking for victory conditions.

Based on the original [battleships-engine](https://www.npmjs.com/package/battleships-engine).

## Installation

Install the package with npm or yarn:

```bash
npm install react-battleships-engine
```

or

```bash
pnpm add react-battleships-engine
```
or

```bash
yarn add react-battleships-engine
```

## Usage

### Importing the Hook

You can import the `useGameBoard` hook and necessary types from the package:

```typescript
import { useGameBoard, TCoords, ShipType, Direction  } from "react-battleships-engine";
```

### Example

#### Using the Hook in a React Component

You can use the `useGameBoard` hook to initialize a game board, place ships, and handle player actions.

```typescript
import React, { useEffect } from "react";
import { useGameBoard } from "react-battleships-engine";

const BattleshipGame: React.FC = () => {
    const {
        ships,
        placeShip,
        randomlyPlaceShips,
        receiveAttack,
        hasLost,
        missed,
    } = useGameBoard();

    // Example: Place ships randomly when the game starts
    useEffect(() => {
        randomlyPlaceShips();
    }, []);

    // Example: Handle a player attack
    const handleAttack = (coords: { x: number, y: number }) => {
        try {
            receiveAttack(coords);
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <div>
            <h1>Battleship Game</h1>
            <button onClick={() => randomlyPlaceShips()}>
                Randomly Place Ships
            </button>
            <button onClick={() => handleAttack({ x: 3, y: 5 })}>
                Attack (3, 5)
            </button>
            {hasLost() && <p>You lost!</p>}
        </div>
    );
};

export default BattleshipGame;
```

### Available Hook Methods

#### `useGameBoard(initialShips?: Ship[])`

The `useGameBoard` hook manages the game board state and logic. It returns a set of methods and state for interacting with the board.

- `placeShip(params: { type: ShipType; coords: TCoords; direction: Direction })`: Manually place a ship on the board at specific coordinates.
- `randomlyPlaceShips()`: Randomly place all ships on the game board.
- `receiveAttack(coords: TCoords)`: Process an attack at the specified coordinates.
- `hasLost()`: Returns `true` if all ships are sunk.
- `resetGameBoard()`: Resets the board and state for a new game.

### Ship Placement Example

#### Manually Placing a Ship

You can manually place a ship on the board by specifying its type, coordinates, and direction:

```typescript
placeShip({
    type: "battleship",
    coords: { x: 3, y: 5 },
    direction: "hor", // horizontal
});
```

#### Randomly Placing Ships

To randomly place all ships on the board:

```typescript
randomlyPlaceShips();
```

### Attack Example

#### Handling an Attack

You can register an attack on the board by specifying the coordinates:

```typescript
receiveAttack({ x: 4, y: 7 });
```

If the attack misses, the missed coordinates will be updated.

### Checking for Game Over

To check if a player has lost (i.e., all ships have been sunk):

```typescript
if (hasLost()) {
    console.log("Game over, all ships have been sunk!");
}
```

## API Reference

### `useGameBoard`

This hook manages the game board's state and interactions.

- `ships`: A map containing all placed ships on the board.
- `takenCells`: A map of cells that are occupied by ships.
- `missed`: A map of missed attacks on the board.
- `randomlyPlaceShips()`: Randomly places all ships on the board.
- `placeShip(params: { type: ShipType; coords: TCoords; direction: Direction })`: Places a specific ship on the board.
- `receiveAttack(coords: TCoords)`: Processes an attack at the given coordinates.
- `hasLost()`: Returns `true` if all ships have been sunk.
- `resetGameBoard()`: Resets the game board to its initial state.

### `Ship`

The `Ship` class defines the behavior of a ship, including its position, hit detection, and sinking status.

- `type`: The type of the ship.
- `length`: The length of the ship.
- `hit()`: Marks the ship as hit.
- `isSunk()`: Checks if the ship is completely sunk.

### `Coords`

The `Coords` class represents the coordinates of a cell on the game board.

- `x`: The x-coordinate.
- `y`: The y-coordinate.
- `toString()`: Returns the coordinates in string format `(x,y)`.

## License

MIT
