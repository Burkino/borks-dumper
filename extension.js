// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fetch = require('node-fetch');
const lmin = require('./luamin.js')

let dump = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
dump.command = "borks-dumper.dump";
dump.tooltip = "Dump script";
dump.text = "$(server) Constant dump";


let herrtts = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
herrtts.command = "borks-dumper.luamin";
herrtts.tooltip = "Beautifys and minifies a script";
herrtts.text = "$(arrow-both) Luamin.js";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	dump.show()
	herrtts.show()

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('borks-dumper.dump', function () {
		if (!vscode.window.activeTextEditor || vscode.window.activeTextEditor.document.getText() == "") {
			vscode.window.showErrorMessage("hey dummy you need to paste an obfuscated script for it to work")
			return
		}
		const settings = vscode.workspace.getConfiguration('borks-dumper')
		vscode.window.showInformationMessage("Dumping started, join https://discord.gg/xehA9ug")
		fetch('http://borks.club:2095/dumper', {
			method: "post",
			headers: {"Content-Type":"application/json"},
			body: JSON.stringify({
				code: vscode.window.activeTextEditor.document.getText(),
				vscode: true
			  })
		})
		.then(res => {
			if(res.status !== 200) {
				throw new Error()
			}
			return res.text()
		})
		.then(text => {
			if (text.includes("No Obfuscator Detected")) {
				vscode.window.showErrorMessage('Either something wrong with regex-ing or the obfuscator is unsupported (yet), join https://discord.gg/xehA9ug')
				return
			}

			if (settings['OutputType'] == 'Create new file') {
				vscode.workspace.openTextDocument({"content":`${text}`,"language":"lua"})
				vscode.window.showInformationMessage("Dumped, new tab opened, join https://discord.gg/xehA9ug")

			} else if (settings['OutputType'] == 'Replace current file') {
				const fullRange = new vscode.Range(vscode.window.activeTextEditor.document.positionAt(0),vscode.window.activeTextEditor.document.positionAt(vscode.window.activeTextEditor.document.getText().length))
				vscode.window.activeTextEditor.edit(editBuilder => {editBuilder.replace(fullRange, text)})
				vscode.window.showInformationMessage("Dumped, join https://discord.gg/xehA9ug")

			} else if (settings['OutputType'] == 'Copy to clipboard') {
				vscode.env.clipboard.writeText(text)
				vscode.window.showInformationMessage("Dumped, copied to clipboard, join https://discord.gg/xehA9ug")
			}
		})
		.catch(function() {
			vscode.window.showErrorMessage('Something went wrong, join https://discord.gg/xehA9ug')
		})

	})


	let luamin = vscode.commands.registerCommand('borks-dumper.luamin', function() {
		if (!vscode.window.activeTextEditor || vscode.window.activeTextEditor.document.getText() == "") {
			vscode.window.showErrorMessage("hey dummy you need to have a script")
			return
		}
		const settings = vscode.workspace.getConfiguration('borks-dumper')
		vscode.window.showQuickPick(["Beautify","Minify","Uglify"],{canPickMany: false}).then(selection =>{
			if(selection === undefined) {return}
			if(selection === "Uglify") {vscode.window.showWarningMessage("This is very slow on large scripts and will probably break.")}
			vscode.window.showQuickPick([
				{
					label: 'Rename Variables',
					detail: "Should it change the variable names? (L_1_, L_2_, ...)",
					picked: true
				},
				{
					label: "Rename Globals",
					detail: "Not safe, rename global variables? (G_1_, G_2_, ...) (only works if RenameVariables is set to true)",
					picked: false
				},
				{
					label:"Solve Math",
					detail: "Solve math? (local a = 1 + 1 => local a = 2, etc.)",
					picked: true
				}
			],{canPickMany: true, placeHolder: "You have to click on the setting with your mouse, enter will just submit"})
			.then(response => {
				if(response === undefined) {return}
				let RV = false, RG = false, SM = false;
				response.map(setting => {
					switch (setting['label']) {
						case "Rename Variables":
						  RV = true;
						  break;
						case "Rename Globals":		// frosty did this part for me
							RG = true;				// he was probably annoyed at me for saying "switch is just lazy if statements"
							break;					// https://i.imgur.com/prVAEDU.png
						case "Sovle Math":
							SM = true;
							break
					}
				})
				const options = {
					RenameVariables:RV,
					RenameGlobals:RG,
					SolveMath:SM
				}
				const mined = lmin[selection](vscode.window.activeTextEditor.document.getText(), options)

				try {
					switch(settings['LuaminOutput']) {
						case "Create new file":
							vscode.workspace.openTextDocument({"content":`${mined}`,"language":"lua"})
							vscode.window.showInformationMessage(`${selection}'d, new tab opened`)
							break;
						case "Replace current file":
							const fullRange = new vscode.Range(vscode.window.activeTextEditor.document.positionAt(0),vscode.window.activeTextEditor.document.positionAt(vscode.window.activeTextEditor.document.getText().length))
							vscode.window.activeTextEditor.edit(editBuilder => {editBuilder.replace(fullRange, mined)})
							vscode.window.showInformationMessage(`${selection}'d`)
							break;
						case "Copy to clipboard":
							vscode.env.clipboard.writeText(mined)
							vscode.window.showInformationMessage(`${selection}'d, copied to clipboard`)
							break;
					}
				} catch(err) {
					vscode.window.showErrorMessage(`${selection} has failed, check your script`)
				}								
			})
		})
	})

	context.subscriptions.push(disposable);
	context.subscriptions.push(luamin);


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
