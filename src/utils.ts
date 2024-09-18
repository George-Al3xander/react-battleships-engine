import random from "lodash/random";
import { Ship, Coords, Direction, ShipType, TCoords } from "battleships-engine";
import {
    coordsType,
    directionTypes,
    numberRegExp,
    shipsLength,
} from "@/consts";
import { sample } from "lodash";

export const generateRandomCoords = (): Coords =>
    new Coords({ x: random(1, 10), y: random(1, 10) });

export const generateRandomDir = (): Direction =>
    directionTypes[random(1) as 0 | 1];

export const generateRandomShip = ({
    placeShip,
    shipType,
}: {
    placeShip: (params: {
        type: ShipType;
        coords: TCoords;
        direction: Direction;
    }) => void;
    shipType: ShipType;
}) => {
    let coords = generateRandomCoords();
    const direction = generateRandomDir();
    if (direction === "hor" && coords.x + shipsLength[shipType] > 10) {
        const { x } = coords;
        coords.x = x - 1;
    } else if (direction === "vert" && coords.y + shipsLength[shipType] > 10) {
        const { y } = coords;
        coords.y = y - 1;
    }
    try {
        placeShip({
            coords,
            direction,
            type: shipType,
        });
    } catch (e) {
        generateRandomShip({ placeShip, shipType });
    }
};

export const generateGameBoardCells = (): Map<string, boolean> => {
    const map = new Map<string, boolean>();

    coordsType.forEach(() => {
        for (let i = 1; i <= 10; i++) {
            for (let j = 1; j <= 10; j++) {
                map.set(`(${i},${j})`, false);
            }
        }
    });

    return map;
};

export const convertStringToCoords = (str: string): TCoords => {
    const [x, y] = str.split(",").map((word) => {
        if (word) {
            const matches = word.match(numberRegExp);
            if (!matches) return;
            return Number(matches[0]);
        }
    });

    if (!x || !y) throw new Error("Invalid string provided");
    return { x, y };
};

export const checkShipsPlacement = (ships: Map<ShipType, Ship>) => {
    let isValid = false;
    if (ships.size <= 4) return false;
    else {
        for (const [currentShipType, currentShip] of ships.entries()) {
            for (const [anyShipType, anyShip] of ships.entries()) {
                if (currentShipType !== anyShipType) {
                    for (const currentShipCoords of currentShip) {
                        for (const anyShipCoords of anyShip) {
                            isValid =
                                anyShipCoords.toString() !==
                                currentShipCoords.toString();
                            if (!isValid) break;
                        }
                        if (!isValid) break;
                    }
                    if (!isValid) break;
                }
            }
            if (!isValid) break;
        }
    }
    return isValid;
};

const randomlyPlaceShip = ({
    type,
    direction = generateRandomDir(),
    takenCells,
}: {
    type: ShipType;
    direction?: Direction;
    takenCells: Map<string, ShipType>;
}) => {
    const allCells = Array.from(generateGameBoardCells().keys());
    const emptyCells: string[] = [];
    for (const cell of allCells) {
        if (!takenCells.has(cell)) emptyCells.push(cell);
    }
    const possibleStarts = emptyCells.filter((str) => {
        const { x, y } = convertStringToCoords(str);
        const newShip = new Ship({
            coords: { x, y },
            direction,
            type,
        });
        let isValid = true;

        if (direction === "hor") isValid = x + shipsLength[type] <= 10;
        else isValid = y + shipsLength[type] <= 10;

        if (isValid) {
            for (const coord of newShip) {
                isValid = !takenCells.has(coord.toString());
                if (!isValid) break;
            }
        } else {
            return false;
        }
        return isValid;
    });

    if (possibleStarts.length === 0) {
        randomlyPlaceShip({
            type,
            direction: directionTypes.find((dir) => dir !== direction),
            takenCells,
        });
    } else {
        const randomStart = sample(possibleStarts);

        if (!randomStart) throw new Error("No available space");
        const newShip = new Ship({
            type,
            coords: convertStringToCoords(randomStart),
            direction,
        });

        for (const coord of newShip) {
            takenCells.set(coord.toString(), type);
        }

        return { takenCells, newShip };
    }
};

export const randomlyPlaceShips = () => {
    const takenCells = new Map<string, ShipType>();
    const ships = new Map<ShipType, Ship>();
    for (const type of Object.keys(shipsLength) as ShipType[]) {
        const { newShip } = randomlyPlaceShip({
            type,
            takenCells,
        })!;
        ships.set(type, newShip);
    }

    return { takenCells, ships };
};
