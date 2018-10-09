var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method. Axios is similiar to 'request'. It works with REACT
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
// cheerio runs ontop of jQUERY - it basically is modified JQUERY - its used to grab content so that you can use: each, child and parent to manipulate elements you scrape from webpages

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3042;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
// Body parser gives us req.body, if we didn't have that, the backend would not easily be able to access frontend data - its server middleware
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/ScraperScrapper";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(
  MONGODB_URI,
  { useNewUrlParser: true }
);

// Connect to the Mongo DB
// mongoose.connect(
//   "mongodb://localhost:27017/scraper",
//   { useNewUrlParser: true }
// );

// Routes
// gets are like gimmie-gimmie-gimmies, give me the data from this URL
// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.theon1on.com/").then(function(response) {
    // console.log("Not-Onion Website Response: ", response);
    //http://www.echojs.com/
    // http://www.theon1on.com/
    // https://www.reddit.com/r/nottheonion/
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    // use .length in the chrome developer tools on elements you thinkg you'd like to grab, .length includes children
    http: var $ = cheerio.load(response.data);
    console.log("Response Data from Axios Request from Site: ", response.data);
    // Now, we grab every h2 within an article tag, and do the following: (grab h2 "child" elements, i is going to be the number inside the list of items we are selecting and 'elements' are going to be the actual element values)
    $(".recent-news a").each(function(i, element) {
      // Save an empty result object
      var result = {};
      // we need to push to, or allow for the re-definition of, an object because objects include multiple values, not just one
      // Add the text and href of every link, and save them as properties of the result object
      // remember .children(), and maybe even .find(), will grab whatever elements follow from whatever preceedes this function, .parent() grabs whatever elements are above what preceeds the function. Remember that .attr() grabs or sets the attributes of elements

      result.title = $(element).text();
      result.link = $(element).attr("href");
      // This is what was listed before
      // result.title = $(element)
      //   .children("a")
      //   .text();
      // result.link = $(element)
      //   .children("a")
      //   .attr("href");
      console.log("Results/.children of Site Elements: ", result);
      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client... this has to be OUTSIDE the EACH loop because it will "send" for each element, but we want to loop through everything once and then send - in that order
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    // dbArticle should be 'results' or 'data' we received from /articles
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  // find brings back array object, findOne brings back an Object Item which would be a single key:value pair, so an object, _id comes from mongoose documentation
  // req.params always means URL, or in this case whichever id the user navigates too
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it, .populate adds a note to row of this id in the database
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // we could say dbNote or data or results, its a parameter that is given value by the user's data added with create(req.body)
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      // we need to specify WHERE we findOneAndUpdate, otherwise it would just grab the first id, we need to findOneAndUpdate from user info
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    // new:true takes the copy of the article object with the updated note, because return kicks you out if whatever follows the return keyword works, if we return, without specifying new, the old Article model will be returned, but you need returns with chained .thens, or .thens following one after another, because it will be following up gets and posts with multiple after statments/confirmations which are the .thens. But .then chains do build on each other so they are useful when using multiple collections
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(process.env.PORT || 3042, function() {
  console.log("App running on port " + PORT + "!");
});
