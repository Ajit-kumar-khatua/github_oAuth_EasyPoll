const express= require("express")
const mongoose=require("mongoose")
require("dotenv").config()
const {connection}=require("./config/db")
const jwt=require("jsonwebtoken")
const { uuid } = require("uuidv4");
const { UserModel }=require("./Models/user.model")
const app=express()

const passport2 = require("passport");
var GitHubStrategy = require("passport-github2").Strategy;

passport2.use(
    new GitHubStrategy(
      {
        clientID: process.env.clientId,
        clientSecret: process.env.clientSecret,
        callbackURL: "https://easypoll-oauth.onrender.com/auth/github/callback",
        scope: "user:email",
      },
      async function (accessToken, refreshToken, profile, done) {
        // console.log(profile);
        var firstName = profile.displayName.split(" ")[0];
        var lastName = profile.displayName.split(" ")[1];
        let email = profile.emails[0].value;
        
        let user;
        try {
          user = await UserModel.findOne({ email });
          if (user) {
            return done(null, user);
          }
          user = new UserModel({
            firstName,
            lastName,
            email,
            password: uuid(),
          });
          await user.save();
          return done(null, user);
        } catch (error) {
          console.log(error);
        }
      }
    )
  );

  app.get(
    "/auth/github",
    passport2.authenticate("github", { scope: ["user:email"] })
  );
  
  app.get(
    "/auth/github/callback",
    passport2.authenticate("github", {
      failureRedirect: "/login",
      session: false,
    }),
    function (req, res) {
      // Successful authentication, redirect home.
      let user = req.user;
      console.log(user);
      var token = jwt.sign({ userID: user._id, email: user.email }, process.env.normal_secret, {
        expiresIn: "1d",
      });
    //   console.log(token);
      res.redirect(
        `https://dapper-melba-18cd1b.netlify.app/events.html?&email=${user.email}&id=${token}&first_name=${user.firstName}&last_name=${user.lastName}`
      );
    }
  );




app.listen(process.env.port,async ()=>{
    try {
        await connection
        console.log("Connected To DB")
        
    } catch (error) {
        console.log(error)
    }
    console.log(`Server is running on port ${process.env.port}`)
})