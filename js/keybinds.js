var keybinds = {};

function getBoundEvent(keyEvent) {
	
}

/* Load keybinds from localstorage, otherwise load from server */
(async () => {
	keybinds = window.localStorage.getItem("keybinds");
	if (!keybinds) {
		// load from server
		keybinds = await fetch("/configs/keybinds.json", {
			"mode": "same-origin"
		}).then(response => response.json());
	}
})();

document.addEventListener("DOMContentLoaded", () => {
	document.addEventListener("keydown", (e) => {
		let selection = document.getSelection();

		console.log(e);

		// Handle standard, non-rebindable keys
		if (!e.altKey && !e.ctrlKey && !e.isComposing && !e.metaKey && !e.shiftKey) {
			if (e.key === "Enter") {
				console.log(selection.anchorNode);
			}
		}
	});
});

