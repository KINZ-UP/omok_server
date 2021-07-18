# TOY PROJECT - 오목 온라인 (서버)

2인 멀티플레이가 가능한 오목 게임 웹 어플리케이션입니다.
<br>
직접 방을 생성하거나 다른 사람이 생성한 방에 들어가서 상대방과 대전할 수 있습니다.
<br>

- [오목 온라인 Live Page](http://omok.kinzup.com)
  <br>
- [Repository for Client Code](https://github.com/KINZ-UP/omok_client)

<br>

## How to Install

### Clone Repository

```bash
git clone https://github.com/KINZ-UP/omok_server.git
```

### Install Packages

```js
npm i

// or if using yarn

yarn
```

### Add Environmental Variables

_.dev_

```
ACCESS_TOKEN_SECRET=INSERT_ACCESS_TOKEN_SECRET
MONGODB_CONNECT=INSERT_MONGODB_CONNECTION_STRING
```

root 폴더에 _.dev_ 를 생성하여 **ACCESS_TOKEN_SECRET** 및 **MONGODB_CONNECTION_STRING**을 입력합니다.
<br>

### Execute

```js
npm start

// or

yarn start
```
