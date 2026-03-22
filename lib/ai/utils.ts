import { ENV } from "varlock/env";

export const isDevelopment = ENV.APP_ENV === "development";
