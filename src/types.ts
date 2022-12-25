/**
 * Media NFO Metadata generator using file name patterns
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license Unlicense
 * @package simple-nfo-generator
 * @link https://github.com/andersevenrud/simple-nfo-generator
 */
export type Thumbnail = string

export interface Casting {
  actor: string
  character?: string
  thumbnail?: string
}

export interface Episode {
  title: string
  description?: string
  runtime?: number
  contentRating?: string
  airDate?: string
  rating?: number
  cast: Casting[]
  thumbnails: Thumbnail[]
}

export interface SeasonEpisode extends Episode {
  id: string
  season: number
  episode: number
}

export interface Season {
  season: number
  episodes: SeasonEpisode[]
}

export interface Show {
  id: string
  title: string
  genres: string[]
  seasons: Season[]
}

export interface GeneratedResult {
  filename: string
  nfo: string
}

export interface ShowNfo {
  season: number
  episode: number
  nfo: string
}
