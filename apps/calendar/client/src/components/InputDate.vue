<template>
  <span>
    <label :for="id">{{ label }}</label>
    <input
      :id="id"
      ref="input"
      type="date"
      class="form-control"
      :value="dateToYYYYMMDD(value)"
      :name="name"
      @input="updateValue($event.target)"
      @focus="selectAll"
    />
  </span>
</template>

<script lang="js">
export default {
  name: 'InputDate',
  props: {
    value: {
      type: Date,
      default: new Date(),
    },
    name: {
      type: String,
      default: undefined,
    },
    id: {
      type: String,
      default: undefined,
    },
    label: {
      type: String,
      default: undefined,
    },
  },
  emits: ['input-date'],
  setup(props, ctx) {
    const { emit } = ctx;

    // alternative implementations in https://stackoverflow.com/q/23593052/1850609
    const dateToYYYYMMDD = (d) =>
      d && new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000).toISOString().split('T')[0];

    const updateValue = (target) => emit('input-date', target.valueAsDate);

    // Workaround for Safari bug
    // http://stackoverflow.com/questions/1269722/selecting-text-on-focus-using-jquery-not-working-in-safari-and-chrome
    const selectAll = (event) =>
      setTimeout(() => {
        event.target.select();
      }, 0);

    return { dateToYYYYMMDD, updateValue, selectAll };
  },
};
</script>

<style scoped>
input[type='date'] {
  position: relative;
}

/* create a new arrow, because we are going to mess up the native one
see "List of symbols" below if you want another, you could also try to add a font-awesome icon.. */
input[type='date']:after {
  content: '\25BC';
  color: #555;
  padding: 0 5px;
}

/* change color of symbol on hover */
input[type='date']:hover:after {
  color: #bf1400;
}

/* make the native arrow invisible and stretch it over the whole
field so you can click anywhere in the input field to trigger the native datepicker*/
input[type='date']::-webkit-calendar-picker-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  color: transparent;
  background: transparent;
}

/* adjust increase/decrease button */
input[type='date']::-webkit-inner-spin-button {
  z-index: 1;
}

/* adjust clear button */
input[type='date']::-webkit-clear-button {
  z-index: 1;
}
</style>
