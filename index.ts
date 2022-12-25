/**
 * Media NFO Metadata generator using file name patterns
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license Unlicense
 * @package simple-nfo-generator
 * @link https://github.com/andersevenrud/simple-nfo-generator
 */
import path from 'node:path'
import fs from 'fs-extra'
import { program } from '@caporal/core'
import { matchFoundFiles, showToNfo, scanDirectory } from './src/utils'
import { loadShow } from './src/main'

program
  .argument('<imdb>', 'IMDB ID of show in directory')
  .argument('<root>', 'Root directory to scan')
  .argument('[force]', 'Force writing nfo even if it exists', {
    validator: program.BOOLEAN,
  })
  .action(async ({ logger, args }) => {
    logger.log('info', `Scraping show ${args.imdb}...`)
    const show = await loadShow(args.imdb.toString())

    logger.log('info', 'Generating NFO files...')
    const nfos = showToNfo(show);

    logger.log('info', `Scanning directory ${args.root}...`)

    const files = await scanDirectory(args.root.toString())
    logger.log('info', `Found ${files.length} files total`)

    const found = matchFoundFiles(files, nfos)
    logger.log('info', `Found ${found.length} matches`)

    for await (const f of found) {
      if (args.force || !await fs.pathExists(f.filename)) {
        logger.log('info', `Writing ${path.basename(f.filename)}...`)
        await fs.writeFile(f.filename, f.nfo, { encoding: 'utf8' })
      }
    }
  })

program.run()
