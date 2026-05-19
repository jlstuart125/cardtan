<script lang="ts">
  import { gameState } from './lib/stores.js';
  import Board from './components/Board.svelte';
</script>

<Board state={$gameState} />
