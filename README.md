# simple-nfo-generator

Extracts show information from filenames and scrapes
IMDB for metadata without using the API services.

Generates Kodi type NFO files that are compatible
with pretty much any media streaming/library software
like Emby or Plex.

Pulls data from a combination of scraping web contents
and structured data where possible.

This pulls information about the entire show and caches
it to prevent hitting a request limit.

**NOTE THAT THIS ALL DEPENDS ON DATA IN THE HTML SERVED
BY IMDB AND CAN BREAK AT ANY TIME IF THEY CHANGE THEIR
SOURCE OR ASSET DELIVERY METHODS.**

## Usage

```bash
simple-nfo-generator <imdb-id> <path> [force]
```

## TODO

* Add appropriate thumbnail attributes
* Auto-detect show and IMDB id from filenames
* Add custom pattern support in CLI
* Deal with N-part episodes

## License

Unlicense
