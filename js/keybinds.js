var keybinds = {};

function getBoundEvent(keyEvent) {
	
}

document.addEventListener("keydown", function(e) {
	
});

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

