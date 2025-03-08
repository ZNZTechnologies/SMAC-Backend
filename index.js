// imports
const express = require("express");
require("dotenv").config({ path: __dirname + "/.env" });

const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const path = require("path");
const app = express();

app.use(cors({
  origin: '*'
}));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:", // Allow blob URLs for images,
        "https://res.cloudinary.com", // Cloudinary for images
        "https://lh3.googleusercontent.com",
        "https://icons.getbootstrap.com",
        "https://cdn.jsdelivr.net",
      ],
      scriptSrc: [
        "'self'",
        "https://apis.google.com", // Google Login
        "https://accounts.google.com", // Google Login
      ],
      frameSrc: ["https://accounts.google.com"], // Google Login
      connectSrc: [
        "'self'",
        "https://accounts.google.com", // Google Login
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for MUI's CSS-in-JS
        "https://fonts.googleapis.com", // Google Fonts
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com", // Google Fonts
        "data:",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [], // Uncomment if using HTTPS
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Put this after all middleware. Otherwise, Heroku will give you 304 page
// for views in node project
// app.use(express.static("public"));
app.set("view engine", "ejs");
// app.use(express.static(path.join(__dirname, 'client/build')));
// app.get('*', (req, res) => {
// res.sendFile(path.join(__dirname + '/client/build/index.html'))
// });
app.use(express.static(path.join(__dirname, "..", "client", "build")));

// // Fallback route to serve index.html for all other routes

// database connection called here
const sequelize = require("./database/connection");
require("./database/imports");
// associations
require("./association/association");
// passport file for google oauth
require("./utils/passport/passport");
// cron job to delete stories
require("./utils/cronjob/cronjob");
const routes = require("./routes");

const { Server } = require("socket.io");
const { setSharedIO, getSharedIO } = require("./socket/shared");
const closeConnectionGracefully = require("./database/closeConnection");

const server = http.createServer(app);
setSharedIO(
  new Server(server, {
    transports: ["websocket"],
    cors: {
      origin: "*",
    },
  })
);
require("./socket")(getSharedIO());

// app.use(limiter)
app.use("/api", routes);

// commecting this for aws
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
// });

app.get("/test", (req, res) => {
  res.send("Hello!");
});

// app.post('/test', async(req, res) => {
//   // let p = require('./utils/jazzcash/index').generateTimeValues({
//   //   MerchantID: process.env.JAZZCASH_MERCHANT_ID,
//   //   Password: process.env.JAZZCASH_PASSWORD,
//   //   ReturnURL: process.env.JAZZCASH_RETURN_URL,
//   //   Amount: 200,
//   //   BillReference: "billRef",
//   //   Description: "Product test description",
//   //   Language: "EN",
//   //   TxnCurrency: "PKR",
//   //   TxnType: "MPAY",
//   //   Version: "1.1"
//   // });
//   let p = require('./utils/jazzcash/index').generateTimeValues({
//     pp_IsRegisteredCustomer: 'yes',
//     pp_ShouldTokenizeCardNumber: 'yes',
//     pp_CustomerID: '25352',
//     pp_CustomerEmail: 'abc@abc.com',
//     pp_CustomerMobile: '03331234567',
//     pp_Version: '2.0',
//     pp_TxnType: 'MPAY',
//     pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
//     pp_Password: process.env.JAZZCASH_PASSWORD,
//     pp_Amount: '200',
//     pp_TxnCurrency: 'PKR',
//     pp_BillReference: 'billRef',
//     pp_Description: 'Description of transaction',
//     pp_CustomerCardNumber: '5123450000000008',
//     pp_CustomerCardCVV: '100',
//     pp_CustomerCardExpiry: '01/39',
//     pp_DiscountedAmount: '',
//     pp_DiscountBank: '',
//     pp_UsageMode: 'API'
//   });
//   console.log('p1 >>>', p)
//   p = require('./utils/jazzcash/index').sortAndGenerateHASH(p);
//   console.log('p2 >>>', JSON.stringify(p))
//   //
//   let r = await require('./utils/jazzcash/index').pingAPI(process.env.JAZZCASH_CARD_URL, p);
//   console.log('just after API call....', r)
//   // r = await require('./utils/jazzcash/index').parseResponse(r.body);
//   console.log('r >>>>>>>>>', r)
//   res.send(r)
// });

// server
const main = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await closeConnectionGracefully(sequelize);

    console.log("Connection has been established successfully.");

    const PORT = process.env.PORT || "5000";
    server.listen(PORT, () => {
      console.log("app is listening of PORT: ", PORT);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

main();

module.exports = app;
