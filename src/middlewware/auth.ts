import passport from "passport";
import passportGoogle from "passport-google-oauth20";
import dotenv from "dotenv";
import { googleClient, googleSecret } from "../lib/secrets";
import { Router } from "express";
import User, { UserI } from "../models/user";
import { getAdminRole, getCostumerRole } from "../models/role";
import { isUser } from "../controllers/user";

dotenv.config();

const GoogleStrategy = passportGoogle.Strategy;

passport.use(
	new GoogleStrategy(
		{
			clientID: googleClient,
			clientSecret: googleSecret,
			callbackURL: "/auth/google/callback",
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				const costRole = await getCostumerRole();
				const adminRole = await getAdminRole();
				let choosenRole = costRole;
				if(profile.emails?.[0].value === "shahar.duany@gmail.com"){
					choosenRole = adminRole;
				}

				const [newUser, created] = await User.findOrCreate({
					where: {
						googleId: profile.id,
					},
					defaults: {
						email: profile.emails?.[0].value,
						image: profile.photos?.[0].value,
						username: profile.displayName,
						role: choosenRole.getDataValue("id")
					},
				});
				return done(null, newUser);
			} catch (err) {
				console.log(err);	
			}
		}
	)
);

interface UserPass {
	email: string;
	id: number;
	username: string;
	cart: number[];
}

passport.serializeUser((user, done) => {
	const userValues = {
		id: user.getDataValue("id"),
		email: user.getDataValue("email"),
		username: user.getDataValue("username"),
		cart: user.getDataValue("cart"),
	};

	return done(null, userValues);
});

passport.deserializeUser(async (userVal: UserPass,  done) => {
	const user = await User.findByPk(userVal.id);
	if(!user){
		return done(null, false);
	}
	return done(null, user);
});

const router = Router();

router.get(
	"/api/auth/login/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
	"/auth/google/callback",
	passport.authenticate("google", {
		failureRedirect: "http://localhost:3000/",
		successRedirect: "http://localhost:3000/",
	})
);

router.get("/api/auth/logout", async (req, res, next) => {
	const userCart = req.session.cart;
	const userId = req.user?.id;
	if(userCart && userId){
		await assignCartToUser(userCart, userId);
	}
	req.logout({ keepSessionInfo: true }, () => console.log("logged out"));
	res.status(201).json({
		message: "user logged out"
	});
})

async function assignCartToUser(userCart: number[], userId: number){
	const user = await isUser(userId);
	for (let id of userCart) {
		if (typeof id !== "number") {
			return;
		}
	}
	await user.set("cart", userCart);
}

export default router;
