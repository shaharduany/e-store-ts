import { SessionData } from "express-session";
import { ShopItemI } from "../client/src/components/shop/shop-view";
import { CartI } from "../controllers/cart";
import { UserI } from "../models/user";

declare global {
	namespace Express {
		interface User extends UserI {

		}
	}
}

declare module "express-session" {
	interface SessionData {
		isLogged: boolean;
		cart: CartI;
		passport: object;
	}
}
