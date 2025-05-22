<script lang="ts">
    import { AntGrid } from "$lib/ant.svelte";
    import { Viewer } from "svelte-image-viewer";
    import { onMount } from "svelte";

    let ruleString = $state("LLRR");
    let running = $state(true);
    let steps = $state(0);
    let gridSize: number = 500;
    let cellSize: number = 30;
    let moveSlider: number = $state(0);
    let movesPerSecond: number = $derived(2 ** moveSlider);
    let batchSize: number = $derived(
        Math.max(Math.floor(movesPerSecond / 32), 1),
    );
    let canvas: HTMLCanvasElement | undefined = $state();
    let context: CanvasRenderingContext2D;
    let antGrid: AntGrid;

    // Function to draw the ant
    const drawAnt = () => {
        context.fillStyle = "red"; // Ant color
        context.fillRect(
            antGrid.ant.x * cellSize,
            antGrid.ant.y * cellSize,
            cellSize,
            cellSize,
        );
    };

    // Function to draw a specific cell
    const drawCell = (x: number, y: number) => {
        context.fillStyle = getColorFromState(antGrid.cells[y][x]);
        context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    };

    // Run the ant movement
    $effect(() => {
        if (running) {
            const interval = setInterval(
                () => {
                    const changedCells = antGrid.moveAnt(batchSize);
                    changedCells.forEach((cell) => {
                        drawCell(cell[0], cell[1]);
                    });
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

    let lastSteps = 0;
    let actualMovesPerSecond = $state(0);
    $effect(() => {
        const interval = setInterval(() => {
            actualMovesPerSecond = steps - lastSteps;
            lastSteps = steps;
        }, 1000);
        return () => {
            clearInterval(interval);
        };
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

    const resetGrid = (rule: string) => {
        context.clearRect(0, 0, gridSize * cellSize, gridSize * cellSize);
        ruleString = rule.toUpperCase();
        antGrid = new AntGrid(gridSize, ruleString);
        steps = 0;
        colorCache.clear();

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                drawCell(x, y);
            }
        }
        drawAnt();
        running = true;
    };

    onMount(() => {
        context = canvas!.getContext("2d")!;
        resetGrid(ruleString);
    });
</script>

<div class="slider-container">
    <div>
        <h1>Langton's Ant Simulation</h1>
        <h2>Current Rules: {ruleString}</h2>
        <input
            type="text"
            placeholder="Enter rules (e.g., LLRR)"
            bind:value={() => ruleString, resetGrid}
        />
        <input type="range" min="0" max="22" step="1" bind:value={moveSlider} />
        <h2>Total steps: {steps.toLocaleString("en")}</h2>
        <h2>
            Moves/second: {movesPerSecond.toLocaleString("en", {
                notation: "compact",
                compactDisplay: "short",
            })} (real: {actualMovesPerSecond.toLocaleString("en", {
                notation: "compact",
                compactDisplay: "short",
            })})
        </h2>
        <h2>Running?: {running}</h2>
    </div>
</div>

<!-- Make minscale dynamic based on screen size so that the grid still fills the screen -->
<Viewer minScale={0.05} maxScale={2}>
    <canvas
        bind:this={canvas}
        width={gridSize * cellSize}
        height={gridSize * cellSize}
    ></canvas>
</Viewer>

<style>
    .slider-container {
        position: absolute; /* Position slider on top */
        top: 20px; /* Distance from top */
        left: 20px; /* Distance from left */
        background: rgba(255, 255, 255, 0.7); /* Background for the slider */
        padding: 10px; /* Padding */
        border-radius: 8px; /* Rounded corners */
        z-index: 10; /* Make sure it is above the grid */
    }
</style>
