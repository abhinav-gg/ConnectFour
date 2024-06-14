<script lang="ts">
  import { Game, CellState } from "$lib/connect4";

  const sidebarItems = ["Play", "Puzzles", "Learn"];

  const players = [
    {
      name: "Example Player",
      rating: 1600,
      color: "yellow-300",
    },
    {
      name: "You",
      rating: 1600,
      color: "emerald-300",
    },
  ];

  let game = new Game();
  let gameState = game.gameState;
  $: movesString = $gameState.moves.join("");
</script>

<div class="w-full h-screen flex flex-row bg-[#302E2B]">
  <div class="h-full bg-neutral-800 hidden md:flex flex-col">
    <h1
      class="flex items-center justify-center w-full text-xl text-white font-bold py-3 px-6"
    >
      Connect 4
    </h1>
    {#each sidebarItems as item}
      <a
        class="flex items-center w-full text-lg text-white font-semibold py-2 pl-6"
        href="/{item.toLowerCase()}"
      >
        {item}
      </a>
    {/each}
  </div>
  <div class="bg-[#302E2B] flex md:p-4 items-center justify-center h-screen">
    <div class="flex flex-col w-full justify-start gap-y-3 max-h-screen">
      <div class="flex flex-row gap-2 items-center">
        <span class="bg-yellow-300 w-10 aspect-square rounded-sm"></span>
        <span class="font-medium text-white"
          >Example Player <span class="font-light text-stone-400">(1600)</span
          ></span
        >
      </div>
      <div
        class="flex items-center justify-center md:rounded-md flex-grow overflow-hidden relative"
      >
        <div
          class="absolute top-0 left-0 w-full h-full flex flex-row z-10 board-padding"
        >
          {#each Array(7) as _, i}
            <table
              class="w-full h-full border-spacing-0 border-none group"
              cellspacing="0"
              cellpadding="0"
            >
              <tbody>
                {#each Array(6) as _, j}
                  <tr class="w-full h-1/6">
                    {#if $gameState.grid[i][j] === CellState.Player1}
                      <td class="w-1/7 h-1/6 bg-emerald-300"> </td>
                    {:else if $gameState.grid[i][j] === CellState.Player2}
                      <td class="w-1/7 h-1/6 bg-yellow-300"> </td>
                    {:else}
                      <td class="w-1/7 h-1/6 bg-transparent"> </td>
                    {/if}
                  </tr>
                {/each}
              </tbody>
            </table>
          {/each}
        </div>

        <img
          src="/grid.svg"
          class="object-contain max-h-full z-10"
          alt="Connect Four grid"
        />

        <div
          class="absolute top-0 left-0 w-full h-full p-[1.5060241%] flex flex-row z-20"
        >
          {#each Array(7) as _, i}
            <table
              class="w-full h-full border-spacing-0 border-none group"
              cellspacing="0"
              cellpadding="0"
            >
              <tbody>
                {#each Array(6) as _, j}
                  <tr class="w-full h-1/6">
                    <td
                      class="w-1/7 h-1/6 group-hover:bg-black/20 cursor-pointer relative"
                      on:click={() => {
                        game.captureCell(i);
                      }}
                    >
                      <!-- todo fix width and ring size here -->
                      {#if j === $gameState.lowestCellIndices[i] && $gameState.grid[i][j] === CellState.Empty}
                        {#if $gameState.currentPlayer === 0}
                          <span
                            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-300 w-5 aspect-square rounded-full"
                          ></span>
                        {:else}
                          <span
                            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group-hover:bg-yellow-300 w-5 aspect-square rounded-full"
                          ></span>
                        {/if}
                      {:else if $gameState.lastMove[0] === i && $gameState.lastMove[1] === j}
                        <span
                          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-transparent ring-4 sm:ring-8 ring-white rounded-full aspect-square circ-width"
                        ></span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/each}
        </div>
      </div>
      <div class="flex flex-row gap-2 items-center">
        <span class="bg-emerald-300 w-10 aspect-square rounded-sm"></span>
        <span class="font-medium text-white"
          >You <span class="font-light text-stone-400">(1600)</span></span
        >
      </div>
    </div>
  </div>
  <div class="h-full hidden md:flex p-4 bg-[#302E2B]">
    <div class="rounded-lg bg-neutral-900 flex flex-col p-4 mr-auto">
      <span class="text-white font-bold text-4xl">Play vs...</span>
      <div class="flex items-center justify-center w-full mt-6 flex-col gap-2">
        <span class="w-24 aspect-square rounded-md bg-yellow-300"></span>
        <span class="text-white text-lg font-bold"
          >Example Player <span class="font-light text-stone-400">(1600)</span
          ></span
        >
        <input type="text" readonly bind:value={movesString} />
      </div>
    </div>
  </div>
</div>

<style>
  .circ-width {
    width: calc((72 / 92) * 98%);
  }

  .board-padding {
    padding: calc(10 / 664 * 100%);
  }
</style>
