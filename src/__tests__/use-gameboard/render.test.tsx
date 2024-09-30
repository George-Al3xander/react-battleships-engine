import React, { ReactNode, useEffect } from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { clsx } from "clsx";
import useGameBoard from "@/hooks/use-gameboard";
import { Ship, Coords } from "battleships-engine";
import { convertStringToCoords, generateGameBoardCells } from "@/utils";
import { waitFor } from "@testing-library/dom";

const defaultShips = [
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

const RenderGameboard = ({ propShips }: { propShips?: Ship[] }) => {
    const {
        hasLost,
        randomlyPlaceShips,
        removeShip,
        receiveAttack,
        checkIfCoordsInMap,
        ships,
        setMissed,
        setHitCells,
        setHasLost,
    } = useGameBoard(propShips);

    const resetGB = () => {
        setMissed(generateGameBoardCells());
        setHitCells(generateGameBoardCells());
        setHasLost(false);
    };

    useEffect(() => {
        if (!propShips) randomlyPlaceShips();
    }, []);

    const rows: ReactNode[][] = [];
    for (let i = 1; i <= 10; i++) {
        const cells: ReactNode[] = [];
        for (let j = 1; j <= 10; j++) {
            const coord = new Coords({ x: i, y: j });
            const c = coord.toString();
            const ship = [...ships.values()].find((s) => {
                let isMatch = false;
                for (const possibleCoords of s) {
                    isMatch = possibleCoords.toString() === c;
                    if (isMatch) break;
                }
                return isMatch;
            });
            cells.push(
                <td
                    onClick={() => receiveAttack(coord)}
                    data-testid={c}
                    key={c}
                    className={clsx("empty", {
                        hit_cell: checkIfCoordsInMap("hit", c),
                        taken_cell: checkIfCoordsInMap("taken", c),
                        missed: checkIfCoordsInMap("missed", c),
                    })}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeShip(ship!);
                        }}
                    >
                        Remove-{c}
                    </button>
                    cell
                </td>,
            );
        }
        rows.push(cells);
    }

    if (hasLost)
        return (
            <main>
                <p>You lose!</p>
                <button onClick={resetGB}>Reset</button>
            </main>
        );

    return (
        <main>
            <table>
                <tbody>
                    {rows.map((cells, index) => (
                        <tr key={index}>{cells}</tr>
                    ))}
                </tbody>
            </table>
            <button onClick={randomlyPlaceShips}>Random</button>
        </main>
    );
};

const renderGameBoard = (paramShips?: Ship[]) =>
    render(<RenderGameboard propShips={paramShips} />);

describe("GameBoard", () => {
    beforeEach(() => {
        renderGameBoard(defaultShips);
    });

    describe("Render", () => {
        it("should render the table", () => {
            for (const ship of defaultShips) {
                for (const coord of ship) {
                    const cell = screen.getByTestId(coord.toString());
                    expect(cell).toBeInTheDocument();
                    expect(cell).toHaveClass("taken_cell");
                }
            }
        });
    });

    describe("Behavior", () => {
        const convertToComparingFormat = (arr: HTMLElement[]) => {
            return arr.map((elem) => ({
                coords: convertStringToCoords(elem.dataset.testid!),
                className: elem.className,
            }));
        };

        it.each([1, 2, 3, 4, 5])(
            "should renew the cells info after the 'random' button click",
            async () => {
                const btn = screen.getByRole("button", { name: "Random" });
                const oldMap = convertToComparingFormat(
                    screen.getAllByText("cell"),
                );
                expect(oldMap.length).toBe(100);

                await userEvent.click(btn);
                const newMap = convertToComparingFormat(
                    screen.getAllByText("cell"),
                );
                expect(
                    oldMap.sort((a, b) => a!.coords.x - b!.coords.x),
                ).not.toEqual(newMap.sort((a, b) => a!.coords.x - b!.coords.x));
            },
        );

        it("should remove a ship", async () => {
            const [ship] = defaultShips;
            const cell = screen.getByRole("button", { name: `Remove-(2,1)` });
            for (const coords of ship!) {
                expect(screen.getByTestId(coords.toString())).toHaveClass(
                    "taken_cell",
                );
            }
            await userEvent.click(cell);
            for (const coords of ship!) {
                expect(screen.getByTestId(coords.toString())).toHaveClass(
                    "empty",
                );
            }
        });

        it("should show the loss message if 'hasLost' is truthy", async () => {
            expect(screen.queryByText("You lose!")).not.toBeInTheDocument();
            for (const ship of defaultShips) {
                for (const coord of ship) {
                    const cell = screen.getByTestId(coord.toString());
                    await userEvent.click(cell);
                }
            }
            for (const ship of defaultShips) {
                for (const coord of ship) {
                    const cell = screen.queryByTestId(coord.toString());
                    await waitFor(() => expect(cell).not.toBeInTheDocument());
                }
            }

            expect(screen.getByText("You lose!")).toBeInTheDocument();
        });

        it("should update the cell's className based on the state change", async () => {
            await waitFor(async () => {
                await userEvent.click(
                    screen.getByRole("button", { name: "Reset" }),
                );
            });

            const cells: [string, "empty" | "hit_cell" | "missed", boolean][] =
                [
                    ["(10,10)", "missed", true],
                    ["(9,9)", "empty", false],
                    ["(2,1)", "hit_cell", true],
                ];

            cells.forEach(async ([coord, className, doClick]) => {
                const cell = await waitFor(() => screen.getByTestId(coord));
                expect(cell).toHaveClass("empty");
                if (doClick) {
                    await userEvent.click(cell);
                    expect(cell).toHaveClass(className);
                }
            });
        });
    });
});
