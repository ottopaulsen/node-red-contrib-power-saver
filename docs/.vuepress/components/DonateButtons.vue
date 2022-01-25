<template>
  <div class="box">
    <div class="left">
      <form action="https://www.paypal.com/donate" method="post" target="_blank">
        <input type="hidden" name="business" value="5K5SRZU27TAC8" />
        <input type="hidden" name="no_recurring" value="0" />
        <input type="hidden" name="item_name" value="One of my hobbies is creating software for smart homes" />
        <input type="hidden" name="currency_code" value="NOK" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif"
          border="0"
          name="submit"
          title="PayPal - The safer, easier way to pay online!"
          alt="Donate with PayPal button"
        />
        <img alt="" border="0" src="https://www.paypal.com/en_NO/i/scr/pixel.gif" width="1" height="1" />
      </form>
    </div>
    <div class="right">
      <a
        class="patreonButton"
        href="https://www.patreon.com/bePatron?u=65948417"
        data-patreon-widget-type="become-patron-button"
        target="_blank"
        >Become a Patron!
      </a>
    </div>
  </div>
  <div><br /></div>
</template>
<script setup></script>

<style scoped>
.box {
  display: flex;
  justify-content: space-evenly;
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
</style>
