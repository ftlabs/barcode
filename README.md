# Barcode

An API endpoint to gather all of the main images used in FT articles from a provided date range, the last 24 hours for example, and squash them (width wise) to give one condensed image that represents the news. The final result looks similar to a coloured barcode.


## Installation

You will need to create a .env file and include the mandatory environment variables, which are:

```
CAPI_KEY= # you can request this via the FT developer portal
TOKEN= # for authorised access without S3O or IP range. This can be set to a noddy value for development.
PORT= # auto set in Heroku, but needs specifying for development.
TWITTER_CONSUMER_KEY= # you can get the twitter keys by creating a twitter app (with a twitter dev account)
TWITTER_CONSUMER_SECRET= # 
TWITTER_ACCESS_TOKEN_KEY= # 
TWITTER_ACCESS_TOKEN_SECRET= # 
DOWNLOAD_PATH= # path to folder allowing image downloads
```

Install nodemon globally by running `npm install -g nodemon`.

Install GraphicsMagick through homebrew `brew install GraphicsMagick`

Install the dependencies by running `npm install` and start the server with `npm start`.


## Tests

```sh
$ npm test
```

## Documentation 

### What does it do?

The prototype queries SAPI for all the articles in a requested date span.
The main images of each article found are downloaded, squashed (width or height wise) and then combined into one image.
The created image is then posted to Twitter. 

### How does that look?

![Alt text](./docs/example_horizontal.jpg?raw=true "Example Horizontal Barcode image")
*Images from 10th Nov - 14th Nov 2018 in a horizontal stack*

![Alt text](./docs/example_vertical.jpg?raw=true "Example Vertical Barcode image")
*Images from 10th Nov - 14th Nov 2018 in a vertical stack*

![Alt text](./docs/updated_horizontal.png?raw=true "Example (updated) Horizontal Barcode image")
*[UPDATED] Images from 19th Nov - 20th Nov 2018 in a horizontal stack*


### How can I use it?

You can run it locally by using ```nodemon index.js``` 

The base request is:
```
http://localhost:8000/barcode
```

You can also optionally pass the following parameters:

+ **width** - width of returned image - *default 1024* 
+ **height** - height of returned image - *default 768*
+ **dateFrom** - date to start image selection from - *default 2018-11-10*
+ **dateTo** - date to end image selection on - *default 2018-11-14*
+ **orientation** - stack images horizontally or vertically - **h/v** - *default v*
+ **fit** - gets images as masks or squashed - **fill/cover** - *default true*


### What technologies does it use?

+ **[Origami image service](https://www.ft.com/__origami/service/image/v2)** : to request FT images in the correct dimensions for editing
+ **node.js** : provides the backend also requests and saves remote FT images
+ **graphicsmagick** : concatenates downloaded images into a single image
+ **Twitter API** : for uploading and posting the image to a Twitter account


### How does it do it?

+ A user enters the request URL into a browser address bar
+ A **SAPI** request is made for all articles & blogs published within the queried time range. The request only asks for the images aspect and no facets. A JSON of all matching articles are sent back.
+ The JSON is then filtered to get an array of all the images (one per article), stripping out any other parameters or articles that don't have a headline image.
+ The image URL's are then updated to request the sliced and/or compressed versions
+ Each image is then downloaded to a local folder
+ GraphicsMagick then creates a new image by stitching together the downloaded images (in original published order)
+ The new image is then saved to a local folder
+ The image is then uploaded as a Media item to Twitter using the Twitter API
+ The Twitter API also creates a new tweet using that media item.
+ Once this process is complete the image is returned to the users browser
