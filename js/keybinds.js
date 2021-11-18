/*
 * Contains keybind hashes mapped to the events which they trigger.
 * Keybind hashes are strings containing the name of a key, with an extra byte
 * at the start. The bits of this byte have the following meanings:
 *   Bit 1		Ctrl
 *   Bit 2		Alt
 *   Bit 3		Shift
 *   Bit 4		Meta
 *   Bit 5 		Chord
 */
var keybinds;
var chord = false;

/*
 * Determines which editor event, if any, was triggered by a keypress.
 * Returns a string containing the event name if an event was triggered, otherwise null
 */
function editorEventFromKeypress(keyboardEvent) {
	let modByte = 0;

	if (keyboardEvent.ctrlKey) modByte |= 1;
	if (keyboardEvent.altKey) modByte |= 2;
	if (keyboardEvent.shiftKey) modByte |= 4;
	if (keyboardEvent.metaKey) modByte |= 8;
	if (chord) modByte |= 16;

	let keyHash = String.fromCharCode(modByte) + keyboardEvent.key;

	if (keyHash in keybinds) {
		return keybinds[keyHash];
	}
	return null;
}

/*
 * Load keybinds from localstorage, otherwise load from server.
 * Keybinds are stored on the server in a json file which contains arrays of
 * key sequences assigned to strings, which are the events that those key
 * sequences trigger.
 */
(async () => {
	keybinds = window.localStorage.getItem("keybinds");
	if (!keybinds) {
		keybinds = {};

		// load from server
		let rawBinds = await fetch("/configs/keybinds.json", {
			"mode": "same-origin"
		}).then(response => response.json());

		// Hash each key
		for (const [event, bindings] of Object.entries(rawBinds)) {
			for (const bind of bindings) {
				let keys = bind.split('-');
				let modByte = 0;
				let boundKey = "";

				for (const key of keys) {
					if (key.toLowerCase() === "ctrl") {
						modByte |= 1;
					} else if (key.toLowerCase() === "alt") {
						 modByte |= 2;
					} else if (key.toLowerCase() === "shift") {
						modByte |= 4;
					} else if (key.toLowerCase() === "meta") {
						modByte |= 8;
					} else if (key.toLowerCase() === "chord") {
						modByte |= 16;
					} else {
						boundKey = key;
					}

				}

				keybinds[String.fromCharCode(modByte) + boundKey] = event;
			}
		}
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

