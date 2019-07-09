"""
run with python shell : "python -m scrapy runspider spider.py -o events.json"
"""

import scrapy
import os
import datetime

class AgendaSpider(scrapy.Spider):
    now = datetime.datetime.now()
    year = int(now.year)
    name = 'blogspider'
    domain = 'https://www.nafix.fr'
    url = str(domain) + '/sorties/vtt/' + str(year) + '-avenir-56-29-22-35-44-0-0-0-1.html'
    start_urls = [url]

    def parse(self, response):
        for href in response.css('a'):
            if href.css('a ::text').get() == 'VOIR':
                response = href.css('a::attr(href)').get()
                next_page = self.domain + '/' + response.split('/')[2] + '/' + response.split('/')[3]
                yield scrapy.Request(next_page, callback=self.parse_event, dont_filter=True)

        next_page = str(self.domain) + '/sorties/vtt/' + str(self.year+1) + '-avenir-56-29-22-35-44-0-0-0-1.html'
        if next_page is not None:
            yield response.follow(next_page, callback=self.parse)

    def parse_event(self, response):
        def extract_with_css(query):
            return response.css(query).get(default='').strip()
        yield {
            'name': extract_with_css('#txt_ref_int_nom_2 ::text'),
            'city': extract_with_css('#txt_ref_int_lieu_2 ::text'),
            'departement': extract_with_css('#txt_ref_int_dpt_2 ::text'),
            'date': extract_with_css('#txt_ref_int_date_2 ::text'),
            'organisateur': extract_with_css('#txt_ref_int_organisateur_2 ::text'),
            'hour': extract_with_css('#txt_ref_int_horaires_2 ::text'),
            'website': extract_with_css('#StyleLien1 ::text'),
            'price': extract_with_css('#txt_ref_int_prix2 ::text'),
            'contact': extract_with_css('#txt_ref_int_contacttxt ::text'),
            'description': extract_with_css('#txt_ref_int_decription ::text')
        }