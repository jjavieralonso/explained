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

async function run(selectedCode) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Summarize the following code. In a very brief way, maximum 50 chars: ${selectedCode}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const summary = response.text();
  return summary;
}

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "explained.comment",
    async function () {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const selection = editor.selection;
        const selectedCode = document.getText(selection);
        const summary = await run(selectedCode);

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

        const comment = `${commentStart}${summary}${commentEnd}\n`; //Constructs the comment depending on the file extension.

        editor.edit((editBuilder) => {
          editBuilder.insert(selection.start, comment);
        });
      }
    }
  );
  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
