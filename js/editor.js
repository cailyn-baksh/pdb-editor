var editors = [];
var activeEditor = 0;

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
			updateTabList();
		};

		// Handle close button click
		closeBtnElem.onclick = function(e) {
			let index = Number(this.parentElement.id);
			editors.splice(index, 1);
			activeEditor -= activeEditor !== 0 ? 1 : 0;

			updateTabList();
			e.stopPropagation();
		}
	
		return element;
	}
}

function updateTabList() {
	let tabList = document.getElementById("tabs");
	tabList.innerHTML = "";

	for (let i=0; i < editors.length; ++i) {
		let tab = editors[i].createTabElement();
		tab.id = i;

		if (i === activeEditor) {
			tab.classList.add("selected");
		}

		tabList.append(tab);
	}
}

function newFile() {
	editors.push(new PDBEditor("Untitled"));
	updateTabList();
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

		updateTabList();
	});
});
