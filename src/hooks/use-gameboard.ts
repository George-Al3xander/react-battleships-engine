import { useEffect, useState } from "react";
import {
    convertStringToCoords,
    generateGameBoardCells,
    randomlyPlaceShips as randomUtil,
} from "@/utils";

import { Coords, Ship, Direction, ShipType, TCoords } from "battleships-engine";
import { cellsMapsTypes, mapsCheckedByValue } from "@/consts";

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

    const removeShip = (ship: Ship) => {
        const newShips = new Map(ships);
        newShips.delete(ship.type);
        setShips(newShips);
        const newTakenCells = new Map(takenCells);

        for (const coords of ship) {
            newTakenCells.delete(coords.toString());
        }

        setTakenCells(newTakenCells);
    };

    const moveShip = (
        startingShip: Ship,
        newShipInfo: { coords: TCoords; direction: Direction },
    ) => {
        removeShip(startingShip);
        placeShip({ type: startingShip.type, ...newShipInfo });
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

    const resetGameBoard = () => {
        setShips(new Map());
        setTakenCells(new Map());
        setMissed(generateGameBoardCells());
        setHitCells(generateGameBoardCells());
        setHasLost(false);
    };

    const randomlyPlaceShips = () => {
        resetGameBoard();
        const { takenCells: localTakenCells, ships: localShips } = randomUtil();
        setTakenCells(localTakenCells);
        setShips(localShips);
    };

    const maps: Record<(typeof cellsMapsTypes)[number], Map<any, any>> = {
        hit: hitCells,
        missed,
        taken: takenCells,
    };
    const checkIfCoordsInMap = (
        cellsMapType: "hit" | "missed" | "taken",
        param: Coords | string,
    ) => {
        if (!(param instanceof Coords))
            param = new Coords(convertStringToCoords(param));

        if (cellsMapsTypes.includes(cellsMapType)) {
            if (mapsCheckedByValue.has(cellsMapType))
                return maps[cellsMapType].get(param.toString()) === true;
            else return maps[cellsMapType].has(param.toString());
        } else {
            throw new Error("Invalid cells map type!");
        }
    };

    return {
        placeShip,
        ships,
        setShips,
        takenCells,
        setTakenCells,
        missed,
        setMissed,
        hitCells,
        setHitCells,
        setHasLost,
        randomlyPlaceShips,
        hasLost,
        receiveAttack,
        inspectCoordsInShips,
        resetGameBoard,
        fillTakenCellsWithShip,
        checkIfCoordsInMap,
        removeShip,
        moveShip,
    };
};

export default useGameBoard;
