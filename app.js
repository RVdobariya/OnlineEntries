import express from "express";
const app = express();
import router from "./routes/router.js";
import cors from "cors";


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use("/api/v1", router);

export default app;
