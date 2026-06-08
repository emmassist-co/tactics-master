import { keywordPlanProvider } from "../tactics/providers/keywordPlanProvider";

export const TACTICAL_PRESETS = {
  compactPress: keywordPlanProvider("home", "Stay compact, press early, and keep our shape"),
  combinationPlay: keywordPlanProvider("home", "Quick passing triangles, overlap, and support runs"),
  cautiousBlock: keywordPlanProvider("away", "Protect deep, stay patient, and keep it safe"),
  directCounter: keywordPlanProvider("away", "Counter fast, break through, and shoot early"),
};
