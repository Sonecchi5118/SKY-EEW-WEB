//@ts-check
const axios = require('axios');
const APIKey = "b9a89bb33c2d535826185f147a9b03700f56a21308a5d6fd4d2cfc8dfd2a0d1e"

const announce = {
  "domain_id": 2993,
  "name": "テスト通知",
  "is_suspend": true,
  "is_when_api": true,
  "when": {
    "immediate": true
  },
  "is_message_api": true,
  "userid_list": [
    "string"
  ],
  "is_ab": true,
  "message_a": {
    "title": "緊急地震速報",
    "body": "※これはテスト通知です\n十勝沖で地震　推定最大震度５強"
  }
}

async function submitRequest() {
  const res =
      await axios.post('https://api.pushcode.jp/v1/push/new', {
    method: 'post',
    body: JSON.stringify(announce),
    Headers: {
        "Content-type": "application/json",
        "X-PUSHCODE-APIKEY": APIKey
    }
  })
  const data = res.data;
  console.log(data);
}
submitRequest();