<script lang="ts">
  import type { ResourceType } from '../lib/engine/types.js';

  interface Props {
    resource: ResourceType;
    size?: number;
    class?: string;
  }

  let { resource, size = 20, class: cls = '' }: Props = $props();

  const icons: Record<ResourceType, string> = {
    wood: '🌲',
    brick: '🧱',
    grain: '🌾',
    wool: '🐑',
    ore: '⛏️',
    gold: '🪙',
  };

  const colors: Record<ResourceType, string> = {
    wood: '#5a8a3a',
    brick: '#c44a2a',
    grain: '#e8c468',
    wool: '#a0b880',
    ore: '#8a8a9a',
    gold: '#d4a24c',
  };
</script>

<span
  class="resource-icon {cls}"
  style="font-size: {size}px; color: {colors[resource]}; line-height: 1;"
  title={resource}
  role="img"
  aria-label={resource}
>
  {icons[resource]}
</span>
