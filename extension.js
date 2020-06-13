// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fetch = require('node-fetch');

let dump = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
dump.command = "borks-dumper.dump";
dump.tooltip = "Dump script";
dump.text = "$(server) Constant dump";


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	dump.show()

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('borks-dumper.dump', function () {
		vscode.window.showInformationMessage("Dumping started")
		const settings = vscode.workspace.getConfiguration('borks-dumper')
		if (!vscode.window.activeTextEditor || vscode.window.activeTextEditor.document.getText() == "") {
			vscode.window.showErrorMessage("hey dummy you need to paste an obfuscated script for it to work")
			return
		}
		const fullRange = new vscode.Range(vscode.window.activeTextEditor.document.positionAt(0),vscode.window.activeTextEditor.document.positionAt(vscode.window.activeTextEditor.document.getText().length))

		fetch('http://borks.club:3000/dumper', {
			method: "post",
			headers: {"Content-Type":"application/json"},
			body: JSON.stringify({
				code: vscode.window.activeTextEditor.document.getText()
			  })
		})
		.then(res => {
			if(res.status !== 200 || res.status !== 201 || res.status !== 202 || res.status !== 203) {
				throw new Error()
			}
			return res.text()
		})
		.then(text => {
			if (text.includes("No Obfuscator Detected")) {
				vscode.window.showErrorMessage('Either something wrong with regex-ing or the obfuscator is unsupported (yet)')
				return
			}

			if (settings['OutputType'] == 'Create new file') {
				vscode.workspace.openTextDocument({"content":`${text}`,"language":"lua"})
				vscode.window.showInformationMessage("Dumped, new tab opened")

			} else if (settings['OutputType'] == 'Replace current file') {
				vscode.window.activeTextEditor.edit(editBuilder => {editBuilder.replace(fullRange, text)})
				vscode.window.showInformationMessage("Dumped")

			} else if (settings['OutputType'] == 'Copy to clipboard') {
				vscode.env.clipboard.writeText(text)
				vscode.window.showInformationMessage("Dumped, copied to clipboard")
			}
		})
		.catch(function() {
			vscode.window.showErrorMessage('Something went wrong, the vps probably went dead')
		})

	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	dump.dispose()
}

module.exports = {
	activate,
	deactivate
}
