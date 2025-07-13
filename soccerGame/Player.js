export const playerSize = 40;

export class Player{
    constructor(id, x, y, color) {
        this.id = id; // Unique identifier for the player
        this.x = x;
        this.y = y;
        this.color = color;
    }
}