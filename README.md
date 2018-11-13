# Barcode

An API endpoint to gather all of the main images used in FT articles from a provided date range, the last 24 hours for example, and squash them (width wise) to give one condensed image that represents the news. The final result looks similar to a coloured barcode.

## To-do

### v1

+ Create base repo
+ Add route for test page and API endpoint
+ Build test page URL string builder
+ Build API endpoint to:
  - accept URL params
  - make SAPI query
  - filter results for images
    - also edit the Origami image request
  - calculate display width for images
  - stick images together
    - ffmpeg? phantom screenshot?
  - collect final image data
  - save it to file?
  - respond to API call with image response
  - display image in browser
  - optimise and test

### v2

+ Convert v1 into an AWS stack of sepereated concerns
  - Heroku stack to cron job and on the fly query
  - Lamda to do the iamge processing
  - S3 for image storage and sercing
  - optimise and test


## Installation

You will need to create a .env file and include the mandatory environment variables, which are:

```
CAPI_KEY= # you can request this via the FT developer portal
TOKEN= # for authorised access without S3O or IP range. This can be set to a noddy value for development.
PORT= # auto set in Heroku, but needs specifying for development.
```

Install nodemon globally by running `npm install -g nodemon`.

Install the dependencies by running `npm install` and start the server with `npm start`.


## Tests

```sh
$ npm test
```
