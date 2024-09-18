import {
    convertStringToCoords,
    generateRandomShip,
    checkShipsPlacement,
    randomlyPlaceShips,
} from "@/utils";
import { Ship } from "battleships-engine";

const repeatTestTimes = (cb: Function, count: number | undefined = 5) => {
    for (let i = 0; i < count; i++) {
        cb();
    }
};

describe("generateRandomShip", () => {
    it("should generate a random ship object with a correct placement", () =>
        repeatTestTimes(() => {
            const placeShip = jest.fn();

            generateRandomShip({ placeShip, shipType: "cruiser" });

            expect(placeShip).toHaveBeenCalledWith(
                expect.objectContaining({
                    coords: {
                        x: expect.any(Number),
                        y: expect.any(Number),
                    },
                    type: "cruiser",
                }),
            );
        }));

    it("should not throw the ship overlap error", () =>
        repeatTestTimes(() => {
            const placeShip = jest.fn();

            generateRandomShip({ placeShip, shipType: "cruiser" });
            try {
                generateRandomShip({ placeShip, shipType: "battleship" });
                expect(1).toBe(1);
            } catch (e) {
                expect(1).toBe(2);
            }
        }));
});

it("should convert string to a coords object", () => {
    expect(convertStringToCoords("(1,2)")).toMatchObject({ x: 1, y: 2 });
    expect(convertStringToCoords("(12,4)")).toMatchObject({ x: 12, y: 4 });
    expect(convertStringToCoords("( 12 , 4 )")).toMatchObject({ x: 12, y: 4 });
    expect(() => convertStringToCoords("bad string")).toThrow(
        "Invalid string provided",
    );
});

it("should check gameboard", () => {
    const ships = [
        new Ship({
            type: "cruiser",
            direction: "hor",
            coords: { x: 1, y: 1 },
        }),
        new Ship({
            type: "battleship",
            direction: "hor",
            coords: { x: 1, y: 4 },
        }),
        new Ship({
            type: "aircraft_carrier",
            direction: "hor",
            coords: { x: 1, y: 6 },
        }),
        new Ship({
            type: "destroyer",
            direction: "vert",
            coords: { x: 6, y: 1 },
        }),
        new Ship({
            type: "submarine",
            direction: "hor",
            coords: { x: 8, y: 4 },
        }),
    ];
    const shipsMap = new Map(ships.map((ship) => [ship.type, ship]));
    expect(checkShipsPlacement(shipsMap)).toBe(true);
});

it.each([1, 2, 3, 4, 5])("should randomly place ships", () => {
    const { ships } = randomlyPlaceShips();
    expect(checkShipsPlacement(ships)).toBe(true);
});
