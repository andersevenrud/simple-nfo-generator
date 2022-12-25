/**
 * Media NFO Metadata generator using file name patterns
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license Unlicense
 * @package simple-nfo-generator
 * @link https://github.com/andersevenrud/simple-nfo-generator
 */
import { fetchSeasonCount, fetchEpisodeList, fetchEpisode, fetchShow } from './crawler'
import type { Season } from './types'

export const loadAllEpisodes = async (id: string): Promise<Season[]> => {
  const count = await fetchSeasonCount(id)
  const promises = Array.from({ length: count }).map(async (_, s) => {
    const season = s + 1
    const list = await fetchEpisodeList(id, season)
    const episodes = await Promise.all(list.map(async (node, e) => {
      const episode = await fetchEpisode(node.id)

      return {
        id: node.id,
        season,
        episode: typeof node.episode === 'number' ? node.episode : (e + 1),
        ...episode,
      }
    }))

    return {
      episodes,
      season,
    }
  })

  return Promise.all(promises);
}

export const loadShow = async (id: string) => {
  const series = await fetchShow(id)
  const seasons = await loadAllEpisodes(id)

  return {
    ...series,
    id,
    seasons,
  }
}
