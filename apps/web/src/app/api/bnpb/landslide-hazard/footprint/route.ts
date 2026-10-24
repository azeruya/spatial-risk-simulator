import { createFootprintHandler, HAZARDS } from "@/lib/hazard-routes";

export const POST = createFootprintHandler(HAZARDS.landslide);
