import type { ShipType } from "battleships-engine";

export const shipsLength: { [K in ShipType]: number } = {
    aircraft_carrier: 5,
    battleship: 4,
    destroyer: 3,
    submarine: 3,
    cruiser: 2,
};

export const directionTypes = ["vert", "hor"] as const;
export const coordsType = ["x", "y"] as const;

export const numberRegExp = /\d+/;

export const cellsMapsTypes = ["hit", "missed", "taken"] as const;
export const mapsCheckedByValue = new Set<(typeof cellsMapsTypes)[number]>([
    "hit",
    "missed",
]);
