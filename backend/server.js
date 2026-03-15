import { createApp } from "#root/server.js";
import { config } from "#root/config/env.js";

const app = await createApp();
app.listen(config.port, () => {
  console.log(`Backend API listening on http://localhost:${config.port}`);
});
