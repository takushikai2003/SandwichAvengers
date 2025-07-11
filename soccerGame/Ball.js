import { config } from './config.js';

export const ballSize = 50;

export class Ball {
    constructor() {
        this.x = config.canvasW / 2 - ballSize / 2;
        this.y = config.canvasH / 2 - ballSize / 2;
    }
}