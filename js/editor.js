var editors = [];
var activeEditor = 0;

class StringByteReader {
	#bytes = [];  // little-endian

	constructor(str) {
		for (let i=0; i < str.length; ++i) {
			let ch = str.charCodeAt(i);

			if (ch < 0x100) {
				this.#bytes.push(ch);
			} else {
				// multi-byte sequences are pushed in big-endian order to preserve logical byte ordering
				let multiByteSequence = [];
				while (ch > 0) {
					multiByteSequence.push((ch & 0xFF) >>> 0);
					ch >>>= 8;
				}

				for (let i=multiByteSequence.length-1; i >= 0; --i) {
					this.#bytes.push(multiByteSequence[i]);
				}
			}
		}
	}

	*yieldBytes(n) {
		let reducer = (prev, cur, index) => ((cur << (8 * index)) >>> 0) | prev;
		let result = [];
		for (let i=0; i < this.#bytes.length; ++i) {
			result.push(this.#bytes[i]);

			if (result.length === n) {
				let value = result.reduce(reducer, 0);
				result = [];
				yield value;
			}
		}

		while (result.length !== n) {
			result.push(0);
		}

		yield result.reduce(reducer, 0);
	}
}

// im not confident that this works right but i cant prove that its wrong
function fletcher64(data) {
	let byteReader = new StringByteReader(data);
	let sum1 = 0;
	let sum2 = 0;

	for (const dword of byteReader.yieldBytes(4)) {
		sum1 = (sum1 + dword) % 0xFFFFFFFF;
		sum2 = (sum2 + sum1) % 0xFFFFFFFF;
	}

	return ((sum2 << 32) | sum1) >>> 0;
}

class PDBEditor {
	fileName;
	#content = "";
	#lines = [[]];

	constructor(name) {
		this.fileName = name;
	}

	/*
	 * Reads a File object
	 */
	async readFile(file) {
		// TODO: read stream and buffer the file
		let content = await file.text();

		for (const line of content.split('\n')) {
			this.#lines.push(line.split(''));
		}
	}

	renderContent() {
		let rendered = "";

		for (let i=0; i < this.#lines.length; ++i) {
			rendered += `<div class="line" tabindex="0" id="${i}"><span>${this.#lines[i].join('')}<br></span></div>`;
		}

		return rendered;
	}

	get raw() {
		return this.#lines.map(c => c.join('')).join('');
	}

	getLine(index) {
		return this.#lines[index].join('');
	}

	spliceLine(index, start, end, chars) {
		this.#lines[index].splice(start, end - start, chars);
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
	if (typeof newFile.counter == 'undefined') {
		newFile.counter = 1;
	}

	editors.push(new PDBEditor(`Untitled ${newFile.counter++}`));
	updateTabs();
}

function saveFile() {
	if (editors.length > 0) {
		let content = new Blob([editors[activeEditor].raw], {type: "text/plain"});

		let dl = document.createElement("a");
		dl.href = URL.createObjectURL(content);
		dl.download = editors[activeEditor].fileName;
		dl.click();
	}
}

/*
 * Upload a file from the file upload dialog
 */
function openFileUploadDialog() {
	document.getElementById("file-upload").click();
}

function verticalNearestElement(node) {
	if (node.nodeType == Node.ELEMENT_NODE) {
		return node;
	} else {
		return node.parentElement;
	}
}

document.addEventListener("DOMContentLoaded", function(e) {
	let tabs = document.getElementById("tabs");
	let fileUpload = document.getElementById("file-upload");
	let editor = document.getElementById("editor");

	// Load files uploaded from the dialog
	fileUpload.addEventListener("change", async function(e) {
		if (fileUpload.files.length !== 0) {
			for (const file of fileUpload.files) {
				// upload file
				let newEditor = new PDBEditor(file.name);
				await newEditor.readFile(file);
				editors.push(newEditor);
			}

			updateTabs();
		}

		fileUpload.value = null;
	});

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

	editor.addEventListener("beforeinput", (e) => {
		e.preventDefault();

		let targetRange = e.getTargetRanges()[0];  // TODO: support multiple input
		let container = targetRange.endContainer;
		let lineId = verticalNearestElement(container).parentElement.id;

		let selection = window.getSelection();
		let range = document.createRange();

		if (container.nodeType === Node.ELEMENT_NODE) {
			if (container.firstChild.nodeType === Node.ELEMENT_NODE) {
				let textNode = document.createTextNode('');
				container.insertBefore(textNode, container.firstChild);
				container = textNode;
			} else {
				container = container.firstChild;
			}
		}

		if (e.inputType === "insertText") {
			editors[activeEditor].spliceLine(lineId, targetRange.startOffset, targetRange.endOffset, e.data);
			container.nodeValue = editors[activeEditor].getLine(lineId);

			range.setStart(container, targetRange.startOffset + e.data.length);
		} else if (e.inputType === "deleteContentBackward") {
			editors[activeEditor].spliceLine(lineId, targetRange.startOffset, targetRange.endOffset, "");
			container.nodeValue = editors[activeEditor].getLine(lineId);
			range.setStart(container, targetRange.startOffset);
		}

		selection.removeAllRanges();
		selection.addRange(range);
	});
});

