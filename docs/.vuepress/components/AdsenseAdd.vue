<template>
  <div>
    <ins
      v-if="øverst"
      class="adsbygoogle"
      style="display: inline-block; width: 740px; height: 90px"
      data-ad-client="ca-pub-9857859182772006"
      data-ad-slot="7524453641"
    ></ins>
    <ins
      v-if="type === 'nederst'"
      class="adsbygoogle"
      style="display: block"
      data-ad-client="ca-pub-9857859182772006"
      data-ad-slot="3584713798"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
    <ins
      v-if="type === 'artikkel'"
      class="adsbygoogle"
      style="display: block; text-align: center"
      data-ad-layout="in-article"
      data-ad-format="fluid"
      data-ad-client="ca-pub-9857859182772006"
      data-ad-slot="3152349396"
    ></ins>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

const props = defineProps({
  type: { type: String, required: false, default: "artikkel" },
});
onMounted(() => {
  (adsbygoogle = window.adsbygoogle || []).push({});
});
</script>

<style scoped>
ins {
  margin-bottom: 30px;
}
</style>
