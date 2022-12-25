/**
 * Media NFO Metadata generator using file name patterns
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license Unlicense
 * @package simple-nfo-generator
 * @link https://github.com/andersevenrud/simple-nfo-generator
 */
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import fs from 'fs-extra'
import builder from 'xmlbuilder'
import fetch from 'node-fetch'
import glob from 'fast-glob'
import type { GeneratedResult, Show, ShowNfo, SeasonEpisode } from './types'

export const CACHE_DIR = path.join(os.tmpdir(), 'simple-nfo-generator')

export const EXTENSIONS = ['avi', 'mpe?g', 'mkv', 'mov']

export const fetcher = async (url: string) => {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const filename = path.join(CACHE_DIR, hash)

  if (!await fs.pathExists(filename)) {
    await fs.ensureDir(CACHE_DIR)

    const response = await fetch(url, {
      // NOTE: We need to spoof some browser information in order to get the correct responses
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Response was ${response.status}: ${response.statusText}`)
    }

    const text = await response.text()
    if (text.includes('Houston, we have a problem')) {
      throw new Error('Recieved an error page')
    }

    await fs.writeFile(filename, text, { encoding: 'utf8' })

    return text
  }

  return fs.readFile(filename, { encoding: 'utf8' })
}

// See https://kodi.wiki/view/NFO_files/Templates
export const episodeToXml = (s: Show, e: SeasonEpisode) => {
  const xml = builder.create('tvshow')

  xml.ele('title', e.title)
  xml.ele('originaltitle', e.title)
  xml.ele('showtitle', s.title)
  xml.ele('season', e.season)
  xml.ele('namedseason', { number: e.season }, `Season ${e.season}`)
  xml.ele('episode', e.episode)
  xml.ele('plot', e.description)
  xml.ele('runtime', e.runtime)
  xml.ele('aired', e.airDate)
  xml.ele('year', e.airDate?.split('-')?.[0])
  xml.ele('uniqueid', { type: 'imdb' }, e.id)
  xml.ele('mpaa', e.contentRating)

  s.genres.forEach((g) => xml.ele('genre', g))

  e.thumbnails.forEach((i) => xml.ele('thumb', {
    spoof: '',
    cache: '',
    // aspect: '',
    // preview: '',
    // type: 'season',
    // season: 1,
  }, i))

  e.cast.forEach((c, i) => {
    const n = xml.ele('actor')
    n.ele('name', {}, c.actor)
    n.ele('role', {}, c.character)
    n.ele('thumb', {}, c.thumbnail)
    n.ele('order', {}, i)
  })

  if (typeof e.rating === 'number') {
    const ratings = xml.ele('ratings')
    ratings
      .ele('rating', { name: 'imdb', max: 10, default: true })
      .ele('value', {}, e.rating)
  }

  return xml.end({ pretty: true })
}

export const showToNfo = (r: Show): ShowNfo[] => r.seasons.flatMap((s) => s.episodes.map((e) => ({
  season: e.season,
  episode: e.episode,
  nfo: episodeToXml(r, e),
})))

export const scanDirectory = (root: string) => {
  const exts = EXTENSIONS.join(',')
  const pattern = path.join(root, `**/*.{${exts}}`)
  return glob(pattern)
}

export const convertDuration = (d: string) => {
  const [_, mm, ss] = d.match(/^PT(\d+M)(\d+S)?$/) || []
  const m = parseInt(mm as string) || 0
  const s = parseInt(ss as string) || 0
  return (s * 60) + m
}

export const convertFilenameToMetadata = (f: string) => {
  const [_, ss, ee] = f.match(/S(\d+)E(\d+)/) || []
  const s = parseInt(ss as string)
  const e = parseInt(ee as string)
  return Number.isInteger(s) && Number.isInteger(e) ? [s, e] : [null, null]
}

export const matchFoundFiles = (files: string[], nfos: ShowNfo[]) => files
  .map((f) => {
    const [s, e] = convertFilenameToMetadata(f)
    const found = nfos.find((nfo) => nfo.episode === e && nfo.season === s)
    const nf = f.replace(/\.\w+$/, '.nfo')
    return [nf, found?.nfo]
  })
  .filter(([_, found]) => !!found)
  .map(([filename, nfo]) => ({ filename, nfo })) as GeneratedResult[]
