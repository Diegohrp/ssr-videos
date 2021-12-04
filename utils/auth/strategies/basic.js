const passport = require("passport");
const { BasicStrategy } = require("passport-http");
const boom = require("@hapi/boom");
//axios es una librería que sirve para que un servidor realice peticiones a una API
const axios = require("axios");
const config = require("../../../config");

passport.use(
	new BasicStrategy(async (email, password, done) => {
		try {
			//Realizamos una petición utilizando axios
			//como respuesta se tiene la data de la petición
			//y el estado (200, 400 not found etc.)
			const { data, status } = await axios({
				//URL de la API a donde se hace la petición
				url: `${config.apiUrl}/api/auth/sign-in`,
				//el método es post ya que se va a mandar data
				//se quiere iniciar sesión
				method: "post",
				//datos para la autenticación en la API
				auth: {
					password,
					username: email,
				},
				data: {
					apiKeyToken: config.apiKeyToken,
				},
			});
			if (!data || status !== 200) {
				return done(boom.unauthorized(), false);
			}
			return done(null, data);
		} catch (error) {
			done(error);
		}
	})
);
