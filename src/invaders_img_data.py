
import bs4.element as el
from bs4 import BeautifulSoup

import time
import math
import requests

"""
Awaz-inv API endpoints :
    - www.awazleon.space/cities/<city_prefix>/info : informations about a specific city (pa, ny, etc.)
    - www.awazleon.space/cities/info : informations about every invaded city
    - www.awazleon.space/invaders/<invader_id>/info : informations about a specific space invader
    - www.awazleon.space/invaders/<city_prefix>/city : informations about the invaders of a specific city
"""

class ImagesScraper(object):

    def __init__(self) -> None:
        self.base_url = 'https://invader-spotter.art/villes.php'
        self.img_base_url = 'https://invader-spotter.art/grosplan/{0}/{1}_{2}-grosplan.png'

        self.new_request()

    def new_request(self) -> None:
        raw_html = requests.get(self.base_url).text
        self.soup = BeautifulSoup(raw_html, 'html.parser')
        self.cities = self.get_cities()

    def get_image_link(self, city_code: str, number: int) -> str:
        self.new_request()

        city = self.cities.get(city_code)
        if not city:
            return ''
        max_digit = math.ceil(math.log10(city['invaders']))
        max_digit = max_digit + 1 if max_digit == 1 else max_digit
        return self.img_base_url.format(city_code, city_code, f'{number:0{max_digit}d}')

    def get_cities(self) -> dict[str, dict[str, int]]:
        links: list[el.Tag] = self.soup.find_all('a', href = True)
        cities = {}

        for link in links:
            href: str = link['href']
            substring = 'javascript:envoi("'
            if href.startswith(substring):
                code = href.replace(substring, '').replace('")', '')
                cities[code] = {}

                name = link.next
                invaders_nb = int(name.next.split(' / ')[1].replace(')', ''))
                cities[code]['name'] = name
                cities[code]['invaders'] = invaders_nb

        return cities
    
if __name__ == '__main__':
    scraper = ImagesScraper()
    print(scraper.get_image_link('TK', 17))