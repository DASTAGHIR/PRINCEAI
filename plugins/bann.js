import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone' 


global.blockNumbers = ['923045875069', '923346025252', '923070857030', '923700474163', '923279822962', '923157490705', '93744215959', '923036570376', '923273838214', '923459046183', '923412174003', '923498171753', '923033164344', '923001686150', '923277968349']


let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'bann.js'"))
  import(`${file}?update=${Date.now()}`)
})
