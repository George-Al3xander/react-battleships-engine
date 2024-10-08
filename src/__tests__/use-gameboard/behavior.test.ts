import useGameBoard from "@/hooks/use-gameboard";

import { Coords, Ship, ShipType, TCoords } from "battleships-engine";
import { shipsLength } from "@/consts";
import { checkShipsPlacement } from "@/utils";
import { act, renderHook, RenderResult } from "@testing-library/react-hooks";
import { waitFor } from "@testing-library/dom";

const shipsDefault = [
    new Ship({
        type: "cruiser",
        coords: { x: 2, y: 1 },
        direction: "hor",
    }),
    new Ship({
        type: "battleship",
        coords: { x: 9, y: 1 },
        direction: "vert",
    }),
    new Ship({
        type: "submarine",
        coords: { x: 4, y: 9 },
        direction: "hor",
    }),
];

const receiveAttackSetup = (
    ships: Ship[],
    extraCoords?: TCoords | TCoords[],
    spyOnShipHit?: ShipType[],
) => {
    const { result } = renderHook(() => useGameBoard(ships));
    const receiveAttack = jest.spyOn(result.current, "receiveAttack");

    let spies = undefined;
    if (spyOnShipHit) {
        spies = spyOnShipHit.map((type) =>
            jest.spyOn(result.current.ships.get(type)!, "hit"),
        );
    }
    act(() => {
        for (const ship of ships) {
            for (const coord of ship) {
                result.current.receiveAttack(coord);
            }
        }
        if (extraCoords) {
            if (Array.isArray(extraCoords)) {
                for (const coord of extraCoords) {
                    result.current.receiveAttack(coord);
                }
            } else result.current.receiveAttack(extraCoords);
        }
    });

    if (spies) return { spies, result, receiveAttack };
    return { result, receiveAttack };
};

describe("GameBoard", () => {
    describe("depends on the ship placement", () => {
        let result: RenderResult<ReturnType<typeof useGameBoard>>;
        beforeAll(() => {
            const hookRender = renderHook(() => useGameBoard());
            result = hookRender.result;

            act(() => {
                result.current.placeShip({
                    type: "cruiser",
                    coords: { x: 1, y: 4 },
                    direction: "hor",
                });
            });
        });
        it("should place a ship", () => {
            expect(result.current.ships.get("cruiser")).toBeInstanceOf(Ship);
            expect(result.current.ships.get("cruiser")).toHaveProperty(
                "coords",
            );
            expect(result.current.ships.get("cruiser")).toHaveProperty(
                "direction",
            );
            expect(result.current.ships.get("cruiser")?.coords.x).toBe(1);
            expect(result.current.ships.get("cruiser")?.coords.y).toBe(4);
            expect(result.current.ships.get("cruiser")?.direction).toBe("hor");
        });

        it("should throw the ship overlap error", () => {
            try {
                act(() =>
                    result.current.placeShip({
                        type: "aircraft_carrier",
                        coords: { x: 2, y: 4 },
                        direction: "vert",
                    }),
                );
                expect(1).toBe(2);
            } catch (e) {
                expect(e instanceof Error ? e.message : "Bad").toBe(
                    "Ship placement error: The ship overlaps with another ship.",
                );
            }
        });
    });

    describe("utils", () => {
        it("should fill taken cells with  ship coordinates", () => {
            const { result } = renderHook(() => useGameBoard());
            const type: ShipType = "aircraft_carrier";
            const size = shipsLength[type];

            expect(result.current.takenCells.size).toBe(0);
            const ship = new Ship({
                type,
                coords: { x: 1, y: 4 },
                direction: "hor",
            });

            act(() =>
                result.current.fillTakenCellsWithShip(ship, "aircraft_carrier"),
            );

            for (const coord of ship) {
                expect(result.current.takenCells.has(coord.toString())).toBe(
                    true,
                );
            }
            expect(result.current.takenCells.size).toBe(size);
        });

        it("should inspect", () => {
            const ships = [
                new Ship({
                    type: "cruiser",
                    direction: "hor",
                    coords: { x: 1, y: 1 },
                }),

                new Ship({
                    type: "battleship",
                    direction: "vert",
                    coords: { x: 1, y: 4 },
                }),
            ];
            const { result } = renderHook(() => useGameBoard(ships));

            const matchCb = jest.fn();
            const missCb = jest.fn();

            act(() => {
                result.current.inspectCoordsInShips({
                    coords: { x: 1, y: 1 },
                    matchCb,
                    missCb,
                });
                result.current.inspectCoordsInShips({
                    coords: { x: 1, y: 5 },
                    matchCb,
                    missCb,
                });
                result.current.inspectCoordsInShips({
                    coords: { x: 9, y: 9 },
                    matchCb,
                    missCb,
                });
            });
            expect(result.current.ships.size).toBe(2);
            expect(missCb).toHaveBeenCalledTimes(1);
            expect(matchCb).toHaveBeenCalledTimes(2);
        });
    });

    describe("receiveAttack", () => {
        let hookRes: ReturnType<typeof receiveAttackSetup> | undefined =
            undefined;

        beforeAll(() => {
            hookRes = receiveAttackSetup(shipsDefault, { x: 4, y: 10 }, [
                "cruiser",
            ]);
        });

        it("should call the hit function after the successful receiveAttack call", () => {
            const { result, spies, receiveAttack } = hookRes!;
            const [hitFunc] = spies!;
            expect(result.current.ships.size).toBe(3);
            const ship = result.current.ships.get("cruiser")!;
            expect(hitFunc).toHaveBeenCalledTimes(ship.length);
            expect(receiveAttack).toHaveBeenCalledTimes(10);
        });

        it("should sunk the ship", () => {
            const { result } = hookRes!;

            expect(result.current.ships.get("cruiser")?.isSunk()).toBe(true);
            expect(result.current.ships.get("cruiser")?.beenHitTimes).toBe(2);
        });

        it("should add the coordinates to the 'missed' array", async () => {
            const { result, receiveAttack } = hookRes!;

            await waitFor(() =>
                expect(receiveAttack).toHaveBeenCalledWith(
                    expect.objectContaining({ x: 4, y: 10 }),
                ),
            );
            expect(result.current.missed.get("(4,10)")).toBe(true);
        });
    });

    describe("defeat check", () => {
        it("should report whether or not all of the ships have been sunk.", () => {
            const { result } = renderHook(() => useGameBoard());

            const ships: { type: ShipType; coords: TCoords }[] = [
                {
                    type: "cruiser",
                    coords: { x: 1, y: 1 },
                },
                {
                    type: "battleship",
                    coords: { x: 1, y: 4 },
                },
            ];

            ships.forEach(({ type, coords }) => {
                act(() => {
                    result.current.placeShip({
                        type,
                        coords,
                        direction: "hor",
                    });
                });
                for (let i = 0; i < shipsLength[type]; i++) {
                    act(() => {
                        result.current.receiveAttack({
                            x: coords.x + i,
                            y: coords.y,
                        });
                    });
                }
            });

            expect(result.current.hasLost).toBe(true);
        });
    });

    it.each([1, 2, 3, 4, 5])("should randomly place ships", () => {
        const { result } = renderHook(() => useGameBoard());

        const oldShips = result.current.ships;
        act(() => {
            result.current.randomlyPlaceShips();
        });
        const newShips = result.current.ships;
        expect(checkShipsPlacement(result.current.ships)).toBe(true);
        expect(oldShips).not.toMatchObject(newShips);
    });
});

