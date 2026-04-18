import { DemoEngine } from "../shared/store/demo-engine.js";

async function main() {
  const engine = new DemoEngine();
  await engine.connectDemo();
  const snapshot = engine.snapshot();

  console.log("connected:", snapshot.connected);
  console.log("archive_count:", snapshot.archive.length);
  console.log("distilled_count:", snapshot.distilledVideos.length);
  console.log("current_intent:", snapshot.intents.find((item) => item.id === snapshot.activeIntentId)?.name || "none");
  console.log("current_action:", snapshot.planner?.action || "none");
  console.log("pet_message:", snapshot.pet.message);

  await engine.triggerScenario("douyin_open");
  const afterTrigger = engine.snapshot();
  console.log("trigger_intent:", afterTrigger.intents.find((item) => item.id === afterTrigger.activeIntentId)?.name || "none");
  console.log("trigger_pet_message:", afterTrigger.pet.message);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
