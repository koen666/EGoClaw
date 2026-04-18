const refs = {
  shell: document.getElementById("pet-shell"),
  avatar: document.getElementById("pet-avatar"),
  status: document.getElementById("pet-status")
};

const state = {
  lastTriggerId: null,
  drag: null
};

function pointFromEvent(event) {
  return {
    screenX: event.screenX,
    screenY: event.screenY
  };
}

async function focusCurrentAction() {
  await window.egoclawPet.focusAction();
}

function triggerAttention() {
  refs.shell.classList.remove("is-attention");
  void refs.shell.offsetWidth;
  refs.shell.classList.add("is-attention");
  window.setTimeout(() => {
    refs.shell.classList.remove("is-attention");
  }, 460);
}

function render(snapshot) {
  const message = snapshot.pet.message || "灵宝已经在等你了。";
  const meta = snapshot.pet.meta || "点击打开当前行动。";

  refs.shell.dataset.priority = snapshot.pet.priority || "idle";
  refs.avatar.setAttribute("title", `${message} ${meta}`.trim());
  refs.avatar.setAttribute("aria-label", `${message}。点击打开当前行动。`);
  refs.status.textContent = `${message} ${meta}`.trim();

  if (
    snapshot.settings.animationEnabled &&
    snapshot.pet.lastTriggerId &&
    snapshot.pet.lastTriggerId !== state.lastTriggerId
  ) {
    triggerAttention();
  }

  state.lastTriggerId = snapshot.pet.lastTriggerId;
}

function finishPointer(event, shouldActivate) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) return;

  refs.shell.classList.remove("is-engaged");
  if (refs.avatar.hasPointerCapture(event.pointerId)) {
    refs.avatar.releasePointerCapture(event.pointerId);
  }

  window.egoclawPet.endDrag(pointFromEvent(event));
  state.drag = null;

  if (shouldActivate) {
    focusCurrentAction();
  }
}

refs.avatar.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  refs.avatar.setPointerCapture(event.pointerId);
  refs.shell.classList.add("is-engaged");
  state.drag = {
    pointerId: event.pointerId,
    startX: event.screenX,
    startY: event.screenY,
    moved: false
  };
  window.egoclawPet.startDrag(pointFromEvent(event));
});

refs.avatar.addEventListener("pointermove", (event) => {
  if (!state.drag || event.pointerId !== state.drag.pointerId) return;

  const distance = Math.hypot(event.screenX - state.drag.startX, event.screenY - state.drag.startY);
  if (distance > 6) {
    state.drag.moved = true;
  }

  window.egoclawPet.drag(pointFromEvent(event));
});

refs.avatar.addEventListener("pointerup", (event) => {
  finishPointer(event, !state.drag?.moved);
});

refs.avatar.addEventListener("pointercancel", (event) => {
  finishPointer(event, false);
});

refs.avatar.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    focusCurrentAction();
  }
});

refs.avatar.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

window.egoclawPet.onState(render);
window.egoclawPet.getState().then(render);
