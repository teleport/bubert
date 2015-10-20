'use strict';

const API_ROOT = 'https://api.wit.ai/message?v=20151016';

class WitAi {
  constructor(robot) {
    this.robot = robot;
    this.robot.hear(/.+$/i, res => this.respond(res));

    /**
     * Bubert says hello to everybody.
     */
    this.robot.on('wit.Hello', (res, outcome) => {
      if (outcome.confidence <= 0.55) return;
      res.send(res.random(['Hi!', 'Hello!', 'Howdy!']));
    });

    /**
     * Bubert, you silly goose!
     */
    this.robot.on('wit.Yesman', (res, outcome) => {
      if (outcome.confidence <= 0.55) return;
      res.send(res.random(['Absolutely!', 'Yes', 'Okay', 'Fine', 'Aye', 'Yea', 'Yep', 'Yup', 'Affirmative', 'Yes']));
    });
  }


  respond(res) {
    this.queryWit(res.match[0]).then(outcomes => outcomes.forEach(outcome => {
      this.robot.emit(`wit.${outcome.intent}`, res, outcome);
      console.log(`wit.${outcome.intent}: ${outcome.confidence}`);
    })).catch(err => console.error(err));
  }


  queryWit(query) {
    console.log(`Querying wit.ai: ${query}`);

    const req = this.robot.http(`${API_ROOT}&q=${query}`)
      .header('Authorization', `Bearer ${process.env.WIT_TOKEN}`)
      .get();

    return new Promise((resolve, reject) => {
      req((err, res, body) => {
        if (err) return reject(err);
        resolve(JSON.parse(body));
      });
    }).then((json) => json.outcomes);
  }
}

module.exports = robot => new WitAi(robot);
