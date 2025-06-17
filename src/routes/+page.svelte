<script lang="ts">
    import {
        Button,
        CloseButton,
        Drawer,
        Input,
        Label,
        Range,
        Toggle,
    } from "flowbite-svelte";
    import {
        AdjustmentsHorizontalOutline,
        CaretDownSolid,
        CaretLeftSolid,
        CaretRightSolid,
        CaretUpSolid,
    } from "flowbite-svelte-icons";
    import { onMount } from "svelte";
    import AntCanvas from "$lib/AntCanvas.svelte";

    let antCanvas: AntCanvas;
    let innerHeight: number = $state(0);
    let innerWidth: number = $state(0);
    let ruleString = $state("LLRR");
    let running = $state(true);
    let steps: number = $state(0);
    let hidden: boolean = $state(false);

    const gridSize: number = 512;
    let minCellSize: number = $derived(
        Math.floor(Math.log2(Math.min(innerHeight, innerWidth) / gridSize)),
    );
    const maxCellSize: number = $derived(minCellSize + 6);

    let zoomSlider: number = $state(0);
    let cellSize: number = $derived(Math.round(2 ** zoomSlider));
    let trouchetTiles: boolean = $state(false);
    let hotTiles: boolean = $state(false);
    let principalContour: boolean = $state(false);

    // Control the speed of the ant
    let moveSlider: number = $state(0);
    const maxSpeed: number = 22;
    let movesPerSecond: number = $derived(2 ** moveSlider);

    const onkeydown = (event: KeyboardEvent) => {
        switch (event.key) {
            case "Escape":
                hidden = !hidden;
                break;
            case " ":
                event.preventDefault();
                running = !running;
                break;
            case "ArrowRight":
                moveSlider = Math.min(moveSlider + 1, maxSpeed);
                break;
            case "ArrowLeft":
                moveSlider = Math.max(moveSlider - 1, 0);
                break;
            case "ArrowUp":
                zoomSlider = Math.min(zoomSlider + 1, maxCellSize);
                break;
            case "ArrowDown":
                zoomSlider = Math.max(zoomSlider - 1, minCellSize);
                break;
            case "t":
                if (trouchetTiles) {
                    trouchetTiles = !hotTiles;
                    hotTiles = !hotTiles;
                } else {
                    trouchetTiles = true;
                }
                break;
            case "p":
                principalContour = !principalContour;
                break;
            case "r":
                resetGrid();
                break;
        }
    };
    const resetGrid = () => {
        antCanvas?.resetGrid();
    };
    const newRule = (rule: string) => {
        ruleString = rule.toUpperCase();
    };
    onMount(() => {
        minCellSize = Math.floor(
            Math.log2(Math.min(innerHeight, innerWidth) / gridSize),
        );
        zoomSlider = maxCellSize;
        resetGrid();
    });
</script>

<AntCanvas
    bind:this={antCanvas}
    {gridSize}
    bind:ruleString
    bind:cellSize
    bind:innerWidth
    bind:innerHeight
    bind:running
    bind:trouchetTiles
    bind:hotTiles
    bind:principalContour
    bind:movesPerSecond
    bind:steps
/>

<Button
    tabindex={0}
    pill={true}
    class="absolute z-10 top-10 left-10 p-2!"
    onclick={() => {
        hidden = false;
    }}
>
    <AdjustmentsHorizontalOutline class="h-6 w-6" />
</Button>

<Drawer
    class="h-full w-60 absolute p-5"
    bind:hidden
    closeDrawer={() => {}}
    backdrop={false}
    activateClickOutside={false}
>
    <p class="pt-2">Total steps: {steps.toLocaleString("en")}</p>
    <Label tabindex={0} class="mt-5">Rulestring</Label>
    <Input
        title="Enter rulestring of L's and R's"
        type="text"
        placeholder="Enter rules (e.g., LLRR)"
        bind:value={() => ruleString, newRule}
    />
    <Label class="flex flex-row justify-between pt-4"
        >Moves/second: {movesPerSecond.toLocaleString("en", {
            notation: "compact",
        })}
        <div>
            <kbd><CaretRightSolid class="h-3 w-3" /></kbd><kbd
                ><CaretLeftSolid class="h-3 w-3" /></kbd
            >
        </div></Label
    >
    <Range size="sm" tabindex={0} min="0" max={maxSpeed} bind:value={moveSlider}
    ></Range>

    <Label class="flex flex-row justify-between pt-4"
        >Cell size: {cellSize}
        <div>
            <kbd><CaretUpSolid class="h-3 w-3" /></kbd><kbd
                ><CaretDownSolid class="h-3 w-3" /></kbd
            >
        </div></Label
    >
    <Range
        size="sm"
        tabindex={0}
        min={minCellSize}
        max={maxCellSize}
        bind:value={zoomSlider}
    ></Range>

    <Toggle class="pt-2" tabindex={0} bind:checked={trouchetTiles}>
        Trouchet Tiles <kbd class="ml-auto mr-0">T</kbd>
    </Toggle>
    <Toggle
        class="pt-2"
        tabindex={0}
        bind:checked={hotTiles}
        disabled={!trouchetTiles}
    >
        Hot Tiles <kbd class="ml-auto mr-0">T</kbd><kbd>T</kbd>
    </Toggle>
    <Toggle class="pt-2" tabindex={0} bind:checked={principalContour}>
        Principal contour <kbd class="ml-auto mr-0">P</kbd>
    </Toggle>

    <Button class="mt-2" tabindex={0} onclick={resetGrid}>Reset grid</Button>
    <kbd>R</kbd>

    <Button
        tabindex={0}
        class="w-20 mt-2"
        onclick={() => {
            running = !running;
        }}
    >
        {#if running}
            Pause
        {:else}
            Play
        {/if}
    </Button>
    <kbd class="ml-auto mr-0">Spacebar</kbd>
</Drawer>

<svelte:window {onkeydown} bind:innerHeight bind:innerWidth />

<style>
    kbd {
        visibility: hidden;
    }
</style>
