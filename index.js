/**
 * Created by Vadym Yatsyuk on 21/03/2017
 */

let app = require('express')();
let resposeTime = require('response-time');
let axios = require('axios');
let redis = require('redis');

let redisClient = redis.createClient(6379, 'Redis');

redisClient.on('error', err => {
  console.log('Redis Error: ' + err);
});

app.set('port', 8000);

app.use(resposeTime());

app.get('/api/:username', (req, res) => {
  const username = req.params.username;

  redisClient.get(username, (error, totalStars) => {
    if (!error && totalStars) {
      sendAnswer(res, totalStars);
      return;
    }

    axios.get(`https://api.github.com/users/${ username }/repos?per_page=100`)
      .then(repositories => {
        return repositories.data.reduce((prev, curr) => {
          return prev + curr.stargazers_count;
        }, 0);
      })
      .then(totalStars => {
        redisClient.setex(username, 60, totalStars);
        sendAnswer(res, totalStars);
      })
      .catch(response => {
        res.send(response);
      });
  });
});

function sendAnswer(res, totalStars) {
  res.json({
    totalStars
  }).end();
}

app.listen(app.get('port'), () => {
  console.log('Server running on port: ', app.get('port'));
});