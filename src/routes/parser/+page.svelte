<script lang="ts">
  let gameString = "";
  let result = "...";

  // game string is a list of columns played in connect four (integers 1-7)
  function parseGameString(gameString: string): string {
    const columns = gameString.split("").map(Number);
    const p1 = [];
    const p2 = [];

    for (let i = 0; i < columns.length; i++) {
      [p1, p2][i % 2].push(columns[i]);
    }

    console.log(p1.join(""), p2.join(""));

    return "...";
  }

  /*
    4141414 = p1win vertical
    1727374 = p1win horizontal
    443256535542422626633 = p1win
    12231334444 = p1win diagonal
    313223342445516 = p1win diagonal
    123747576 = p1win horizontal
    1423233562444 = p1win diagonal
    12723244576 = p1win horizontal

    complete run of columns by one player without the other player placing either the 2nd, 3rd, or 4th square in the run before the first player

    (x-3)(x-2)(x-1)(x) s.t. 4 <= x <= 7 (4567)
    (x-2)(x-1)(x)(x+1) s.t. 3 <= x <= 6 (3456)
    (x-1)(x)(x+1)(x+2) s.t. 2 <= x <= 5 (2345)
    (x)(x+1)(x+2)(x+3) s.t. 1 <= x <= 4 (1234)

    xxxx s.t. 1 <= x <= 7 && count(x) <= 7

    (nth x)(n-1th x+1)(n-2th x+2)(n-3th x+3) s.t. 4 <= n <= 7
    (nth x)(n+1th x+1)(n+2th x+2)(n+3th x+3) s.t. 1 <= n <= 4
    etc
  */
</script>

<div class="h-dvh w-full flex items-center justify-center">
  <div class="flex flex-col gap-8 items-center w-1/3">
    <input
      class="w-full p-8 bg-gray-700 rounded-lg font-mono text-white focus:outline-none focus:border-blue-400 border-4 border-gray-700"
      type="text"
      bind:value={gameString}
      on:input={() => (result = parseGameString(gameString))}
      placeholder="Enter game string..."
      maxlength="42"
      minlength="7"
      required
    />
    <span class="text-4xl text-blue-950 font-mono font-bold">{result}</span>
  </div>
</div>
