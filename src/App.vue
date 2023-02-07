<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style lang="stylus">
@import '~variables'

.modal-content.json-modal {
  background: $card-background;
}

.consumergroupstatus-info { background: darken($card-success-icon, 65%); }
.consumergroupstatus-warning { background: darken($card-warning-icon, 60%); }
.consumergroupstatus-error { background: darken($card-error-side-bg, 0%); }

</style>
