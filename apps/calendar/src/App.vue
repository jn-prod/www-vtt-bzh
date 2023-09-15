<script lang="tsx">
// import pages
import Calendar from '@/views/Calendar.vue';

export default {
  name: 'App',
  components: {
    Calendar,
  },
  render() {
    return (
      <div class="row">
        <div class="col-12">
          <Calendar></Calendar>
        </div>
      </div>
    )
  }
};
</script>
