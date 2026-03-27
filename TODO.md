# TODO

## To do

- Find a way to give the error page a localized message switching with the real error
- Add a static log-level and overcharge `console.level` with it (checkout [winston](https://github.com/winstonjs/winston))
- Integrate fs.watch of the ED Journal folder
- Integrate SSE, either by sending only event to recall from client api, or by sending the data
- Integrate persistance (maybe lowdb or duckdb)

## To study

replace nodemon by tsx watch & chokidar
Add a music tracker (not sure if pertinent)
pertinance of [swc](https://swc.rs/)
Add social with FriendStatus -> For accuracy, we need to checkout if ED logs the friends statuses, and not only the connected, disconnected

### Chokidar

"client:watch": "chokidar '../backend/src/generated/swagger.json' -c 'pnpm run gen:client'",