it("should check if coords in map", () => {
    const { result } = renderHook(() => useGameBoard());
    act(() => {
        result.current.placeShip({
            type: "cruiser",
            coords: { x: 1, y: 4 },
            direction: "hor",
        });
    });
    expect(result.current.checkIfCoordsInMap("taken", "(1,4)")).toBe(true);

    const hitCoords = { x: 2, y: 4 };
    const missedCoords = { x: 9, y: 9 };
    act(() => {
        result.current.receiveAttack(hitCoords);
        result.current.receiveAttack(missedCoords);
    });
    expect(
        result.current.checkIfCoordsInMap("hit", new Coords(hitCoords)),
    ).toBe(true);
    expect(
        result.current.checkIfCoordsInMap("missed", new Coords(missedCoords)),
    ).toBe(true);
});

it("should remove a ship", () => {
    const { result } = renderHook(() => useGameBoard());
    const ship = new Ship({
        type: "cruiser",
        coords: { x: 1, y: 4 },
        direction: "hor",
    });
    act(() => {
        result.current.placeShip(ship);
    });
    for (const coords of ship) {
        expect(
            result.current.checkIfCoordsInMap("taken", coords.toString()),
        ).toBe(true);
        expect(result.current.ships.has(ship.type)).toBe(true);
    }
    act(() => {
        result.current.removeShip(ship);
    });
    for (const coords of ship) {
        expect(
            result.current.checkIfCoordsInMap("taken", coords.toString()),
        ).toBe(false);
        expect(result.current.ships.has(ship.type)).toBe(false);
    }
});

it("should move a ship", () => {
    const { result } = renderHook(() => useGameBoard());
    const [firstShip, secondShip] = shipsDefault;
    act(() => {
        result.current.placeShip(firstShip!);
        result.current.placeShip(secondShip!);

        try {
            result.current.moveShip(firstShip!, {
                coords: { x: 9, y: 1 },
                direction: "vert",
            });
            expect(1).toBe(2);
        } catch (e) {
            expect(1).toBe(1);
        }

        result.current.moveShip(firstShip!, {
            coords: { x: 3, y: 3 },
            direction: "vert",
        });
    });

    expect(result.current.ships.get("cruiser")!.coords).toEqual({ x: 3, y: 3 });
});
