<script lang="ts">
    import { AntGrid } from "$lib/ant.svelte";
    import { onMount } from "svelte";

    let {
        ruleString = $bindable("LLRR"),
        running = $bindable(true),
        cellSize = $bindable(64),
        movesPerSecond = $bindable(1),
        trouchetTiles = $bindable(false),
        hotTiles = $bindable(false),
        principalContour = $bindable(false),
        gridSize = 512,
        steps = $bindable(0),
        innerWidth = $bindable(),
        innerHeight = $bindable(),
    } = $props();

    let antGrid: AntGrid;

    // Control the speed of the ant
    let batchSize: number = $derived(
        Math.max(Math.floor(movesPerSecond / 32), 1),
    );

    let canvas: HTMLCanvasElement | undefined = $state();
    let context: CanvasRenderingContext2D;

    export const resetGrid = () => {
        antGrid = new AntGrid(gridSize, ruleString);
        steps = 0;
        colorCache.clear();
        redrawGrid();
    };

    // Function to draw the ant
    const drawAnt = () => {
        context.save();
        context.translate(antGrid.ant.x * cellSize, antGrid.ant.y * cellSize);
        context.strokeStyle = "red";
        context.fillStyle = "red";
        context.beginPath();
        context.strokeRect(1, 1, cellSize - 2, cellSize - 2);

        context.translate(cellSize / 2, cellSize / 2);
        context.rotate(((antGrid.ant.direction + 2) * Math.PI) / 2);
        context.moveTo(-0.2 * cellSize, -0.5 * cellSize);
        context.lineTo(0.2 * cellSize, -0.5 * cellSize);
        context.lineTo(0, -0.3 * cellSize);
        context.fill();

        context.restore();
    };

    const drawTrouchet = (x: number, y: number, state: number) => {
        const vCell = (x + y + 1) % 2;
        const leftTurn = ruleString[state] == "L";

        context.strokeStyle =
            antGrid.cells[y][x] * 2 < antGrid.rule.length ? "black" : "white";

        context.beginPath();
        context.moveTo(
            (x + (vCell ^ +leftTurn)) * cellSize,
            (y + 0.5) * cellSize,
        );
        context.lineTo((x + 0.5) * cellSize, y * cellSize);

        context.moveTo(
            (x + 1 - (vCell ^ +leftTurn)) * cellSize,
            (y + 0.5) * cellSize,
        );
        context.lineTo((x + 0.5) * cellSize, (y + 1) * cellSize);

        context.stroke();

        if (hotTiles && antGrid.cells[y][x] % 2) {
            context.strokeStyle =
                antGrid.cells[y][x] * 2 < antGrid.rule.length
                    ? "rgb(0 0 0 / 50%)"
                    : "rgb(255 255 255 / 50%)";
            context.beginPath();
            context.moveTo(
                (x + 1 - (vCell ^ +leftTurn)) * cellSize,
                y * cellSize,
            );
            context.lineTo(
                (x + (vCell ^ +leftTurn)) * cellSize,
                (y + 1) * cellSize,
            );
            context.stroke();
        }
    };

    const drawArcTrouchet = (x: number, y: number, state: number) => {
        const vCell = (x + y) % 2;
        const leftTurn = ruleString[state] == "L";

        context.strokeStyle = "blue";
        const startAngle = 0;
        context.beginPath();
        context.arc(
            (x + (vCell ^ +leftTurn)) * cellSize,
            y * cellSize,
            cellSize / 2,
            startAngle,
            startAngle + Math.PI,
            !leftTurn,
        );
        context.stroke();

        context.strokeStyle = "green";
        context.beginPath();
        context.arc(
            (x + 1 - (vCell ^ +leftTurn)) * cellSize,
            (y + 1) * cellSize,
            cellSize / 2,
            startAngle,
            startAngle + Math.PI,
            leftTurn,
        );
        context.stroke();
    };

    const drawCell = (x: number, y: number) => {
        context.fillStyle = getColorFromState(antGrid.cells[y][x]);
        context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        if (trouchetTiles) {
            drawTrouchet(x, y, antGrid.cells[y][x]);
        }
    };

    const drawContour = (path: string[]) => {
        context.save();
        context.lineWidth = Math.max(1, Math.round(cellSize / 16));
        context.lineCap = "square";
        context.strokeStyle = "blue";
        context.translate(
            (antGrid.ant.x + 0.5) * cellSize,
            (antGrid.ant.y + 0.5) * cellSize,
        );
        context.rotate(((antGrid.ant.direction + 2) * Math.PI) / 2);

        path.forEach((move) => {
            context.beginPath();
            context.moveTo(0, -0.5 * cellSize);
            if (move == "R") {
                context.lineTo(-0.5 * cellSize, 0);
                context.translate(-cellSize, 0);
                context.rotate(Math.PI / 2);
            } else {
                context.lineTo(0.5 * cellSize, 0);
                context.translate(cellSize, 0);
                context.rotate(-Math.PI / 2);
            }
            context.stroke();
        });
        context.restore();
    };

    // Run the ant movement
    $effect(() => {
        if (running) {
            const interval = setInterval(
                () => {
                    if (principalContour) {
                        switch (antGrid.ant.direction) {
                            case 0:
                                drawCell(antGrid.ant.x, antGrid.ant.y + 1);
                                break;
                            case 1:
                                drawCell(antGrid.ant.x - 1, antGrid.ant.y);
                                break;
                            case 2:
                                drawCell(antGrid.ant.x, antGrid.ant.y - 1);
                                break;
                            case 3:
                                drawCell(antGrid.ant.x + 1, antGrid.ant.y);
                                break;
                        }
                    }
                    const changedCells = antGrid.moveAnt(batchSize);
                    changedCells.forEach((cell) => {
                        drawCell(cell[0], cell[1]);
                    });
                    if (principalContour) {
                        drawContour(antGrid.principalContour());
                    }
                    drawAnt();
                    steps = antGrid.steps;
                },
                Math.floor((1000 * batchSize) / movesPerSecond),
            );
            return () => {
                clearInterval(interval);
            };
        }
    });

    // Function to calculate the color based on the current state
    let colorCache = new Map();
    const getColorFromState = (state: number) => {
        if (colorCache.has(state)) {
            return colorCache.get(state);
        }

        const maxState: number = ruleString.length - 1; // Maximum state (0 to maxState)
        if (maxState == 0) {
            colorCache.set(state, "white");
            return "white";
        }
        const grayscaleValue: number = Math.floor((1 - state / maxState) * 255); // Calculate grayscale value
        const rgb = `rgb(${grayscaleValue}, ${grayscaleValue}, ${grayscaleValue})`;

        colorCache.set(state, rgb);
        return rgb;
    };

    const redrawGrid = () => {
        context.clearRect(0, 0, gridSize * cellSize, gridSize * cellSize);
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                drawCell(x, y);
            }
        }
        if (principalContour) {
            drawContour(antGrid.principalContour());
        }
        drawAnt();
    };

    $effect(() => {
        canvas!.width = innerWidth;
        canvas!.height = innerHeight;
        const canvasTransformX = (canvas!.width - gridSize * cellSize) / 2;
        const canvasTransformY = (canvas!.height - gridSize * cellSize) / 2;

        if (!context) {
            return;
        }
        context.reset();
        context.translate(
            Math.round(canvasTransformX),
            Math.round(canvasTransformY),
        );
        redrawGrid();
    });

    $effect(() => {
        if (!trouchetTiles) {
            hotTiles = false;
        }
    });

    const increaseCell = (event: MouseEvent) => {
        const middle = (gridSize - 1) / 2;
        const y = Math.round(
            middle + (event.offsetY - canvas!.height / 2) / cellSize,
        );
        const x = Math.round(
            middle + (event.offsetX - canvas!.width / 2) / cellSize,
        );
        antGrid.cells[y][x] += 1;
        antGrid.cells[y][x] %= antGrid.rule.length;
        drawCell(x, y);
        drawAnt();
    };

    onMount(() => {
        context = canvas!.getContext("2d")!;
        resetGrid();
    });
</script>

<canvas
    onclick={increaseCell}
    class="absolute w-full h-full"
    bind:this={canvas}
    style="pointer-events: auto;"
></canvas>

<style>
</style>
