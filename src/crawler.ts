/**
 * Media NFO Metadata generator using file name patterns
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license Unlicense
 * @package simple-nfo-generator
 * @link https://github.com/andersevenrud/simple-nfo-generator
 */
import { fetcher } from './utils'
import { decode } from 'html-entities'
import { HTMLElement, parse } from 'node-html-parser'
import { convertDuration } from './utils'
import type { Episode, Casting } from './types'

// TODO: Add typings with generics
export const queryStructuredData = (node: HTMLElement) => {
  const info = node.querySelectorAll('script').find((n) => n.getAttribute('type') === 'application/ld+json')
  return JSON.parse(info?.innerText ?? '') as any
}

export const crawlEpisode = (html: string): Episode => {
  const root = parse(html)
  const info = queryStructuredData(root)

  // NOTE: Structured data does not contain character info so we scrape it instead
  const topCastingContainers = root.querySelectorAll('div[data-testid="title-cast-item"]')
  const cast: Casting[] = topCastingContainers.map((node) => {
    return {
      actor: decode(node.querySelector('[data-testid="title-cast-item__actor"]')?.textContent),
      character: decode(node.querySelector('[data-testid="cast-item-characters-link"]')?.textContent),
      thumbnail: node.querySelector('img')?.getAttribute?.('src'),
    }
  })

  const thumbnails: string[] = []
  if (info.image) thumbnails.push(info.image)

  return {
    title: decode(info.name),
    runtime: convertDuration(info.duration ?? '') || undefined,
    description: decode(info.description),
    contentRating: info.contentRating,
    airDate: info.datePublished,
    rating: info.aggregateRating?.ratingValue,
    thumbnails,
    cast,
  }
}

export const crawlEpisodeList = (html: string) => {
  const root = parse(html)

  // NOTE: No structured data on these pages, so we need to scrape instead
  const entries = root.querySelectorAll('div.list.detail.eplist > div')
  const list = entries.map((node) => {
    const href = node.querySelector('a[itemprop="name"]')?.getAttribute('href') ?? ''
    const [, id] = href.split(/^\/title\/(\w+)\//)

    if (!id) throw Error('No id found for this episode')

    const episode = parseInt(node.querySelector('meta[itemprop="episodeNumber"]')?.getAttribute('content') as string)
    return {
      id,
      title: decode(node.querySelector('a[itemprop="name"]')?.textContent),
      description: decode(node.querySelector('a[itemprop="description"]')?.textContent),
      episode: Number.isInteger(episode) ? episode : undefined,
    }
  })

  return list
}

export const crawlSeasonCount = (html: string): number => {
  const root = parse(html)
  return root.querySelectorAll('select#bySeason > option').length
}

export const crawlShow = (html: string, id: string) => {
  const root = parse(html)
  const info = queryStructuredData(root)
  const genres = (info.genre || []) as string[]

  return {
    id,
    title: decode(info.name),
    genres: genres.map((s) => decode(s)),
  }
}

export const fetchEpisode = (id: string) => fetcher(`https://www.imdb.com/title/${id}/`)
  .then((text) => crawlEpisode(text))

export const fetchEpisodeList = (id: string, season: number) => fetcher(`https://www.imdb.com/title/${id}/episodes?season=${season}`)
  .then((text) => crawlEpisodeList(text))

export const fetchSeasonCount = (id: string) => fetcher(`https://www.imdb.com/title/${id}/episodes?season=1`)
  .then((text) => crawlSeasonCount(text))

export const fetchShow = (id: string) => fetcher(`https://www.imdb.com/title/${id}/`)
  .then((text) => crawlShow(text, id))
