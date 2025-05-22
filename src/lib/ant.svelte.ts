class AntGrid {

    cells: number[][];
    size: number;
    rule: string;
    ant;
    steps;

    constructor(gridSize: number, ruleString: string) {
        this.steps = 0;
        this.size = gridSize;
        this.rule = ruleString;
        this.cells = Array.from({ length: gridSize }, () =>
            Array(gridSize).fill(0),
        );
        this.ant = {
            x: Math.floor(gridSize / 2),
            y: Math.floor(gridSize / 2),
            direction: 1,
        };
    }

    turningCache = new Map();
    nextDir(state: number, direction: number) {
        if (this.turningCache.has([state, direction])) {
            return this.turningCache.get([state, direction]);
        }

        let newDirection = 0;
        if (this.rule[state % this.rule.length] === "R") {
            newDirection = (direction + 1) % 4; // Turn right
        } else {
            newDirection = (direction + 3) % 4; // Turn left
        }
        this.turningCache.set([state, direction], newDirection)
        return newDirection;
    }

    moveOneStep() {
        let cellValue = this.cells[this.ant.y][this.ant.x];
        this.cells[this.ant.y][this.ant.x] = (cellValue + 1) % this.rule.length; // Change cell state

        // Turn the ant
        this.ant.direction = this.nextDir(cellValue, this.ant.direction)
        // if (this.rule[cellValue % this.rule.length] === "R") {
        //     this.ant.direction = (this.ant.direction + 1) % 4; // Turn right
        // } else {
        //     this.ant.direction = (this.ant.direction + 3) % 4; // Turn left
        // }

        // Move the ant forward
        switch (this.ant.direction) {
            case 0: // Move up
                this.ant.y = this.ant.y - 1;
                break;
            case 1: // Move right
                this.ant.x = this.ant.x + 1;
                break;
            case 2: // Move down
                this.ant.y = this.ant.y + 1;
                break;
            case 3: // Move left
                this.ant.x = this.ant.x - 1;
                break;
        }
    };

    moveAnt(steps: number) {
        let changedCells = new Set<number[]>();

        for (let i = 0; i < steps; i++) {
            if (
                this.ant.x < 0 ||
                this.ant.y < 0 ||
                this.ant.x >= this.size ||
                this.ant.y >= this.size
            ) {
                this.steps += i;
                return changedCells
            }
            changedCells.add([this.ant.x, this.ant.y]);
            this.moveOneStep();
        }
        this.steps += steps;
        return changedCells
    }

}

export { AntGrid };