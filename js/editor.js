var editors = [];

class PDBEditor {
	fileName;
	#id;
	#content;

	constructor(name) {
		this.fileName = name;
	}

	createTab() {
		let element = document.createElement("div");
		element.classList.add("tab");
		element.id = this.#id;
		element.setAttribute("title", this.fileName);

		let fileNameElem = document.createElement("span");
		fileNameElem.classList.add("fileName");
		let fileNameText = document.createTextNode(this.fileName);
		fileNameElem.append(fileNameText);

		let closeBtnElem = document.createElement("span");
		closeBtnElem.classList.add("closebtn");
		let closeBtnText = document.createTextNode("&cross;");
		closeBtnElem.append(closeBtnText);
		

		element.append(fileNameElem);

		return element
	}
}

document.addEventListener("DOMContentLoaded", function() {
	let editor = document.getElementById("editor");
});
