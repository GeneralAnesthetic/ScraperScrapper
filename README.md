# ScraperScrapper

This app uses: express,(supposedly express-handlebars) mongoose, body-parser, cheerio & request npm packages to
scrape recent-news article titles and href attributes from http://www.theon1on.com/. The data is then displayed to the user in selectable text snippets that are saved to a MongoDB database. Once selected, the user can post comments to a different collection/table under that same database. Neat!
