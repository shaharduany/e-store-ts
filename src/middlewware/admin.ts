import { Router } from "express";
import { isAdmin, postProductAdmin } from "../controllers/admin";

const adminRouter = Router();

adminRouter.post("/api/admin/add-item", isAdmin, postProductAdmin);

export default adminRouter;