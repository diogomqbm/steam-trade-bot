const SteamUser = require('steam-user')
const config = require('./config')
const SteamTotp = require('steam-totp')
const SteamCommunity = require('steamcommunity')
const TradeOfferManager = require('steam-tradeoffer-manager')
const fs = require('fs')
// const http = require('http')
// const express = require('express')
// const handlebars = require('express-handlebars')
// const passport = require('passport')
// const SteamStrategy = require('passport-steam').Strategy
// const cookieParser = require('cookie-parser')
// const session = require('express-session')
// const socket = require('socket.io')

// const app = express()
// const server = http.Server(app)
// const io = socket(server)

// passport.serializeUser((user, done) => {
//   console.log(user._json)
//   done(null, user._json)
// })

// passport.deserializeUser((obj, done) => {
//   done(null, obj)
// })

// passport.use(new SteamStrategy({
//   returnURL: 'http://localhost:3000/auth/steam/return',
//   realm: 'http://localhost:3000/',
//   apiKey: config.apiKey
// }, (identifier, profile, done) => done(null, profile)))

// app.engine('hbs', handlebars({
//   extname: '.hbs',
//   partialsDir: './views/partials',
//   layouts: './views',
//   helpers: {
//     bonusprice: (coinprice) => Math.floor(coinprice * 0.95)
//   }
// }))

// app.set('view engine', 'hbs')
// app.use(cookieParser())
// app.use(session({
//   key: 'session_id',
//   secret: 'anything',
//   resave: true,
//   saveUninitialized: true,
//   cookie: {
//     maxAge: 259200000
//   }
// }))

// app.use(passport.initialize())
// app.use(passport.session())

// app.use('/public', express.static(__dirname + '/public'))

// let online = 0
// io.on('connection', socket => {
//   online += 1
//   io.emit('onlinechange', online)

//   socket.on('disconnect', () => {
//     online -= 1
//     io.emit('onlinechange', online)
//   })

// })

// app.get('/', (req, res) => {
//   if(req.user) {
//     return res.render('home', {
//       user: req.user
//     })
//   }
//   return res.render('home', {})
// })

// app.get('/logout', (req, res) => {
//   req.logout()
//   res.redirect('/')
// })

// app.get(/^\/auth\/steam(\/return)?$/, passport.authenticate('steam', {
//   failureRedirect: '/'
// }), (req, res) => {
//     res.redirect('/')
// })

// server.listen('3000')

const client = new SteamUser({ 
  dataDirectory: __dirname + '/sentry'
})

const community = new SteamCommunity()
const manager = new TradeOfferManager({
  steam: client,
  community,
  language: 'en'
})

const mountLogInOptions = () => {

  let logInOptions = {
    accountName: config.accountName,
    password: config.password,
    twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret),
    dontRememberMachine: false,
    rememberPassword: true,
    machineName: config.machineName
  }

  if (config.loginKey) {
    return logInOptions = {
      accountName: config.accountName,
      loginKey: config.loginKey,
      rememberPassword: true,
      machineName: config.machineName
    }
  }

  return logInOptions
}

const logInOptions = mountLogInOptions()

client.logOn(logInOptions)

client.on('loggedOn', () => {
  console.log('logged on')

  client.setPersona(SteamUser.EPersonaState.Online)
})

client.on('webSession', (sid, cookies) => {
  manager.setCookies(cookies)
  community.setCookies(cookies)
  community.startConfirmationChecker(20000, config.identitySecret)
})

manager.on('newOffer', offer => {
  console.log('new offer')
  console.log(offer)
})

client.on('loginKey', (loginKey) => {
  fs.writeFile('./sentry/loginkey.txt', loginKey, (err) => {
    if (err) console.log(err)
    console.log('Sucessfully written to file')
  })
})