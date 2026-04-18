const refs = {
  message: document.getElementById("pet-message"),
  meta: document.getElementById("pet-meta"),
  start: document.getElementById("pet-start"),
  map: document.getElementById("pet-map"),
  snooze: document.getElementById("pet-snooze"),
  dismiss: document.getElementById("pet-dismiss")
};

function render(snapshot) {
  refs.message.textContent = snapshot.pet.message;
  refs.meta.textContent = snapshot.pet.meta;
}

refs.start.addEventListener("click", () => window.egoclawPet.petAction("start"));
refs.map.addEventListener("click", () => window.egoclawPet.petAction("map"));
refs.snooze.addEventListener("click", () => window.egoclawPet.petAction("snooze"));
refs.dismiss.addEventListener("click", () => window.egoclawPet.petAction("dismiss"));

window.egoclawPet.onState(render);
window.egoclawPet.getState().then(render);
