<template>
  <div class="box">
    <div v-if="vipps" class="right vipps-box">
      <span style="margin-right: 10px;">
        Support PowerSaver development: 
      </span>
      <span>
        <img src="../../images/vipps-smiling-rgb-orange-pos.png" height="30" />
      </span>
      <span class="vippsnummer">#781437 </span>
    </div>
  </div>
  <div><br /></div>
</template>
<script setup>
const props = defineProps({
  paypal: { type: Boolean, required: false, default: true },
  patreon: { type: Boolean, required: false, default: true },
  vipps: { type: Boolean, required: false, default: true },
});
</script>

<style scoped>
.box {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}
left {
  flex: 1 1 auto;
}
right {
  flex: 1 1 auto;
}
.buttonDiv {
  text-size-adjust: 100%;
  color: rgb(36, 30, 18);
  font-family: aktiv-grotesk, sans-serif;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizelegibility;
  -webkit-box-direction: normal;
  width: 11rem;
}
.patreonButton {
  text-size-adjust: 100%;
  font-family: aktiv-grotesk, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizelegibility;
  -webkit-box-direction: normal;
  -webkit-box-align: center;
  align-items: center;
  backface-visibility: hidden;
  background-color: rgb(255, 66, 77);
  border-radius: 9999px;
  border: 1px solid rgb(255, 66, 77);
  box-sizing: border-box;
  display: inline-flex;
  font-weight: 500;
  height: unset;
  -webkit-box-pack: center;
  justify-content: center;
  padding: 0.46875rem 1rem;
  position: relative;
  pointer-events: unset;
  text-align: center;
  text-transform: none;
  transition: all 300ms cubic-bezier(0.19, 1, 0.22, 1) 0s;
  user-select: none;
  white-space: unset;
  width: 100%;
  color: rgb(255, 255, 255) !important;
  font-size: 0.875rem !important;
  text-decoration: none;
  cursor: pointer;
}

.vipps-box {
  display: flex;
  align-items: flex-start;
}

.vippsnummer {
  font-size: 1.3rem;
  margin-left: 10px;
}
</style>
