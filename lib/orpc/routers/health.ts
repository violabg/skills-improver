import { publicProcedure } from "../procedures";

export const healthRouter = {
  ping: publicProcedure.handler(async () => {
    return { ok: true, timestamp: new Date().toISOString() };
  }),
};
