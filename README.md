# Barcode

An API endpoint to gather all of the main images used in FT articles from a provided date range, the last 24 hours for example, and squash them (width wise) to give one condensed image that represents the news. The final result looks similar to a coloured barcode.

Can be tested out here:
[https://ft-barcode.herokuapp.com/](https://ft-barcode.herokuapp.com/)

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
DOWNLOAD_FOLDER=downloads # path to folder allowing image downloads
RESULT_FOLDER=downloads/results # path to folder for final combined image storage
```

Install nodemon globally by running `npm install -g nodemon`.

Install GraphicsMagick through homebrew `brew install GraphicsMagick`

Install the dependencies by running `npm install` and start the server with `npm start`.


### Heroku deployment

To get GraphicsMagick working on Heroku you need to add some buildpacks, make sure they are in this order:

+ https://github.com/heroku/heroku-buildpack-apt
+ https://github.com/bogini/heroku-buildpack-graphicsmagick
+ heroku/nodejs


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

#### Vertical 

| Fill | Cover | Solid |
|---|---|---|
| ![Alt text](./docs/readme/vertical_fill.png?raw=true "Example Vertical line image with fill parameter") | ![Alt text](./docs/readme/vertical_cover.png?raw=true "Example Vertical line image with cover parameter") | ![Alt text](./docs/readme/vertical_colour_sort.png?raw=true "Example Vertical solid image with colour sorting") | 

*Images from 13th Nov - 14th Nov 2018*

#### Horizontal

| Fill | Cover | Solid |
|---|---|---|
| ![Alt text](./docs/readme/horizontal_fill.png?raw=true "Example Horizontal line image with fill parameter") | ![Alt text](./docs/readme/horizontal_cover.png?raw=true "Example Horizontal line image with cover parameter") | ![Alt text](./docs/readme/horizontal_colour_sort.png?raw=true "Example Horizontal solid image with colour sorting") | 

*Images from 13th Nov - 14th Nov 2018*


### How can I use it?

You can run it locally by using ```nodemon index.js```

The base request is:
```
http://localhost:8000/barcode
```

You can also optionally pass the following parameters:

+ **width** - width of returned image - *default 1024*
+ **height** - height of returned image - *default 768*
+ **dateFrom** - date to start image selection from - *default 2018-11-15*
+ **dateTo** - date to end image selection on - *default 2018-11-16*
+ **orientation** - stack images horizontally or vertically - **h/v** - *default h*
+ **fit** - gets images as masks or squashed - **fill/cover/solid** - *default fill*
+ **sort** - display order of images - **published/colour** - *published fill*


### What technologies does it use?

+ **[Origami image service](https://www.ft.com/__origami/service/image/v2)** : to request FT images in the correct dimensions for editing
+ **node.js** : provides the backend also requests and saves remote FT images
+ **graphicsmagick** : concatenates downloaded images into a single image
+ **Twitter API** : for uploading and posting the image to a Twitter account


### How does it do it?

+ A user enters the request URL into a browser address bar
+ A **SAPI** request is made for all articles & blogs published within the queried time range. The request only asks for the images aspect and no facets. A JSON of all matching articles are sent back.
+ The JSON is then filtered to get an array of all the images (one per article), stripping out any other parameters or articles that don't have a headline image.
+ The image URL's are then updated to request the sliced, solid or compressed versions
+ Images that are missing from the in-memory cache (and therefore are already downloaded) will be request from Origami and saved to a local folder
+ GraphicsMagick then creates a new image by stitching together the downloaded images (in the order requested, colour or published)
+ The new image is then saved to a local folder
+ **[If twitter share was requested]** The image is then uploaded as a Media item to Twitter using the Twitter API. The Twitter API also creates a new tweet using that media item.
+ Once this process is complete the image is returned to the users browser


## Feature creep

A list of some interesting expansions for the project:

+ ~Sort by (pixel) colour~
+ ~Allow searching for date AND time ranges~
+ ~Allow sorting order to be sorted (publish/colour) by ASC and DESC~
+ Add more colour sorting variations
+ Add the option to search by theme, person, genre
+ On startup check for any existing images and add paths to cache
+ Use Rekognition to identify images of a given person and return a barcode of that person (or even a mosaic?)


## Lessons learned

### Image genereation speed

**WIP**

Running Barcode locally generates images in a second or two. Unfortuantly once deployed to Heroku the image creation was about 8 - 15 seconds with the occasion timeout. Not good.


https://github.com/railsagainstignorance

I wasnt sure what was casuing the slow down, was it the image downloads or the barcode image generation? So I added some console.log timing tracking and found the three longest performing functions:

- Image request and downloads
- Resizing images
- Generation of final image

I went on the hunt for some better libraries and functions that were faster/better performing than the ones I was using. [railsagainstignorance](https://github.com/railsagainstignorance) also suggested caching the images rather than redownloading on each request.

**Fix:** Found some fast/performant/lightweight libraries to replace the ones I was already using. Also images are saved with their FT image ID's to identify if the image is already downloaded, so no need to download it again.

---

### Extract pixel colour from an image? Easy...right?

One of the awesome feature creeps was the option to sort the images that make up the barcode by colour.
I thought it would be simple enough to get a 1x1 pixel image from Origami, get the colour of that pixel and use that as the sort value.

However I couldn't work out how to interperet the raw image data, during the file request stream, to get an RGB value of the image therefore not needing to read the image twice.

**Fix:** Currently using the npm package [`image-average-color`](https://www.npmjs.com/package/image-average-color) to get colour from an image

---

### Sort by colour? Easy...right?

Once the RGB/Hex colours for each image have been found they need to be sorted into some kind of colour/saturation/brightness order. 

I tried to add the RGB values together and sort the images like that but the sorting didn't look right.

I also looked for some libraries to help out but none had the ability to sort an array of id'd RGB or Hex values, only a flat array of values.

In the end I had to extract the values for each image, sort those values seperate from the id's and then sort the id array based on the sorting of the colour sorted array.

**Fix:** In the end I had to extract the values for each image, sort those values seperate from the id's and then sort the id array based on the sorting of the colour sorted array.

Currently using [`color-sort` package](https://www.npmjs.com/package/color-sort) to sort the hex colours of each image. There may be room here to add different sorting filters & libraries to diversify the sorting options for users 

---

### Additional white bars appearing in images

![Alt text](./docs/lessons_learned/additional_whitebars.png?raw=true "Example barcode image with additional white bars on some images")

While working on the colour sorting feature we found that some images were getting additional whitebars on the top and bottom of the image, even though the downloaded image did not have them.

After some super detective work (thanks [Lily2point0](https://github.com/Lily2point0)), it was discovered that affected downloaded images had an additional resolution parameter that the others did not. This was because they were png's while the other iamges were jpgs.

**Fix:** Added `&format=jpg` to the Origami image request

![Alt text](./docs/lessons_learned/additional_whitebars_fixed.png?raw=true "Example barcode image with additional white bars removed")

---