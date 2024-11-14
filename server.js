const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: `./.env.${process.env.NODE_ENV}` }); // this command will read all variables from config file and set in into node.js env
const app = require('./app');

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log(' DBconnection successful');
  });

const port = process.env.PORT || 3000;
app.listen(3000, () => console.log(`Listening on ${port}`));
