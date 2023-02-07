<template>
  <div :class="'row flex-center consumergroupstatus ' + type.class">
    <span class="">{{type.text}}</span>
  </div>
</template>

<script>
import { aggregatedConsumerGroupStatus } from "../utils/TopologyUtils.js";

export default {
  name: "ConsumerGroupStatus",
  props: {
    status: Object
  },
  computed: {
    type() {
      const type = { text: aggregatedConsumerGroupStatus.toPrettyString(this.status) || this.status };
      const warning = aggregatedConsumerGroupStatus.isWarning(this.status);
      const error = aggregatedConsumerGroupStatus.isError(this.status);
      if (!warning && !error) {
          type.class = "consumergroupstatus-info";
      } else if (error) {
          type.class = "consumergroupstatus-error";
      } else {
          type.class = "consumergroupstatus-warning";
      }
      return type;
    }
  }
};
</script>

<style scoped lang="stylus">
@import '~variables'

.consumergroupstatus {
  width: 48px;
  height: 48px;
  border-radius: $card-border-radius;
  font-size: 10px;
  font-weight: 700;
}
</style>
