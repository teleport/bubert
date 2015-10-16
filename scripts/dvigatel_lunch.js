// Description:
//   Dvigatel today's lunch menu
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot lunch (en|[et]) - Display the lunch menu
//   /lunch (en|[et]) - Display the lunch menu

'use strict';

const moment = require('moment');
const _ = require('lodash');
const HubotCron = require('hubot-cronjob');

const API_ROOT = 'http://www.sodexo.fi/en/ruokalistat/output/daily_json/7576';
const TEXT = {
  en: {
    header: 'Restaurant Dvigatel (E-R 8:00 - 17:00, Lõõtsa 6)',
    legend: '*G* - Gluten-Free  *L* - Lactose-free',
  },

  et: {
    header: 'Restoran Dvigatel (E-R 8:00 - 17:00, Lõõtsa 6)',
    legend: '*G* - Gluteenivaba  *L* - Laktoosivaba',
  },
};


class DvigatelLunch {
  constructor(robot) {
    this.robot = robot;
    this.robot.hear(/\/lunch\s*([a-z]{2})?$/i, res => this.respond(res));

    this.robot.on('wit.Lunch', (res, outcome) => {
      if (outcome.confidence <= 0.5) return;

      this.fetchData()
        .then(categories => this.formatResponse(categories, 'et'))
        .then(text => res.send(text))
        .catch(err => console.error(err));
    });

    const FLEEP_ROOM = process.env.LUNCH_CRON_FLEEP_ROOM;
    if (!FLEEP_ROOM) return;

    new HubotCron(process.env.LUNCH_CRON_PATTERN, process.env.LUNCH_CRON_TZ, () => {
      this.fetchData()
        .then(categories => this.formatResponse(categories, 'et'))
        .then(text => robot.messageRoom(FLEEP_ROOM, text))
        .catch(err => console.error(err));
    });
  }


  respond(res) {
    const lang = res.match[1] || 'et';
    if (lang !== 'en' && lang !== 'et') return res.send('I don\'t speak that language.');

    this.fetchData()
      .then(categories => this.formatResponse(categories, lang))
      .then(text => res.send(text))
      .catch(err => console.error(err));
  }


  /**
   * Format Fleep response
   */
  formatResponse(categories, lang) {
    const result = [TEXT[lang].header];
    const apiLang = lang === 'et' ? 'fi' : 'en';

    const formatCourse = course => {
      const title = course[`title_${apiLang}`].trim();
      const desc = course[`desc_${apiLang}`].trim();
      const price = (course.price || '').replace(/,/g, '.').replace(/([0-9]+)\./g, '€$&');

      const line = [title];
      if (course.properties) line.push(` (${course.properties})`);
      if (course.price) line.push(`  –  ${price}`);
      result.push(line.join(''));

      if (desc) result.push(`    _${desc}_`);
    };


    _.each(categories, (courses, category) => {
      result.push('');
      if (category !== 'Porridge') result.push(`*${category}:*`);

      _.each(_.sortBy(courses, `title_${apiLang}`), formatCourse);
    });

    result.push('');
    result.push(TEXT[lang].legend);

    return result.join('\n');
  }


  /**
   * Fetch todays lunch data
   */
  fetchData() {
    const today = moment().format('YYYY/MM/DD');
    const req = this.robot.http(`${API_ROOT}/${today}/en`)
      .header('Accept', 'application/json')
      .get();

    return new Promise((resolve, reject) => {
      req((err, res, body) => {
        if (err) return reject(err);
        resolve(JSON.parse(body));
      });
    }).then((json) => _.groupBy(json.courses, 'category'));
  }
}


module.exports = robot => new DvigatelLunch(robot);
