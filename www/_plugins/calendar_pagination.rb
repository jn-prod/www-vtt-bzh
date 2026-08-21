# frozen_string_literal: true

module Jekyll
  class CalendarPaginationGenerator < Generator
    safe true
    priority :low

    PAGE_SIZE = 20

    def generate(site)
      events = site.data['events'] || []
      total_pages = (events.length.to_f / PAGE_SIZE).ceil

      events.each_slice(PAGE_SIZE).with_index(1) do |slice, page_number|
        next if page_number == 1

        page = PageWithoutAFile.new(site, site.source, "calendrier/page/#{page_number}", 'index.html')
        page.content = ''
        page.data = {
          'layout' => 'calendar-page',
          'title' => "Calendrier rando VTT Bretagne — page #{page_number}",
          'description' => "Randonnées VTT à venir en Bretagne, page #{page_number} sur #{total_pages}.",
          'events' => slice,
          'page_number' => page_number,
          'total_pages' => total_pages,
          'sitemap' => true
        }
        site.pages << page
      end
    end
  end
end
