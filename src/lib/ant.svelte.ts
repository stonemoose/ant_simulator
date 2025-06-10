class AntGrid {

    cells: number[][];
    size: number;
    rule: string;
    steps: number;
    ant;
    startAnt;

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
        this.startAnt = { ...this.ant };
    }

    nextDir(state: number, direction: number) {

        let newDirection = 0;
        if (this.rule[state % this.rule.length] === "R") {
            newDirection = (direction + 1) % 4; // Turn right
        } else {
            newDirection = (direction + 3) % 4; // Turn left
        }
        return newDirection;
    }

    moveOneStep() {
        let cellValue = this.cells[this.ant.y][this.ant.x];

        // Turn the ant
        this.ant.direction = this.nextDir(cellValue, this.ant.direction)

        // Change cell state
        this.cells[this.ant.y][this.ant.x] = (cellValue + 1) % this.rule.length;

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

    principalContour() {
        let path: string[] = [];
        let visitedCells = new Set<number[]>();
        let pretendAnt = { ...this.ant };

        do {
            if (visitedCells.has([pretendAnt.x, pretendAnt.y])) {
                if (this.cells[pretendAnt.y][pretendAnt.x] % 2) {
                    console.log("could not get back to start")
                    break
                }
            } else {
                visitedCells.add([pretendAnt.x, pretendAnt.y])
            }

            let cellValue = this.cells[pretendAnt.y][pretendAnt.x];
            pretendAnt.direction = this.nextDir(cellValue, pretendAnt.direction)

            path.push(this.rule[this.cells[pretendAnt.y][pretendAnt.x]])
            switch (pretendAnt.direction) {
                case 0: // Move up
                    pretendAnt.y = pretendAnt.y - 1;
                    break;
                case 1: // Move right
                    pretendAnt.x = pretendAnt.x + 1;
                    break;
                case 2: // Move down
                    pretendAnt.y = pretendAnt.y + 1;
                    break;
                case 3: // Move left
                    pretendAnt.x = pretendAnt.x - 1;
                    break;
            }
        } while (pretendAnt.x != this.startAnt.x || pretendAnt.y != this.startAnt.y || pretendAnt.direction != this.startAnt.direction);

        return path
    }


}

export { AntGrid };