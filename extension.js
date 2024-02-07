const fs = require("fs");
const path = require("path");

const env = fs.readFileSync(path.join(__dirname, ".env"), "utf-8");

const lines = env.split("\n");

for (const line of lines) {
  const [name, value] = line.split("=");

  process.env[name] = value;
}
const vscode = require("vscode");

const GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;

const API_KEY = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

let commentCount = 1;

async function commentCode(selectedCode, commentStart, commentEnd) {
  // Check if the selected code exceeds the line or character limit
  const lineCount = selectedCode.split("\n").length;
  const charCount = selectedCode.length;
  if (lineCount > 100 || charCount > 8000) {
    throw new Error("Code is too long.");
  }
  if (lineCount < 1 || charCount < 10) {
    throw new Error("Code is too short.");
  }
  if (commentCount < 1 || commentCount > 3) {
    throw new Error("Invalid amount of comments");
  }
  let comments = "";
  for (let i = 0; i < commentCount; i++) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Summarize the following code. In a very brief way, maximum 100 chars: ${selectedCode}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    comments += `${commentStart}${summary}${commentEnd}\n`;
  }
  return comments;
}

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "explained.setCommentCount",
    async function () {
      const count = await vscode.window.showInputBox({
        prompt:
          "Enter the number of comments (1, 2, or 3): Actual Configuration: " +
          commentCount +
          " ",
      });
      commentCount = parseInt(count);
    }
  );
  context.subscriptions.push(disposable);

  let disposable_2 = vscode.commands.registerCommand(
    "explained.comment",
    async function () {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const selection = editor.selection;
        const selectedCode = document.getText(selection);
        const summary = await commentCode(selectedCode);

        //Map of comment syntax for different file extensions
        const commentSyntax = {
          ".js": "// ",
          ".ts": "// ",
          ".py": "# ",
          ".html": "<!-- ",
          ".css": "/* ",
          ".java": "// ",
          ".c": "/* ",
          ".cpp": "/* ",
          ".go": "// ",
          ".rb": "# ",
          ".php": "// ",
          ".swift": "// ",
          ".rs": "// ",
          ".sh": "# ",
          ".bat": "REM ",
          ".xml": "<!-- ",
          ".sql": "-- ",
          ".pl": "# ",
          ".lua": "-- ",
          ".r": "# ",
          ".scala": "// ",
          ".groovy": "// ",
          ".kotlin": "// ",
          ".dart": "// ",
          ".f": "c ",
        };

        const fileExtension = path.extname(document.fileName); //Detects the file extension of the current file

        const commentStart = commentSyntax[fileExtension] || "// ";
        const commentEnd =
          fileExtension === ".html" || fileExtension === ".css" ? " -->" : "";

        const comments = await commentCode(
          selectedCode,
          commentStart,
          commentEnd
        );

        editor.edit((editBuilder) => {
          editBuilder.insert(selection.start, comments);
        });
      }
    }
  );
  context.subscriptions.push(disposable_2);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
