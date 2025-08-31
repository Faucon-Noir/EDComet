# TODO

## To do

- Find a way to give the error page a localized message switching with the real error
- Add a static log-level and overcharge `console.level` with it (checkout [winston](https://github.com/winstonjs/winston))
- Integrate fs.watch of the ED Journal folder
- Integrate SSE, either by sending only event to recall from client api, or by sending the data
- Integrate persistance (maybe lowdb or duckdb)
- Migrate to yarn pnp

## To study

replace nodemon by tsx watch & chokidar
Add a music tracker (not sure if pertinent)
pertinance of [swc](https://swc.rs/)
Add social with FriendStatus -> For accuracy, we need to find a way to check that ED is open

### Chokidar

"client:watch": "chokidar '../backend/src/generated/swagger.json' -c 'yarn gen:client'",
