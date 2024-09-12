import React, { ReactNode, useEffect } from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Coords from "@/coords";
import useGameBoard from "@/hooks/use-gameboard";
import Ship from "@/ship";

const RenderGameboard = ({ ships }: { ships?: Ship[] }) => {
    const { takenCells, randomlyPlaceShips, missed } = useGameBoard(ships);
    useEffect(() => {
        if (!ships) randomlyPlaceShips();
    }, []);
    const rows: ReactNode[][] = [];
    for (let i = 1; i <= 10; i++) {
        const cells: ReactNode[] = [];
        for (let j = 1; j <= 10; j++) {
            const coord = new Coords({ x: i, y: j });
            const handleClassName = () => {
                const c = coord.toString();
                if (takenCells.has(c)) return "taken_cell";
                if (missed.get(c) === true) return "missed";
                return "empty";
            };
            cells.push(
                <td
                    data-testid={coord.toString()}
                    key={Math.random()}
                    className={handleClassName()}
                >
                    {coord.toString()}
                </td>,
            );
        }
        rows.push(cells);
    }

    return (
        <table>
            <tbody>
                {rows.map((cells) => (
                    <tr key={Math.random()}>{cells.map((cell) => cell)}</tr>
                ))}
            </tbody>
        </table>
    );
};

const renderGameBoard = (ships: Ship[]) => {
    render(<RenderGameboard ships={ships} />);
};

describe("GameBoard", () => {
    describe("Render", () => {
        it("should render the table", () => {
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
            renderGameBoard(ships);
            for (const ship of ships) {
                for (const coord of ship) {
                    const cell = screen.getByTestId(coord.toString());
                    expect(cell).toBeInTheDocument();
                    expect(cell.className).toBe("taken_cell");
                }
            }
        });
    });
});
