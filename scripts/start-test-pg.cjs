const EmbeddedPostgres = require("embedded-postgres").default;
const path = require("path");

const pg = new EmbeddedPostgres({
  databaseDir: path.join(__dirname, "..", ".test-pg-data"),
  user: "testuser",
  password: "testpass",
  port: 54329,
  persistent: false,
});

(async () => {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("dealer_portal_test");
  console.log("READY");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
