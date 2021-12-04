const express = require("express");
const passport = require("passport");
const boom = require("@hapi/boom");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const config = require("./config");

const app = express();
//body parser
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

//Basic strategy
require("./utils/auth/strategies/basic");
//OAuth Strategy
require("./utils/auth/strategies/oAuth");

//Para recordar sesión
// Agregamos las variables de timpo en segundos
const THIRTY_DAYS_IN_SEC = 2592000000;
const TWO_HOURS_IN_SEC = 7200000;

//sign in
app.post("/auth/sign-in", async (req, res, next) => {
	const rememberMe = req.body;
	//llamado de la estrategia basic
	passport.authenticate("basic", (error, data) => {
		try {
			if (error || !data) {
				return next(boom.unauthorized());
			}
			console.log(data);
			req.login(data, { session: false }, async (error) => {
				if (error) {
					return next(error);
				}
				const { token, user } = data;
				//Se crea una cookie y en esta se almacena el token
				res.cookie("token", token, {
					httpOnly: !config.dev,
					secure: !config.dev,
					//Tiempo que durará el token
					maxAge: rememberMe ? THIRTY_DAYS_IN_SEC : TWO_HOURS_IN_SEC,
				});
				res.status(200).json(user);
			});
		} catch (error) {
			next(error);
		}
	})(req, res, next);
});

//sign up
app.post("/auth/sign-up", async (req, res, next) => {
	const user = req.body;
	try {
		await axios({
			url: `${config.apiUrl}/api/auth/sign-up`,
			method: "post",
			data: user,
		});
		res.status(201).json({ message: "user created" });
	} catch (error) {
		next(error);
	}
});

//get movies
app.get("/movies", async (req, res, next) => {});

//add user movie
app.post("/user-movies", async (req, res, next) => {
	try {
		const { body: userMovie } = req;
		//El bearer token se obtiene de la cookie
		const { token } = req.cookies;
		const { data, status } = await axios({
			url: `${config.apiUrl}/api/user-movies`,
			headers: { Authorization: `Bearer ${token}` },
			method: "post",
			data: userMovie,
		});
		if (status !== 201) {
			return next(boom.badImplementation());
		}
		res.status(201).json(data);
	} catch (error) {
		next(error);
	}
});

//delete user movie
app.delete("/user-movies/:userMovieId", async (req, res, next) => {
	try {
		const { userMovieId } = req.params;
		//El bearer token se obtiene de la cookie
		const { token } = req.cookies;
		const { data, status } = await axios({
			url: `${config.apiUrl}/api/user-movies/${userMovieId}`,
			headers: { Authorization: `Bearer ${token}` },
			method: "delete",
		});
		if (status !== 200) {
			return next(boom.badImplementation());
		}
		res.status(200).json(data);
	} catch (error) {
		next(error);
	}
});

app.get(
	"/auth/google-oauth",
	passport.authenticate("google-oauth", {
		scope: ["email", "profile", "openid"],
	})
);

app.get(
	"/auth/google-oauth/callback",
	passport.authenticate("google-oauth", { session: false }),
	function (req, res, next) {
		if (!req.user) {
			next(boom.unauthorized());
		}

		const { token, ...user } = req.user;

		res.cookie("token", token, {
			httpOnly: !config.dev,
			secure: !config.dev,
		});

		res.status(200).json(user);
	}
);

app.listen(config.port, () => {
	console.log(`Listening at: http://localhost:${config.port}`);
});
