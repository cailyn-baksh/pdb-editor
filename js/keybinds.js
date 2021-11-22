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

	let keyHash = String.fromCharCode(modByte) + keyboardEvent.key.toLocaleUpperCase();

	if (keyHash in keybinds) {
		return keybinds[keyHash].event;
	}
	return null;
}

function unhashKeybind(keybind) {
	let str = "";
	let modByte = keybind.charCodeAt(0);

	if (modByte & 1) str += "Ctrl-";
	if (modByte & 2) str += "Alt-";
	if (modByte & 4) str += "Shift-";
	if (modByte & 8) {
		if (navigator.userAgentData.platform.indexOf('Win') > -1) {
			str += "Win-"
		} else if (navigator.userAgentData.platform.indexOf('Mac') > -1) {
			str += "⌘-";
		} else {
			str += "Meta-";
		}
	}

	return str + keybind.slice(1);
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
		for (const [event, bindings] of Object.entries(rawBinds.binds)) {
			for (let i=0; i < bindings.length; ++i) {
				let keys = bindings[i].split('-');
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
						boundKey = key.toLocaleUpperCase();
					}

				}

				keybinds[String.fromCharCode(modByte) + boundKey] = {"event": event, "preferred": i === 0};
			}
		}
	}

	// Add shortcuts to menu
	let addShortcutText = () => {
		for (const [keybind, event] of Object.entries(keybinds)) {
			let elem = document.querySelector(`div#menu span.shortcut#${event.event}`);
			if (event.preferred) elem.innerHTML = unhashKeybind(keybind);
		}
	};

	if (document.getElementById("menu-end")) {
		addShortcutText();
	} else {
		let observer = new MutationObserver((mutations, instance) => {
			if (document.getElementById("menu-end")) {  // menu has fully loaded
				addShortcutText();	

				instance.disconnect();
			}
		});

		observer.observe(document, {subtree: true, childList: true});
	}
})();

document.addEventListener("DOMContentLoaded", () => {
	document.addEventListener("keydown", (e) => {
		let selection = document.getSelection();

		// Handle standard, non-rebindable keys
		static_keys: {
			if (!e.altKey && !e.ctrlKey && !e.isComposing && !e.metaKey && !e.shiftKey) {
				if (e.key === "Enter") {
					console.log(selection.anchorNode);
				} else {
					break static_keys;  // allow processing of this key as a bound key
				}
				return;
			}
		}

		// Handle bound keys
		let editorEvent = editorEventFromKeypress(e);

		switch (editorEvent) {
			case 'New':
				newFile();
				break;
			case 'Save':
				break;
			default:
				return;
		}
		e.preventDefault();
	});
});

