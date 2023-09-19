<script lang="tsx">
// import pages
import CalendarView from '@/views/CalendarView.vue';

export default {
  name: 'App',
  components: {
    CalendarView,
  },
  render() {
    return (
      <div class="row">
        <div class="col-12">
          <CalendarView></CalendarView>
        </div>
      </div>
    );
  },
};
</script>
