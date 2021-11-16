var editors = [];
var activeEditor = 0;

class StringByteReader {
	#str = "";
	#index = 0;
	#buffer = [];

	constructor(str) {
		this.#str = str;
	}

	getNBytes(n) {
		let bytes = [];

		while (this.#buffer.length > 0 && bytes.length < n) {
			bytes.push(this.#buffer.shift());
		}

		while (bytes.length < n && this.#index < this.#str.length) {
			let char = this.#str.charCodeAt(this.#index);

			if (char < 0x100) {
				bytes.push(char);
			} else {
				while (char > 0) {
					if (bytes.length < n) {
						bytes.push((char & 0xFF) >>> 0);
					} else {
						this.#buffer.push((char & 0xFF) >>> 0);
					}
					char = char >>> 8;
				}
			}

			++this.#index;
		}

		return bytes;
	}
}

function fletcher64(data) {
	let byteReader = new StringByteReader(data);
	let sum1 = 0;
	let sum2 = 0;

	for (let i=0; i < data.length; ++i) {
		
	}	
}

class PDBEditor {
	fileName;
	#content = "";

	constructor(name) {
		this.fileName = name;
	}

	/*
	 * Reads a File object
	 */
	async readFile(file) {
		// TODO: read stream and buffer the file
		this.#content = await file.text().then(text => text.split('\n'));
	}

	renderContent() {
		let rendered = "";

		if (this.#content.length > 0) {
			for (const line of this.#content) {
				rendered += `<div class="line" tabindex="0"><span>${line}<br></span></div>`;
			}
		} else {
			rendered += '<div class="line" tabindex="0"><span><br></span></div>';
		}

		return rendered;
	}

	createTabElement() {
		// Create tab element
		let element = document.createElement("div");
		element.classList.add("tab");
		element.setAttribute("title", this.fileName);

		// Create file name text
		let fileNameElem = document.createElement("span");
		fileNameElem.classList.add("filename");
		let fileNameText = document.createTextNode(this.fileName);
		fileNameElem.appendChild(fileNameText);
		element.appendChild(fileNameElem);

		// Create close button
		let closeBtnElem = document.createElement("span");
		closeBtnElem.classList.add("closebtn");
		let closeBtnText = document.createTextNode("x");
		closeBtnElem.appendChild(closeBtnText);
		element.appendChild(closeBtnElem);
	
		// Handle tab click
		element.onclick = function(e) {
			activeEditor = Number(this.id);
			updateTabs();
		};

		// Handle close button click
		closeBtnElem.onclick = function(e) {
			let index = Number(this.parentElement.id);
			editors.splice(index, 1);
			activeEditor -= activeEditor !== 0 ? 1 : 0;

			updateTabs();
			e.stopPropagation();
		}
	
		return element;
	}
}

function updateTabs() {
	let tabList = document.getElementById("tabs");
	let editor = document.getElementById("editor");
	tabList.innerHTML = "";

	for (let i=0; i < editors.length; ++i) {
		let tab = editors[i].createTabElement();
		tab.id = i;

		if (i === activeEditor) {
			tab.classList.add("selected");
		}

		tabList.append(tab);
	}

	if (activeEditor < editors.length) {
		editor.innerHTML = editors[activeEditor].renderContent();
	} else {
		editor.innerHTML = "";
	}
}

function newFile() {
	editors.push(new PDBEditor("Untitled"));
	updateTabs();
}

document.addEventListener("DOMContentLoaded", function(e) {
	let tabs = document.getElementById("tabs");

	// Load file on drag'n'drop
	tabs.addEventListener("dragover", function(e) {
		e.preventDefault();
	});
	tabs.addEventListener("drop", async function(e) {
		e.preventDefault();

		for (const file of e.dataTransfer.files) {
			let newEditor = new PDBEditor(file.name);
			await newEditor.readFile(file);
			editors.push(newEditor);
		}

		updateTabs();
	});
});

