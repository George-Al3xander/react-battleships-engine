import { useEffect, useState } from "react";
import {
    convertStringToCoords,
    generateGameBoardCells,
    generateRandomDir,
    generateRandomShip,
} from "@/utils";

import random from "lodash/random";
import { Coords, Ship, Direction, ShipType, TCoords } from "battleships-engine";
import { directionTypes, shipsLength } from "@/consts";

const useGameBoard = (initialShips?: Ship[]) => {
    const [ships, setShips] = useState<Map<ShipType, Ship>>(() => {
        if (initialShips)
            return new Map(initialShips.map((ship) => [ship.type, ship]));

        return new Map();
    });
    const [takenCells, setTakenCells] = useState<Map<string, ShipType>>(() => {
        if (initialShips) {
            const cells: [string, ShipType][] = [];

            initialShips.forEach((ship) => {
                for (const coord of ship)
                    cells.push([coord.toString(), ship.type]);
            });
            return new Map(cells);
        }
        return new Map();
    });

    const [missed, setMissed] = useState<Map<string, boolean>>(
        generateGameBoardCells(),
    );

    const [hitCells, setHitCells] = useState<Map<string, boolean>>(
        generateGameBoardCells(),
    );

    const [hasLost, setHasLost] = useState(false);

    useEffect(() => {
        setHasLost(checkLoss());
    }, [hitCells]);

    const fillTakenCellsWithShip = (
        ship: Ship,
        shipType: ShipType,
        _map?: Map<ShipType, Ship>,
    ) => {
        for (const coord of ship)
            setTakenCells((prev) =>
                new Map(prev).set(coord.toString(), shipType),
            );
    };

    const inspectCoordsInShips = ({
        coords: paramCoords,
        missCb,
        matchCb,
    }: {
        coords: TCoords;
        matchCb: (ship: Ship) => void;
        missCb: () => void;
    }) => {
        if (ships.size > 0) {
            const coords = new Coords(paramCoords);
            const shipType = takenCells.get(coords.toString());

            if (shipType) {
                const ship = ships.get(shipType);
                if (!ship) throw new Error(`${shipType} does not exist`);
                matchCb(ship);
            } else missCb();
        } else missCb();
    };

    const placeShip = (params: {
        type: ShipType;
        coords: TCoords;
        direction: Direction;
    }) => {
        inspectCoordsInShips({
            coords: params.coords,
            missCb: () => {
                const newShip = new Ship(params);
                for (const coords of newShip) {
                    if (takenCells.has(coords.toString())) {
                        throw new Error(
                            "Ship placement error: The ship overlaps with another ship.",
                        );
                    }
                }
                setShips((prev) => new Map(prev).set(params.type, newShip));
                fillTakenCellsWithShip(newShip, params.type);
            },
            matchCb: () => {
                throw new Error(
                    "Ship placement error: The ship overlaps with another ship.",
                );
            },
        });
    };

    const receiveAttack = (coords: TCoords) => {
        const coordsClass = new Coords(coords);
        if (missed.get(coordsClass.toString()) === true)
            throw new Error(
                `The coordinate (X: ${coords.x}, Y: ${coords.y}) has already been targeted and missed.`,
            );

        const fromTaken = takenCells.get(coordsClass.toString());
        if (fromTaken) {
            const ship = ships.get(fromTaken);

            if (!ship) throw new Error(`${fromTaken} does not exist`);
            else {
                ship.hit();
                setHitCells((prev) =>
                    new Map(prev).set(coordsClass.toString(), true),
                );
            }
        } else
            setMissed((prev) =>
                new Map(prev).set(coordsClass.toString(), true),
            );
    };

    const checkLoss = () => {
        const currShips = Array.from(ships.keys());
        if (currShips.length > 0) {
            return !currShips
                .map((ship) => ships.get(ship)?.isSunk())
                .includes(false);
        } else return false;
    };

    const randomlyPlaceShip = ({
        type,
        direction = generateRandomDir(),
    }: {
        type: ShipType;
        direction?: Direction;
    }) => {
        if (takenCells.size > 0) {
            const allCells = generateGameBoardCells();
            const emptyCells: string[] = [];
            for (const [cell] of allCells) {
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
                });
            } else {
                const randomStart =
                    possibleStarts[random(possibleStarts.length - 1)];

                if (!randomStart) throw new Error("No available space");

                placeShip({
                    type,
                    coords: convertStringToCoords(randomStart),
                    direction,
                });
            }
        } else {
            generateRandomShip({ placeShip, shipType: type });
        }
    };

    const randomlyPlaceShips = () => {
        setShips(new Map());
        setTakenCells(new Map());
        (Object.keys(shipsLength) as ShipType[]).forEach((type) =>
            randomlyPlaceShip({ type }),
        );
    };

    const resetGameBoard = () => {
        setShips(new Map());
        setTakenCells(new Map());
        setMissed(generateGameBoardCells());
        setHitCells(generateGameBoardCells());
        setHasLost(false);
    };

    return {
        placeShip,
        ships,
        takenCells,
        missed,
        hitCells,
        randomlyPlaceShip,
        randomlyPlaceShips,
        hasLost,
        receiveAttack,
        inspectCoordsInShips,
        resetGameBoard,
        fillTakenCellsWithShip,
    };
};

export default useGameBoard;
