import { pub } from "../procedures";

export const healthRouter = {
  ping: pub.health.ping.handler(async () => {
    return { ok: true, timestamp: new Date().toISOString() };
  }),
};
