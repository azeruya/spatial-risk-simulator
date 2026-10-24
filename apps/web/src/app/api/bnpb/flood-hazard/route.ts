import { createPointHandler, HAZARDS } from "@/lib/hazard-routes";

export const GET = createPointHandler(HAZARDS.flood);
