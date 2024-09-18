import React, { ReactNode, useEffect } from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { clsx } from "clsx";
import useGameBoard from "@/hooks/use-gameboard";
import { Ship, Coords } from "battleships-engine";
import { convertStringToCoords } from "@/utils";
import { waitFor } from "@testing-library/dom";

const ships = [
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
        takenCells,
        hitCells,
        randomlyPlaceShips,
        missed,
        receiveAttack,
        resetGameBoard,
        checkIfCoordsInMap,
    } = useGameBoard(propShips);

    const resetGB = () => {
        resetGameBoard();
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
        renderGameBoard(ships);
    });

    describe("Render", () => {
        it("should render the table", () => {
            for (const ship of ships) {
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

        it("should show the loss message if 'hasLost' is truthy", async () => {
            expect(screen.queryByText("You lose!")).not.toBeInTheDocument();
            for (const ship of ships) {
                for (const coord of ship) {
                    const cell = screen.getByTestId(coord.toString());
                    await userEvent.click(cell);
                }
            }
            for (const ship of ships) {
                for (const coord of ship) {
                    const cell = screen.queryByTestId(coord.toString());
                    await waitFor(() => expect(cell).not.toBeInTheDocument());
                }
            }

            expect(screen.getByText("You lose!")).toBeInTheDocument();
        });

        it("should update the cell's className based on the state change", async () => {
            await userEvent.click(
                screen.getByRole("button", { name: "Reset" }),
            );
            const cells: [string, "empty" | "hit_cell" | "missed", boolean][] =
                [
                    ["(10,10)", "missed", true],
                    ["(9,9)", "empty", false],
                    ["(2,1)", "hit_cell", true],
                ];

            cells.forEach(async ([coord, className, doClick]) => {
                const cell = screen.getByTestId(coord);
                expect(cell).toHaveClass("empty");
                if (doClick) {
                    await userEvent.click(cell);
                    expect(cell).toHaveClass(className);
                }
            });
        });
    });
});
